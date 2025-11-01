'use client'; 

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.

// --- Types ---
type User = {
  id: number;
  name: string;
  profileUrl: string;
  Role: {
    name: string;
  };
};

type Reply = {
  id: number;
  userId: number;
  forumId: number;
  content: string;
  createdAt: string;
  user: User;
};

type Forum = {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  user: User;
  Replies: Reply[];
};

// --- Helper function to format timestamp ---
const formatTimestamp = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Formats to "Oct 27, 2025, 6:40 AM"
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return dateString;
  }
};

// --- Reply Card Component ---
const ReplyCard = ({ 
  reply, 
  currentUserId,
  onEditClick,
  onDeleteClick
}: { 
  reply: Reply, 
  currentUserId: number | null,
  onEditClick: (reply: Reply) => void,
  onDeleteClick: (reply: Reply) => void
}) => {
  const canEdit = reply.userId === currentUserId;

  return (
    <div className="flex space-x-3 pt-4 border-t border-neutral-100">
      {/* Profile Pic */}
      {/* <Image ... /> */} {/* PREVIEW FIX */}
      <Image
        src={reply.user.profileUrl}
        alt={reply.user.name}
        width={32}
        height={32}
        className="rounded-full object-cover h-8 w-8"
        onError={(e) => {
          const target = e.target as HTMLImageElement;
          target.onerror = null;
          target.src = `https://placehold.co/32x32/DEDEDE/424242?text=${reply.user.name.charAt(0)}`;
        }}
      />
      
      {/* Content */}
      <div className="flex-1">
        <div className="flex items-center justify-between">
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-body-md text-neutral-900">{reply.user.name}</span>
            <span className="text-body-sm text-neutral-500">@{reply.user.name}</span>
            <span className="text-body-sm text-neutral-500">·</span>
            <span className="text-body-sm text-neutral-500">{formatTimestamp(reply.createdAt)}</span>
          </div>
          {/* Edit/Delete for Replies */}
          {canEdit && (
            <div className="flex space-x-2">
              <button onClick={() => onEditClick(reply)} title="Edit Reply" className="text-neutral-400 hover:text-primary-600">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
              </button>
              <button onClick={() => onDeleteClick(reply)} title="Delete Reply" className="text-neutral-400 hover:text-error">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
              </button>
            </div>
          )}
        </div>
        <p className="text-body-md text-neutral-800 whitespace-pre-line mt-1">
          {reply.content}
        </p>
      </div>
    </div>
  );
};

// --- Create Reply Form Component ---
const CreateReplyForm = ({
  forumId,
  token,
  userId,
  onReplyAdded
}: {
  forumId: number,
  token: string | null,
  userId: number | null,
  onReplyAdded: () => void
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !token || !userId) return;

    setIsSubmitting(true);
    try {
      const res = await axios.post('https://my-cheva-api.kakashispiritnews.my.id/replies', {
        content,
        userId,
        forumId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to post reply');
      }

      setContent('');
      onReplyAdded(); // Refresh the forum list

    } catch (err) {
      console.error(err);
      // We could show an error here
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex space-x-3 pt-4 border-t border-neutral-100">
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        placeholder="Post your reply"
        rows={2}
        className="flex-1 rounded-lg border border-neutral-300 px-4 py-2 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
      />
      <button
        type="submit"
        disabled={isSubmitting || !content.trim()}
        className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
      >
        {isSubmitting ? 'Replying...' : 'Reply'}
      </button>
    </form>
  );
};

// --- Forum Card Component ---
const ForumCard = ({ 
  post, 
  currentUserId, 
  token,
  onPostUpdated,
  onEditClick,
  onDeleteClick,
  onReplyEditClick,
  onReplyDeleteClick
}: {
  post: Forum, 
  currentUserId: number | null, 
  token: string | null,
  onPostUpdated: () => void,
  onEditClick: (post: Forum) => void,
  onDeleteClick: (post: Forum) => void,
  onReplyEditClick: (reply: Reply) => void,
  onReplyDeleteClick: (reply: Reply) => void
}) => {
  const [showReplies, setShowReplies] = useState(false);
  const canEdit = post.userId === currentUserId;

  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
      {/* --- Card Header --- */}
      <div className="flex space-x-4 p-6">
        {/* Profile Pic */}
        {/* <Image ... /> */} {/* PREVIEW FIX */}
        <Image
          src={post.user.profileUrl}
          alt={post.user.name}
          width={48}
          height={48}
          className="rounded-full object-cover h-12 w-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://placehold.co/48x48/DEDEDE/424242?text=${post.user.name.charAt(0)}`;
          }}
        />
        
        {/* Content */}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <div className="flex items-baseline space-x-2">
              <span className="font-semibold text-body-lg text-neutral-900">{post.user.name}</span>
              <span className="text-body-md text-neutral-500">@{post.user.name}</span>
              <span className="text-body-md text-neutral-500">·</span>
              <span className="text-body-md text-neutral-500">{formatTimestamp(post.createdAt)}</span>
            </div>
            {/* Edit/Delete for Posts */}
            {canEdit && (
              <div className="flex space-x-2">
                <button onClick={() => onEditClick(post)} title="Edit Post" className="text-neutral-500 hover:text-primary-600">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" /></svg>
                </button>
                <button onClick={() => onDeleteClick(post)} title="Delete Post" className="text-neutral-500 hover:text-error">
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                </button>
              </div>
            )}
          </div>
          <p className="text-body-md text-neutral-800 whitespace-pre-line mt-2">
            {post.content}
          </p>

          {/* Action Buttons (Reply) */}
          <div className="flex items-center space-x-4 mt-4">
            <button 
              onClick={() => setShowReplies(!showReplies)}
              className="flex items-center space-x-2 text-neutral-600 hover:text-primary-600"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span className="text-sm font-semibold">{post.Replies.length}</span>
            </button>
            {/* Other buttons like Retweet, Like, etc. could go here */}
          </div>
        </div>
      </div>
      
      {/* --- Replies Section (Conditional) --- */}
      {showReplies && (
        <div className="px-6 pb-6">
          {/* New Reply Form */}
          <CreateReplyForm 
            forumId={post.id} 
            token={token}
            userId={currentUserId}
            onReplyAdded={onPostUpdated}
          />
          
          {/* Replies List */}
          <div className="space-y-4 mt-4">
            {post.Replies.map(reply => (
              <ReplyCard 
                key={reply.id} 
                reply={reply} 
                currentUserId={currentUserId}
                onEditClick={onReplyEditClick}
                onDeleteClick={onReplyDeleteClick}
              />
            ))}
            {post.Replies.length === 0 && (
              <p className="text-center text-sm text-neutral-500 pt-4">No replies yet.</p>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

// --- Create Post Form (Top of Page) ---
const CreatePostForm = ({ 
  token, 
  userId,
  userProfileUrl,
  userName,
  onPostAdded 
}: { 
  token: string | null, 
  userId: number | null,
  userProfileUrl: string | null,
  userName: string | null,
  onPostAdded: () => void 
}) => {
  const [content, setContent] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !token || !userId) {
      setError("Cannot post. Please make sure you are logged in and have written a message.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.post('https://my-cheva-api.kakashispiritnews.my.id/forum', {
        content,
        userId,
      }, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to create post');
      }

      setContent('');
      onPostAdded(); // Refresh the list

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-8">
      <div className="flex space-x-4">
        <Image
          src={userProfileUrl || ''}
          alt={userName || 'User'}
          width={48}
          height={48}
          className="rounded-full object-cover h-12 w-12"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            target.onerror = null;
            target.src = `https://placehold.co/48x48/DEDEDE/424242?text=${(userName || 'U').charAt(0)}`;
          }}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's happening?"
          rows={3}
          className="flex-1 rounded-lg border-0 p-2 text-body-lg focus:ring-2 focus:ring-primary-200 outline-none resize-none"
        />
      </div>
      {error && <p className="text-right text-sm text-error mt-2">{error}</p>}
      <div className="flex justify-end mt-4">
        <button
          type="submit"
          disabled={isSubmitting || !content.trim()}
          className="rounded-lg bg-primary-500 py-2 px-5 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
        >
          {isSubmitting ? 'Posting...' : 'Post'}
        </button>
      </div>
    </form>
  );
};

// --- NEW: Modal for Editing Forum Post ---
const EditForumModal = ({
  isOpen, onClose, token, onPostUpdated, post
}: {
  isOpen: boolean, onClose: () => void, token: string | null, onPostUpdated: () => void, post: Forum
}) => {
  const [content, setContent] = useState(post.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (post) setContent(post.content);
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.put(`https://my-cheva-api.kakashispiritnews.my.id/forum/${post.id}`, { content }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.status !== 200) throw new Error(data.message || 'Failed to update post');
      onPostUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-h4 text-neutral-900 mb-4">Edit Post</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={5}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
          />
          {error && <p className="text-body-md text-error">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !content.trim()} className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW: Modal for Deleting Forum Post ---
const DeleteForumModal = ({
  isOpen, onClose, token, onPostUpdated, post
}: {
  isOpen: boolean, onClose: () => void, token: string | null, onPostUpdated: () => void, post: Forum
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.delete(`https://my-cheva-api.kakashispiritnews.my.id/forum/${post.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.status !== 200) throw new Error(data.message || 'Failed to delete post');
      onPostUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-h4 text-neutral-900 mb-4">Confirm Deletion</h2>
        <p className="text-body-md text-neutral-700 mb-6">Are you sure you want to delete this post? This action cannot be undone.</p>
        {error && <p className="text-body-md text-error p-3 bg-error/10 rounded-lg mb-4">{error}</p>}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isSubmitting} className="rounded-lg bg-error py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-error/90 disabled:opacity-50">
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- NEW: Modal for Editing Reply ---
const EditReplyModal = ({
  isOpen, onClose, token, onPostUpdated, reply
}: {
  isOpen: boolean, onClose: () => void, token: string | null, onPostUpdated: () => void, reply: Reply
}) => {
  const [content, setContent] = useState(reply.content);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (reply) setContent(reply.content);
  }, [reply]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() || !token) return;
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.put(`https://my-cheva-api.kakashispiritnews.my.id/replies/${reply.id}`, { content }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.status !== 200) throw new Error(data.message || 'Failed to update reply');
      onPostUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-h4 text-neutral-900 mb-4">Edit Reply</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            rows={4}
            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
          />
          {error && <p className="text-body-md text-error">{error}</p>}
          <div className="flex justify-end space-x-3">
            <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50">Cancel</button>
            <button type="submit" disabled={isSubmitting || !content.trim()} className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50">
              {isSubmitting ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- NEW: Modal for Deleting Reply ---
const DeleteReplyModal = ({
  isOpen, onClose, token, onPostUpdated, reply
}: {
  isOpen: boolean, onClose: () => void, token: string | null, onPostUpdated: () => void, reply: Reply
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const res = await axios.delete(`https://my-cheva-api.kakashispiritnews.my.id/replies/${reply.id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.status !== 200) throw new Error(data.message || 'Failed to delete reply');
      onPostUpdated();
      onClose();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
        <h2 className="text-h4 text-neutral-900 mb-4">Confirm Deletion</h2>
        <p className="text-body-md text-neutral-700 mb-6">Are you sure you want to delete this reply?</p>
        {error && <p className="text-body-md text-error p-3 bg-error/10 rounded-lg mb-4">{error}</p>}
        <div className="flex justify-end space-x-3">
          <button type="button" onClick={onClose} disabled={isSubmitting} className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50">Cancel</button>
          <button type="button" onClick={handleDelete} disabled={isSubmitting} className="rounded-lg bg-error py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-error/90 disabled:opacity-50">
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- Main Discussion Page Component ---
export default function DiscussionPage() {
  const [forums, setForums] = useState<Forum[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Get user info from localStorage
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userProfileUrl, setUserProfileUrl] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);
  
  // State for modals
  const [selectedForum, setSelectedForum] = useState<Forum | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  
  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const [isReplyEditModalOpen, setIsReplyEditModalOpen] = useState(false);
  const [isReplyDeleteModalOpen, setIsReplyDeleteModalOpen] = useState(false);


  // Get token and user info on mount
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');
    const storedProfileUrl = localStorage.getItem('profileUrl'); // Assuming this is stored on login
    const storedName = localStorage.getItem('name'); // Assuming this is stored on login

    if (!storedToken || !storedUserId) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    setUserId(Number(storedUserId));
    setUserProfileUrl(storedProfileUrl);
    setUserName(storedName);
  }, []);

  // --- Fetch all forums ---
  const fetchForums = useCallback(async () => {
    if (!token) {
      return;
    }
 
    setError(null);
    try {
      const res = await axios.get('https://my-cheva-api.kakashispiritnews.my.id/forum', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = res.data;
      if (data.status === 200 && Array.isArray(data.forums)) {
        // Sort forums to show newest first
        setForums(data.forums.sort((a: Forum, b: Forum) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
      } else {
        throw new Error(data.message || 'Failed to parse forums');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false); 
    }
  }, [token]);

  // Fetch data once token is set
  useEffect(() => {
    if (token) {
      fetchForums();
    }
  }, [token, fetchForums]);

  // --- Modal Handlers for FORUMS ---
  const handleOpenForumEdit = (post: Forum) => {
    setSelectedForum(post);
    setIsEditModalOpen(true);
  };
  const handleOpenForumDelete = (post: Forum) => {
    setSelectedForum(post);
    setIsDeleteModalOpen(true);
  };

  // --- Modal Handlers for REPLIES ---
  const handleOpenReplyEdit = (reply: Reply) => {
    setSelectedReply(reply);
    setIsReplyEditModalOpen(true);
  };
  const handleOpenReplyDelete = (reply: Reply) => {
    setSelectedReply(reply);
    setIsReplyDeleteModalOpen(true);
  };


  return (
    <div>
      <h1 className="text-4xl text-neutral-900 mb-6">Discussion Forum</h1>

      <div className="max-w-3xl mx-auto">
        {/* --- Create Post Form --- */}
        <CreatePostForm
          token={token}
          userId={userId}
          userProfileUrl={userProfileUrl}
          userName={userName}
          onPostAdded={fetchForums}
        />
      
        {/* --- Forum Feed --- */}
        {isLoading ? (
          <div className="text-center text-neutral-600 py-12">Loading discussions...</div>
        ) : error ? (
          <div className="text-center text-error bg-error/10 p-6 rounded-lg">Error: {error}</div>
        ) : forums.length === 0 ? (
          <div className="text-center text-neutral-600 py-12">No discussions yet. Start one!</div>
        ) : (
          forums.map((post) => (
            <ForumCard 
              key={post.id} 
              post={post} 
              currentUserId={userId}
              token={token}
              onPostUpdated={fetchForums}
              onEditClick={handleOpenForumEdit}
              onDeleteClick={handleOpenForumDelete}
              onReplyEditClick={handleOpenReplyEdit}
              onReplyDeleteClick={handleOpenReplyDelete}
            />
          ))
        )}
      </div>

      {/* --- NEW: Render ALL Modals --- */}
      {selectedForum && (
        <EditForumModal 
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          token={token}
          onPostUpdated={fetchForums}
          post={selectedForum}
        />
      )}
      {selectedForum && (
        <DeleteForumModal 
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          token={token}
          onPostUpdated={fetchForums}
          post={selectedForum}
        />
      )}
      {selectedReply && (
        <EditReplyModal
          isOpen={isReplyEditModalOpen}
          onClose={() => setIsReplyEditModalOpen(false)}
          token={token}
          onPostUpdated={fetchForums}
          reply={selectedReply}
        />
      )}
      {selectedReply && (
        <DeleteReplyModal
          isOpen={isReplyDeleteModalOpen}
          onClose={() => setIsReplyDeleteModalOpen(false)}
          token={token}
          onPostUpdated={fetchForums}
          reply={selectedReply}
        />
      )}
    </div>
  );
}