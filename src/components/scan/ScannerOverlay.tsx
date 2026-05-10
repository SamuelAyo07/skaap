import { memo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, ZapOff, X, Keyboard, RotateCw, AlertTriangle } from "lucide-react";

interface ScannerOverlayProps {
  torchOn: boolean;
  torchSupported: boolean;
  hintVisible: boolean;
  bottomHintVisible: boolean;
  noDetection?: boolean;
  errorMessage?: string | null;
  onClose: () => void;
  onToggleTorch: () => void;
  onTapFocus?: (xPct: number, yPct: number) => void;
  onManualEntry?: () => void;
  onRetry?: () => void;
}

/**
 * Memoized scanner overlay. Keeps the <video> element stable across the
 * parent's frequent state changes so the camera feed never reflows.
 */
export const ScannerOverlay = memo(
  forwardRef<HTMLVideoElement, ScannerOverlayProps>(function ScannerOverlay(
    {
      torchOn, torchSupported, hintVisible, bottomHintVisible,
      noDetection, errorMessage, onClose, onToggleTorch,
      onTapFocus, onManualEntry, onRetry,
    },
    videoRef
  ) {
    const handleVideoTap = (e: React.MouseEvent<HTMLVideoElement>) => {
      if (!onTapFocus) return;
      const rect = (e.target as HTMLVideoElement).getBoundingClientRect();
      const x = (e.clientX - rect.left) / rect.width;
      const y = (e.clientY - rect.top) / rect.height;
      onTapFocus(Math.max(0, Math.min(1, x)), Math.max(0, Math.min(1, y)));
    };

    return (
      <div className="fixed inset-0 bg-black z-50 animate-scanner-in">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          onClick={handleVideoTap}
          className="absolute inset-0 w-full h-full object-cover cursor-crosshair"
        />

        {/* Top bar */}
        <div
          className="absolute top-0 left-0 right-0 z-10 flex items-center justify-between px-4"
          style={{ paddingTop: "calc(env(safe-area-inset-top, 12px) + 12px)" }}
        >
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full flex items-center justify-center glass-pill active:scale-90 transition-transform"
            aria-label="Back"
          >
            <ArrowLeft size={18} color="#fff" />
          </button>

          <AnimatePresence>
            {hintVisible && !noDetection && !errorMessage && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="px-4 py-2 rounded-full glass-pill"
              >
                <p className="text-white text-[13px] font-semibold animate-hint-pulse">
                  Point at any barcode
                </p>
              </motion.div>
            )}
          </AnimatePresence>

          {torchSupported ? (
            <button
              onClick={onToggleTorch}
              className="w-9 h-9 rounded-full flex items-center justify-center glass-pill active:scale-90 transition-transform"
              aria-label="Toggle flashlight"
            >
              {torchOn ? <ZapOff size={18} color="#fff" /> : <Zap size={18} color="#fff" />}
            </button>
          ) : (
            <div className="w-9" />
          )}
        </div>

        {/* Reticle — pure CSS, no framer */}
        <div
          className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none"
          style={{ paddingBottom: "10%" }}
        >
          <div className="relative animate-bracket-pulse" style={{ width: 260, height: 160 }}>
            <div className="absolute" style={{ top: 0, left: 0, width: 24, height: 24, borderRadius: 4, borderTop: "3px solid #C41E3A", borderLeft: "3px solid #C41E3A" }} />
            <div className="absolute" style={{ top: 0, right: 0, width: 24, height: 24, borderRadius: 4, borderTop: "3px solid #C41E3A", borderRight: "3px solid #C41E3A" }} />
            <div className="absolute" style={{ bottom: 0, left: 0, width: 24, height: 24, borderRadius: 4, borderBottom: "3px solid #C41E3A", borderLeft: "3px solid #C41E3A" }} />
            <div className="absolute" style={{ bottom: 0, right: 0, width: 24, height: 24, borderRadius: 4, borderBottom: "3px solid #C41E3A", borderRight: "3px solid #C41E3A" }} />
            <div
              className="absolute left-3 right-3 animate-scan-sweep"
              style={{ height: 1, background: "linear-gradient(90deg, transparent, #C41E3A, transparent)", top: 12 }}
            />
          </div>
        </div>

        <AnimatePresence>
          {bottomHintVisible && !noDetection && !errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-28 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-full glass-pill"
            >
              <p className="text-white text-xs font-normal text-center">
                Tap to focus · Works on all barcodes
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Graceful fallback: no detection after timeout */}
        <AnimatePresence>
          {noDetection && !errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute bottom-28 left-4 right-4 z-20 rounded-2xl p-4 glass-pill"
            >
              <p className="text-white text-[13px] font-semibold mb-1">
                Having trouble reading the barcode?
              </p>
              <p className="text-white/70 text-[11px] mb-3 leading-relaxed">
                Move closer (10–15 cm), tap the screen to focus, hold steady, or turn on the torch in low light.
              </p>
              <div className="flex gap-2">
                {onManualEntry && (
                  <button
                    onClick={onManualEntry}
                    className="flex-1 h-10 rounded-full bg-white text-black text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Keyboard size={14} /> Type barcode
                  </button>
                )}
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="h-10 px-4 rounded-full glass-pill text-white text-[12px] font-semibold flex items-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <RotateCw size={14} /> Keep trying
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Camera/permission error */}
        <AnimatePresence>
          {errorMessage && (
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 16 }}
              className="absolute inset-x-4 top-1/2 -translate-y-1/2 z-20 rounded-2xl p-5 glass-pill"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 rounded-full bg-[#C41E3A]/20 flex items-center justify-center shrink-0">
                  <AlertTriangle size={18} color="#C41E3A" />
                </div>
                <div>
                  <p className="text-white text-[14px] font-semibold mb-1">Camera unavailable</p>
                  <p className="text-white/70 text-[12px] leading-relaxed">{errorMessage}</p>
                </div>
              </div>
              <div className="flex gap-2">
                {onRetry && (
                  <button
                    onClick={onRetry}
                    className="flex-1 h-10 rounded-full bg-white text-black text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <RotateCw size={14} /> Try again
                  </button>
                )}
                {onManualEntry && (
                  <button
                    onClick={onManualEntry}
                    className="flex-1 h-10 rounded-full glass-pill text-white text-[12px] font-semibold flex items-center justify-center gap-1.5 active:scale-95 transition-transform"
                  >
                    <Keyboard size={14} /> Type barcode
                  </button>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Bottom bar */}
        <div
          className="absolute bottom-0 left-0 right-0 z-10 glass-nav flex items-center justify-between px-6"
          style={{ height: 80, paddingBottom: 20 }}
        >
          <button
            onClick={onToggleTorch}
            className="w-11 h-11 rounded-full flex items-center justify-center glass-pill active:scale-90 transition-transform disabled:opacity-40"
            aria-label="Flashlight"
            disabled={!torchSupported}
          >
            {torchOn ? <ZapOff size={20} color="#fff" /> : <Zap size={20} color="#fff" />}
          </button>
          {onManualEntry ? (
            <button
              onClick={onManualEntry}
              className="h-11 px-4 rounded-full flex items-center gap-1.5 glass-pill active:scale-95 transition-transform"
              aria-label="Type barcode"
            >
              <Keyboard size={16} color="#fff" />
              <span className="text-white text-[12px] font-semibold">Type</span>
            </button>
          ) : <div className="w-11" />}
          <button
            onClick={onClose}
            className="w-11 h-11 rounded-full flex items-center justify-center glass-pill active:scale-90 transition-transform"
            aria-label="Close"
          >
            <X size={20} color="#fff" />
          </button>
        </div>
      </div>
    );
  })
);
