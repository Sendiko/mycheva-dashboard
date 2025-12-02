'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import api from '@/lib/axios';
import Pagination from '@/components/Pagination';

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
  updatedAt: string;
  user: User;
};

type Forum = {
  id: number;
  userId: number;
  content: string;
  createdAt: string;
  updatedAt: string;
  user: User;
  Replies: Reply[];
};

// --- Helper function to format timestamp ---
const formatTimestamp = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
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
      <img
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
            <span className="text-body-sm text-neutral-500">
              {formatTimestamp(reply.createdAt)}
              {reply.updatedAt && reply.createdAt !== reply.updatedAt && (
                <span className="ml-1 text-neutral-400 italic">(edited)</span>
              )}
            </span>
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
      const response = await api.post('/replies', {
        content,
        userId,
        forumId,
      });

      if (response.data.status !== 201) {
        throw new Error(response.data.message || 'Failed to post reply');
      }

      setContent('');
      onReplyAdded(); // Refresh the forum list

    } catch (err) {
      console.error(err);
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

// --- Main Post Component (for detail page) ---
const MainPostCard = ({ post }: { post: Forum }) => {
  return (
    <div className="w-full bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden mb-6">
      {/* Card Header */}
      <div className="flex space-x-4 p-6">
        <img
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
        <div className="flex-1">
          <div className="flex items-baseline space-x-2">
            <span className="font-semibold text-body-lg text-neutral-900">{post.user.name}</span>
            <span className="text-body-md text-neutral-500">@{post.user.name}</span>
          </div>
          <span className="text-body-md text-neutral-500">
            {formatTimestamp(post.createdAt)}
            {post.updatedAt && post.createdAt !== post.updatedAt && (
              <span className="ml-1 text-neutral-400 italic">(edited)</span>
            )}
          </span>
        </div>
      </div>
      {/* Card Body */}
      <div className="px-6 pb-6">
        <p className="text-lg text-neutral-800 whitespace-pre-line mt-2">
          {post.content}
        </p>
      </div>
      {/* Reply Count */}
      <div className="border-t border-neutral-200 px-6 py-4">
        <span className="font-semibold text-body-md text-neutral-800">
          {post.Replies.length} {post.Replies.length === 1 ? 'Reply' : 'Replies'}
        </span>
      </div>
    </div>
  );
};


// --- Modal for Editing Reply ---
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
      const response = await api.put(`/replies/${reply.id}`, { content });
      if (response.data.status !== 200) throw new Error(response.data.message || 'Failed to update reply');
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

// --- Modal for Deleting Reply ---
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
      const response = await api.delete(`/replies/${reply.id}`);
      if (response.data.status !== 200) throw new Error(response.data.message || 'Failed to delete reply');
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

// --- Main Forum Detail Page Component ---
export default function ForumDetailPage() {
  const params = useParams();
  const forumId = params?.forumId;

  const [forum, setForum] = useState<Forum | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  const [selectedReply, setSelectedReply] = useState<Reply | null>(null);
  const [isReplyEditModalOpen, setIsReplyEditModalOpen] = useState(false);
  const [isReplyDeleteModalOpen, setIsReplyDeleteModalOpen] = useState(false);

  // --- Pagination State (Client-Side) ---
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(10);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    const storedUserId = localStorage.getItem('userId');

    if (!storedToken || !storedUserId) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    setUserId(Number(storedUserId));
  }, []);

  const fetchForumDetails = useCallback(async () => {
    if (!token || !forumId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await api.get(`/forum/${forumId}`);
      const data = response.data;
      if (data.status === 200 && data.forum) {
        setForum(data.forum);
      } else {
        throw new Error(data.message || 'Failed to parse forum data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, forumId]);

  useEffect(() => {
    if (token && forumId) {
      fetchForumDetails();
    }
  }, [token, forumId, fetchForumDetails]);

  // --- Computed Pagination ---
  const paginatedReplies = useMemo(() => {
    if (!forum || !forum.Replies) return [];
    const startIndex = (currentPage - 1) * limit;
    return forum.Replies.slice(startIndex, startIndex + limit);
  }, [forum, currentPage, limit]);

  const totalPages = useMemo(() => {
    if (!forum || !forum.Replies) return 0;
    return Math.ceil(forum.Replies.length / limit);
  }, [forum, limit]);


  const handleOpenReplyEdit = (reply: Reply) => {
    setSelectedReply(reply);
    setIsReplyEditModalOpen(true);
  };
  const handleOpenReplyDelete = (reply: Reply) => {
    setSelectedReply(reply);
    setIsReplyDeleteModalOpen(true);
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Back Button */}
      <div className="mb-4">
        <Link href="/dashboard/forums" className="flex items-center space-x-2 text-body-md font-semibold text-primary-600 hover:text-primary-800">
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" /></svg>
          <span>Back to all discussions</span>
        </Link>
      </div>

      {isLoading ? (
        <div className="text-center text-neutral-600 py-12">Loading discussion...</div>
      ) : error ? (
        <div className="text-center text-error bg-error/10 p-6 rounded-lg">Error: {error}</div>
      ) : !forum ? (
        <div className="text-center text-neutral-600 py-12">Post not found.</div>
      ) : (
        <>
          {/* --- Main Post --- */}
          <MainPostCard post={forum} />

          {/* --- Create Reply Form --- */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6 mb-6">
            <h3 className="text-h5 text-neutral-900 mb-4">Post a Reply</h3>
            <CreateReplyForm
              forumId={forum.id}
              token={token}
              userId={userId}
              onReplyAdded={fetchForumDetails} // Refreshes the post
            />
          </div>

          {/* --- Replies Feed --- */}
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm p-6">
            <div className="space-y-4">
              {paginatedReplies.length > 0 ? (
                paginatedReplies.map((reply) => (
                  <ReplyCard
                    key={reply.id}
                    reply={reply}
                    currentUserId={userId}
                    onEditClick={handleOpenReplyEdit}
                    onDeleteClick={handleOpenReplyDelete}
                  />
                ))
              ) : (
                <p className="text-center text-sm text-neutral-500 py-4">Be the first to reply!</p>
              )}
            </div>
            {/* Pagination Control */}
            {totalPages > 1 && (
              <div className="mt-6">
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </>
      )}

      {/* --- Render Reply Modals --- */}
      {selectedReply && (
        <EditReplyModal
          isOpen={isReplyEditModalOpen}
          onClose={() => setIsReplyEditModalOpen(false)}
          token={token}
          onPostUpdated={fetchForumDetails}
          reply={selectedReply}
        />
      )}
      {selectedReply && (
        <DeleteReplyModal
          isOpen={isReplyDeleteModalOpen}
          onClose={() => setIsReplyDeleteModalOpen(false)}
          token={token}
          onPostUpdated={fetchForumDetails}
          reply={selectedReply}
        />
      )}
    </div>
  );
}