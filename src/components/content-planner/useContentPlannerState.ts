import { useState, useCallback, useEffect, useRef } from "react";
import {
  SetupData, WeekData, DayData, PostEntry, IdeaEntry, HashtagGroup, StrategyRow,
  ContentPlannerData, DEFAULT_SETUP, DEFAULT_TAB_ORDER, createEmptyPost,
} from "./types";
import { format, startOfWeek, addDays, parseISO } from "date-fns";

const STORAGE_KEY = "content-planner-data";

function getWeekStart(weekOffset = 0): string {
  const start = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  return format(start, "yyyy-MM-dd");
}

function createEmptyWeek(weekStartStr: string): WeekData {
  const start = parseISO(weekStartStr);
  const days: DayData[] = Array.from({ length: 7 }, (_, i) => ({
    date: format(addDays(start, i), "yyyy-MM-dd"),
    posts: [],
  }));
  return { weekStart: weekStartStr, weeklyGoal: "", weeklyTodos: ["", "", "", "", ""], weeklyReview: "", days };
}

const DEFAULT_IDEAS: Record<string, IdeaEntry[]> = {};
DEFAULT_SETUP.contentPillars.forEach((pillar, pi) => {
  const examples = [
    ["5 tips for beginners", "How-to guide", "FAQ breakdown"],
    ["Behind the scenes", "Day in my life", "Story time"],
    ["Motivational quote", "Transformation story", "Goal setting"],
    ["Growth hack", "Analytics deep dive", "Collaboration idea"],
    ["Testimonial", "Case study", "Before & after"],
  ];
  DEFAULT_IDEAS[pillar] = (examples[pi] || examples[0]).map((text, i) => ({
    id: `${pi}-${i}`,
    text,
  }));
});

const DEFAULT_HASHTAG_GROUPS: HashtagGroup[] = [
  { id: "1", name: "Brand", hashtags: [{ tag: "#mybrand", size: "medium", checked: false }, { tag: "#brandlife", size: "small", checked: false }] },
  { id: "2", name: "Niche", hashtags: [{ tag: "#contentcreator", size: "large", checked: false }, { tag: "#digitalmarketing", size: "large", checked: false }] },
  { id: "3", name: "Community", hashtags: [{ tag: "#creatoreconomy", size: "medium", checked: false }, { tag: "#buildyourbrand", size: "medium", checked: false }] },
  { id: "4", name: "Growth", hashtags: [{ tag: "#growthmindset", size: "niche", checked: false }, { tag: "#socialmediatips", size: "large", checked: false }] },
  { id: "5", name: "Trending", hashtags: [{ tag: "#trending", size: "large", checked: false }, { tag: "#viral", size: "large", checked: false }] },
  { id: "6", name: "Platform", hashtags: [{ tag: "#reels", size: "large", checked: false }, { tag: "#tiktok", size: "large", checked: false }] },
];

const DEFAULT_STRATEGY: StrategyRow[] = [
  { label: "Primary Goals", value: "" },
  { label: "Target Audience", value: "" },
  { label: "Competitor Analysis", value: "" },
  { label: "Content Pillars", value: "" },
  { label: "Brand Voice", value: "" },
  { label: "Platform Strategy", value: "" },
  { label: "Monthly KPIs", value: "" },
];

function loadFromStorage(): ContentPlannerData | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

function buildDefaults(): ContentPlannerData {
  const weekStart = getWeekStart(0);
  return {
    setup: DEFAULT_SETUP,
    weeks: { [weekStart]: createEmptyWeek(weekStart) },
    ideas: DEFAULT_IDEAS,
    hashtagGroups: DEFAULT_HASHTAG_GROUPS,
    strategy: DEFAULT_STRATEGY,
    tabOrder: DEFAULT_TAB_ORDER,
  };
}

export function useContentPlannerState() {
  const [data, setData] = useState<ContentPlannerData>(() => {
    return loadFromStorage() || buildDefaults();
  });

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(0));

  // Auto-save to localStorage on every change
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }, 100);
    return () => clearTimeout(saveTimeout.current);
  }, [data]);

  // Ensure current week exists
  const currentWeek = data.weeks[currentWeekStart] || createEmptyWeek(currentWeekStart);
  if (!data.weeks[currentWeekStart]) {
    // lazily add it
    setData(prev => ({ ...prev, weeks: { ...prev.weeks, [currentWeekStart]: createEmptyWeek(currentWeekStart) } }));
  }

  const setSetup = useCallback((fn: SetupData | ((prev: SetupData) => SetupData)) => {
    setData(prev => ({
      ...prev,
      setup: typeof fn === "function" ? fn(prev.setup) : fn,
    }));
  }, []);

  const setCurrentWeek = useCallback((fn: WeekData | ((prev: WeekData) => WeekData)) => {
    setData(prev => {
      const old = prev.weeks[currentWeekStart] || createEmptyWeek(currentWeekStart);
      const next = typeof fn === "function" ? fn(old) : fn;
      return { ...prev, weeks: { ...prev.weeks, [currentWeekStart]: next } };
    });
  }, [currentWeekStart]);

  const addPost = useCallback((dayIndex: number) => {
    setCurrentWeek(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], posts: [...days[dayIndex].posts, createEmptyPost()] };
      return { ...prev, days };
    });
  }, [setCurrentWeek]);

  const updatePost = useCallback((dayIndex: number, postId: string, patch: Partial<PostEntry>) => {
    setCurrentWeek(prev => {
      const days = [...prev.days];
      const posts = days[dayIndex].posts.map(p => p.id === postId ? { ...p, ...patch } : p);
      days[dayIndex] = { ...days[dayIndex], posts };
      return { ...prev, days };
    });
  }, [setCurrentWeek]);

  const deletePost = useCallback((dayIndex: number, postId: string) => {
    setCurrentWeek(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], posts: days[dayIndex].posts.filter(p => p.id !== postId) };
      return { ...prev, days };
    });
  }, [setCurrentWeek]);

  const updatePostChecklist = useCallback((dayIndex: number, postId: string, key: string, val: boolean) => {
    setCurrentWeek(prev => {
      const days = [...prev.days];
      const posts = days[dayIndex].posts.map(p =>
        p.id === postId ? { ...p, checklist: { ...p.checklist, [key]: val } } : p
      );
      days[dayIndex] = { ...days[dayIndex], posts };
      return { ...prev, days };
    });
  }, [setCurrentWeek]);

  const updatePostAnalytics = useCallback((dayIndex: number, postId: string, key: string, val: string) => {
    setCurrentWeek(prev => {
      const days = [...prev.days];
      const posts = days[dayIndex].posts.map(p =>
        p.id === postId ? { ...p, analytics: { ...p.analytics, [key]: val } } : p
      );
      days[dayIndex] = { ...days[dayIndex], posts };
      return { ...prev, days };
    });
  }, [setCurrentWeek]);

  const navigateWeek = useCallback((direction: -1 | 1) => {
    setCurrentWeekStart(prev => {
      const d = parseISO(prev);
      const next = addDays(d, direction * 7);
      return format(next, "yyyy-MM-dd");
    });
  }, []);

  const setIdeas = useCallback((fn: Record<string, IdeaEntry[]> | ((prev: Record<string, IdeaEntry[]>) => Record<string, IdeaEntry[]>)) => {
    setData(prev => ({
      ...prev,
      ideas: typeof fn === "function" ? fn(prev.ideas) : fn,
    }));
  }, []);

  const setHashtagGroups = useCallback((fn: HashtagGroup[] | ((prev: HashtagGroup[]) => HashtagGroup[])) => {
    setData(prev => ({
      ...prev,
      hashtagGroups: typeof fn === "function" ? fn(prev.hashtagGroups) : fn,
    }));
  }, []);

  const setStrategy = useCallback((fn: StrategyRow[] | ((prev: StrategyRow[]) => StrategyRow[])) => {
    setData(prev => ({
      ...prev,
      strategy: typeof fn === "function" ? fn(prev.strategy) : fn,
    }));
  }, []);

  const setTabOrder = useCallback((order: string[]) => {
    setData(prev => ({ ...prev, tabOrder: order }));
  }, []);

  // Get all posts across all weeks for monthly view
  const getAllPosts = useCallback(() => {
    const all: { date: string; post: PostEntry }[] = [];
    Object.values(data.weeks).forEach(week => {
      week.days.forEach(day => {
        day.posts.forEach(post => {
          all.push({ date: day.date, post });
        });
      });
    });
    return all;
  }, [data.weeks]);

  return {
    setup: data.setup,
    setSetup,
    currentWeek,
    currentWeekStart,
    setCurrentWeek,
    navigateWeek,
    addPost,
    updatePost,
    deletePost,
    updatePostChecklist,
    updatePostAnalytics,
    ideas: data.ideas,
    setIdeas,
    hashtagGroups: data.hashtagGroups,
    setHashtagGroups,
    strategy: data.strategy,
    setStrategy,
    tabOrder: data.tabOrder,
    setTabOrder,
    getAllPosts,
  };
}
