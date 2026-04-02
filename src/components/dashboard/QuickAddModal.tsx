import { Target, CheckCircle, BookOpen, UserPlus, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface QuickAddModalProps {
  open: boolean;
  onClose: () => void;
  onNewGoal: () => void;
  onNewTask: () => void;
  onNewJournal: () => void;
  onNewContact: () => void;
}

const options = [
  { key: "goal", label: "New Goal", icon: Target, color: "text-primary" },
  { key: "task", label: "New Task", icon: CheckCircle, color: "text-success" },
  { key: "journal", label: "New Journal Entry", icon: BookOpen, color: "text-warning" },
  { key: "contact", label: "New Contact", icon: UserPlus, color: "text-info" },
];

export default function QuickAddModal({ open, onClose, onNewGoal, onNewTask, onNewJournal, onNewContact }: QuickAddModalProps) {
  const handlers: Record<string, () => void> = {
    goal: () => { onNewGoal(); onClose(); },
    task: () => { onNewTask(); onClose(); },
    journal: () => { onNewJournal(); onClose(); },
    contact: () => { onNewContact(); onClose(); },
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
            className="w-full max-w-[400px] mx-4 bg-card rounded-xl border border-border shadow-2xl overflow-hidden"
          >
            <div className="flex items-center justify-between p-4 border-b border-border">
              <h3 className="text-base font-semibold text-foreground">Quick Add</h3>
              <button onClick={onClose} className="p-1 hover:bg-muted rounded-lg transition">
                <X className="w-4 h-4 text-muted-foreground" />
              </button>
            </div>
            <div className="divide-y divide-border">
              {options.map((opt) => {
                const Icon = opt.icon;
                return (
                  <button
                    key={opt.key}
                    onClick={handlers[opt.key]}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-muted/50 transition text-left"
                  >
                    <Icon className={`w-5 h-5 ${opt.color}`} />
                    <span className="text-sm font-medium text-foreground">{opt.label}</span>
                  </button>
                );
              })}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
