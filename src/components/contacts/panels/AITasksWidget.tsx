import { useState } from "react";
import { Check } from "lucide-react";

interface Task {
  id: string;
  text: string;
  contactName: string;
  completed: boolean;
}

const DEFAULT_TASKS: Task[] = [
  { id: "t1", text: "Follow up with Sarah Johnson about investment property listings", contactName: "Sarah Johnson", completed: false },
  { id: "t2", text: "Send Mike Thompson the kitchen remodel approval", contactName: "Mike Thompson", completed: false },
  { id: "t3", text: "Check in with James Chen — 12 days since last contact", contactName: "James Chen", completed: false },
  { id: "t4", text: "Schedule a call with Robert Kim about mortgage pre-approval", contactName: "Robert Kim", completed: false },
];

const SARAH_TASKS: Task[] = [
  { id: "st1", text: "Reply to Sarah's Investment ROI Sheet email", contactName: "Sarah Johnson", completed: false },
  { id: "st2", text: "Schedule a property viewing call this week", contactName: "Sarah Johnson", completed: false },
  { id: "st3", text: "Review 3 property listings she sent", contactName: "Sarah Johnson", completed: false },
];

const MIKE_TASKS: Task[] = [
  { id: "mt1", text: "Approve kitchen remodel electrical work", contactName: "Mike Thompson", completed: false },
  { id: "mt2", text: "Review quartzite countertop quote", contactName: "Mike Thompson", completed: false },
  { id: "mt3", text: "Schedule final walkthrough", contactName: "Mike Thompson", completed: false },
];

function getTasksForContact(contactId: string | null): Task[] {
  if (contactId === "p1") return SARAH_TASKS;
  if (contactId === "p2") return MIKE_TASKS;
  return DEFAULT_TASKS;
}

interface Props {
  activeContactId: string | null;
}

export default function AITasksWidget({ activeContactId }: Props) {
  const baseTasks = getTasksForContact(activeContactId);
  const [tasks, setTasks] = useState<Task[]>(baseTasks);
  const [prevContactId, setPrevContactId] = useState(activeContactId);

  if (activeContactId !== prevContactId) {
    setPrevContactId(activeContactId);
    setTasks(getTasksForContact(activeContactId));
  }

  const toggleTask = (id: string) => {
    setTasks(prev => {
      const updated = prev.map(t => t.id === id ? { ...t, completed: !t.completed } : t);
      return [...updated.filter(t => !t.completed), ...updated.filter(t => t.completed)];
    });
  };

  const refresh = () => {
    const base = getTasksForContact(activeContactId);
    setTasks([...base].sort(() => Math.random() - 0.5).map(t => ({ ...t, completed: false })));
  };

  return (
    <div className="rounded-[24px] p-5" style={{ background: "#ffffff", boxShadow: "0 12px 40px rgba(70,69,84,0.06)", border: "1px solid #f0f0f5" }}>
      <div className="flex items-center justify-between mb-3">
        <span className="font-bold text-sm text-[#1a1c1f]" style={{ fontFamily: "'Plus Jakarta Sans', sans-serif" }}>
          ✦ AI Suggested Tasks
        </span>
        <span className="text-[#4648d4] text-sm">✦</span>
      </div>

      <div className="space-y-2">
        {tasks.map(task => (
          <div
            key={task.id}
            onClick={() => toggleTask(task.id)}
            className={`flex items-start gap-3 p-3 rounded-[16px] cursor-pointer transition-colors ${task.completed ? "bg-[#f9f9fe]" : "bg-[#f3f3f8] hover:bg-[#eeeef8]"}`}
          >
            <div className={`w-4 h-4 rounded-full border-2 flex-shrink-0 mt-0.5 flex items-center justify-center transition-colors ${task.completed ? "bg-[#4648d4] border-[#4648d4]" : "border-[#c0c1ff]"}`}>
              {task.completed && <Check className="w-2.5 h-2.5 text-white" />}
            </div>
            <div>
              <div className={`text-xs font-medium ${task.completed ? "line-through text-[#767586]" : "text-[#1a1c1f]"}`}>
                {task.text}
              </div>
              <span className="bg-[#e1e0ff] text-[#4648d4] text-[9px] font-bold rounded-full px-2 py-0.5 inline-block mt-1">
                {task.contactName}
              </span>
            </div>
          </div>
        ))}
      </div>

      <button onClick={refresh} className="text-[10px] text-[#4648d4] font-bold mt-3 hover:underline">
        ✦ Refresh suggestions
      </button>
    </div>
  );
}
