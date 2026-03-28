interface Props {
  activeView: string;
  onViewChange: (view: string) => void;
}

const tabs = [
  { key: "overview", label: "Overview" },
  { key: "emails", label: "Emails" },
  { key: "contacts", label: "Contacts" },
];

export default function VerticalTabRail({ activeView, onViewChange }: Props) {
  return (
    <div className="flex items-center gap-6 mb-6">
      {tabs.map((tab) => (
        <button
          key={tab.key}
          onClick={() => onViewChange(tab.key)}
          className={`text-sm font-bold pb-1 transition-colors duration-200 border-b-2 ${
            activeView === tab.key
              ? "text-[#4648d4] border-[#4648d4]"
              : "text-[#767586] dark:text-[#9ca3af] border-transparent hover:text-[#464554] dark:hover:text-[#e5e7eb]"
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
