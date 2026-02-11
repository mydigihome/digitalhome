// assets.ts - Complete asset library from Figma design

export const ASSETS = {
  // Profile/User Images
  profiles: {
    default: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    livia: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop',
    user1: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop',
    user2: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=200&h=200&fit=crop',
    user3: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop',
  },

  // Project Logos/Icons (from Figma)
  projectLogos: {
    groceryShop: 'https://api.dicebear.com/7.x/shapes/svg?seed=grocery&backgroundColor=f97316',
    office: 'https://api.dicebear.com/7.x/shapes/svg?seed=office&backgroundColor=ec4899',
    personal: 'https://api.dicebear.com/7.x/shapes/svg?seed=personal&backgroundColor=a855f7',
    study: 'https://api.dicebear.com/7.x/shapes/svg?seed=study&backgroundColor=eab308',
  },

  // Emoji icons used in Figma design
  emojis: {
    briefcase: '💼',
    user: '👤',
    book: '📚',
    cart: '🛒',
    calendar: '📅',
    target: '🎯',
    checkmark: '✅',
    rocket: '🚀',
    fire: '🔥',
    star: '⭐',
  },

  // Background patterns from Figma
  patterns: {
    grid: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGRlZnM+PHBhdHRlcm4gaWQ9ImdyaWQiIHdpZHRoPSI2MCIgaGVpZ2h0PSI2MCIgcGF0dGVyblVuaXRzPSJ1c2VyU3BhY2VPblVzZSI+PHBhdGggZD0iTSAxMCAwIEwgMCAwIDAgMTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0id2hpdGUiIHN0cm9rZS1vcGFjaXR5PSIwLjA1IiBzdHJva2Utd2lkdGg9IjEiLz48L3BhdHRlcm4+PC9kZWZzPjxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbGw9InVybCgjZ3JpZCkiLz48L3N2Zz4=`,
    dots: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjEiIGZpbGw9IndoaXRlIiBmaWxsLW9wYWNpdHk9IjAuMSIvPjwvc3ZnPg==`,
    waves: `data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciPjxkZWZzPjxwYXR0ZXJuIGlkPSJ3YXZlcyIgeD0iMCIgeT0iMCIgd2lkdGg9IjEwMCIgaGVpZ2h0PSIxMDAiIHBhdHRlcm5Vbml0cz0idXNlclNwYWNlT25Vc2UiPjxwYXRoIGQ9Ik0wIDUwIFEgMjUgMzAsIDUwIDUwIFQgMTAwIDUwIiBzdHJva2U9IndoaXRlIiBzdHJva2Utd2lkdGg9IjIiIGZpbGw9Im5vbmUiIG9wYWNpdHk9IjAuMSIvPjwvcGF0dGVybj48L2RlZnM+PHJlY3Qgd2lkdGg9IjEwMCUiIGhlaWdodD0iMTAwJSIgZmlsbD0idXJsKCN3YXZlcykiLz48L3N2Zz4=`,
  },

  // Placeholder images for projects/tasks
  placeholders: {
    project: 'https://api.dicebear.com/7.x/shapes/svg?seed=',
    avatar: 'https://ui-avatars.com/api/?name=',
    illustration: 'https://illustrations.popsy.co/violet/',
  },
};

// Helper function to get avatar with initials
interface AvatarOptions {
  size?: number;
  background?: string;
  color?: string;
  bold?: boolean;
}

export const getAvatarUrl = (name: string, options: AvatarOptions = {}) => {
  const { size = 200, background = '8b5cf6', color = 'ffffff', bold = true } = options;
  return `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&size=${size}&background=${background}&color=${color}&bold=${bold}`;
};

// Helper function to get project logo
export const getProjectLogo = (projectName: string, color: string = 'violet') => {
  const colorMap: Record<string, string> = {
    violet: '8b5cf6',
    pink: 'ec4899',
    orange: 'f97316',
    blue: '3b82f6',
    yellow: 'eab308',
  };
  const bgColor = colorMap[color] || colorMap.violet;
  return `https://api.dicebear.com/7.x/shapes/svg?seed=${projectName}&backgroundColor=${bgColor}`;
};

// Color-coded icon backgrounds (from Figma)
export const ICON_BACKGROUNDS: Record<string, string> = {
  pink: 'bg-pink-100',
  purple: 'bg-purple-100',
  orange: 'bg-orange-100',
  yellow: 'bg-yellow-100',
  blue: 'bg-blue-100',
  green: 'bg-green-100',
};

// Status badge colors (from Figma)
export const STATUS_COLORS: Record<string, string> = {
  done: 'bg-green-100 text-green-600',
  'in-progress': 'bg-orange-100 text-orange-600',
  todo: 'bg-blue-100 text-blue-600',
  blocked: 'bg-red-100 text-red-600',
};

export default ASSETS;
