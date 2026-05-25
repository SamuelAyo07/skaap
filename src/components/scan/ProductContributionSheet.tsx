import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Camera, Check, Loader2 } from "lucide-react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { getUserName } from "@/components/scan/FirstScanSignupModal";

const Schema = z.object({
  product_name: z.string().trim().min(1, "Product name required").max(300),
  brand: z.string().trim().max(300).optional(),
  category: z.enum(["food", "beauty", "other"]),
  country: z.string().trim().max(100).optional(),
  contributor_email: z.string().trim().email().max(255).optional().or(z.literal("")),
});

interface Props {
  open: boolean;
  onClose: () => void;
  barcode?: string | null;
}

export function ProductContributionSheet({ open, onClose, barcode }: Props) {
  const [productName, setProductName] = useState("");
  const [brand, setBrand] = useState("");
  const [category, setCategory] = useState<"food" | "beauty" | "other">("food");
  const [country, setCountry] = useState("");
  const [email, setEmail] = useState(() => {
    try { return localStorage.getItem("skaap_user_email_v1") || ""; } catch { return ""; }
  });
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const resetAll = () => {
    setProductName(""); setBrand(""); setCategory("food"); setCountry("");
    setPhotoFile(null); setPhotoPreview(null); setDone(false);
  };

  const handleClose = () => {
    onClose();
    setTimeout(resetAll, 300);
  };

  const handlePhoto = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      toast.error("Photo too large (max 8MB)");
      return;
    }
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
  };

  const handleSubmit = async () => {
    const parsed = Schema.safeParse({
      product_name: productName,
      brand: brand || undefined,
      category,
      country: country || undefined,
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
        const ext = photoFile.name.split(".").pop() || "jpg";
        const path = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("product-contributions")
          .upload(path, photoFile, { contentType: photoFile.type, upsert: false });
        if (!upErr) {
          const { data } = supabase.storage.from("product-contributions").getPublicUrl(path);
          imageUrl = data.publicUrl;
        }
      }

      const { error } = await supabase.from("product_contributions").insert({
        barcode: barcode || null,
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
                  Help us add this product
                </h2>
                <p className="text-[12px] mt-1" style={{ color: "#6B7280" }}>
                  Snap a photo and the basics. Takes 10 seconds.
                </p>

                {barcode && (
                  <p className="text-[11px] mt-2 font-mono px-2 py-1 rounded inline-block"
                    style={{ background: "#F3F4F6", color: "#4B5563" }}>
                    Barcode {barcode}
                  </p>
                )}

                {/* Photo */}
                <div className="mt-4">
                  <input ref={fileRef} type="file" accept="image/*" capture="environment"
                    className="hidden" onChange={handlePhoto} />
                  <button
                    type="button"
                    onClick={() => fileRef.current?.click()}
                    className="w-full rounded-2xl flex flex-col items-center justify-center gap-1.5 py-6 text-[13px] font-semibold transition-colors"
                    style={{
                      background: photoPreview ? "transparent" : "#F9FAFB",
                      border: "1.5px dashed #D1D5DB",
                      color: "#6B7280",
                      backgroundImage: photoPreview ? `url(${photoPreview})` : undefined,
                      backgroundSize: "cover", backgroundPosition: "center",
                      minHeight: 120,
                    }}
                  >
                    {!photoPreview && (<><Camera size={20} /> Take photo of product</>)}
                  </button>
                </div>

                {/* Product name */}
                <input
                  value={productName} onChange={(e) => setProductName(e.target.value)}
                  placeholder="Product name" maxLength={300}
                  className="w-full mt-3 px-3 py-3 rounded-xl text-[14px] outline-none"
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
                  Optional. Skip anything you don't know.
                </p>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
