import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, X, Sparkles, Loader2, Apple, Leaf } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RecognitionResult {
  name: string;
  category: string;
  calories_per_100g: number;
  protein_per_100g: number;
  fiber_per_100g: number;
  sugar_per_100g: number;
  fat_per_100g: number;
  health_tip: string;
  score: number;
  emoji: string;
}

interface ImageRecognitionProps {
  onClose: () => void;
}

export function ImageRecognition({ onClose }: ImageRecognitionProps) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<RecognitionResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 1_000_000) {
      setError("Image too large. Please use a photo under 1 MB.");
      return;
    }


    // Convert to base64
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const base64 = ev.target?.result as string;
      setImage(base64);
      setAnalyzing(true);
      setError(null);
      setResult(null);

      try {
        const { data, error: fnError } = await supabase.functions.invoke("ai-product-insights", {
          body: {
            type: "image_recognition",
            imageBase64: base64,
          },
        });

        if (fnError || !data?.result) {
          setError("Couldn't identify this food. Try a clearer photo.");
          setAnalyzing(false);
          return;
        }

        // Parse JSON from AI response
        const jsonMatch = data.result.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          setError("Couldn't analyze this image. Try again.");
          setAnalyzing(false);
          return;
        }

        const parsed: RecognitionResult = JSON.parse(jsonMatch[0]);
        setResult(parsed);
      } catch {
        setError("Something went wrong. Please try again.");
      }
      setAnalyzing(false);
    };
    reader.readAsDataURL(file);
  };

  const scoreColor = (s: number) => s >= 75 ? "#22C55E" : s >= 50 ? "#F59E0B" : "#E8314A";

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[60] flex items-end justify-center"
    >
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <motion.div
        initial={{ y: "100%" }}
        animate={{ y: 0 }}
        exit={{ y: "100%" }}
        transition={{ type: "spring", damping: 26, stiffness: 200 }}
        className="relative w-full rounded-t-[28px] z-10"
        style={{ maxWidth: 430, maxHeight: "85vh", background: "#FFFFFF", overflow: "auto" }}
        onClick={e => e.stopPropagation()}
      >
        {/* Handle */}
        <div className="flex justify-center pt-3">
          <div style={{ width: 36, height: 4, borderRadius: 99, background: "#E5E7EB" }} />
        </div>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-3 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #C41E3A, #9E1830)" }}>
              <Camera size={18} color="#fff" />
            </div>
            <div>
              <h2 className="text-[16px] font-bold" style={{ color: "#1B2A4A" }}>Snap & Analyze</h2>
              <p className="text-[11px]" style={{ color: "#9CA3AF" }}>No barcode needed</p>
            </div>
          </div>
          <button onClick={onClose} className="w-9 h-9 rounded-full flex items-center justify-center" style={{ background: "#F3F4F6" }}>
            <X size={18} style={{ color: "#6B7280" }} />
          </button>
        </div>

        <div className="px-5 pb-8">
          {/* Upload area */}
          {!image && (
            <motion.button
              whileTap={{ scale: 0.98 }}
              onClick={() => fileRef.current?.click()}
              className="w-full mt-4 rounded-2xl flex flex-col items-center justify-center gap-3 py-12"
              style={{ background: "#F9FAFB", border: "2px dashed #E5E7EB" }}
            >
              <div className="w-16 h-16 rounded-full flex items-center justify-center" style={{ background: "#FFF1F2" }}>
                <Camera size={28} style={{ color: "#C41E3A" }} />
              </div>
              <div className="text-center">
                <p className="text-[15px] font-semibold" style={{ color: "#1B2A4A" }}>Take a photo of your food</p>
                <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>Works with fruits, veggies, meals & snacks</p>
              </div>
            </motion.button>
          )}

          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleCapture}
          />

          {/* Image preview */}
          {image && (
            <div className="mt-4 relative">
              <img src={image} alt="Food" className="w-full rounded-2xl object-cover" style={{ maxHeight: 200 }} />
              {!result && !analyzing && (
                <button
                  onClick={() => { setImage(null); setResult(null); setError(null); }}
                  className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/50 flex items-center justify-center"
                >
                  <X size={16} color="#fff" />
                </button>
              )}
            </div>
          )}

          {/* Loading */}
          {analyzing && (
            <div className="mt-6 text-center">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                className="inline-block"
              >
                <Loader2 size={28} style={{ color: "#C41E3A" }} />
              </motion.div>
              <p className="text-[14px] font-semibold mt-3" style={{ color: "#1B2A4A" }}>Analyzing your food...</p>
              <p className="text-[12px] mt-1" style={{ color: "#9CA3AF" }}>AI is identifying nutrients and health impact</p>
            </div>
          )}

          {/* Error */}
          {error && (
            <div className="mt-4 p-4 rounded-2xl text-center" style={{ background: "#FEF2F2", border: "1px solid #FECDD3" }}>
              <p className="text-[13px] font-semibold" style={{ color: "#DC2626" }}>{error}</p>
              <button
                onClick={() => { setImage(null); setError(null); }}
                className="mt-3 px-4 py-2 rounded-xl text-[13px] font-semibold text-white"
                style={{ background: "#C41E3A" }}
              >
                Try Again
              </button>
            </div>
          )}

          {/* Result */}
          <AnimatePresence>
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-5 space-y-3"
              >
                {/* Name & Score */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{result.emoji}</span>
                    <div>
                      <h3 className="text-[17px] font-bold" style={{ color: "#1B2A4A" }}>{result.name}</h3>
                      <p className="text-[12px]" style={{ color: "#9CA3AF" }}>{result.category}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: scoreColor(result.score) + "15" }}>
                    <span className="text-[18px] font-extrabold" style={{ color: scoreColor(result.score) }}>{result.score}</span>
                    <span className="text-[10px] font-semibold" style={{ color: scoreColor(result.score) }}>/100</span>
                  </div>
                </div>

                {/* Nutrient grid */}
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "Calories", val: `${result.calories_per_100g} kcal`, icon: "🔥" },
                    { label: "Protein", val: `${result.protein_per_100g}g`, icon: "💪" },
                    { label: "Fiber", val: `${result.fiber_per_100g}g`, icon: "🌾" },
                    { label: "Sugar", val: `${result.sugar_per_100g}g`, icon: "🍬" },
                    { label: "Fat", val: `${result.fat_per_100g}g`, icon: "💧" },
                  ].map(n => (
                    <div key={n.label} className="flex items-center gap-2 px-3 py-2 rounded-xl" style={{ background: "#F9FAFB", border: "1px solid #E5E7EB" }}>
                      <span className="text-sm">{n.icon}</span>
                      <div>
                        <p className="text-[10px] font-semibold uppercase" style={{ color: "#9CA3AF" }}>{n.label}</p>
                        <p className="text-[13px] font-bold" style={{ color: "#1B2A4A" }}>{n.val}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Health tip */}
                <div className="flex items-start gap-2 p-3 rounded-xl" style={{ background: "#F0FDF4", border: "1px solid #BBF7D0" }}>
                  <Sparkles size={14} style={{ color: "#22C55E" }} className="mt-0.5 flex-shrink-0" />
                  <div>
                    <p className="text-[11px] font-bold uppercase mb-0.5" style={{ color: "#15803D" }}>Health Tip</p>
                    <p className="text-[12px] leading-relaxed" style={{ color: "#166534" }}>{result.health_tip}</p>
                  </div>
                </div>

                {/* AI badge */}
                <div className="flex items-center justify-center gap-1 pt-1">
                  <Sparkles size={10} style={{ color: "#9CA3AF" }} />
                  <span className="text-[10px]" style={{ color: "#9CA3AF" }}>Estimated by AI · May not be exact</span>
                </div>

                {/* Retake */}
                <button
                  onClick={() => { setImage(null); setResult(null); setError(null); }}
                  className="w-full py-3 rounded-2xl text-[14px] font-semibold mt-2"
                  style={{ background: "#F3F4F6", color: "#1B2A4A" }}
                >
                  Scan Another Item
                </button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </motion.div>
  );
}
