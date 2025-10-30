'use client';

import React, { useState, useEffect, useCallback } from 'react';
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

// --- Data Structure from API ---
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
const AnnouncementCard = ({ 
  announcement,
  onImageClick // <-- NEW: Prop to handle image click
}: { 
  announcement: Announcement,
  onImageClick: (url: string) => void
}) => {
  
  // --- Construct the full image URL (FIXED) ---
  const fullImageUrl = announcement.imageUrl
    // Remove any leading slashes from imageUrl to prevent double slashes
    ? `https://my-cheva-api.kakashispiritnews.my.id/public/${announcement.imageUrl.replace(/^\//, '')}`
    : null;

  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">
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
        {fullImageUrl && ( // <-- Use the new full URL
          <button // <-- Changed to button for accessibility
            className="relative w-full h-64 mb-4 rounded-lg overflow-hidden cursor-pointer group focus:outline-none focus:ring-2 focus:ring-primary-500 ring-offset-2"
            onClick={() => onImageClick(fullImageUrl)} // <-- NEW: onClick handler
          >
            {/* --- PREVIEW FIX --- (Using <img> tag) */}
            <img
              src={fullImageUrl} // <-- Use the new full URL
              alt={announcement.title}
              className="w-full h-full object-cover"
            />
            {/* --- ORIGINAL CODE for your Next.js project ---
            <Image
              src={fullImageUrl} // <-- Use the new full URL
              alt={announcement.title}
              layout="fill"
              className="object-cover"
            />
            ---------------------------------------------- */}
            {/* --- NEW: Hover Overlay --- */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100">
              <span className="text-white bg-black/50 px-3 py-1 rounded-md text-sm">
                View Full Size
              </span>
            </div>
          </button>
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

// --- AddAnnouncementModal Component (with File Upload) ---
const AddAnnouncementModal = ({
  isOpen,
  onClose,
  token,
  userId,
  onAnnouncementAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  userId: string | null,
  onAnnouncementAdded: () => void
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null); // <-- NEW: State for file
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      setSuccessMessage(null);
      return;
    }
    if (!token || !userId) {
      setError('Authentication error. Please log in again.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    // --- NEW: Use FormData to send file and text ---
    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    formData.append('userId', userId);
    if (selectedFile) {
      formData.append('image', selectedFile); // 'image' is the key your API expects
    }

    try {
      const response = await fetch('https://my-cheva-api.kakashispiritnews.my.id/announcement', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
          'Authorization': `Bearer ${token}`,
        },
        body: formData, // <-- Send FormData instead of JSON
      });

      const data = await response.json();
      if (!response.ok || data.status !== 201) {
        throw new Error(data.message || 'Failed to create announcement');
      }

      // Success
      setSuccessMessage('Announcement created successfully!');
      onAnnouncementAdded(); // Refresh the list

      // Close modal immediately after successful creation and refresh
      handleClose();

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setContent('');
    setSelectedFile(null); // <-- NEW: Reset file
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">New Announcement</h2>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="title" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Title
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter the announcement title"
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="content" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Content
            </label>
            <textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Write your announcement content here..."
              rows={6}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          {/* --- NEW: File Upload --- */}
          <div>
            <label htmlFor="image" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Image (Optional)
            </label>
            <input
              id="image"
              type="file"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              className="w-full text-sm text-neutral-700
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100 transition-colors"
            />
            {selectedFile && (
              <p className="text-sm text-neutral-600 mt-2">
                File selected: {selectedFile.name}
              </p>
            )}
          </div>
          
          {/* Feedback Messages */}
          {error && (
            <p className="text-body-md text-error p-3 bg-error/10 rounded-lg">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-body-md text-success p-3 bg-success/10 rounded-lg">
              {successMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Publishing...' : 'Publish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW: EditAnnouncementModal Component ---
const EditAnnouncementModal = ({
  isOpen,
  onClose,
  token,
  onAnnouncementUpdated,
  announcement,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onAnnouncementUpdated: () => void;
  announcement: Announcement;
}) => {
  const [title, setTitle] = useState(announcement.title);
  const [content, setContent] = useState(announcement.content);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Update state if the prop changes
  useEffect(() => {
    if (announcement) {
      setTitle(announcement.title);
      setContent(announcement.content);
    }
  }, [announcement]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    } else {
      setSelectedFile(null);
    }
  };

  // Handle form submission for EDIT (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !content) {
      setError('Title and content are required.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    const formData = new FormData();
    formData.append('title', title);
    formData.append('content', content);
    if (selectedFile) {
      formData.append('image', selectedFile);
    }

    try {
      const response = await fetch(`https://my-cheva-api.kakashispiritnews.my.id/announcement/${announcement.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
        body: formData,
      });

      const data = await response.json();
      if (!response.ok || data.status !== 200) {
        throw new Error(data.message || 'Failed to update announcement');
      }

      setSuccessMessage('Announcement updated successfully!');
      onAnnouncementUpdated();
      
      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    setSelectedFile(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Edit Announcement</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Title */}
          <div>
            <label htmlFor="edit-title" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Title
            </label>
            <input
              id="edit-title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          {/* Content */}
          <div>
            <label htmlFor="edit-content" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Content
            </label>
            <textarea
              id="edit-content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={6}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            />
          </div>

          {/* File Upload */}
          <div>
            <label htmlFor="edit-image" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Replace Image (Optional)
            </label>
            <input
              id="edit-image"
              type="file"
              onChange={handleFileChange}
              accept="image/png, image/jpeg, image/gif"
              className="w-full text-sm text-neutral-700
                file:mr-4 file:py-2 file:px-4
                file:rounded-lg file:border-0
                file:text-sm file:font-semibold
                file:bg-primary-50 file:text-primary-700
                hover:file:bg-primary-100 transition-colors"
            />
            {selectedFile && (
              <p className="text-sm text-neutral-600 mt-2">
                New file: {selectedFile.name}
              </p>
            )}
          </div>
          
          {/* Feedback */}
          {error && (
            <p className="text-body-md text-error p-3 bg-error/10 rounded-lg">
              {error}
            </p>
          )}
          {successMessage && (
            <p className="text-body-md text-success p-3 bg-success/10 rounded-lg">
              {successMessage}
            </p>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 transition-all disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 transition-all disabled:opacity-50"
            >
              {isSubmitting ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW: DeleteConfirmationModal Component ---
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  token,
  onAnnouncementDeleted,
  announcement,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onAnnouncementDeleted: () => void;
  announcement: Announcement;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle DELETE request
  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // NOTE: Following your attendance pattern of sending ID in the body
      const response = await fetch(`https://my-cheva-api.kakashispiritnews.my.id/announcement/${announcement.id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          announcementId: announcement.id,
        }),
      });

      const data = await response.json();
      if (!response.ok || data.status !== 200) {
        throw new Error(data.message || 'Failed to delete announcement');
      }

      // Success
      onAnnouncementDeleted(); // Refresh the table
      handleClose(); // Close the modal

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-h4 text-neutral-900 mb-4">Confirm Deletion</h2>
        <p className="text-body-md text-neutral-700 mb-6">
          Are you sure you want to delete the announcement titled:
          <strong className="text-neutral-900"> "{announcement.title}"</strong>?
          This action cannot be undone.
        </p>

        {error && (
          <p className="text-body-md text-error p-3 bg-error/10 rounded-lg mb-4">
            {error}
          </p>
        )}

        <div className="flex justify-end space-x-3">
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 transition-all disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDelete}
            disabled={isSubmitting}
            className="rounded-lg bg-error py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-error/90 transition-all disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- NEW: FullScreenImageModal Component ---
const FullScreenImageModal = ({ imageUrl, onClose }: { imageUrl: string, onClose: () => void }) => {
  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose} // Click background to close
    >
      <button 
        className="absolute top-4 right-4 text-white/70 hover:text-white"
        onClick={onClose}
        title="Close"
      >
        <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
      
      <div 
        className="relative max-w-full max-h-full"
        onClick={(e) => e.stopPropagation()} // Prevent click on image from closing
      >
        <img 
          src={imageUrl} 
          alt="Full size announcement" 
          className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl" 
        />
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
  const [userId, setUserId] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [fullScreenImageUrl, setFullScreenImageUrl] = useState<string | null>(null);
  
  // --- NEW: State for Edit/Delete Modals ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  // Get token and userId on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');

    if (!storedToken || !storedUserId) {
      setError('You are not authenticated.');
      setIsLoading(false);
      // You might want to redirect here:
      // import { useRouter } from 'next/navigation';
      // const router = useRouter();
      // router.push('/login');
      return;
    }
    setToken(storedToken);
    setUserId(storedUserId);
  }, []);

  // --- Wrapped fetch in useCallback ---
  const fetchAnnouncements = useCallback(async () => {
    if (!token) {
      return;
    }
    
    // Don't show loading spinner on refresh, only on initial load
    // setIsLoading(true); 
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
      setIsLoading(false); // Only stop loading on initial load
    }
  }, [token]); // <-- Dependency array

  // Fetch data once token is available
  useEffect(() => {
    if (token) {
      fetchAnnouncements();
    }
  }, [token, fetchAnnouncements]); // <-- Add fetchAnnouncements here

  // --- NEW: Handlers to open modals ---
  const handleOpenEditModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsDeleteModalOpen(true);
  };

  return (
    <div>
      {/* --- NEW: Header with Add New Button --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-neutral-900">Announcements</h1>
        <button
          className="flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={() => setIsModalOpen(true)} // <-- Hook up the modal
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
            // --- NEW: Flex wrapper for card + actions ---
            <div key={item.id} className="relative flex items-start space-x-3 mb-6">
              {/* Card takes up most of the space */}
              <div className="flex-1">
                <AnnouncementCard 
                  announcement={item} 
                  onImageClick={setFullScreenImageUrl} // <-- NEW: Pass handler
                />
              </div>
              
              {/* Actions: Conditionally rendered */}
              {userId && item.user.id === Number(userId) && (
                <div className="flex flex-col space-y-2 pt-6">
                  <button
                    onClick={() => handleOpenEditModal(item)}
                    title="Edit"
                    className="text-neutral-500 hover:text-primary-600 transition-colors p-2 rounded-full hover:bg-neutral-100"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleOpenDeleteModal(item)}
                    title="Delete"
                    className="text-neutral-500 hover:text-error transition-colors p-2 rounded-full hover:bg-neutral-100"
                  >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* --- NEW: Render the Modal --- */}
      <AddAnnouncementModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        userId={userId}
        onAnnouncementAdded={fetchAnnouncements}
      />

      {/* --- NEW: Render the Full Screen Image Overlay --- */}
      {fullScreenImageUrl && (
        <FullScreenImageModal 
          imageUrl={fullScreenImageUrl} 
          onClose={() => setFullScreenImageUrl(null)}
        />
      )}

      {/* --- NEW: Render Edit/Delete Modals --- */}
      {selectedAnnouncement && (
        <EditAnnouncementModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          token={token}
          onAnnouncementUpdated={fetchAnnouncements}
          announcement={selectedAnnouncement}
        />
      )}
      {selectedAnnouncement && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          token={token}
          onAnnouncementDeleted={fetchAnnouncements}
          announcement={selectedAnnouncement}
        />
      )}
    </div>
  );
}