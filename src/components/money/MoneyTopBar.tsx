import { Search, EyeOff, X, Plus } from "lucide-react";

interface Props {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  hiddenCount: number;
  onToggleDrawer: () => void;
  onOpenTrackFinance: () => void;
}

export default function MoneyTopBar({ searchQuery, onSearchChange, hiddenCount, onToggleDrawer, onOpenTrackFinance }: Props) {
  return (
    <div className="flex items-center gap-3 mb-4">
      {/* Search */}
      <div className="flex-1 flex items-center gap-3 bg-[#f9fafb] dark:bg-[#252836] border border-[#e5e7eb] dark:border-[#2d3148] rounded-[12px] px-4 py-2.5">
        <Search className="w-4 h-4 flex-shrink-0 text-[#9ca3af]" />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search cards..."
          className="bg-transparent border-none outline-none text-sm text-[#111827] dark:text-[#f9fafb] w-full placeholder:text-[#9ca3af]"
          style={{ fontFamily: "inherit" }}
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} className="bg-transparent border-none cursor-pointer">
            <X className="w-4 h-4 text-[#9ca3af]" />
          </button>
        )}
      </div>

      {/* Hidden cards */}
      <button
        onClick={onToggleDrawer}
        className="flex items-center gap-2 bg-white dark:bg-[#1e2130] border border-[#e5e7eb] dark:border-[#2d3148] rounded-[12px] px-4 py-2.5 cursor-pointer hover:bg-[#f9fafb] dark:hover:bg-[#252836] transition-colors"
      >
        <EyeOff className="w-4 h-4 text-[#374151] dark:text-[#e5e7eb]" />
        <span className="text-sm font-medium text-[#374151] dark:text-[#e5e7eb]">Hidden</span>
        {hiddenCount > 0 && (
          <span className="w-5 h-5 rounded-full bg-[#6366f1] text-white text-[10px] font-bold flex items-center justify-center">
            {hiddenCount}
          </span>
        )}
      </button>

      {/* Add Card */}
      <button
        onClick={onOpenTrackFinance}
        className="flex items-center gap-2 bg-[#6366f1] hover:bg-[#4f46e5] text-white rounded-[12px] px-4 py-2.5 border-none cursor-pointer transition-colors"
      >
        <Plus className="w-4 h-4" />
        <span className="text-sm font-semibold">Add Card</span>
      </button>
    </div>
  );
}
