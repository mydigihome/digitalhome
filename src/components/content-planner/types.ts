export interface SetupData {
  contentPillars: string[];
  contentFormats: string[];
  statuses: string[];
  platforms: string[];
  goals: string[];
}

export interface DayEntry {
  date: string;
  imageUrl: string;
  platform: string;
  contentType: string;
  title: string;
  caption: string;
  status: string;
  checklist: {
    script: boolean;
    graphics: boolean;
    filmed: boolean;
    edited: boolean;
    posted: boolean;
  };
  analytics: {
    views: string;
    likes: string;
    comments: string;
    shares: string;
  };
}

export interface WeekData {
  weekNumber: number;
  weeklyGoal: string;
  weeklyTodos: string[];
  weeklyReview: string;
  days: DayEntry[];
}

export interface IdeaEntry {
  id: string;
  text: string;
}

export interface HashtagGroup {
  id: string;
  name: string;
  hashtags: { tag: string; size: string; checked: boolean }[];
}

export interface StrategyRow {
  label: string;
  value: string;
}

export const STATUS_COLORS: Record<string, string> = {
  "Not Started": "#EF4444",
  "Draft": "#F59E0B",
  "Filming": "#8B5CF6",
  "Editing": "#6366F1",
  "Scheduled": "#3B82F6",
  "Published": "#22C55E",
};

export const DEFAULT_SETUP: SetupData = {
  contentPillars: ["Educate", "Nurture", "Inspire", "Grow", "Social Proof"],
  contentFormats: ["Reel", "Story", "Carousel", "Video", "Blog", "Newsletter", "Podcast"],
  statuses: ["Not Started", "Draft", "Filming", "Editing", "Scheduled", "Published"],
  platforms: ["Substack", "YouTube", "Instagram", "TikTok", "Pinterest"],
  goals: ["Views", "Subscribers", "Likes", "Comments", "Signups"],
};

export function createEmptyDay(dateStr: string): DayEntry {
  return {
    date: dateStr,
    imageUrl: "",
    platform: "",
    contentType: "",
    title: "",
    caption: "",
    status: "Not Started",
    checklist: { script: false, graphics: false, filmed: false, edited: false, posted: false },
    analytics: { views: "", likes: "", comments: "", shares: "" },
  };
}
