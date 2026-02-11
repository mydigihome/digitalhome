import { useState } from 'react';
import { ExternalLink, TrendingUp, BarChart3, Calendar, Sparkles, Copy, Check } from 'lucide-react';

interface AppTool {
  id: string;
  name: string;
  category: 'wealth' | 'events' | 'ai';
  description: string;
  icon: string;
  referralLink: string;
  clicks: number;
  signups: number;
}

const AppsAndTools = () => {
  const [copiedId, setCopiedId] = useState<string | null>(null);
  
  const [apps, setApps] = useState<AppTool[]>([
    // Wealth Management
    {
      id: '1',
      name: 'Zocks',
      category: 'wealth',
      description: 'Financial advisors platform for smart wealth management',
      icon: '💼',
      referralLink: 'https://zocks.com/ref/digitalhome',
      clicks: 42,
      signups: 8,
    },
    {
      id: '2',
      name: 'Monarch Money',
      category: 'wealth',
      description: 'Complete wealth tracker for all your financial goals',
      icon: '👑',
      referralLink: 'https://monarchmoney.com/ref/digitalhome',
      clicks: 67,
      signups: 12,
    },
    // Event Planning
    {
      id: '3',
      name: 'Luma',
      category: 'events',
      description: 'Beautiful event planning and calendar management',
      icon: '🌙',
      referralLink: 'https://lu.ma/ref/digitalhome',
      clicks: 38,
      signups: 15,
    },
    {
      id: '4',
      name: 'Posh VIP',
      category: 'events',
      description: 'Premium event experiences and exclusive access',
      icon: '✨',
      referralLink: 'https://poshvip.com/ref/digitalhome',
      clicks: 29,
      signups: 6,
    },
    {
      id: '5',
      name: 'Partiful',
      category: 'events',
      description: 'Social event planning made simple and fun',
      icon: '🎉',
      referralLink: 'https://partiful.com/ref/digitalhome',
      clicks: 51,
      signups: 19,
    },
    // AI Tools (existing ones from before)
    {
      id: '6',
      name: 'Gamma',
      category: 'ai',
      description: 'Make a pitch deck/powerpoint in minutes',
      icon: '🎨',
      referralLink: 'https://gamma.app',
      clicks: 0,
      signups: 0,
    },
  ]);

  const copyReferralLink = (app: AppTool) => {
    navigator.clipboard.writeText(app.referralLink);
    setCopiedId(app.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleAppClick = (appId: string) => {
    setApps(apps.map(app => 
      app.id === appId ? { ...app, clicks: app.clicks + 1 } : app
    ));
  };

  const categories = [
    { id: 'all', name: 'All Apps', icon: Sparkles },
    { id: 'wealth', name: 'Wealth Management', icon: TrendingUp },
    { id: 'events', name: 'Event Planning', icon: Calendar },
    { id: 'ai', name: 'AI Tools', icon: BarChart3 },
  ];

  const [selectedCategory, setSelectedCategory] = useState('all');

  const filteredApps = selectedCategory === 'all' 
    ? apps 
    : apps.filter(app => app.category === selectedCategory);

  const totalClicks = apps.reduce((sum, app) => sum + app.clicks, 0);
  const totalSignups = apps.reduce((sum, app) => sum + app.signups, 0);

  return (
    <div className="space-y-6">
      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center">
              <ExternalLink className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-blue-600 font-medium">Total Clicks</p>
              <p className="text-3xl font-bold text-blue-900">{totalClicks}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-green-500 rounded-xl flex items-center justify-center">
              <Check className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-green-600 font-medium">Signups</p>
              <p className="text-3xl font-bold text-green-900">{totalSignups}</p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-purple-500 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-sm text-purple-600 font-medium">Conversion</p>
              <p className="text-3xl font-bold text-purple-900">
                {totalClicks > 0 ? Math.round((totalSignups / totalClicks) * 100) : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Category Filters */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition ${
                selectedCategory === category.id
                  ? 'bg-blue-500 text-white shadow-lg'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Apps Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredApps.map((app) => (
          <div
            key={app.id}
            className="bg-white rounded-2xl shadow-sm overflow-hidden hover:shadow-lg transition group border border-gray-200"
          >
            <div className="p-6">
              {/* App Icon & Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-purple-100 rounded-2xl flex items-center justify-center text-3xl">
                  {app.icon}
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  app.category === 'wealth' 
                    ? 'bg-green-100 text-green-700'
                    : app.category === 'events'
                    ? 'bg-purple-100 text-purple-700'
                    : 'bg-blue-100 text-blue-700'
                }`}>
                  {app.category.charAt(0).toUpperCase() + app.category.slice(1)}
                </span>
              </div>

              <h3 className="text-xl font-semibold text-gray-900 mb-2">{app.name}</h3>
              <p className="text-gray-600 text-sm mb-4">{app.description}</p>

              {/* Stats */}
              <div className="flex items-center gap-4 mb-4 text-sm">
                <div className="flex items-center gap-1">
                  <ExternalLink className="w-4 h-4 text-gray-400" />
                  <span className="text-gray-600">{app.clicks} clicks</span>
                </div>
                <div className="flex items-center gap-1">
                  <Check className="w-4 h-4 text-green-500" />
                  <span className="text-gray-600">{app.signups} signups</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <a
                  href={app.referralLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleAppClick(app.id)}
                  className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition font-medium"
                >
                  Visit
                  <ExternalLink className="w-4 h-4" />
                </a>
                <button
                  onClick={() => copyReferralLink(app)}
                  className={`px-4 py-2 rounded-lg transition ${
                    copiedId === app.id
                      ? 'bg-green-500 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {copiedId === app.id ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {filteredApps.length === 0 && (
        <div className="text-center py-12 bg-white rounded-2xl shadow-sm">
          <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <p className="text-gray-500">No apps found in this category</p>
        </div>
      )}
    </div>
  );
};

export default AppsAndTools;
