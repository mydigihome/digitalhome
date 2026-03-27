import { useState } from "react";
import { Search, EyeOff, X, Zap } from "lucide-react";

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
      <div className="flex-1 flex items-center gap-3" style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "8px 20px", boxShadow: "0 2px 12px rgba(70,69,84,0.06)" }}>
        <Search className="w-4 h-4 flex-shrink-0" style={{ color: "#767586" }} />
        <input
          value={searchQuery}
          onChange={e => onSearchChange(e.target.value)}
          placeholder="Search cards..."
          style={{ background: "transparent", border: "none", outline: "none", fontSize: "14px", color: "#1a1c1f", width: "100%", fontFamily: "inherit" }}
          className="placeholder:text-[#c7c4d7]"
        />
        {searchQuery && (
          <button onClick={() => onSearchChange("")} style={{ background: "none", border: "none", cursor: "pointer" }}>
            <X className="w-4 h-4" style={{ color: "#767586" }} />
          </button>
        )}
      </div>

      {/* Hidden cards */}
      <button
        onClick={onToggleDrawer}
        className="flex items-center gap-2"
        style={{ backgroundColor: "#ffffff", borderRadius: "20px", padding: "8px 16px", boxShadow: "0 2px 12px rgba(70,69,84,0.06)", border: "none", cursor: "pointer" }}
      >
        <EyeOff className="w-4 h-4" style={{ color: "#767586" }} />
        <span style={{ fontSize: "14px", fontWeight: 700, color: "#767586" }}>Hidden</span>
        {hiddenCount > 0 && (
          <span style={{ width: "20px", height: "20px", borderRadius: "50%", backgroundColor: "#4648d4", color: "white", fontSize: "10px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center" }}>
            {hiddenCount}
          </span>
        )}
      </button>

      {/* Track Finance */}
      <button
        onClick={onOpenTrackFinance}
        className="flex items-center gap-2"
        style={{ background: "linear-gradient(135deg, #4648d4, #6063ee)", color: "white", borderRadius: "20px", padding: "8px 20px", border: "none", cursor: "pointer" }}
      >
        <Zap className="w-4 h-4" />
        <span style={{ fontSize: "14px", fontWeight: 700 }}>Track Finance</span>
      </button>
    </div>
  );
}
