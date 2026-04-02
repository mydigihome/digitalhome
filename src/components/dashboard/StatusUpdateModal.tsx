import { useState } from "react";
import { X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface StatusUpdateModalProps {
  open: boolean;
  onClose: () => void;
}

export default function StatusUpdateModal({ open, onClose }: StatusUpdateModalProps) {
  const [text, setText] = useState("");

  const handlePost = () => {
    if (!text.trim()) return;
    toast.success("Status updated!");
    setText("");
    onClose();
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[400px] mx-4 bg-card rounded-xl border border-border shadow-2xl p-5"
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-semibold text-foreground">Update Status</h3>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 280))}
              placeholder="What's on your mind?"
              className="w-full h-24 px-3 py-2 text-sm border border-border rounded-lg bg-background text-foreground placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-primary resize-none"
            />
            <div className="flex items-center justify-between mt-3">
              <span className="text-xs text-muted-foreground">{text.length}/280</span>
              <Button size="sm" onClick={handlePost} disabled={!text.trim()}>
                Post to profile
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
