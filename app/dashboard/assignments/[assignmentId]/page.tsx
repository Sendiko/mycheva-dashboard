'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '../../../../lib/axios';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

// --- Types ---
interface Division {
    id: number;
    name: string;
}

interface UserDatum {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    faculty: string;
    major: string;
    divisionId: number;
    nim: string;
    imageUrl: string | null;
}

interface User {
    id: number;
    roleId: number;
    name: string;
    profileUrl: string;
    UserDatum: UserDatum;
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
    user: User;
    SubmissionFiles?: SubmissionFile[];
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
    Submissions: Submission[];
}

export default function AssignmentSubmissionsPage({ params }: { params: Promise<{ assignmentId: string }> }) {
    const router = useRouter();
    const { assignmentId } = React.use(params);
    const [assignment, setAssignment] = useState<Assignment | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [roleId, setRoleId] = useState<number | null>(null);

    // Scoring State
    const [editingScoreId, setEditingScoreId] = useState<number | null>(null);
    const [scoreInput, setScoreInput] = useState<string>('');
    const [isSavingScore, setIsSavingScore] = useState(false);

    useEffect(() => {
        const storedRoleId = localStorage.getItem('roleId');
        if (storedRoleId) {
            setRoleId(parseInt(storedRoleId, 10));
        }
    }, []);

    const fetchAssignment = useCallback(async () => {
        setIsLoading(true);
        try {
            const res = await api.get(`/assignment/${assignmentId}`);
            if (res.data.status === 200 && res.data.assignment) {
                setAssignment(res.data.assignment);
            } else {
                setError('Failed to load assignment details.');
            }
        } catch (err: any) {
            console.error("Error fetching assignment:", err);
            setError(err.message || 'Failed to fetch assignment.');
        } finally {
            setIsLoading(false);
        }
    }, [assignmentId]);

    useEffect(() => {
        if (assignmentId) {
            fetchAssignment();
        }
    }, [assignmentId, fetchAssignment]);

    const handleBack = () => {
        router.push('/dashboard/assignments');
    };

    const startEditingScore = (submission: Submission) => {
        setEditingScoreId(submission.id);
        setScoreInput(submission.score?.toString() || '');
    };

    const cancelEditingScore = () => {
        setEditingScoreId(null);
        setScoreInput('');
    };

    const saveScore = async (submissionId: number) => {
        setIsSavingScore(true);
        try {
            // Assuming the endpoint is PUT /submission/:id with { score: number }
            const scoreValue = parseFloat(scoreInput);
            if (isNaN(scoreValue) || scoreValue < 0 || scoreValue > 100) {
                alert("Please enter a valid score between 0 and 100.");
                setIsSavingScore(false);
                return;
            }

            const res = await api.put(`/submission/${submissionId}`, { score: scoreValue });

            if (res.status === 200) {
                // Refresh data
                await fetchAssignment();
                setEditingScoreId(null);
            } else {
                alert("Failed to save score.");
            }
        } catch (err) {
            console.error("Error saving score:", err);
            alert("Error saving score.");
        } finally {
            setIsSavingScore(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
                <p className="text-neutral-600">Loading submission details...</p>
            </div>
        );
    }

    if (error || !assignment) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8">
                <button onClick={handleBack} className="mb-6 text-neutral-500 hover:text-neutral-900 flex items-center gap-2">
                    ← Back to Assignments
                </button>
                <div className="text-center py-20 bg-error/5 rounded-xl border border-error/10">
                    <p className="text-error font-medium mb-2">Error loading data</p>
                    <p className="text-neutral-600 text-sm">{error || 'Assignment not found'}</p>
                </div>
            </div>
        );
    }

    // Only mentors should access this page ideally, but we'll show a warning if not
    if (roleId !== 7) {
        return (
            <div className="max-w-5xl mx-auto px-4 py-8 text-center">
                <p className="text-error">Access Denied. Only mentors can view this page.</p>
                <button onClick={handleBack} className="mt-4 text-primary-600 hover:underline">Return to Assignments</button>
            </div>
        );
    }

    return (
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {/* Header */}
            <div className="mb-8">
                <button onClick={handleBack} className="mb-4 text-neutral-500 hover:text-neutral-900 flex items-center gap-2 font-medium transition-colors">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                    Back to Assignments
                </button>
                <div className="flex flex-col md:flex-row md:items-start gap-6 bg-white p-6 rounded-xl shadow-sm border border-neutral-200">
                    {assignment.imageUrl && (
                        <div className="relative w-full md:w-48 h-32 bg-neutral-100 rounded-lg overflow-hidden flex-shrink-0">
                            <Image
                                src={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${assignment.imageUrl.replace(/^\//, '')}`}
                                alt={assignment.title}
                                layout="fill"
                                className="object-cover"
                            />
                        </div>
                    )}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-block px-3 py-1 text-xs font-semibold rounded-full bg-primary-50 text-primary-600">
                                {assignment.Division?.name || 'General'}
                            </span>
                            <span className="text-neutral-500 text-sm">
                                Due: {new Date(assignment.deadline).toLocaleDateString()} {new Date(assignment.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </div>
                        <h1 className="text-2xl font-bold text-neutral-900 mb-2">{assignment.title}</h1>
                        <p className="text-neutral-600 line-clamp-2">{assignment.detail}</p>
                    </div>
                </div>
            </div>

            {/* Submissions List */}
            <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
                <div className="p-6 border-b border-neutral-100 flex justify-between items-center bg-neutral-50/50">
                    <h2 className="text-lg font-bold text-neutral-900">Submissions ({assignment.Submissions.length})</h2>
                </div>

                {assignment.Submissions.length === 0 ? (
                    <div className="p-12 text-center text-neutral-500">
                        No submissions yet.
                    </div>
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead className="bg-neutral-50 text-neutral-500 text-sm font-semibold uppercase tracking-wider">
                                <tr>
                                    <th className="px-6 py-4">Student</th>
                                    <th className="px-6 py-4">Submitted At</th>
                                    <th className="px-6 py-4">Content</th>
                                    <th className="px-6 py-4">Score</th>
                                    <th className="px-6 py-4 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-neutral-100">
                                {assignment.Submissions.map((submission) => (
                                    <tr key={submission.id} className="hover:bg-neutral-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="relative w-10 h-10 rounded-full overflow-hidden bg-neutral-200">
                                                    <Image
                                                        src={submission.user.profileUrl || `https://ui-avatars.com/api/?name=${submission.user.UserDatum.fullName}`}
                                                        alt={submission.user.UserDatum.fullName}
                                                        layout="fill"
                                                        className="object-cover"
                                                    />
                                                </div>
                                                <div>
                                                    <p className="font-semibold text-neutral-900">{submission.user.UserDatum.fullName}</p>
                                                    <p className="text-xs text-neutral-500">{submission.user.UserDatum.nim}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-neutral-600">
                                            {new Date(submission.createdAt).toLocaleDateString()} <br />
                                            <span className="text-xs text-neutral-400">{new Date(submission.createdAt).toLocaleTimeString()}</span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="max-w-xs">
                                                <div className="prose prose-sm max-w-none text-neutral-800 line-clamp-3 mb-2">
                                                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                                        {submission.content}
                                                    </ReactMarkdown>
                                                </div>
                                                {submission.SubmissionFiles && submission.SubmissionFiles.length > 0 && (
                                                    <div className="flex flex-col gap-1">
                                                        {submission.SubmissionFiles.map(file => (
                                                            <a
                                                                key={file.id}
                                                                href={`${process.env.NEXT_PUBLIC_API_IMAGE_BASE_URL}/public/${file.path.replace(/^\//, '')}`}
                                                                target="_blank"
                                                                rel="noopener noreferrer"
                                                                download
                                                                className="text-xs text-primary-600 hover:text-primary-800 hover:underline flex items-center gap-1 group"
                                                            >
                                                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"></path></svg>
                                                                <span className="truncate max-w-[150px]" title={file.fileName || file.path.split('/').pop()}>{file.fileName || file.path.split('/').pop() || 'Attachment'}</span>
                                                                <svg className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
                                                            </a>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingScoreId === submission.id ? (
                                                <div className="flex items-center gap-2">
                                                    <input
                                                        type="number"
                                                        min="0"
                                                        max="100"
                                                        value={scoreInput}
                                                        onChange={(e) => setScoreInput(e.target.value)}
                                                        className="w-20 p-1 border border-neutral-300 rounded text-sm focus:ring-2 focus:ring-primary-500 outline-none"
                                                        autoFocus
                                                    />
                                                </div>
                                            ) : (
                                                <span className={`inline-block px-2.5 py-1 rounded-full text-sm font-semibold ${submission.score !== null
                                                    ? 'bg-success-50 text-success-700 border border-success-200'
                                                    : 'bg-neutral-100 text-neutral-500 border border-neutral-200'
                                                    }`}>
                                                    {submission.score !== null ? submission.score : 'Not Scored'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            {editingScoreId === submission.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button
                                                        onClick={() => saveScore(submission.id)}
                                                        disabled={isSavingScore}
                                                        className="text-success-600 hover:text-success-700 font-medium text-sm disabled:opacity-50"
                                                    >
                                                        Save
                                                    </button>
                                                    <button
                                                        onClick={cancelEditingScore}
                                                        disabled={isSavingScore}
                                                        className="text-neutral-500 hover:text-neutral-700 font-medium text-sm disabled:opacity-50"
                                                    >
                                                        Cancel
                                                    </button>
                                                </div>
                                            ) : (
                                                <button
                                                    onClick={() => startEditingScore(submission)}
                                                    className="text-primary-600 hover:text-primary-700 font-medium text-sm hover:underline"
                                                >
                                                    {submission.score !== null ? 'Edit Score' : 'Grade'}
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
    );
}
