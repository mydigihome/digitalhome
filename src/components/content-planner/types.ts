export interface StatusItem {
  label: string;
  color: string; // pastel hex
}

export interface PlatformItem {
  name: string;
  color: string; // brand color hex
}

export interface SetupData {
  contentPillars: string[];
  contentFormats: string[];
  statuses: StatusItem[];
  platforms: PlatformItem[];
  goals: string[];
}

export interface PostEntry {
  id: string;
  imageUrl: string;
  imageFile?: string; // base64 data URL for uploaded files
  postLink: string; // separate URL field for the actual post link
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

export interface IdeasTable {
  id: string;
  title: string;
  pillars: string[]; // each table owns its column names
  columnColors: Record<string, string>; // pillar name -> color hex
  ideas: Record<string, IdeaEntry[]>;
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

export interface SocialLink {
  platform: string;
  url: string;
}

export interface ContentPlannerData {
  setup: SetupData;
  weeks: Record<string, WeekData>; // keyed by weekStart date
  ideas: Record<string, IdeaEntry[]>; // legacy, migrated to ideasTables
  ideasTables: IdeasTable[];
  hashtagGroups: HashtagGroup[];
  strategy: StrategyRow[];
  tabOrder: string[];
  socialLinks: SocialLink[];
}

export const DEFAULT_PLATFORM_COLORS: PlatformItem[] = [
  { name: "Substack", color: "#FF6719" },
  { name: "YouTube", color: "#FF0000" },
  { name: "Instagram", color: "#833AB4" },
  { name: "TikTok", color: "#000000" },
  { name: "Pinterest", color: "#E60023" },
];

export const DEFAULT_STATUS_COLORS: StatusItem[] = [
  { label: "Not Started", color: "#E5E7EB" },
  { label: "Draft", color: "#FFF3CD" },
  { label: "Filming", color: "#FFE5CC" },
  { label: "Editing", color: "#CCE5FF" },
  { label: "Scheduled", color: "#E8D5FF" },
  { label: "Published", color: "#D4EDDA" },
];

export const DEFAULT_SETUP: SetupData = {
  contentPillars: ["Educate", "Nurture", "Inspire", "Grow", "Social Proof"],
  contentFormats: ["Reel", "Story", "Carousel", "Video", "Blog", "Newsletter", "Podcast"],
  statuses: DEFAULT_STATUS_COLORS,
  platforms: DEFAULT_PLATFORM_COLORS,
  goals: ["Views", "Subscribers", "Likes", "Signups"],
};

export const DEFAULT_TAB_ORDER = ["setup", "weekly", "monthly", "ideas", "hashtags", "strategy"];

export const DEFAULT_SOCIAL_LINKS: SocialLink[] = [
  { platform: "YouTube", url: "https://youtube.com" },
  { platform: "Instagram", url: "https://instagram.com" },
  { platform: "TikTok", url: "https://tiktok.com" },
  { platform: "Substack", url: "https://substack.com" },
  { platform: "Pinterest", url: "https://pinterest.com" },
];

export function createEmptyPost(): PostEntry {
  return {
    id: crypto.randomUUID(),
    imageUrl: "",
    postLink: "",
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
  return statuses.find(s => s.label === statusLabel)?.color || "#E5E7EB";
}

export function getPlatformColor(platforms: PlatformItem[], name: string): string {
  return platforms.find(p => p.name === name)?.color || "#6B7280";
}

// Pastel tints for day columns (Mon-Sun)
export const DAY_COLUMN_TINTS = [
  "#F0F4FF", "#F4F0FF", "#F0FFF8", "#FFF4F0", "#FFFBF0", "#FFF0F6", "#F6F6F6",
];
