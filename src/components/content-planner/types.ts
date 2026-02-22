export interface StatusItem {
  label: string;
  color: string; // pastel hex
}

export interface SetupData {
  contentPillars: string[];
  contentFormats: string[];
  statuses: StatusItem[];
  platforms: string[];
  goals: string[];
}

export interface PostEntry {
  id: string;
  imageUrl: string;
  imageFile?: string; // base64 data URL for uploaded files
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

export interface DayData {
  date: string; // yyyy-MM-dd
  posts: PostEntry[];
}

export interface WeekData {
  weekStart: string; // yyyy-MM-dd (Monday)
  weeklyGoal: string;
  weeklyTodos: string[];
  weeklyReview: string;
  days: DayData[];
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

export interface ContentPlannerData {
  setup: SetupData;
  weeks: Record<string, WeekData>; // keyed by weekStart date
  ideas: Record<string, IdeaEntry[]>;
  hashtagGroups: HashtagGroup[];
  strategy: StrategyRow[];
  tabOrder: string[];
}

export const DEFAULT_STATUS_COLORS: StatusItem[] = [
  { label: "Not Started", color: "#e5e7eb" },
  { label: "Draft", color: "#fef08a" },
  { label: "Filming", color: "#fed7aa" },
  { label: "Editing", color: "#bfdbfe" },
  { label: "Scheduled", color: "#ddd6fe" },
  { label: "Published", color: "#bbf7d0" },
];

export const DEFAULT_SETUP: SetupData = {
  contentPillars: ["Educate", "Nurture", "Inspire", "Grow", "Social Proof"],
  contentFormats: ["Reel", "Story", "Carousel", "Video", "Blog", "Newsletter", "Podcast"],
  statuses: DEFAULT_STATUS_COLORS,
  platforms: ["Substack", "YouTube", "Instagram", "TikTok", "Pinterest"],
  goals: ["Views", "Subscribers", "Likes", "Signups"],
};

export const DEFAULT_TAB_ORDER = ["setup", "weekly", "monthly", "ideas", "hashtags", "strategy"];

export function createEmptyPost(): PostEntry {
  return {
    id: crypto.randomUUID(),
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

export function getStatusColor(statuses: StatusItem[], statusLabel: string): string {
  return statuses.find(s => s.label === statusLabel)?.color || "#e5e7eb";
}
