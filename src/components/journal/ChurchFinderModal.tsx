import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, MapPin, Star, Navigation, Search, Church } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const DENOMINATIONS = [
  "All", "Christian", "Catholic", "Baptist", "Methodist", "Presbyterian",
  "Lutheran", "Pentecostal", "Non-Denominational", "Episcopal", "Orthodox",
];

const RADII = [
  { label: "1 mi", value: 1 },
  { label: "5 mi", value: 5 },
  { label: "10 mi", value: 10 },
  { label: "25 mi", value: 25 },
];

// Mock results for UI-only
const MOCK_CHURCHES = [
  { name: "Grace Community Church", address: "1234 Oak Street, Anytown", rating: 4.8, denomination: "Non-Denominational" },
  { name: "St. Mary's Catholic Church", address: "567 Elm Avenue, Anytown", rating: 4.6, denomination: "Catholic" },
  { name: "First Baptist Church", address: "890 Main Street, Anytown", rating: 4.5, denomination: "Baptist" },
  { name: "Trinity Methodist", address: "321 Pine Road, Anytown", rating: 4.7, denomination: "Methodist" },
];

interface ChurchFinderModalProps {
  open: boolean;
  onClose: () => void;
}

export default function ChurchFinderModal({ open, onClose }: ChurchFinderModalProps) {
  const [denomination, setDenomination] = useState("All");
  const [radius, setRadius] = useState(10);
  const [location, setLocation] = useState("");
  const [searched, setSearched] = useState(false);

  const handleSearch = () => {
    if (!location.trim()) {
      toast.error("Enter your city or zip code");
      return;
    }
    setSearched(true);
    toast("Showing sample results — Google Places integration coming soon!");
  };

  const results = searched
    ? MOCK_CHURCHES.filter((c) => denomination === "All" || c.denomination === denomination)
    : [];

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[70] flex items-end sm:items-center justify-center bg-black/40"
        >
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="w-full max-w-md bg-white dark:bg-card rounded-t-3xl sm:rounded-3xl p-6 max-h-[85vh] overflow-y-auto"
          >
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: "#EEF2FF" }}>
                  <Church className="w-4 h-4" style={{ color: "#6366F1" }} />
                </div>
                <h2 className="text-lg font-bold">Find a Church</h2>
              </div>
              <button onClick={onClose}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Location */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="City, zip code, or address"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="pl-9 rounded-xl"
              />
            </div>

            {/* Denomination */}
            <div className="mb-4">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Denomination</label>
              <div className="flex flex-wrap gap-1.5">
                {DENOMINATIONS.map((d) => (
                  <button
                    key={d}
                    onClick={() => setDenomination(d)}
                    className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                      denomination === d ? "text-white" : "bg-slate-100 dark:bg-secondary text-foreground"
                    }`}
                    style={denomination === d ? { backgroundColor: "#6366F1" } : {}}
                  >
                    {d}
                  </button>
                ))}
              </div>
            </div>

            {/* Radius */}
            <div className="mb-5">
              <label className="text-xs font-semibold uppercase text-muted-foreground mb-2 block">Distance</label>
              <div className="flex gap-2">
                {RADII.map((r) => (
                  <button
                    key={r.value}
                    onClick={() => setRadius(r.value)}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-medium transition-all ${
                      radius === r.value ? "text-white" : "bg-slate-100 dark:bg-secondary text-foreground"
                    }`}
                    style={radius === r.value ? { backgroundColor: "#6366F1" } : {}}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>

            <Button onClick={handleSearch} className="w-full rounded-xl mb-4" style={{ backgroundColor: "#6366F1" }}>
              Search Churches
            </Button>

            {/* Results */}
            {results.length > 0 && (
              <div className="space-y-3">
                {results.map((church, i) => (
                  <div key={i} className="p-3 rounded-2xl border border-slate-100 dark:border-border">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-sm">{church.name}</h4>
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="w-3 h-3" /> {church.address}
                        </p>
                        <p className="text-[10px] text-muted-foreground mt-0.5">{church.denomination}</p>
                      </div>
                      <div className="flex items-center gap-0.5 text-xs">
                        <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                        {church.rating}
                      </div>
                    </div>
                    <button
                      onClick={() => toast("Directions would open in Google Maps")}
                      className="mt-2 flex items-center gap-1 text-xs font-medium"
                      style={{ color: "#6366F1" }}
                    >
                      <Navigation className="w-3 h-3" /> Get Directions
                    </button>
                  </div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
