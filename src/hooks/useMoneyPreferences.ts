import { useState, useEffect, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

const DEFAULT_ORDER = [
  "plaid", "net-worth", "spending", "debt", "credit-score",
  "bills", "moneyflow", "emergency", "salary", "tradingview",
];

interface MoneyPrefs {
  cardOrder: string[];
  hiddenCards: string[];
  cardData: Record<string, any>;
}

const LOCAL_KEY = (uid: string) => `money_prefs_${uid}`;

function loadLocal(uid: string): MoneyPrefs {
  try {
    const raw = localStorage.getItem(LOCAL_KEY(uid));
    if (raw) return JSON.parse(raw);
  } catch {}
  return { cardOrder: DEFAULT_ORDER, hiddenCards: [], cardData: {} };
}

function saveLocal(uid: string, prefs: MoneyPrefs) {
  try { localStorage.setItem(LOCAL_KEY(uid), JSON.stringify(prefs)); } catch {}
}

export function useMoneyPreferences() {
  const { user } = useAuth();
  const uid = user?.id;
  const [prefs, setPrefs] = useState<MoneyPrefs>(() =>
    uid ? loadLocal(uid) : { cardOrder: DEFAULT_ORDER, hiddenCards: [], cardData: {} }
  );
  const [loaded, setLoaded] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  // Load from Supabase on mount
  useEffect(() => {
    if (!uid) return;
    setPrefs(loadLocal(uid)); // instant from localStorage
    (async () => {
      const { data } = await supabase
        .from("money_tab_preferences" as any)
        .select("*")
        .eq("user_id", uid)
        .maybeSingle();
      if (data) {
        const remote: MoneyPrefs = {
          cardOrder: (data as any).card_order ?? DEFAULT_ORDER,
          hiddenCards: (data as any).hidden_cards ?? [],
          cardData: (data as any).card_data ?? {},
        };
        setPrefs(remote);
        saveLocal(uid, remote);
      } else {
        // Insert default row
        await supabase.from("money_tab_preferences" as any).insert({
          user_id: uid,
          card_order: DEFAULT_ORDER,
          hidden_cards: [],
          card_data: {},
        } as any);
      }
      setLoaded(true);
    })();
  }, [uid]);

  const persist = useCallback((next: MoneyPrefs) => {
    if (!uid) return;
    saveLocal(uid, next);
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      await supabase.from("money_tab_preferences" as any).update({
        card_order: next.cardOrder,
        hidden_cards: next.hiddenCards,
        card_data: next.cardData,
        updated_at: new Date().toISOString(),
      } as any).eq("user_id", uid);
    }, 500);
  }, [uid]);

  const updateCardOrder = useCallback((order: string[]) => {
    setPrefs(p => { const n = { ...p, cardOrder: order }; persist(n); return n; });
  }, [persist]);

  const hideCard = useCallback((id: string) => {
    setPrefs(p => {
      const n = {
        ...p,
        cardOrder: p.cardOrder.filter(c => c !== id),
        hiddenCards: [...p.hiddenCards.filter(c => c !== id), id],
      };
      persist(n);
      return n;
    });
  }, [persist]);

  const restoreCard = useCallback((id: string) => {
    setPrefs(p => {
      const n = {
        ...p,
        hiddenCards: p.hiddenCards.filter(c => c !== id),
        cardOrder: [...p.cardOrder, id],
      };
      persist(n);
      return n;
    });
  }, [persist]);

  const restoreAll = useCallback(() => {
    setPrefs(p => {
      const n = {
        ...p,
        cardOrder: [...p.cardOrder, ...p.hiddenCards],
        hiddenCards: [],
      };
      persist(n);
      return n;
    });
  }, [persist]);

  const saveCardData = useCallback((cardId: string, data: any) => {
    setPrefs(p => {
      const n = { ...p, cardData: { ...p.cardData, [cardId]: data } };
      persist(n);
      return n;
    });
  }, [persist]);

  return {
    ...prefs,
    loaded,
    updateCardOrder,
    hideCard,
    restoreCard,
    restoreAll,
    saveCardData,
  };
}
