import { useState } from 'react';
import { Plus, Calendar, MapPin, Building, Briefcase, Link as LinkIcon, Smile, Image as ImageIcon, MessageSquare, FileText, CheckSquare } from 'lucide-react';
import { cn } from '@/lib/utils';

type TrackerType = 'job' | 'internship' | 'fellowship' | 'brand-collab';
type ApplicationStatus = 'applied' | 'interviewing' | 'offered' | 'rejected' | 'withdrawn';

interface Application {
  id: string;
  postingTitle: string;
  company: string;
  role: string;
  industry: string;
  status: ApplicationStatus;
  location: string;
  applicationDate: string;
  link: string;
}

interface Document {
  id: string;
  name: string;
  type: 'resume' | 'cover-letter' | 'pitch-deck' | 'recommendation';
  version: number;
}

const statusColors: Record<ApplicationStatus, string> = {
  applied: 'bg-primary/10 text-primary',
  interviewing: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300',
  offered: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
  rejected: 'bg-destructive/10 text-destructive',
  withdrawn: 'bg-muted text-muted-foreground',
};

const statusIcons: Record<ApplicationStatus, string> = {
  applied: '🔵',
  interviewing: '🟡',
  offered: '🟢',
  rejected: '🔴',
  withdrawn: '⚪',
};

const ApplicationsTracker = () => {
  const [activeTracker, setActiveTracker] = useState<TrackerType>('job');
  const [showNotionPage, setShowNotionPage] = useState(false);
  const [selectedDoc, setSelectedDoc] = useState<Document | null>(null);
  const [showTaskPopup, setShowTaskPopup] = useState(false);

  const [applications] = useState<Application[]>([
    {
      id: '1',
      postingTitle: 'Sustainability Intern (Sample)',
      company: 'Sonoma Holdings',
      role: 'Sustainability',
      industry: 'Telco',
      status: 'interviewing',
      location: 'Esplanade, Singapore',
      applicationDate: 'November 24, 2024',
      link: 'www.linkedin.com/hr',
    },
    {
      id: '2',
      postingTitle: 'Data Analyst',
      company: 'Langston Cars',
      role: 'Data',
      industry: 'Automotive',
      status: 'interviewing',
      location: 'Sudirman, Jakarta',
      applicationDate: 'November 25, 2024',
      link: 'www.linkedin.com/hr',
    },
  ]);

  const [documents] = useState<Document[]>([
    { id: '1', name: 'Resume 1', type: 'resume', version: 1 },
    { id: '2', name: 'Resume 2', type: 'resume', version: 2 },
    { id: '3', name: 'Cover Letter Template', type: 'cover-letter', version: 1 },
  ]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-400 rounded-xl flex items-center justify-center">
            <span className="text-2xl">📁</span>
          </div>
          <div>
            <h2 className="text-2xl font-bold text-foreground">Job & Application Tracker</h2>
            <p className="text-muted-foreground">Track all your applications in one place</p>
          </div>
        </div>

        {/* Tracker Type Toggles */}
        <div className="flex items-center gap-3 flex-wrap">
          {[
            { id: 'job', name: 'Job', icon: '💼' },
            { id: 'internship', name: 'Internship', icon: '🎓' },
            { id: 'fellowship', name: 'Fellowship', icon: '🏆' },
            { id: 'brand-collab', name: 'Brand Collab', icon: '🤝' },
          ].map((tracker) => (
            <button
              key={tracker.id}
              onClick={() => setActiveTracker(tracker.id as TrackerType)}
              className={cn(
                "px-4 py-2 rounded-lg font-medium transition text-sm",
                activeTracker === tracker.id
                  ? "bg-primary text-primary-foreground shadow-lg"
                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
              )}
            >
              {tracker.icon} {tracker.name}
            </button>
          ))}
        </div>
      </div>

      {/* Applications Table */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h3 className="text-xl font-semibold text-foreground">📋 Applications</h3>
          <button className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition">
            <Plus className="w-5 h-5" />
            Add Application
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-secondary border-b border-border">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Posting Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Company</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Role</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Industry</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Location</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground uppercase">Link</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {applications.map((app) => (
                <tr key={app.id} className="hover:bg-secondary/50 transition">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-foreground">{app.postingTitle}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Building className="w-4 h-4 text-muted-foreground" />
                      {app.company}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-foreground">
                    <div className="flex items-center gap-2">
                      <Briefcase className="w-4 h-4 text-muted-foreground" />
                      {app.role}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">{app.industry}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={cn("inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium", statusColors[app.status])}>
                      <span>{statusIcons[app.status]}</span>
                      {app.status.charAt(0).toUpperCase() + app.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4" />
                      {app.location}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {app.applicationDate}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-primary">
                    <a href={`https://${app.link}`} className="flex items-center gap-1 hover:underline">
                      <LinkIcon className="w-4 h-4" />
                      Link
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Documents */}
      <div className="rounded-2xl border border-border bg-card shadow-sm">
        <div className="p-6 border-b border-border">
          <h3 className="text-xl font-semibold text-foreground">📄 Documents</h3>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {documents.map((doc) => (
              <button
                key={doc.id}
                onClick={() => {
                  setSelectedDoc(doc);
                  setShowNotionPage(true);
                }}
                className="p-6 border-2 border-border rounded-xl hover:border-primary hover:shadow-lg transition text-left group"
              >
                <div className="flex items-center gap-3 mb-3">
                  <FileText className="w-8 h-8 text-primary" />
                  <div>
                    <h4 className="font-semibold text-foreground">{doc.name}</h4>
                    <p className="text-sm text-muted-foreground">Version {doc.version}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground capitalize">{doc.type.replace('-', ' ')}</p>
              </button>
            ))}

            <button className="p-6 border-2 border-dashed border-border rounded-xl hover:border-primary hover:bg-primary/5 transition flex items-center justify-center gap-2 text-primary">
              <Plus className="w-6 h-6" />
              <span className="font-medium">Add Document</span>
            </button>
          </div>
        </div>
      </div>

      {/* Notion-Style Page Modal */}
      {showNotionPage && selectedDoc && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-50 p-4">
          <div className="bg-card rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
            <div className="border-b border-border p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-secondary rounded text-sm text-muted-foreground">
                  <Smile className="w-4 h-4" /> Add icon
                </button>
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-secondary rounded text-sm text-muted-foreground">
                  <ImageIcon className="w-4 h-4" /> Add cover
                </button>
                <button className="flex items-center gap-2 px-3 py-1 hover:bg-secondary rounded text-sm text-muted-foreground">
                  <MessageSquare className="w-4 h-4" /> Add comment
                </button>
              </div>
              <button onClick={() => setShowNotionPage(false)} className="px-4 py-2 hover:bg-secondary rounded text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="p-8">
              <h1 className="text-4xl font-bold text-foreground mb-8">{selectedDoc.name}</h1>

              <button
                onClick={() => setShowTaskPopup(true)}
                className="flex items-center gap-2 px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition mb-6"
              >
                <CheckSquare className="w-5 h-5" />
                Open Task List
              </button>

              <textarea
                className="w-full h-96 p-4 border-2 border-border rounded-lg resize-none focus:border-primary focus:outline-none bg-background text-foreground"
                placeholder="Start writing your notes here..."
              />
            </div>
          </div>
        </div>
      )}

      {/* Task Popup */}
      {showTaskPopup && (
        <div className="fixed inset-0 bg-foreground/50 flex items-center justify-center z-[60]">
          <div className="bg-card rounded-2xl w-full max-w-2xl p-6 shadow-2xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Task List</h2>
              <button onClick={() => setShowTaskPopup(false)} className="p-2 hover:bg-secondary rounded-lg text-muted-foreground">
                ✕
              </button>
            </div>

            <div className="mb-4">
              <input
                type="text"
                placeholder="Add a new task..."
                className="w-full px-4 py-3 border-2 border-border rounded-lg focus:border-primary focus:outline-none bg-background text-foreground"
              />
            </div>

            <div className="space-y-2">
              {['Review resume', 'Prepare for interview', 'Send follow-up email'].map((task, idx) => (
                <div key={idx} className="flex items-center gap-3 p-3 hover:bg-secondary rounded-lg">
                  <input type="checkbox" className="w-5 h-5 rounded" />
                  <span className="flex-1 text-foreground">{task}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApplicationsTracker;
