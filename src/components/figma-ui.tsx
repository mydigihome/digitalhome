import React, { ReactNode } from 'react';
import { ASSETS, getAvatarUrl, getProjectLogo, ICON_BACKGROUNDS, STATUS_COLORS } from '@/lib/assets';

// ============================================
// PROFILE AVATAR COMPONENT
// ============================================
interface ProfileAvatarProps {
  name?: string;
  imageUrl?: string | null;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showBorder?: boolean;
}

export const ProfileAvatar = ({ name = 'User', imageUrl = null, size = 'md', showBorder = true }: ProfileAvatarProps) => {
  const sizeClasses = { sm: 'w-10 h-10', md: 'w-14 h-14', lg: 'w-20 h-20', xl: 'w-32 h-32' };
  const avatarSrc = imageUrl || getAvatarUrl(name);

  return (
    <div className={`${sizeClasses[size]} rounded-full overflow-hidden ${showBorder ? 'border-4 border-white shadow-lg' : ''}`}>
      <img src={avatarSrc} alt={name} className="w-full h-full object-cover" />
    </div>
  );
};

// ============================================
// PROJECT LOGO COMPONENT
// ============================================
interface ProjectLogoProps {
  projectName: string;
  imageUrl?: string | null;
  color?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const ProjectLogo = ({ projectName, imageUrl = null, color = 'violet', size = 'md' }: ProjectLogoProps) => {
  const sizeClasses = { sm: 'w-10 h-10', md: 'w-16 h-16', lg: 'w-24 h-24' };
  const logoSrc = imageUrl || getProjectLogo(projectName, color);

  return (
    <div className={`${sizeClasses[size]} rounded-2xl overflow-hidden bg-white shadow-md`}>
      <img src={logoSrc} alt={projectName} className="w-full h-full object-cover" />
    </div>
  );
};

// ============================================
// ICON CONTAINER
// ============================================
interface IconContainerProps {
  icon: ReactNode;
  bgColor?: string;
  size?: 'sm' | 'md' | 'lg';
  isEmoji?: boolean;
}

export const IconContainer = ({ icon, bgColor = 'pink', size = 'md', isEmoji = true }: IconContainerProps) => {
  const sizeClasses = { sm: 'w-10 h-10 text-xl', md: 'w-12 h-12 text-2xl', lg: 'w-16 h-16 text-3xl' };
  const bgClass = ICON_BACKGROUNDS[bgColor] || ICON_BACKGROUNDS.pink;

  return (
    <div className={`${sizeClasses[size]} ${bgClass} rounded-2xl flex items-center justify-center`}>
      {isEmoji ? <span>{icon}</span> : icon}
    </div>
  );
};

// ============================================
// CIRCULAR PROGRESS
// ============================================
interface CircularProgressProps {
  percentage: number;
  size?: 'large' | 'small';
  color?: string;
  children?: ReactNode;
}

export const CircularProgress = ({ percentage, size = 'large', color = 'violet', children }: CircularProgressProps) => {
  const dimensions = size === 'large' ? { width: 140, radius: 52 } : { width: 100, radius: 40 };
  const circumference = 2 * Math.PI * dimensions.radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  const colorMap: Record<string, string> = {
    violet: '#8b5cf6', pink: '#ec4899', orange: '#f97316',
    blue: '#3b82f6', green: '#22c55e', yellow: '#eab308',
  };
  const strokeColor = colorMap[color] || colorMap.violet;

  return (
    <div className="relative inline-flex items-center justify-center">
      <svg width={dimensions.width} height={dimensions.width} className="transform -rotate-90">
        <circle cx={dimensions.width / 2} cy={dimensions.width / 2} r={dimensions.radius} stroke="#f3f4f6" strokeWidth="12" fill="none" />
        <circle cx={dimensions.width / 2} cy={dimensions.width / 2} r={dimensions.radius} stroke={strokeColor} strokeWidth="12" fill="none"
          strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} strokeLinecap="round" className="transition-all duration-1000 ease-out" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">{children}</div>
    </div>
  );
};

// ============================================
// HERO CARD
// ============================================
interface HeroCardProps {
  title?: string;
  subtitle?: string;
  percentage?: number;
  buttonText?: string;
  onButtonClick?: () => void;
  pattern?: boolean;
}

export const HeroCard = ({ title = "Your today's task", subtitle = "almost done!", percentage = 85, buttonText = "View Task", onButtonClick, pattern = true }: HeroCardProps) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-violet-600 via-purple-600 to-fuchsia-600 p-8 lg:p-10 shadow-2xl shadow-violet-500/30 group">
      {pattern && (
        <div className="absolute inset-0 opacity-40" style={{ backgroundImage: `url('${ASSETS.patterns.grid}')` }} />
      )}
      <div className="relative flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex-1">
          <h3 className="text-white/90 text-lg lg:text-xl mb-2 font-medium">{title}</h3>
          <p className="text-white text-3xl lg:text-4xl font-bold mb-6">{subtitle}</p>
          <button onClick={onButtonClick} className="px-8 py-3 bg-white text-violet-600 rounded-2xl font-bold hover:shadow-2xl hover:scale-105 transition-all duration-300">
            {buttonText}
          </button>
        </div>
        <CircularProgress percentage={percentage} size="large">
          <span className="text-5xl font-bold text-white">{percentage}%</span>
        </CircularProgress>
      </div>
    </div>
  );
};

// ============================================
// PROJECT CARD
// ============================================
interface ProjectCardProps {
  category: string;
  name: string;
  progress: number;
  color?: 'blue' | 'rose' | 'orange' | 'yellow' | 'purple';
  icon?: string;
  onClick?: () => void;
}

export const ProjectCard = ({ category, name, progress, color = 'blue', icon = '💼', onClick }: ProjectCardProps) => {
  const gradientClasses: Record<string, string> = {
    blue: 'bg-gradient-to-br from-blue-50 to-blue-100',
    rose: 'bg-gradient-to-br from-rose-50 to-rose-100',
    orange: 'bg-gradient-to-br from-orange-50 to-orange-100',
    yellow: 'bg-gradient-to-br from-yellow-50 to-yellow-100',
    purple: 'bg-gradient-to-br from-purple-50 to-purple-100',
  };
  const barClasses: Record<string, string> = {
    blue: 'bg-blue-500', rose: 'bg-rose-500', orange: 'bg-orange-500',
    yellow: 'bg-yellow-500', purple: 'bg-purple-500',
  };

  return (
    <div onClick={onClick} className={`${gradientClasses[color]} rounded-3xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer`}>
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-1">{category}</p>
          <h4 className="text-xl font-bold text-foreground">{name}</h4>
        </div>
        <div className="p-3 rounded-2xl bg-white/80 backdrop-blur-sm">
          <span className="text-2xl">{icon}</span>
        </div>
      </div>
      <div className="progress-bar">
        <div className={`progress-fill ${barClasses[color]}`} style={{ width: `${progress}%` }} />
      </div>
    </div>
  );
};

// ============================================
// TASK GROUP CARD
// ============================================
interface TaskGroupCardProps {
  name: string;
  taskCount: number;
  progress: number;
  color?: string;
  icon?: string;
  onClick?: () => void;
}

export const TaskGroupCard = ({ name, taskCount, progress, color = 'pink', icon = '💼', onClick }: TaskGroupCardProps) => {
  const textColorMap: Record<string, string> = {
    pink: 'text-pink-500', purple: 'text-purple-500', orange: 'text-orange-500',
    yellow: 'text-yellow-500', blue: 'text-blue-500',
  };

  return (
    <div onClick={onClick} className="bg-card rounded-3xl p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 cursor-pointer border border-border">
      <div className="flex items-center justify-between mb-4">
        <IconContainer icon={icon} bgColor={color} />
        <CircularProgress percentage={progress} size="small" color={color}>
          <span className={`text-xl font-bold ${textColorMap[color]}`}>{progress}%</span>
        </CircularProgress>
      </div>
      <h4 className="font-bold text-lg text-foreground mb-1">{name}</h4>
      <p className="text-sm text-muted-foreground">{taskCount} Tasks</p>
    </div>
  );
};

// ============================================
// TASK ITEM
// ============================================
interface TaskItemProps {
  project: string;
  taskName: string;
  time: string;
  status?: 'done' | 'in-progress' | 'todo' | 'blocked';
  icon?: string;
  iconBg?: string;
  onClick?: () => void;
}

export const TaskItem = ({ project, taskName, time, status = 'todo', icon = '💼', iconBg = 'pink', onClick }: TaskItemProps) => {
  const statusClass = STATUS_COLORS[status] || STATUS_COLORS.todo;
  const statusText: Record<string, string> = { done: 'Done', 'in-progress': 'In Progress', todo: 'To-do', blocked: 'Blocked' };

  return (
    <div onClick={onClick} className="bg-card rounded-3xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer border border-border">
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-2">{project}</p>
          <h4 className="text-xl font-bold text-foreground mb-3">{taskName}</h4>
          <div className="flex items-center gap-2 text-violet-600">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span className="text-sm font-medium">{time}</span>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <IconContainer icon={icon} bgColor={iconBg} size="sm" />
          <span className={`px-4 py-2 rounded-xl text-sm font-medium whitespace-nowrap ${statusClass}`}>{statusText[status]}</span>
        </div>
      </div>
    </div>
  );
};

// ============================================
// STATUS BADGE
// ============================================
interface StatusBadgeProps {
  status?: string;
  children: ReactNode;
}

export const StatusBadge = ({ status = 'todo', children }: StatusBadgeProps) => {
  const statusClass = STATUS_COLORS[status] || STATUS_COLORS.todo;
  return <span className={`badge-figma ${statusClass}`}>{children}</span>;
};
