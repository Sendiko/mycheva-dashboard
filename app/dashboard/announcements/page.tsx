'use client';

import React, { useState, useEffect, useCallback } from 'react'; // <-- Import useCallback
// import Image from 'next/image'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.

// --- Helper function to format the date ---
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Formats the date to "Dec 22, 2024"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return dateString; // Return original string if formatting fails
  }
};

// --- NEW: Data Structure from API ---
type Announcement = {
  id: number;
  title: string;
  content: string;
  imageUrl: string | null;
  createdAt: string;
  user: {
    id: number;
    profileUrl: string;
    UserDatum: {
      fullName: string;
    };
  };
};

// --- Announcement Card Component (Updated) ---
const AnnouncementCard = ({ announcement }: { announcement: Announcement }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
      {/* --- Card Header --- */}
      <div className="flex items-center space-x-4 p-6">
        {/* --- PREVIEW FIX ---
          The <Image> component is replaced with a standard <img> tag
          for the preview. In your local Next.js project,
          you should use the original <Image> component code below.
        ----------------------*/}
        <img
          src={announcement.user.profileUrl}
          alt={announcement.user.UserDatum.fullName}
          width={48}
          height={48}
          className="rounded-full object-cover h-12 w-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // prevent infinite loop
            target.src = `https://placehold.co/48x48/DEDEDE/424242?text=${announcement.user.UserDatum.fullName.charAt(0)}`;
          }}
        />
        {/* --- ORIGINAL CODE for your Next.js project ---
        <Image
          src={announcement.user.profileUrl}
          alt={announcement.user.UserDatum.fullName}
          width={48}
          height={48}
          className="rounded-full object-cover h-12 w-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null; // prevent infinite loop
            target.src = `https://placehold.co/48x48/DEDEDE/424242?text=${announcement.user.UserDatum.fullName.charAt(0)}`;
          }}
        />
        ---------------------------------------------- */}
        <div>
          <h2 className="font-bold text-body-lg text-neutral-900">
            {announcement.user.UserDatum.fullName}
          </h2>
          <p className="text-body-sm text-neutral-600">
            {formatDate(announcement.createdAt)}
          </p>
        </div>
      </div>

      {/* --- Card Body --- */}
      <div className="px-6 pb-6">
        <h3 className="text-h4 font-bold text-neutral-900 mb-4">
          {announcement.title}
        </h3>

        {/* Conditionally render the image if it exists */}
        {announcement.imageUrl && (
          <div className="relative w-full h-64 mb-4 rounded-lg overflow-hidden">
            {/* --- PREVIEW FIX --- (Using <img> tag) */}
            <img
              src={announcement.imageUrl}
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
            {/* --- ORIGINAL CODE for your Next.js project ---
            <Image
              src={announcement.imageUrl}
              alt={announcement.title}
              layout="fill"
              className="object-cover"
            />
            ---------------------------------------------- */}
          </div>
        )}

        {/* Render the content. 
          'whitespace-pre-line' will respect newlines in the string.
        */}
        <p className="text-body-md text-neutral-800 whitespace-pre-line">
          {announcement.content}
        </p>
      </div>

      {/* --- Card Footer --- */}
      <div className="border-t border-neutral-200 px-6 py-4">
        <div className="flex justify-end">
          <button
            className="text-neutral-600 hover:text-neutral-900"
            title="Bookmark"
          >
            <svg
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
              />
            </svg>
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Announcements Page (Updated) ---
export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // Get token on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('You are not authenticated.');
      setIsLoading(false);
      // You might want to redirect here:
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.push('/login');
      return;
    }
    setToken(storedToken);
  }, []);

  // --- Wrapped fetch in useCallback ---
  const fetchAnnouncements = useCallback(async () => {
    if (!token) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }
    
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch('https://my-cheva-api.kakashispiritnews.my.id/announcement', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch announcements.');
      }

      const data = await response.json();
      if (data.status === 200 && Array.isArray(data.announcements)) {
        setAnnouncements(data.announcements);
      } else {
        throw new Error(data.message || 'Failed to parse data.');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token]); // <-- Dependency array

  // Fetch data once token is available
  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token, fetchAnnouncements]); // <-- Add fetchAnnouncements here

  return (
    <div>
      {/* --- NEW: Header with Add New Button --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-h3 text-neutral-900">Announcements</h1>
        <button
          className="flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
          // onClick={() => ...} // <-- We'll add this later
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New</span>
        </button>
      </div>


      {/* Center the content and set a max width for readability */}
      <div className="max-w-3xl mx-auto">
        {isLoading ? (
          <div className="text-center text-neutral-600 py-12">
            Loading announcements...
          </div>
        ) : error ? (
          <div className="text-center text-error bg-error/10 p-6 rounded-lg">
            Error: {error}
          </div>
        ) : announcements.length === 0 ? (
          <div className="text-center text-neutral-600 py-12">
            No announcements found.
          </div>
        ) : (
          announcements.map((item) => (
            <AnnouncementCard key={item.id} announcement={item} />
          ))
        )}
      </div>
    </div>
  );
}