'use client';

import React, { useState, useEffect, useCallback } from 'react';
import Link from 'next/link'; // <-- PREVIEW FIX: Uncomment in your local project.
import Image from 'next/image'; // <-- PREVIEW FIX: Uncomment in your local project.

// --- Types ---
type Event = {
  id: number;
  name: string;
  date: string;
  time: string;
  type: string;
};

// --- UPDATED: Announcement is now a single object ---
type Announcement = {
  id: number;
  title: string;
  content: string; // Added content
  createdAt: string;
  imageUrl: string | null;
  user: {
    UserDatum: {
      fullName: string;
    };
  };
};

// --- UPDATED: Popular Forum type ---
type PopularForum = {
  id: number;
  content: string;
  replyCount: number;
  user: { // <-- Added user object
    profileUrl: string;
    name: string;
  };
};

type Stat = {
  title: string;
  value: string;
  icon: string; // Emoji
};

// --- Helper function to format the date ---
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    return dateString;
  }
};

// --- Helper function to format time ---
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  try {
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  } catch (error) {
    return timeString;
  }
};

// --- Stat Card Component ---
const StatCard = ({ title, value, icon }: Stat) => (
  <div className="flex items-center p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
    <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-full bg-primary-100 text-primary-600">
      <span className="text-3xl">{icon}</span>
    </div>
    <div className="ml-4">
      <p className="text-body-md font-medium text-neutral-600">{title}</p>
      <p className="text-h4 font-bold text-neutral-900">{value}</p>
    </div>
  </div>
);

// --- UPDATED: Popular Forums Card Component ---
const PopularForumsCard = ({ forums }: { forums: PopularForum[] }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
    <div className="flex items-center mb-4">
       <div className="flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 text-primary-600">
        <span className="text-2xl">🔥</span>
      </div>
      <h3 className="text-h5 text-neutral-900 ml-3">Hottest Discussions</h3>
    </div>
    
    <div className="space-y-4">
      {forums.length > 0 ? (
        forums.map(forum => (
          <Link 
            key={forum.id}
            href={`/dashboard/forums/${forum.id}`} 
            className="block p-4 rounded-lg bg-neutral-50 hover:bg-neutral-100 transition-all"
          >
            <div className="flex items-center space-x-2 mb-2">
              <Image
                src={forum.user.profileUrl}
                alt={forum.user.name}
                width={24}
                height={24}
                className="rounded-full object-cover h-6 w-6"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.onerror = null;
                  target.src = `https://placehold.co/24x24/DEDEDE/424242?text=${forum.user.name.charAt(0)}`;
                }}
              />
              <span className="text-sm font-semibold text-neutral-800">{forum.user.name}</span>
            </div>
            <p className="text-body-md text-neutral-700 line-clamp-2 mb-1">
              {forum.content}
            </p>
            <p className="text-sm font-bold text-primary-700">
              {forum.replyCount} Replies
            </p>
          </Link>
        ))
      ) : (
        <p className="text-neutral-600">No popular discussions yet.</p>
      )}
    </div>
  </div>
);


// --- Next Meeting Card Component ---
const NextMeetingCard = ({ meeting }: { meeting: Event | null }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
    <h3 className="text-h4 text-neutral-900 mb-4">Next Meeting</h3>
    {meeting ? (
      <div>
        <span className={`inline-block px-3 py-1 text-sm font-semibold rounded-full mb-2 ${
          meeting.type === 'onsite' ? 'bg-info/10 text-info' : 'bg-success/10 text-success'
        }`}>
          {meeting.type.charAt(0).toUpperCase() + meeting.type.slice(1)}
        </span>
        <h4 className="text-h5 font-semibold text-primary-700 mb-1 break-words">{meeting.name}</h4>
        <p className="text-body-lg text-neutral-800 font-semibold">
          {formatDate(meeting.date)} at {formatTime(meeting.time)}
        </p>
      </div>
    ) : (
      <p className="text-neutral-600">No upcoming meetings scheduled.</p>
    )}
  </div>
);

// --- UPDATED: Latest Announcement Card (Singular) ---
const LatestAnnouncementCard = ({ announcement }: { announcement: Announcement | null }) => (
  <div className="p-6 bg-white rounded-xl shadow-sm border border-neutral-200">
    <div className="flex justify-between items-center mb-4">
      <h3 className="text-h4 text-neutral-900">Latest Announcement</h3>
      <Link href="/dashboard/announcements" className="text-body-md font-semibold text-primary-600 hover:text-primary-800">
        View all
      </Link>
    </div>
    {announcement ? (
      <div>
         {/* Optional Image */}
         {announcement.imageUrl && (
            <div className="relative w-full h-48 mb-4 rounded-lg overflow-hidden">

              <Image
                src={`https://my-cheva-api.kakashispiritnews.my.id/public/${announcement.imageUrl.replace(/^\//, '')}`}
                alt={announcement.title}
                layout="fill"
                className="object-cover"
              />
            </div>
         )}
        <h4 className="text-h5 font-semibold text-neutral-900 break-words">{announcement.title}</h4>
        <p className="text-body-sm text-neutral-500 mb-2">
           {formatDate(announcement.createdAt)}
        </p>
        <p className="text-body-md text-neutral-700 line-clamp-3 whitespace-pre-line">
          {announcement.content}
        </p>
      </div>
    ) : (
      <p className="text-neutral-600">No announcements yet.</p>
    )}
  </div>
);


// --- Main Dashboard Page Component ---
export default function DashboardPage() {
  // --- UPDATED: User info state ---
  const [userName, setUserName] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [stats, setStats] = useState<Stat[]>([]);
  const [nextMeeting, setNextMeeting] = useState<Event | null>(null);
  // --- UPDATED: Announcement is now single ---
  const [latestAnnouncement, setLatestAnnouncement] = useState<Announcement | null>(null);
  // --- UPDATED: Popular Forum state is now an array ---
  const [popularForums, setPopularForums] = useState<PopularForum[]>([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get user info on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId'); // Get userId

    if (!storedToken || !storedUserId) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    setUserId(storedUserId);
  }, []);

  // --- NEW: First fetch for User Data (to get roleId and name) ---
  useEffect(() => {
    if (!token || !userId) return;

    const fetchUserData = async () => {
      try {
        const headers = { 'Authorization': `Bearer ${token}` };
        const response = await fetch(`https://my-cheva-api.kakashispiritnews.my.id/userdata/${userId}`, { headers });
        if (!response.ok) throw new Error('Failed to fetch user data');
        
        const data = await response.json();
        if (data.status === 200 && data.user) {
          setUserName(data.user.UserDatum.fullName); // <-- Set full name
          setRoleId(data.user.roleId); // <-- Set roleId
        } else {
          throw new Error(data.message || 'Failed to parse user data');
        }
      } catch (err) {
        setError((err as Error).message);
        // Don't set loading false, let the next effect handle it
      }
    };
    
    fetchUserData();
  }, [token, userId]);


  // --- UPDATED: Second fetch for all dashboard widgets (depends on roleId) ---
  const fetchDashboardData = useCallback(async () => {
    if (!token || roleId === null) return; // Wait for roleId

    setIsLoading(true);
    setError(null);
    
    // --- URLs to fetch ---
    const usersUrl = 'https://my-cheva-api.kakashispiritnews.my.id/user/all';
    const attendanceUrl = 'https://my-cheva-api.kakashispiritnews.my.id/attendance';
    const eventsUrl = 'https://my-cheva-api.kakashispiritnews.my.id/event';
    // --- NEW Endpoints ---
    const latestAnnouncementUrl = 'https://my-cheva-api.kakashispiritnews.my.id/announcements/latest';
    const popularForumUrl = 'https://my-cheva-api.kakashispiritnews.my.id/forums/popular';

    try {
      const headers = { 'Authorization': `Bearer ${token}` };

      // --- Fetch in parallel (All Roles) ---
      const baseRequests = [
        fetch(eventsUrl, { headers }),
        fetch(latestAnnouncementUrl, { headers }),
        fetch(popularForumUrl, { headers }),
      ];
      
      // Conditionally add admin-only fetches
      const isAdminRole = [1, 3, 4].includes(roleId);
      if (isAdminRole) {
        baseRequests.push(fetch(usersUrl, { headers }));
        baseRequests.push(fetch(attendanceUrl, { headers }));
      }

      const responses = await Promise.all(baseRequests);
      const [eventsRes, announcementRes, forumRes, usersRes, attendanceRes] = responses;

      // --- Process Events (All Roles) ---
      if (!eventsRes.ok) throw new Error('Failed to fetch events');
      const eventsData = await eventsRes.json();
      let eventCount = 0;
      if (eventsData.status === 200 && Array.isArray(eventsData.events)) {
        eventCount = eventsData.events.length;
        const sortedEvents = eventsData.events
          .map((e: Event) => ({...e, dateTime: new Date(`${e.date.split('T')[0]}T${e.time}`)}))
          .sort((a: any, b: any) => a.dateTime - b.dateTime);
        const upcoming = sortedEvents.find((e: any) => e.dateTime > new Date());
        setNextMeeting(upcoming || null);
      }
      
      // --- Process Latest Announcement (All Roles) ---
      if (!announcementRes.ok) throw new Error('Failed to fetch latest announcement');
      const announcementData = await announcementRes.json();
      if (announcementData.status === 200 && announcementData.announcement) {
        setLatestAnnouncement(announcementData.announcement);
      }

      // --- Process Popular Forum (All Roles) ---
      if (!forumRes.ok) throw new Error('Failed to fetch popular forum');
      const forumData = await forumRes.json();
      if (forumData.status === 200 && Array.isArray(forumData.forum)) {
        // --- UPDATED: Take top 3 from the array ---
        setPopularForums(forumData.forum.slice(0, 3));
      }

      // --- Process Admin Stats (Admin Roles Only) ---
      if (isAdminRole) {
        let userCount = 0;
        let attendanceCount = 0;
        
        if (usersRes && usersRes.ok) {
          const usersData = await usersRes.json();
          if (usersData.status === 200) userCount = usersData.users.length;
        }
        
        if (attendanceRes && attendanceRes.ok) {
          const attendanceData = await attendanceRes.json();
          if (attendanceData.status === 200) attendanceCount = attendanceData.attendances.length;
        }

        setStats([
          { title: 'Total Users', value: userCount.toString(), icon: '👥' },
          { title: 'Total Meetings', value: eventCount.toString(), icon: '🤝' },
          { title: 'Total Attendances', value: attendanceCount.toString(), icon: '📅' },
        ]);
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, roleId]); // <-- Now depends on roleId

  // Fetch data once roleId is set
  useEffect(() => {
    if (roleId !== null) { // <-- Check if roleId has been fetched
      fetchDashboardData();
    }
  }, [roleId, fetchDashboardData]); // <-- Trigger on roleId change

  // --- Render Functions ---
  const renderStats = () => {
    if (!roleId || ![1, 3, 4].includes(roleId)) return null; 
    
    return (
      <div className="mb-8">
        <h2 className="font-bold text-neutral-900 mb-4">At a Glance</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.map(stat => (
            <StatCard key={stat.title} {...stat} />
          ))}
        </div>
      </div>
    );
  };

  const renderWidgets = () => (
    // --- UPDATED: 2-column layout ---
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2">
        <LatestAnnouncementCard announcement={latestAnnouncement} />
      </div>
      <div className="lg:col-span-1 space-y-6">
        <NextMeetingCard meeting={nextMeeting} />
        {/* --- UPDATED: Use new component and state --- */}
        <PopularForumsCard forums={popularForums} />
      </div>
    </div>
  );

  return (
    <div>
      <h1 className="text-xl font-bold text-neutral-900 mb-2">
        Welcome back, {userName || 'User'}!
      </h1>
      <p className="text-2xl text-neutral-600 mb-8">
        Here's what's happening today.
      </p>

      {isLoading ? (
        <div className="text-center text-neutral-600 py-20">Loading dashboard...</div>
      ) : error ? (
        <div className="text-center text-error bg-error/10 p-6 rounded-lg">Error: {error}</div>
      ) : (
        <>
          {renderStats()}
          {renderWidgets()}
        </>
      )}
    </div>
  );
}