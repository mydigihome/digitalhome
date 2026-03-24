import { motion } from "framer-motion";
import { Target, UserPlus, Receipt, CheckCircle, BookOpen } from "lucide-react";

interface QuickActionsRowProps {
  onNewGoal: () => void;
  onNewContact: () => void;
  onNewBill: () => void;
  onNewTodo: () => void;
  onJournal: () => void;
}

const actions = [
  { key: "goal", label: "Goal", icon: Target, color: "text-primary", bg: "bg-primary/10" },
  { key: "contact", label: "Contact", icon: UserPlus, color: "text-info", bg: "bg-info/10" },
  { key: "bill", label: "Bill", icon: Receipt, color: "text-destructive", bg: "bg-destructive/10" },
  { key: "todo", label: "Todo", icon: CheckCircle, color: "text-success", bg: "bg-success/10" },
  { key: "journal", label: "Journal", icon: BookOpen, color: "text-warning", bg: "bg-warning/10" },
];

export default function QuickActionsRow({ onNewGoal, onNewContact, onNewBill, onNewTodo, onJournal }: QuickActionsRowProps) {
  const handlers: Record<string, () => void> = {
    goal: onNewGoal,
    contact: onNewContact,
    bill: onNewBill,
    todo: onNewTodo,
    journal: onJournal,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.1 }}
      className="flex items-center justify-center gap-4 sm:gap-6"
    >
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.key}
            onClick={handlers[action.key]}
            className="flex flex-col items-center gap-1.5 group"
          >
            <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full ${action.bg} flex items-center justify-center transition-transform group-hover:scale-110 group-active:scale-95`}>
              <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${action.color}`} strokeWidth={1.5} />
            </div>
            <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
              {action.label}
            </span>
          </button>
        );
      })}
    </motion.div>
  );
}
