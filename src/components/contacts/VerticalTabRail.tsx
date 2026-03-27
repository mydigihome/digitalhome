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
    <div className="contacts-tab-rail">
      {tabs.map((tab) => (
        <div
          key={tab.key}
          className="contacts-tab-item"
          onClick={() => onViewChange(tab.key)}
        >
          <div
            className={`contacts-tab-line ${activeView === tab.key ? "active" : "inactive"}`}
          />
          <span
            className={`contacts-tab-label ${activeView === tab.key ? "active" : "inactive"}`}
          >
            {tab.label}
          </span>
        </div>
      ))}
    </div>
  );
}
