import { useState, useCallback, useEffect, useRef } from "react";
import {
  SetupData, WeekData, DayData, PostEntry, IdeaEntry, IdeasTable, HashtagGroup, StrategyRow, SocialLink, FeedPost, StudioProfile, DEFAULT_PLATFORM_COLORS,
  ContentPlannerData, DEFAULT_SETUP, DEFAULT_TAB_ORDER, DEFAULT_SOCIAL_LINKS, DEFAULT_STUDIO_PROFILE, createEmptyPost,
} from "./types";
import { format, startOfWeek, addDays, parseISO } from "date-fns";
import { loadStoredJson, saveStoredJson } from "@/lib/localStorage";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

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

const PILLAR_COLORS = ["#FFF5F0", "#F0F7FF", "#FFF0F8", "#F0FFF4", "#FFF8E0", "#F0FFFF", "#FFF0FF"];

function buildDefaultIdeasTable(pillars: string[], title: string, defaultIdeas?: Record<string, IdeaEntry[]>): IdeasTable {
  const columnColors: Record<string, string> = {};
  pillars.forEach((p, i) => { columnColors[p] = PILLAR_COLORS[i % PILLAR_COLORS.length]; });
  return {
    id: crypto.randomUUID(),
    title,
    pillars: [...pillars],
    columnColors,
    ideas: defaultIdeas || {},
  };
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

function migrateData(parsed: ContentPlannerData): ContentPlannerData {
  // Migrate old format: platforms as string[] → PlatformItem[]
  if (parsed.setup?.platforms && parsed.setup.platforms.length > 0 && typeof parsed.setup.platforms[0] === "string") {
    parsed.setup.platforms = (parsed.setup.platforms as unknown as string[]).map((name: string) => {
      const found = DEFAULT_PLATFORM_COLORS.find(p => p.name === name);
      return found || { name, color: "#6B7280" };
    });
  }
  if (!parsed.socialLinks) {
    parsed.socialLinks = DEFAULT_SOCIAL_LINKS;
  }
  if (!parsed.ideasTables) {
    const pillars = parsed.setup?.contentPillars || DEFAULT_SETUP.contentPillars;
    parsed.ideasTables = [buildDefaultIdeasTable(pillars, "Ideas", parsed.ideas || {})];
  } else {
    const defaultPillars = parsed.setup?.contentPillars || DEFAULT_SETUP.contentPillars;
    parsed.ideasTables = parsed.ideasTables.map(t => {
      if (!t.pillars) {
        return { ...t, pillars: Object.keys(t.ideas).length > 0 ? Object.keys(t.ideas) : [...defaultPillars] };
      }
      return t;
    });
  }
  return parsed;
}

function loadFromStorage(): ContentPlannerData | null {
  const parsed = loadStoredJson<ContentPlannerData | null>(STORAGE_KEY, null);
  if (parsed) return migrateData(parsed);
  return null;
}

function buildDefaults(): ContentPlannerData {
  const weekStart = getWeekStart(0);
  return {
    setup: DEFAULT_SETUP,
    weeks: { [weekStart]: createEmptyWeek(weekStart) },
    ideas: {},
    ideasTables: [buildDefaultIdeasTable(DEFAULT_SETUP.contentPillars, "Ideas", DEFAULT_IDEAS)],
    hashtagGroups: DEFAULT_HASHTAG_GROUPS,
    strategy: DEFAULT_STRATEGY,
    tabOrder: DEFAULT_TAB_ORDER,
    socialLinks: DEFAULT_SOCIAL_LINKS,
    feedPosts: [],
    studioProfile: DEFAULT_STUDIO_PROFILE,
  };
}

export function useContentPlannerState() {
  const { user } = useAuth();
  const [data, setData] = useState<ContentPlannerData>(() => {
    return loadFromStorage() || buildDefaults();
  });
  const [dbLoaded, setDbLoaded] = useState(false);
  const initialLoadDone = useRef(false);

  const [currentWeekStart, setCurrentWeekStart] = useState(() => getWeekStart(0));

  // Load from database on mount (if logged in)
  useEffect(() => {
    if (!user?.id || initialLoadDone.current) return;
    initialLoadDone.current = true;

    const loadFromDb = async () => {
      try {
        const { data: row, error } = await supabase
          .from("content_planner_data")
          .select("data")
          .eq("user_id", user.id)
          .maybeSingle();

        if (error) {
          console.warn("Failed to load content planner from DB:", error.message);
          setDbLoaded(true);
          return;
        }

        if (row?.data) {
          const dbData = migrateData(row.data as unknown as ContentPlannerData);
          setData(dbData);
          saveStoredJson(STORAGE_KEY, dbData);
        } else {
          // No DB data yet — push localStorage data to DB
          const localData = loadFromStorage();
          if (localData) {
            await supabase.from("content_planner_data").upsert([{
              user_id: user.id,
              data: JSON.parse(JSON.stringify(localData)),
            }], { onConflict: "user_id" });
          }
        }
      } catch (err) {
        console.warn("Error loading content planner data:", err);
      } finally {
        setDbLoaded(true);
      }
    };

    loadFromDb();
  }, [user?.id]);

  // Auto-save to localStorage AND database on every change
  const saveTimeout = useRef<ReturnType<typeof setTimeout>>();
  useEffect(() => {
    clearTimeout(saveTimeout.current);
    saveTimeout.current = setTimeout(() => {
      saveStoredJson(STORAGE_KEY, data);

      // Save to DB if user is logged in and initial load is done
      if (user?.id && dbLoaded) {
        supabase.from("content_planner_data").upsert([{
          user_id: user.id,
          data: JSON.parse(JSON.stringify(data)),
        }], { onConflict: "user_id" }).then(({ error }) => {
          if (error) console.warn("Failed to save content planner to DB:", error.message);
        });
      }
    }, 500);
    return () => clearTimeout(saveTimeout.current);
  }, [data, user?.id, dbLoaded]);

  // Ensure current week exists
  const currentWeek = data.weeks[currentWeekStart] || createEmptyWeek(currentWeekStart);
  useEffect(() => {
    if (!data.weeks[currentWeekStart]) {
      setData(prev => ({ ...prev, weeks: { ...prev.weeks, [currentWeekStart]: createEmptyWeek(currentWeekStart) } }));
    }
  }, [currentWeekStart, data.weeks]);

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

  const movePost = useCallback((fromDay: number, toDay: number, postId: string) => {
    if (fromDay === toDay) return;
    setCurrentWeek(prev => {
      const days = [...prev.days];
      const post = days[fromDay].posts.find(p => p.id === postId);
      if (!post) return prev;
      days[fromDay] = { ...days[fromDay], posts: days[fromDay].posts.filter(p => p.id !== postId) };
      days[toDay] = { ...days[toDay], posts: [...days[toDay].posts, post] };
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

  const setIdeasTables = useCallback((fn: IdeasTable[] | ((prev: IdeasTable[]) => IdeasTable[])) => {
    setData(prev => ({
      ...prev,
      ideasTables: typeof fn === "function" ? fn(prev.ideasTables) : fn,
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

  const setSocialLinks = useCallback((fn: SocialLink[] | ((prev: SocialLink[]) => SocialLink[])) => {
    setData(prev => ({
      ...prev,
      socialLinks: typeof fn === "function" ? fn(prev.socialLinks) : fn,
    }));
  }, []);

  const setFeedPosts = useCallback((fn: FeedPost[] | ((prev: FeedPost[]) => FeedPost[])) => {
    setData(prev => ({
      ...prev,
      feedPosts: typeof fn === "function" ? fn(prev.feedPosts || []) : fn,
    }));
  }, []);

  const setStudioProfile = useCallback((fn: StudioProfile | ((prev: StudioProfile) => StudioProfile)) => {
    setData(prev => ({
      ...prev,
      studioProfile: typeof fn === "function" ? fn(prev.studioProfile || DEFAULT_STUDIO_PROFILE) : fn,
    }));
  }, []);

  const getAllPosts = useCallback(() => {
    const all: { date: string; post: PostEntry; weekStart: string; dayIndex: number }[] = [];
    Object.entries(data.weeks).forEach(([ws, week]) => {
      week.days.forEach((day, dayIdx) => {
        day.posts.forEach(post => {
          all.push({ date: day.date, post, weekStart: ws, dayIndex: dayIdx });
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
    movePost,
    updatePostChecklist,
    updatePostAnalytics,
    ideas: data.ideas,
    setIdeas,
    ideasTables: data.ideasTables,
    setIdeasTables,
    hashtagGroups: data.hashtagGroups,
    setHashtagGroups,
    strategy: data.strategy,
    setStrategy,
    tabOrder: data.tabOrder,
    setTabOrder,
    socialLinks: data.socialLinks,
    setSocialLinks,
    feedPosts: data.feedPosts || [],
    setFeedPosts,
    studioProfile: data.studioProfile || DEFAULT_STUDIO_PROFILE,
    setStudioProfile,
    getAllPosts,
  };
}
