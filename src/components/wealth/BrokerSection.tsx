import { useState } from "react";
import { ExternalLink, Settings, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";

const BROKERS = [
  { name: "Webull", url: "https://www.webull.com", color: "bg-primary" },
  { name: "Robinhood", url: "https://robinhood.com" },
  { name: "Fidelity", url: "https://www.fidelity.com" },
  { name: "Schwab", url: "https://www.schwab.com" },
  { name: "TD Ameritrade", url: "https://www.tdameritrade.com" },
  { name: "Interactive Brokers", url: "https://www.interactivebrokers.com" },
  { name: "E*TRADE", url: "https://us.etrade.com" },
];

interface BrokerConfig {
  name: string;
  url: string;
}

function loadBroker(): BrokerConfig {
  return loadStoredJson<BrokerConfig>("wealth_broker", { name: "Webull", url: "https://www.webull.com" });
}

export default function BrokerSection() {
  const [broker, setBroker] = useState<BrokerConfig>(loadBroker);
  const [showSettings, setShowSettings] = useState(false);
  const [customUrl, setCustomUrl] = useState("");

  const selectBroker = (b: BrokerConfig) => {
    setBroker(b);
    saveStoredJson("wealth_broker", b);
    setShowSettings(false);
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">Go to Broker</h2>
        <Button variant="ghost" size="sm" onClick={() => setShowSettings(!showSettings)} className="text-xs gap-1">
          <Settings className="h-3.5 w-3.5" /> Change
        </Button>
      </div>

      <div className="rounded-xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-foreground">{broker.name}</p>
            <p className="text-xs text-muted-foreground">{broker.url}</p>
          </div>
          <Button
            onClick={() => window.open(broker.url, "_blank")}
            className="gap-1.5"
          >
            <ExternalLink className="h-4 w-4" /> Open {broker.name}
          </Button>
        </div>

        {showSettings && (
          <div className="mt-4 pt-4 border-t border-border space-y-2">
            <p className="text-xs font-medium text-muted-foreground mb-2">Select your broker:</p>
            <div className="grid grid-cols-2 gap-2">
              {BROKERS.map((b) => (
                <button
                  key={b.name}
                  onClick={() => selectBroker(b)}
                  className={`text-left p-3 rounded-lg border text-sm transition-all ${
                    broker.name === b.name
                      ? "border-primary bg-primary/5 text-foreground font-medium"
                      : "border-border bg-card text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    {b.name}
                    {broker.name === b.name && <Check className="h-3.5 w-3.5 text-primary" />}
                  </div>
                </button>
              ))}
            </div>
            <div className="pt-2">
              <p className="text-xs text-muted-foreground mb-1">Custom broker URL:</p>
              <div className="flex gap-2">
                <Input
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  placeholder="https://your-broker.com"
                  className="h-8 text-sm"
                />
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8"
                  onClick={() => {
                    if (customUrl) selectBroker({ name: "Custom", url: customUrl });
                  }}
                >
                  Set
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
