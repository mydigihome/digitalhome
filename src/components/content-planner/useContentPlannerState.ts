import { useState, useCallback } from "react";
import {
  SetupData, WeekData, IdeaEntry, HashtagGroup, StrategyRow,
  DEFAULT_SETUP, createEmptyDay,
} from "./types";
import { format, startOfWeek, addDays } from "date-fns";

function getWeekDates(weekOffset = 0): string[] {
  const start = startOfWeek(addDays(new Date(), weekOffset * 7), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, i) => format(addDays(start, i), "yyyy-MM-dd"));
}

const DEFAULT_IDEAS: Record<string, IdeaEntry[]> = {};
DEFAULT_SETUP.contentPillars.forEach((pillar, pi) => {
  const examples = [
    ["5 tips for beginners", "How-to guide", "FAQ breakdown", "Myth vs reality", "Tool review"],
    ["Behind the scenes", "Day in my life", "Story time", "Community spotlight", "Q&A session"],
    ["Motivational quote", "Transformation story", "Goal setting", "Vision board share", "Mindset shift"],
    ["Growth hack", "Analytics deep dive", "Collaboration idea", "Trend alert", "Platform update"],
    ["Testimonial", "Case study", "Before & after", "Client feature", "Results breakdown"],
  ];
  DEFAULT_IDEAS[pillar] = (examples[pi] || examples[0]).map((text, i) => ({
    id: `${pi}-${i}`,
    text,
  }));
  // pad to 20 rows
  for (let i = DEFAULT_IDEAS[pillar].length; i < 20; i++) {
    DEFAULT_IDEAS[pillar].push({ id: `${pi}-${i}`, text: "" });
  }
});

const DEFAULT_HASHTAG_GROUPS: HashtagGroup[] = [
  { id: "1", name: "Brand", hashtags: [{ tag: "#mybrand", size: "medium", checked: false }, { tag: "#brandlife", size: "small", checked: false }] },
  { id: "2", name: "Niche", hashtags: [{ tag: "#contentcreator", size: "large", checked: false }, { tag: "#digitalmarketing", size: "large", checked: false }] },
  { id: "3", name: "Community", hashtags: [{ tag: "#creatoreconomy", size: "medium", checked: false }, { tag: "#buildyourbrand", size: "medium", checked: false }] },
  { id: "4", name: "Growth", hashtags: [{ tag: "#growthmindset", size: "niche", checked: false }, { tag: "#socialmediatips", size: "large", checked: false }] },
  { id: "5", name: "Trending", hashtags: [{ tag: "#trending", size: "large", checked: false }, { tag: "#viral", size: "large", checked: false }] },
  { id: "6", name: "Platform", hashtags: [{ tag: "#reels", size: "large", checked: false }, { tag: "#tiktok", size: "large", checked: false }] },
  { id: "7", name: "Content Type", hashtags: [{ tag: "#tutorial", size: "medium", checked: false }, { tag: "#howto", size: "medium", checked: false }] },
  { id: "8", name: "Lifestyle", hashtags: [{ tag: "#workfromanywhere", size: "niche", checked: false }, { tag: "#freelance", size: "medium", checked: false }] },
];

const DEFAULT_STRATEGY: StrategyRow[] = [
  { label: "Primary Goals", value: "" },
  { label: "Target Audience", value: "" },
  { label: "Competitor Analysis", value: "" },
  { label: "Content Pillars & Themes", value: "" },
  { label: "Brand Voice & Tone", value: "" },
  { label: "Platform Strategy", value: "" },
  { label: "Monthly KPIs", value: "" },
  { label: "Notes", value: "" },
];

export function useContentPlannerState() {
  const [setup, setSetup] = useState<SetupData>(DEFAULT_SETUP);

  const weekDates = getWeekDates(0);
  const [week, setWeek] = useState<WeekData>({
    weekNumber: 1,
    weeklyGoal: "",
    weeklyTodos: ["", "", "", "", ""],
    weeklyReview: "",
    days: weekDates.map(d => createEmptyDay(d)),
  });

  const [ideas, setIdeas] = useState<Record<string, IdeaEntry[]>>(DEFAULT_IDEAS);
  const [hashtagGroups, setHashtagGroups] = useState<HashtagGroup[]>(DEFAULT_HASHTAG_GROUPS);
  const [strategy, setStrategy] = useState<StrategyRow[]>(DEFAULT_STRATEGY);

  const updateDay = useCallback((dayIndex: number, patch: Partial<typeof week.days[0]>) => {
    setWeek(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], ...patch };
      return { ...prev, days };
    });
  }, []);

  const updateDayChecklist = useCallback((dayIndex: number, key: string, val: boolean) => {
    setWeek(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], checklist: { ...days[dayIndex].checklist, [key]: val } };
      return { ...prev, days };
    });
  }, []);

  const updateDayAnalytics = useCallback((dayIndex: number, key: string, val: string) => {
    setWeek(prev => {
      const days = [...prev.days];
      days[dayIndex] = { ...days[dayIndex], analytics: { ...days[dayIndex].analytics, [key]: val } };
      return { ...prev, days };
    });
  }, []);

  return {
    setup, setSetup,
    week, setWeek, updateDay, updateDayChecklist, updateDayAnalytics,
    ideas, setIdeas,
    hashtagGroups, setHashtagGroups,
    strategy, setStrategy,
  };
}
