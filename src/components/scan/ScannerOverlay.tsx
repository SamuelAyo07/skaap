import { memo, forwardRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Zap, ZapOff, X } from "lucide-react";

interface ScannerOverlayProps {
  torchOn: boolean;
  torchSupported: boolean;
  hintVisible: boolean;
  bottomHintVisible: boolean;
  onClose: () => void;
  onToggleTorch: () => void;
}

/**
 * Memoized scanner overlay. Keeps the <video> element stable across the
 * parent's frequent state changes so the camera feed never reflows.
 * Only re-renders when torch / hint props actually change.
 */
export const ScannerOverlay = memo(
  forwardRef<HTMLVideoElement, ScannerOverlayProps>(function ScannerOverlay(
    { torchOn, torchSupported, hintVisible, bottomHintVisible, onClose, onToggleTorch },
    videoRef
  ) {
    return (
      <div className="fixed inset-0 bg-black z-50 animate-scanner-in">
        <video
          ref={videoRef}
          autoPlay
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
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
            {hintVisible && (
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
          {bottomHintVisible && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="absolute bottom-24 left-1/2 -translate-x-1/2 z-10 px-5 py-3 rounded-full glass-pill"
            >
              <p className="text-white text-xs font-normal text-center">Works on all barcodes</p>
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
            className="w-11 h-11 rounded-full flex items-center justify-center glass-pill active:scale-90 transition-transform"
            aria-label="Flashlight"
          >
            {torchOn ? <ZapOff size={20} color="#fff" /> : <Zap size={20} color="#fff" />}
          </button>
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
