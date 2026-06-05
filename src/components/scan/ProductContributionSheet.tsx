import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check, Loader2, Sparkles, Barcode } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserName } from "@/components/scan/FirstScanSignupModal";
import { compressImage } from "@/lib/imageCompress";

const Schema = z.object({
  product_name: z.string().trim().min(1, "Product name required").max(300),
  brand: z.string().trim().max(300).optional(),
  category: z.enum(["food", "beauty", "other"]),
  country: z.string().trim().max(100).optional(),
  barcode: z.string().trim().max(32).optional(),
  contributor_email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onClose: () => void;
  barcode?: string | null;
}

// Try to read a barcode straight from the photo using the native BarcodeDetector
async function detectBarcodeFromFile(file: File): Promise<string | null> {
  try {
    const BD = (globalThis as any).BarcodeDetector;
    if (!BD) return null;
    const detector = new BD({
      formats: ["ean_13", "ean_8", "upc_a", "upc_e", "code_128", "code_39"],
    });
    const bitmap = await createImageBitmap(file);
    const codes = await detector.detect(bitmap);
    bitmap.close?.();
    return codes?.[0]?.rawValue || null;
  } catch {
    return null;
  }
}

// Compress + base64 a file (for the AI vision call)
async function fileToDataUrl(file: File): Promise<string> {
  const small = await compressImage(file, { maxDim: 1024, quality: 0.78 });
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(r.result as string);
    r.onerror = () => reject(r.error);
    r.readAsDataURL(small);
  });
}

export function ProductContributionSheet({ open, onClose, barcode }: Props) {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<"food" | "beauty" | "other">("beauty");
  const [country, setCountry] = useState("");
  const [barcodeInput, setBarcodeInput] = useState(barcode || "");
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem("skaap_user_email_v1") || ""; } catch { return ""; }
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [autoBusy, setAutoBusy] = useState(false);
  const [autoFilled, setAutoFilled] = useState<{ barcode?: boolean; name?: boolean; brand?: boolean } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setProductName(""); setBrand(""); setCategory("beauty"); setCountry("");
    setBarcodeInput(barcode || "");
    setPhotoFile(null); setPhotoPreview(null); setDone(false);
    setAutoFilled(null); setAutoBusy(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const handlePhoto = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Photo too large (max 8MB)");
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setAutoBusy(true);
    setAutoFilled(null);

    try {
      // Parallel: native barcode scan + AI identify
      const [detectedBarcode, dataUrl] = await Promise.all([
        detectBarcodeFromFile(f),
        fileToDataUrl(f),
      ]);

      const aiPromise = supabase.functions.invoke("ai-product-insights", {
        body: { type: "product_identify", imageBase64: dataUrl },
      });

      const filled: { barcode?: boolean; name?: boolean; brand?: boolean } = {};

      if (detectedBarcode && !barcodeInput) {
        setBarcodeInput(detectedBarcode);
        filled.barcode = true;
      }

      const { data: aiData, error: aiErr } = await aiPromise;
      if (!aiErr && aiData?.result) {
        try {
          const cleaned = String(aiData.result).replace(/```json|```/g, "").trim();
          const parsed = JSON.parse(cleaned);
          if (parsed.productName && !productName) {
            setProductName(parsed.productName);
            filled.name = true;
          }
          if (parsed.brand && !brand) {
            setBrand(parsed.brand);
            filled.brand = true;
          }
          if (parsed.category && ["food", "beauty", "other"].includes(parsed.category)) {
            setCategory(parsed.category);
          }
          if (parsed.barcode && !barcodeInput && !detectedBarcode) {
            setBarcodeInput(parsed.barcode);
            filled.barcode = true;
          }
        } catch {
          /* JSON parse failed — keep manual entry */
        }
      }
      setAutoFilled(filled);
    } catch (err) {
      console.error("auto-detect failed", err);
    } finally {
      setAutoBusy(false);
    }
  };

  const handleSubmit = async () => {
    const parsed = Schema.safeParse({
      product_name: productName,
      brand: brand || undefined,
      category,
      country: country || undefined,
      barcode: barcodeInput || undefined,
      contributor_email: email || undefined,
    });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0]?.message || "Check your details");
      return;
    }

    setSubmitting(true);
    let imageUrl: string | null = null;

    try {
      if (photoFile) {
        const compressed = await compressImage(photoFile, { maxDim: 1600, quality: 0.85 });
        const ext = "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-contributions")
          .upload(path, compressed, { contentType: "image/jpeg", upsert: false });
        if (!upErr) {
          const { data } = supabase.storage.from("product-contributions").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from("product_contributions").insert({
        barcode: parsed.data.barcode || barcode || null,
        product_name: parsed.data.product_name,
        brand: parsed.data.brand || null,
        category: parsed.data.category,
        country: parsed.data.country || null,
        image_url: imageUrl,
        contributor_name: getUserName() || null,
        contributor_email: parsed.data.contributor_email || null,
      });
      if (error) throw error;

      setDone(true);
      setTimeout(handleClose, 1600);
    } catch (err) {
      console.error(err);
      toast.error("Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const anyAutoFilled = autoFilled && (autoFilled.barcode || autoFilled.name || autoFilled.brand);

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-[95] flex items-end sm:items-center justify-center px-4"
          onClick={handleClose}
        >
          <div className="absolute inset-0 bg-black/40" />
          <motion.div
            initial={{ y: 40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 40, opacity: 0 }}
            transition={{ type: "spring", damping: 24, stiffness: 220 }}
            className="relative w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={handleClose}
              className="absolute top-3 right-3 w-8 h-8 rounded-full flex items-center justify-center z-10"
              style={{ background: "#F3F4F6" }} aria-label="Close">
              <X size={16} color="#6B7280" />
            </button>

            {done ? (
              <div className="py-10 text-center">
                <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center"
                  style={{ background: "#ECFDF5", border: "1px solid #A7F3D0" }}>
                  <Check size={26} style={{ color: "#059669" }} />
                </div>
                <h3 className="font-extrabold text-[18px] mt-3" style={{ color: "#0A1220" }}>Thanks for helping</h3>
                <p className="text-[13px] mt-1" style={{ color: "#6B7280" }}>
                  We'll add it to the catalog soon.
                </p>
              </div>
            ) : (
              <>
                <h2 className="font-extrabold text-[20px] leading-tight tracking-tight pr-8" style={{ color: "#0A1220" }}>
                  Add this product
                </h2>
                <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
                  Just snap the front of the pack — we'll read the barcode and name for you.
                </p>

                {/* Photo with smart capture */}
                <div className="mt-4">
                  <input ref={fileRef} type="file" accept="image/*" capture="environment"
                    className="hidden" onChange={handlePhoto} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="relative w-full rounded-2xl flex flex-col items-center justify-center gap-1.5 py-6 text-[13px] font-semibold transition-colors overflow-hidden"
                    style={{
                      background: photoPreview ? "transparent" : "#F9FAFB",
                      border: "1.5px dashed #D1D5DB",
                      color: "#6B7280",
                      backgroundImage: photoPreview ? `url(${photoPreview})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      minHeight: 140,
                    }}
                  >
                    {!photoPreview && (
                      <>
                        <Camera size={22} />
                        <span>Take photo of product</span>
                        <span className="text-[11px] font-normal" style={{ color: "#9CA3AF" }}>
                          Front of pack — include the barcode
                        </span>
                      </>
                    )}
                    {photoPreview && autoBusy && (
                      <div className="absolute inset-0 flex flex-col items-center justify-center gap-2"
                        style={{ background: "rgba(10,18,32,0.55)", color: "#fff" }}>
                        <Loader2 size={22} className="animate-spin" />
                        <span className="text-[12px] font-semibold">Reading the pack…</span>
                      </div>
                    )}
                  </button>
                  {anyAutoFilled && !autoBusy && (
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] font-semibold"
                      style={{ color: "#059669" }}>
                      <Sparkles size={12} /> Auto-filled from photo — tap to edit
                    </div>
                  )}
                </div>

                {/* Barcode */}
                <div className="mt-3 relative">
                  <Barcode size={14} className="absolute left-3 top-1/2 -translate-y-1/2" color="#9CA3AF" />
                  <input
                    value={barcodeInput} onChange={(e) => setBarcodeInput(e.target.value.replace(/[^0-9]/g, ""))}
                    placeholder="Barcode (auto-detected from photo)" maxLength={20} inputMode="numeric"
                    className="w-full pl-9 pr-3 py-3 rounded-xl text-[14px] outline-none font-mono"
                    style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                  />
                </div>

                {/* Product name */}
                <input
                  value={productName} onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product name" maxLength={300}
                  className="w-full mt-2 px-3 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                />

                {/* Brand */}
                <input
                  value={brand} onChange={(e) => setBrand(e.target.value)}
                  placeholder="Brand (optional)" maxLength={300}
                  className="w-full mt-2 px-3 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                />

                {/* Category chips */}
                <div className="flex gap-2 mt-3">
                  {(["food", "beauty", "other"] as const).map(c => (
                    <button key={c} type="button" onClick={() => setCategory(c)}
                      className="flex-1 py-2 rounded-xl text-[12px] font-bold capitalize transition-colors"
                      style={{
                        background: category === c ? "#0A1220" : "#F3F4F6",
                        color: category === c ? "#fff" : "#6B7280",
                      }}>
                      {c}
                    </button>
                  ))}
                </div>

                {/* Country */}
                <input
                  value={country} onChange={(e) => setCountry(e.target.value)}
                  placeholder="Country (e.g. Nigeria, USA)" maxLength={100}
                  className="w-full mt-3 px-3 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                />

                {/* Email for credit */}
                <input
                  type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  placeholder="Email (optional, so we can credit you)" maxLength={255}
                  className="w-full mt-2 px-3 py-3 rounded-xl text-[14px] outline-none"
                  style={{ background: "#F9FAFB", border: "1px solid #E5E7EB", color: "#0A1220" }}
                />

                <button
                  onClick={handleSubmit} disabled={submitting || !productName.trim()}
                  className="w-full mt-4 py-3.5 rounded-2xl font-bold text-[15px] text-white disabled:opacity-50 flex items-center justify-center gap-2"
                  style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}
                >
                  {submitting ? (<><Loader2 size={16} className="animate-spin" /> Sending</>) : "Send to SKAAP"}
                </button>
                <p className="text-center text-[11px] mt-2" style={{ color: "#9CA3AF" }}>
                  Skip anything you don't know — we'll verify on our side.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
