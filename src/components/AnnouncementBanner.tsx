import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';

interface Announcement {
  id: string;
  title: string;
  message: string;
  target_roles: string[];
  is_active: boolean;
  expires_at: string | null;
}

export function AnnouncementBanner() {
  const [announcement, setAnnouncement] = useState<Announcement | null>(null);
  const [dismissed, setDismissed] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    const fetchAnnouncement = async () => {
      if (!user) return;

      // Get user's role
      const { data: profile } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', user.id)
        .maybeSingle();

      // Fetch active announcements
      const { data } = await supabase
        .from('announcements')
        .select('*')
        .eq('is_active', true)
        .or(`expires_at.is.null,expires_at.gt.${new Date().toISOString()}`)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      // Check if user's role is in target_roles
      if (data && profile && data.target_roles && data.target_roles.includes(profile.role)) {
        setAnnouncement(data);
      }
    };

    fetchAnnouncement();
  }, [user]);

  if (!announcement || dismissed) return null;

  return (
    <div
      style={{
        width: '100%',
        padding: '14px 24px',
        backgroundColor: '#8B5CF6',
        color: '#FFFFFF',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: '16px',
        boxShadow: '0 2px 8px rgba(139, 92, 246, 0.3)',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flex: 1 }}>
        <span style={{ fontSize: '20px' }}>📢</span>
        <div>
          <strong style={{ fontSize: '15px', marginRight: '8px' }}>{announcement.title}</strong>
          <span style={{ fontSize: '14px', opacity: 0.95 }}>{announcement.message}</span>
        </div>
      </div>
      <button
        onClick={() => setDismissed(true)}
        style={{
          padding: '6px 10px',
          backgroundColor: 'rgba(255,255,255,0.2)',
          border: 'none',
          borderRadius: '6px',
          color: '#FFFFFF',
          fontSize: '16px',
          cursor: 'pointer',
          transition: 'background-color 0.2s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.3)')}
        onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)')}
      >
        ✕
      </button>
    </div>
  );
}
