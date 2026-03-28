interface EmailData {
  id: string;
  senderName: string;
  senderInitial: string;
  subject: string;
  snippet: string;
  time: string;
  isUnread: boolean;
}

interface Props {
  email: EmailData;
  isActive: boolean;
  onClick: () => void;
}

export default function EmailRow({ email, isActive, onClick }: Props) {
  return (
    <div
      onClick={onClick}
      className={`px-4 py-3 rounded-[16px] cursor-pointer flex items-start gap-3 transition-colors ${
        isActive ? "bg-[#4648d4]/8" : "hover:bg-[#f3f3f8] dark:hover:bg-[#252836]"
      }`}
    >
      {email.isUnread && (
        <div className="w-2 h-2 rounded-full bg-[#4648d4] mt-2 flex-shrink-0" />
      )}
      <div className="w-8 h-8 rounded-full bg-[#e1e0ff] dark:bg-[#2d2b4e] text-[#4648d4] dark:text-[#a5b4fc] font-bold text-xs flex items-center justify-center flex-shrink-0">
        {email.senderInitial}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <span className="font-bold text-xs text-[#1a1c1f] dark:text-[#f9fafb]">{email.senderName}</span>
          <span className="text-[10px] text-[#767586] dark:text-[#9ca3af] flex-shrink-0">{email.time}</span>
        </div>
        <div className="text-xs text-[#1a1c1f] dark:text-[#f9fafb] truncate font-medium">{email.subject}</div>
        <div className="text-xs text-[#767586] dark:text-[#9ca3af] truncate">{email.snippet}</div>
      </div>
    </div>
  );
}
