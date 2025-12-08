'use client';

import React, { useState, useEffect } from 'react';
import api from '../../../lib/axios';
import Image from 'next/image';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface Division {
  id: number;
  name: string;
}

interface Assignment {
  id: number;
  title: string;
  detail: string;
  deadline: string;
  imageUrl: string | null;
  divisionId: number;
  createdAt: string;
  updatedAt: string;
  Division: Division;
}

interface SubmissionFile {
  id: number;
  path: string;
  fileName?: string;
  fileType?: string;
}

interface Submission {
  id: number;
  userId: number;
  assignmentId: number;
  content: string;
  score: number | null;
  createdAt: string;
  updatedAt: string;
  SubmissionFiles?: SubmissionFile[];
}

// --- Components ---

const AssignmentCard = ({
  assignment,
  onSubmit,
  isSubmitted,
  roleId,
  onEdit,
  onDelete,
  onView,
  onViewSubmission
}: {
  assignment: Assignment;
  onSubmit: (assignment: Assignment) => void;
  isSubmitted: boolean;
  roleId: number | null;
  onEdit: (assignment: Assignment) => void;
  onDelete: (assignment: Assignment) => void;
  onView: (assignment: Assignment) => void;
  onViewSubmission: (assignment: Assignment) => void;
}) => {
  const deadlineDate = new Date(assignment.deadline);
  const isPastDeadline = new Date() > deadlineDate;
  const isMentor = roleId === 7 || roleId === 1;

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden flex flex-col h-full hover:shadow-md transition-shadow duration-200 group">
      {assignment.imageUrl && (
        <div
          className="relative h-48 w-full bg-neutral-100 cursor-pointer overflow-hidden"
          onClick={() => onView(assignment)}
        >
          <Image
            src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${assignment.imageUrl.replace(/^\//, '')}`}
            alt={assignment.title}
            layout="fill"
            className="object-cover group-hover:scale-105 transition-transform duration-300"
            onError={(e) => {
              const target = e.target as HTMLImageElement;
              target.style.display = 'none'; // Hide if fails
            }}
          />
        </div>
      )}
      <div className="p-6 flex-1 flex flex-col">
        <div className="mb-4">
          <div className="flex justify-between items-start mb-2">
            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
              {assignment.Division?.name || 'General'}
            </span>
            {isSubmitted && !isMentor && (
              <span className="text-success-600 text-xs font-bold flex items-center">
                ✓ Submitted
              </span>
            )}
          </div>
          <h3
            className="text-h5 font-bold text-neutral-900 mb-2 line-clamp-2 cursor-pointer hover:text-primary-600 transition-colors"
            title={assignment.title}
            onClick={() => onView(assignment)}
          >
            {assignment.title}
          </h3>
          <p className={`text-body-sm mb-4 font-medium ${isPastDeadline && !isSubmitted && !isMentor ? 'text-error' : 'text-neutral-500'}`}>
            Due: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </p>
          <p className="text-body-md text-neutral-700 line-clamp-3 mb-4">
            {assignment.detail}
          </p>
        </div>

        <div className="mt-auto space-y-2">
          {isMentor ? (
            <div className="space-y-2">
              <button
                onClick={() => window.location.href = `/dashboard/assignments/${assignment.id}`}
                className="w-full py-2 px-4 bg-primary-50 text-primary-700 border border-primary-200 rounded-lg font-semibold hover:bg-primary-100 transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                View Submissions
              </button>
              <div className="flex space-x-2">
                <button
                  onClick={() => onEdit(assignment)}
                  className="flex-1 py-2 px-4 bg-white border border-neutral-300 text-neutral-700 rounded-lg font-semibold hover:bg-neutral-50 transition-colors"
                >
                  Edit
                </button>
                <button
                  onClick={() => onDelete(assignment)}
                  className="flex-1 py-2 px-4 bg-white border border-error/30 text-error rounded-lg font-semibold hover:bg-error/5 transition-colors"
                >
                  Delete
                </button>
              </div>
            </div>
          ) : (
            <>
              {isSubmitted ? (
                <button
                  onClick={() => onViewSubmission(assignment)}
                  className="w-full py-2.5 px-4 bg-success-50 text-success-700 border border-success-200 rounded-lg font-semibold hover:bg-success-100 transition-colors flex items-center justify-center gap-2"
                >
                  <span>View Submission</span>
                </button>
              ) : isPastDeadline ? (
                <button disabled className="w-full py-2.5 px-4 bg-neutral-100 text-neutral-500 border border-neutral-200 rounded-lg font-semibold cursor-not-allowed">
                  Deadline Passed
                </button>
              ) : (
                <button
                  onClick={() => onSubmit(assignment)}
                  className="w-full py-2.5 px-4 bg-primary-600 text-white rounded-lg font-semibold hover:bg-primary-700 transition-colors shadow-sm active:transform active:scale-[0.98]"
                >
                  Submit Assignment
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

const SubmissionModal = ({
  isOpen,
  onClose,
  assignment,
  onSuccess,
  existingSubmission
}: {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  onSuccess: () => void;
  existingSubmission?: Submission | null;
}) => {
  const [content, setContent] = useState('');
  const [files, setFiles] = useState<FileList | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Determine if editable
  const isScored = existingSubmission?.score !== null;
  // Check if deadline is within 24 hours from now
  const deadlineDate = assignment ? new Date(assignment.deadline) : new Date();
  const oneDayBeforeDeadline = new Date(deadlineDate.getTime() - 24 * 60 * 60 * 1000);
  const isTooLateToEdit = new Date() > oneDayBeforeDeadline;

  const isEditable = !isScored && !isTooLateToEdit;
  const isViewOnly = !!existingSubmission && !isEditable;

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      setContent(existingSubmission?.content || '');
      setFiles(null);
      setError(null);
    }
  }, [isOpen, existingSubmission]);

  if (!isOpen || !assignment) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('assignmentId', assignment.id.toString());
      formData.append('content', content);

      const userId = localStorage.getItem('userId');
      if (userId) formData.append('userId', userId);

      // Only append score if creating new, though backend might ignore it for students
      if (!existingSubmission) {
        formData.append('score', '0');
      }

      if (files) {
        for (let i = 0; i < files.length; i++) {
          formData.append('files', files[i]);
        }
      }

      let response;
      if (existingSubmission) {
        // Update existing submission
        // Assuming PUT /submission/:id updates content
        response = await api.put(`/submission/${existingSubmission.id}`, {
          content: content,
          // Add other fields if necessary, but typically PUT updates what's sent
        });
      } else {
        // Create new submission
        response = await api.post('/submission', formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });
      }

      if (response.status === 201 || response.status === 200) {
        onSuccess();
        onClose();
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to submit assignment. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden transform transition-all animate-in zoom-in-95 duration-200">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <div>
            <h3 className="text-h5 font-bold text-neutral-900">{existingSubmission ? (isViewOnly ? 'View Submission' : 'Edit Submission') : 'Submit Assignment'}</h3>
            <p className="text-sm text-neutral-500 mt-1 truncate max-w-xs" title={assignment.title}>{assignment.title}</p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        {isViewOnly && (
          <div className="px-6 py-3 bg-neutral-50 border-b border-neutral-100 text-sm text-neutral-600">
            {isScored ? (
              <span className="flex items-center gap-2 text-success-700 font-medium">
                <span>✓ Graded: {existingSubmission?.score}</span>
              </span>
            ) : (
              <span className="flex items-center gap-2 text-warning-700 font-medium">
                <span>⚠️ Editing locked (Less than 24h before deadline)</span>
              </span>
            )}
          </div>
        )}

        {isViewOnly && existingSubmission?.SubmissionFiles && existingSubmission.SubmissionFiles.length > 0 && (
          <div className="px-6 py-4 bg-white border-b border-neutral-100">
            <h4 className="text-sm font-semibold text-neutral-900 mb-2">Submitted Files:</h4>
            <div className="space-y-2">
              {existingSubmission.SubmissionFiles.map((file) => (
                <a
                  key={file.id}
                  href={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${file.path.replace(/^\//, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  download
                  className="flex items-center gap-2 p-2 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors group"
                >
                  <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span className="text-sm text-neutral-700 font-medium group-hover:text-primary-700 underline decoration-transparent group-hover:decoration-primary-700 transition-all flex-1">
                    {file.fileName || file.path.split('/').pop() || 'Download File'}
                  </span>
                  <svg className="w-4 h-4 text-neutral-400 group-hover:text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                  </svg>
                </a>
              ))}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="p-4 bg-error/10 border border-error/20 text-error rounded-lg text-sm flex items-start gap-2">
              <span className="text-lg">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-2">
              Description / Content <span className="text-error">*</span>
            </label>
            <div className={isViewOnly ? "prose max-w-none p-3 border border-neutral-200 rounded-lg bg-neutral-50" : ""}>
              {isViewOnly ? (
                <ReactMarkdown remarkPlugins={[remarkGfm]}>
                  {content}
                </ReactMarkdown>
              ) : (
                <textarea
                  required
                  disabled={isViewOnly}
                  value={content}
                  onChange={(e) => setContent(e.target.value)}
                  className="w-full p-3 border border-neutral-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all min-h-[120px] text-neutral-800 placeholder-neutral-400 disabled:bg-neutral-50 disabled:text-neutral-500"
                  placeholder="Write your submission details here... (Markdown supported)"
                />
              )}
            </div>
          </div>

          {!isViewOnly && (
            <div>
              <label className="block text-sm font-semibold text-neutral-700 mb-2">Attachments</label>
              <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-neutral-300 border-dashed rounded-lg hover:bg-neutral-50 transition-colors relative">
                <div className="space-y-1 text-center">
                  <svg className="mx-auto h-12 w-12 text-neutral-400" stroke="currentColor" fill="none" viewBox="0 0 48 48" aria-hidden="true">
                    <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <div className="flex text-sm text-neutral-600 justify-center">
                    <label htmlFor="file-upload" className="relative cursor-pointer bg-white rounded-md font-medium text-primary-600 hover:text-primary-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500">
                      <span>Upload files</span>
                      <input id="file-upload" name="file-upload" type="file" className="sr-only" multiple onChange={(e) => setFiles(e.target.files)} />
                    </label>
                    <p className="pl-1">or drag and drop</p>
                  </div>
                  <p className="text-xs text-neutral-500">
                    {files && files.length > 0 ? `${files.length} file(s) selected` : 'Any file type up to 10MB'}
                  </p>
                </div>
              </div>
            </div>
          )}

          <div className="flex justify-end space-x-3 pt-4 border-t border-neutral-100">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
            >
              {isViewOnly ? 'Close' : 'Cancel'}
            </button>
            {!isViewOnly && (
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-sm transition-all flex items-center gap-2"
              >
                {isSubmitting && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                {isSubmitting ? 'Saving...' : (existingSubmission ? 'Update Submission' : 'Submit Assignment')}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

const AssignmentDetailModal = ({
  isOpen,
  onClose,
  assignment,
  roleId,
  isSubmitted,
  submission,
  onSubmit
}: {
  isOpen: boolean;
  onClose: () => void;
  assignment: Assignment | null;
  roleId: number | null;
  isSubmitted: boolean;
  submission?: Submission | null;
  onSubmit: (assignment: Assignment) => void;
}) => {
  if (!isOpen || !assignment) return null;

  const deadlineDate = new Date(assignment.deadline);
  const isPastDeadline = new Date() > deadlineDate;
  const isMentor = roleId === 7;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-in fade-in duration-200">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-start bg-neutral-50/50">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
                {assignment.Division?.name || 'General'}
              </span>
              {isSubmitted && !isMentor && (
                <span className="text-success-600 text-xs font-bold flex items-center bg-success-50 px-2 py-1 rounded-full">
                  ✓ Submitted
                </span>
              )}
            </div>
            <h3 className="text-h4 font-bold text-neutral-900">{assignment.title}</h3>
            <p className={`text-sm font-medium mt-1 ${isPastDeadline && !isSubmitted && !isMentor ? 'text-error' : 'text-neutral-500'}`}>
              Due: {deadlineDate.toLocaleDateString()} {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </p>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600 p-1 rounded-full hover:bg-neutral-100 transition-colors">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {assignment.imageUrl && (
            <div className="relative w-full h-64 mb-6 rounded-lg overflow-hidden bg-neutral-100">
              <Image
                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${assignment.imageUrl.replace(/^\//, '')}`}
                alt={assignment.title}
                layout="fill"
                className="object-contain"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.style.display = 'none';
                }}
              />
            </div>
          )}

          <div className="prose max-w-none text-neutral-800">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>
              {assignment.detail}
            </ReactMarkdown>
          </div>

          {submission && submission.SubmissionFiles && submission.SubmissionFiles.length > 0 && (
            <div className="mt-6 pt-6 border-t border-neutral-100">
              <h4 className="text-sm font-semibold text-neutral-900 mb-3">Your Submission Files:</h4>
              <div className="space-y-2">
                {submission.SubmissionFiles.map((file) => (
                  <a
                    key={file.id}
                    href={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${file.path.replace(/^\//, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    download
                    className="flex items-center gap-3 p-3 rounded-lg border border-neutral-200 hover:bg-neutral-50 transition-colors group bg-white"
                  >
                    <div className="p-2 bg-primary-50 text-primary-600 rounded-lg group-hover:bg-primary-100 transition-colors">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-neutral-900 truncate group-hover:text-primary-700 transition-colors">
                        {file.fileName || file.path.split('/').pop() || 'Download File'}
                      </p>
                      <p className="text-xs text-neutral-500">Click to download</p>
                    </div>
                    <svg className="w-5 h-5 text-neutral-400 group-hover:text-primary-600 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path>
                    </svg>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-6 border-t border-neutral-100 bg-neutral-50/30 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-5 py-2.5 text-neutral-700 font-medium hover:bg-neutral-100 rounded-lg transition-colors"
          >
            Close
          </button>
          {!isMentor && !isSubmitted && !isPastDeadline && (
            <button
              onClick={() => {
                onClose();
                onSubmit(assignment);
              }}
              className="px-5 py-2.5 bg-primary-600 text-white font-medium rounded-lg hover:bg-primary-700 shadow-sm transition-all"
            >
              Submit Assignment
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

const CreateEditAssignmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  assignmentToEdit
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignmentToEdit: Assignment | null;
}) => {
  const [title, setTitle] = useState('');
  const [detail, setDetail] = useState('');
  const [deadline, setDeadline] = useState('');
  const [divisionId, setDivisionId] = useState('');
  const [image, setImage] = useState<File | null>(null);
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Fetch divisions for the dropdown
    const fetchDivisions = async () => {
      try {
        const res = await api.get('/division');
        if (res.data.status === 200 && Array.isArray(res.data.divisions)) {
          setDivisions(res.data.divisions);
        } else {
          setDivisions([]);
        }
      } catch (err) {
        console.error("Failed to fetch divisions", err);
        setDivisions([]);
      }
    };
    if (isOpen) fetchDivisions();
  }, [isOpen]);

  useEffect(() => {
    if (assignmentToEdit) {
      setTitle(assignmentToEdit.title);
      setDetail(assignmentToEdit.detail);
      // Format deadline for datetime-local input (YYYY-MM-DDTHH:mm)
      const d = new Date(assignmentToEdit.deadline);
      d.setMinutes(d.getMinutes() - d.getTimezoneOffset());
      setDeadline(d.toISOString().slice(0, 16));
      setDivisionId(assignmentToEdit.divisionId.toString());
      setImage(null); // Reset image input
    } else {
      setTitle('');
      setDetail('');
      setDeadline('');
      setDivisionId('');
      setImage(null);
    }
    setError(null);
  }, [assignmentToEdit, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('title', title);
      formData.append('detail', detail);
      formData.append('deadline', new Date(deadline).toISOString());
      formData.append('divisionId', divisionId);
      if (image) {
        formData.append('image', image);
      }

      let response;
      if (assignmentToEdit) {
        response = await api.put(`/assignment/${assignmentToEdit.id}`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        response = await api.post('/assignment', formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      }

      if (response.status === 201 || response.status === 200) {
        onSuccess();
        onClose();
      } else {
        throw new Error('Unexpected response status');
      }
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || err.message || 'Failed to save assignment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
          <h3 className="text-h5 font-bold text-neutral-900">{assignmentToEdit ? 'Edit Assignment' : 'Create Assignment'}</h3>
          <button onClick={onClose} className="text-neutral-400 hover:text-neutral-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
          </button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && <div className="p-3 bg-error/10 text-error rounded-lg text-sm">{error}</div>}

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Title</label>
            <input required type="text" value={title} onChange={e => setTitle(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Detail</label>
            <textarea required value={detail} onChange={e => setDetail(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg h-24" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Deadline</label>
            <input required type="datetime-local" value={deadline} onChange={e => setDeadline(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg" />
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Division</label>
            <select required value={divisionId} onChange={e => setDivisionId(e.target.value)} className="w-full p-2 border border-neutral-300 rounded-lg">
              <option value="">Select Division</option>
              {divisions.map(div => (
                <option key={div.id} value={div.id}>{div.name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-neutral-700 mb-1">Image (Optional)</label>
            <input type="file" onChange={e => setImage(e.target.files ? e.target.files[0] : null)} className="w-full p-2 border border-neutral-300 rounded-lg" />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button type="button" onClick={onClose} className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg">Cancel</button>
            <button type="submit" disabled={isSubmitting} className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-70">
              {isSubmitting ? 'Saving...' : 'Save Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const DeleteAssignmentModal = ({
  isOpen,
  onClose,
  onSuccess,
  assignment
}: {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  assignment: Assignment | null;
}) => {
  const [isDeleting, setIsDeleting] = useState(false);

  if (!isOpen || !assignment) return null;

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await api.delete(`/assignment/${assignment.id}`);
      onSuccess();
      onClose();
    } catch (err) {
      console.error("Failed to delete assignment", err);
      alert("Failed to delete assignment");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-lg p-6 max-w-sm w-full">
        <h3 className="text-lg font-bold text-neutral-900 mb-2">Delete Assignment?</h3>
        <p className="text-neutral-600 mb-6">Are you sure you want to delete &quot;{assignment.title}&quot;? This action cannot be undone.</p>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-neutral-700 hover:bg-neutral-100 rounded-lg">Cancel</button>
          <button onClick={handleDelete} disabled={isDeleting} className="px-4 py-2 bg-error text-white rounded-lg hover:bg-error/90 disabled:opacity-70">
            {isDeleting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default function AssignmentsPage() {
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);

  // Modals
  const [isSubmissionModalOpen, setIsSubmissionModalOpen] = useState(false);
  const [isCreateEditModalOpen, setIsCreateEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [assignmentToEdit, setAssignmentToEdit] = useState<Assignment | null>(null);
  const [assignmentToDelete, setAssignmentToDelete] = useState<Assignment | null>(null);
  const [assignmentToView, setAssignmentToView] = useState<Assignment | null>(null);

  const [roleId, setRoleId] = useState<number | null>(null);
  const [userDivisionId, setUserDivisionId] = useState<number | null>(null);

  useEffect(() => {
    // Get roleId from localStorage
    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) {
      setRoleId(parseInt(storedRoleId, 10));
    }

    // Get user division
    const fetchUserDivision = async () => {
      const storedUserId = localStorage.getItem('userId');
      if (storedUserId) {
        try {
          const res = await api.get(`/userdata/${storedUserId}`);
          if (res.data.status === 200 && res.data.user) {
            setUserDivisionId(res.data.user.UserDatum.divisionId);
          }
        } catch (err) {
          console.error("Error fetching user division:", err);
        }
      }
    };
    fetchUserDivision();
  }, []);

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [assignmentsRes, submissionsRes] = await Promise.all([
        api.get('/assignment'),
        api.get('/submission')
      ]);

      if (assignmentsRes.data.status === 200) {
        setAssignments(assignmentsRes.data.assignments);
      }

      if (submissionsRes.data.status === 200) {
        setSubmissions(submissionsRes.data.submissions);
      }
    } catch (err: any) {
      console.error("Error fetching data:", err);
      setError(err.message || 'Failed to fetch data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleOpenSubmit = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSelectedSubmission(null);
    setIsSubmissionModalOpen(true);
  };

  const handleViewSubmission = (assignment: Assignment) => {
    const submission = submissions.find(s => s.assignmentId === assignment.id && s.userId.toString() === localStorage.getItem('userId'));
    if (submission) {
      setSelectedAssignment(assignment);
      setSelectedSubmission(submission);
      setIsSubmissionModalOpen(true);
    }
  };

  const handleSubmissionSuccess = () => {
    fetchData(); // Refresh data to update "Submitted" status
  };

  const userId = typeof window !== 'undefined' ? localStorage.getItem('userId') : null;

  const isAssignmentSubmitted = (assignmentId: number) => {
    if (!userId) return false;
    return submissions.some(s => s.assignmentId === assignmentId && s.userId.toString() === userId);
  };

  // Mentor Actions
  const handleCreateClick = () => {
    setAssignmentToEdit(null);
    setIsCreateEditModalOpen(true);
  };

  const handleEditClick = (assignment: Assignment) => {
    setAssignmentToEdit(assignment);
    setIsCreateEditModalOpen(true);
  };

  const handleDeleteClick = (assignment: Assignment) => {
    setAssignmentToDelete(assignment);
    setIsDeleteModalOpen(true);
  };

  const handleViewClick = (assignment: Assignment) => {
    setAssignmentToView(assignment);
    setIsDetailModalOpen(true);
  };

  const handleCreateEditSuccess = () => {
    fetchData();
  };

  const handleDeleteSuccess = () => {
    fetchData();
  };

  // Filter and Sort Assignments
  const filteredAssignments = assignments.filter(a => {
    if (userDivisionId === null) return false;
    return a.divisionId === userDivisionId;
  });

  const sortedAssignments = [...filteredAssignments].sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime());

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900 tracking-tight">Assignments</h1>
          <p className="text-neutral-500 mt-1">Manage and track your division&apos;s tasks</p>
        </div>
        {roleId === 7 || roleId === 1 ? (
          <button
            onClick={handleCreateClick}
            className="flex items-center space-x-2 bg-primary-600 text-white px-5 py-2.5 rounded-xl font-semibold hover:bg-primary-700 transition-all shadow-sm hover:shadow-md active:scale-95"
          >
            <span className="text-xl leading-none">+</span>
            <span>Create Assignment</span>
          </button>
        ) : null}
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <p className="text-neutral-600">Loading assignments...</p>
        </div>
      ) : error ? (
        <div className="text-center py-20 bg-error/5 rounded-xl border border-error/10">
          <p className="text-error font-medium mb-2">Error loading data</p>
          <p className="text-neutral-600 text-sm">{error}</p>
          <button onClick={fetchData} className="mt-4 px-4 py-2 bg-white border border-neutral-300 rounded-lg text-neutral-700 hover:bg-neutral-50 transition-colors">
            Try Again
          </button>
        </div>
      ) : sortedAssignments.length === 0 ? (
        <div className="text-center py-20 bg-neutral-50 rounded-xl border border-neutral-200 border-dashed">
          <p className="text-neutral-500 text-lg">No assignments found for your division.</p>
          {roleId === 7 && (
            <button onClick={handleCreateClick} className="mt-4 text-primary-600 font-semibold hover:underline">
              Create your first assignment
            </button>
          )}
        </div>
      ) : (
        <div className="relative border-l-2 border-neutral-200 ml-3 md:ml-6 space-y-12 pb-12">
          {sortedAssignments.map((assignment) => {
            const isSubmitted = isAssignmentSubmitted(assignment.id);
            const deadlineDate = new Date(assignment.deadline);
            const isPastDeadline = new Date() > deadlineDate;

            return (
              <div key={assignment.id} className="relative pl-8 md:pl-12 group">
                {/* Timeline Dot */}
                <div className={`absolute -left-[9px] top-0 h-[18px] w-[18px] rounded-full border-4 border-white shadow-sm transition-colors duration-300 ${isSubmitted ? 'bg-success-500' : isPastDeadline ? 'bg-error-500' : 'bg-primary-500'
                  }`} />

                <div className="flex flex-col md:flex-row gap-6 items-start">
                  {/* Date Column */}
                  <div className="md:w-32 flex-shrink-0 pt-1">
                    <p className="text-sm font-bold text-neutral-900">
                      {deadlineDate.toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                    </p>
                    <p className="text-xs text-neutral-500 mb-2">
                      {deadlineDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>

                    {/* Status Badge for timeline */}
                    {isSubmitted ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-success-50 text-success-700 border border-success-200">
                        Submitted
                      </span>
                    ) : isPastDeadline && roleId !== 7 ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-error-50 text-error-700 border border-error-200">
                        Overdue
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-50 text-primary-700 border border-primary-200">
                        Active
                      </span>
                    )}
                  </div>

                  {/* Card Column */}
                  <div className="flex-1 min-w-0 w-full">
                    <AssignmentCard
                      assignment={assignment}
                      onSubmit={handleOpenSubmit}
                      isSubmitted={isSubmitted}
                      roleId={roleId}
                      onEdit={handleEditClick}
                      onDelete={handleDeleteClick}
                      onView={handleViewClick}
                      onViewSubmission={handleViewSubmission}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modals */}
      <SubmissionModal
        isOpen={isSubmissionModalOpen}
        onClose={() => setIsSubmissionModalOpen(false)}
        assignment={selectedAssignment}
        onSuccess={handleSubmissionSuccess}
        existingSubmission={selectedSubmission}
      />

      <CreateEditAssignmentModal
        isOpen={isCreateEditModalOpen}
        onClose={() => setIsCreateEditModalOpen(false)}
        onSuccess={handleCreateEditSuccess}
        assignmentToEdit={assignmentToEdit}
      />

      <DeleteAssignmentModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onSuccess={handleDeleteSuccess}
        assignment={assignmentToDelete}
      />

      <AssignmentDetailModal
        isOpen={isDetailModalOpen}
        onClose={() => setIsDetailModalOpen(false)}
        assignment={assignmentToView}
        roleId={roleId}
        isSubmitted={assignmentToView ? isAssignmentSubmitted(assignmentToView.id) : false}
        submission={assignmentToView ? submissions.find(s => s.assignmentId === assignmentToView.id && s.userId.toString() === localStorage.getItem('userId')) : null}
        onSubmit={handleOpenSubmit}
      />
    </div>
  );
}
