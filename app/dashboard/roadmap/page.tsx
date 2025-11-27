'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/axios';
import JourneyView from './JourneyView';

// --- Define a type for the roadmap data ---
type Roadmap = {
  id: number;
  title: string;
  desc: string;
  divisionId: number;
  Division: {
    id: number;
    name: string;
  };
};

// --- Define a type for division data ---
type Division = {
  id: number;
  name: string;
};

// --- Define types for sorting ---
type SortKey = 'title' | 'desc' | 'Division.name';
type SortDirection = 'ascending' | 'descending';
type SortConfig = {
  key: SortKey | null;
  direction: SortDirection;
};

// --- Helper function to get nested values for sorting ---
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
};

// --- NEW: AddRoadmapModal Component ---
const AddRoadmapModal = ({
  isOpen,
  onClose,
  token,
  onRoadmapAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onRoadmapAdded: () => void
}) => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [divisionId, setDivisionId] = useState('');

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch divisions when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const fetchDivisions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await api.get('/division');
          const data = res.data;
          if (data.status === 200) setDivisions(data.divisions);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDivisions();
    }
  }, [isOpen, token]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !divisionId) {
      setError('All fields are required.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.post('/roadmap', {
        title,
        desc,
        divisionId: Number(divisionId),
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to create roadmap');
      }

      setSuccessMessage('Roadmap created successfully!');
      onRoadmapAdded(); // Refresh the table

      // Close modal immediately after successful creation and refresh
      handleClose();

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDesc('');
    setDivisionId('');
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Add New Roadmap</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading divisions...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="roadmap-title" className="block text-body-md font-semibold text-neutral-800 mb-2">Title</label>
              <input
                id="roadmap-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div>
              <label htmlFor="roadmap-desc" className="block text-body-md font-semibold text-neutral-800 mb-2">Description</label>
              <textarea
                id="roadmap-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div>
              <label htmlFor="roadmap-division" className="block text-body-md font-semibold text-neutral-800 mb-2">Division</label>
              <select
                id="roadmap-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white"
              >
                <option value="" disabled>Select a division</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-body-md text-error p-3 bg-error/10 rounded-lg">{error}</p>}
            {successMessage && <p className="text-body-md text-success p-3 bg-success/10 rounded-lg">{successMessage}</p>}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button" onClick={handleClose} disabled={isSubmitting}
                className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Creating...' : 'Create'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- NEW: EditRoadmapModal Component ---
const EditRoadmapModal = ({
  isOpen,
  onClose,
  token,
  onRoadmapUpdated,
  roadmap
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onRoadmapUpdated: () => void,
  roadmap: Roadmap
}) => {
  const [divisions, setDivisions] = useState<Division[]>([]);
  const [title, setTitle] = useState(roadmap.title);
  const [desc, setDesc] = useState(roadmap.desc);
  const [divisionId, setDivisionId] = useState(roadmap.divisionId.toString());

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch divisions when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const fetchDivisions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await api.get('/division');
          const data = res.data;
          if (data.status === 200) setDivisions(data.divisions);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDivisions();
    }
  }, [isOpen, token]);

  // Update form if the roadmap prop changes
  useEffect(() => {
    if (roadmap) {
      setTitle(roadmap.title);
      setDesc(roadmap.desc);
      setDivisionId(roadmap.divisionId.toString());
    }
  }, [roadmap]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !desc || !divisionId) {
      setError('All fields are required.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const res = await api.put(`/roadmap/${roadmap.id}`, {
        title,
        desc,
        divisionId: Number(divisionId),
      });

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update roadmap');
      }

      setSuccessMessage('Roadmap updated successfully!');
      onRoadmapUpdated(); // Refresh the table

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
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Edit Roadmap</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading divisions...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="edit-roadmap-title" className="block text-body-md font-semibold text-neutral-800 mb-2">Title</label>
              <input
                id="edit-roadmap-title" type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div>
              <label htmlFor="edit-roadmap-desc" className="block text-body-md font-semibold text-neutral-800 mb-2">Description</label>
              <textarea
                id="edit-roadmap-desc" value={desc} onChange={(e) => setDesc(e.target.value)} rows={4}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none"
              />
            </div>
            <div>
              <label htmlFor="edit-roadmap-division" className="block text-body-md font-semibold text-neutral-800 mb-2">Division</label>
              <select
                id="edit-roadmap-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none bg-white"
              >
                <option value="" disabled>Select a division</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>{division.name}</option>
                ))}
              </select>
            </div>

            {error && <p className="text-body-md text-error p-3 bg-error/10 rounded-lg">{error}</p>}
            {successMessage && <p className="text-body-md text-success p-3 bg-success/10 rounded-lg">{successMessage}</p>}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button" onClick={handleClose} disabled={isSubmitting}
                className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="submit" disabled={isSubmitting}
                className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50"
              >
                {isSubmitting ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- NEW: DeleteRoadmapConfirmationModal Component ---
const DeleteRoadmapConfirmationModal = ({
  isOpen,
  onClose,
  token,
  onRoadmapDeleted,
  roadmap,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onRoadmapDeleted: () => void;
  roadmap: Roadmap;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.delete(`/roadmap/${roadmap.id}`);

      const data = res.data;
      if (data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to delete roadmap');
      }

      onRoadmapDeleted();
      handleClose();

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
          Are you sure you want to delete the roadmap:
          <strong className="text-neutral-900"> "{roadmap.title}"</strong>?
        </p>
        {error && <p className="text-body-md text-error p-3 bg-error/10 rounded-lg mb-4">{error}</p>}
        <div className="flex justify-end space-x-3">
          <button
            type="button" onClick={handleClose} disabled={isSubmitting}
            className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            type="button" onClick={handleDelete} disabled={isSubmitting}
            className="rounded-lg bg-error py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-error/90 disabled:opacity-50"
          >
            {isSubmitting ? 'Deleting...' : 'Delete'}
          </button>
        </div>
      </div>
    </div>
  );
};


// --- ViewRoadmapModal Component (read-only form matching AddRoadmapModal styles) ---
const ViewRoadmapModal = ({
  isOpen,
  onClose,
  roadmap,
}: {
  isOpen: boolean;
  onClose: () => void;
  roadmap: Roadmap;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Roadmap Details</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form className="space-y-4">
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Title</label>
            <input
              type="text"
              value={roadmap.title}
              disabled
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Description</label>
            <textarea
              value={roadmap.desc}
              disabled
              rows={4}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 bg-neutral-50"
            />
          </div>

          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Division</label>
            <select value={roadmap.Division?.id.toString()} disabled className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md bg-neutral-50">
              <option value={roadmap.Division?.id.toString()}>{roadmap.Division?.name}</option>
            </select>
          </div>

          <div className="flex justify-end pt-4">
            <button type="button" onClick={onClose} className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600">Close</button>
          </div>
        </form>
      </div>
    </div>
  );
};


// --- NEW: ImportRoadmapModal Component ---
const ImportRoadmapModal = ({
  isOpen,
  onClose,
  token,
  onRoadmapsImported
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onRoadmapsImported: () => void
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [divisionId, setDivisionId] = useState('');
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Fetch divisions
  useEffect(() => {
    if (isOpen && token) {
      const fetchDivisions = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const res = await api.get('/division');
          const data = res.data;
          if (data.status === 200) setDivisions(data.divisions);
        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDivisions();
    }
  }, [isOpen, token]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
      setError(null);
      setSuccessMessage(null);
      setLogs([]);
    }
  };

  const parseCSV = async (file: File): Promise<any[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        if (!text) return resolve([]);

        const lines = text.split('\n');
        // Expected headers: No, Materi, Deskripsi
        // We will map: Materi -> title, Deskripsi -> desc
        const headers = lines[0].split(',').map(h => h.trim());

        const result = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          // Simple CSV split handling quotes roughly
          const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          const currentLine = matches ? matches : lines[i].split(',');

          const obj: any = {};
          headers.forEach((header, index) => {
            let val = currentLine[index]?.trim();
            if (val && val.startsWith('"') && val.endsWith('"')) {
              val = val.slice(1, -1);
            }
            obj[header] = val;
          });
          result.push(obj);
        }
        resolve(result);
      };
      reader.onerror = (e) => reject(e);
      reader.readAsText(file);
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !divisionId) {
      setError('Please select a file and a division.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setLogs([]);
    setProgress(null);

    try {
      const parsedData = await parseCSV(file);
      if (parsedData.length === 0) {
        throw new Error('CSV file is empty or could not be parsed.');
      }

      setProgress({ current: 0, total: parsedData.length });

      let successCount = 0;
      let failCount = 0;
      const newLogs = [];

      for (let i = 0; i < parsedData.length; i++) {
        const row = parsedData[i];

        // Map CSV fields to API fields
        const title = row['Materi'];
        const desc = row['Deskripsi'];

        if (!title || !desc) {
          newLogs.push(`Row ${i + 2}: Skipped - Missing 'Materi' or 'Deskripsi'`);
          failCount++;
          setProgress({ current: i + 1, total: parsedData.length });
          continue;
        }

        try {
          await api.post('/roadmap', {
            title,
            desc,
            divisionId: Number(divisionId),
          });
          successCount++;
        } catch (err: any) {
          newLogs.push(`Row ${i + 2}: Failed - ${err.response?.data?.message || err.message}`);
          failCount++;
        }

        setProgress({ current: i + 1, total: parsedData.length });
      }

      setLogs(newLogs);
      setSuccessMessage(`Import completed. Success: ${successCount}, Failed: ${failCount}`);
      if (successCount > 0) {
        onRoadmapsImported();
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setDivisionId('');
    setError(null);
    setSuccessMessage(null);
    setLogs([]);
    setProgress(null);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Import Roadmaps from CSV</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading divisions...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Division Selection */}
            <div>
              <label htmlFor="import-division" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Assign Division to All Items
              </label>
              <select
                id="import-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none bg-white"
              >
                <option value="" disabled>Select division</option>
                {divisions.map((division) => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
            </div>

            {/* File Input */}
            <div>
              <label htmlFor="csv-file" className="block text-body-md font-semibold text-neutral-800 mb-1">
                CSV File
              </label>
              <input
                id="csv-file" type="file" accept=".csv" onChange={handleFileChange}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              />
              <p className="text-xs text-neutral-500 mt-1">
                Expected columns: No, Materi, Deskripsi
              </p>
            </div>

            {/* Progress Bar */}
            {progress && (
              <div className="w-full bg-neutral-200 rounded-full h-2.5 mb-4">
                <div
                  className="bg-primary-500 h-2.5 rounded-full transition-all duration-300"
                  style={{ width: `${(progress.current / progress.total) * 100}%` }}
                ></div>
                <p className="text-xs text-center mt-1">{progress.current} / {progress.total}</p>
              </div>
            )}

            {/* Logs */}
            {logs.length > 0 && (
              <div className="max-h-32 overflow-y-auto bg-neutral-50 p-2 rounded border border-neutral-200 text-xs text-neutral-700">
                {logs.map((log, idx) => (
                  <div key={idx}>{log}</div>
                ))}
              </div>
            )}

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
                Close
              </button>
              <button
                type="submit"
                disabled={isSubmitting || !file || !divisionId}
                className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 transition-all disabled:opacity-50"
              >
                {isSubmitting ? 'Importing...' : 'Start Import'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};


export default function RoadmapPage() {
  // --- State for data, loading, and errors ---
  const [roadmaps, setRoadmaps] = useState<Roadmap[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userDivisionId, setUserDivisionId] = useState<number | null>(null);

  // --- State for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // --- State for Modals ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // NEW: State for import modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedRoadmap, setSelectedRoadmap] = useState<Roadmap | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [showJourneyView, setShowJourneyView] = useState(false); // NEW: Toggle for Journey View


  // --- Refactored fetchRoadmaps ---
  const fetchRoadmaps = useCallback(async () => {
    if (!token) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }

    setError(null);
    try {
      const res = await api.get('/roadmap');

      const data = res.data;

      if (data.status === 200 && Array.isArray(data.roadmaps)) {
        setRoadmaps(data.roadmaps);
      } else {
        throw new Error(data.message || 'Failed to parse roadmap data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token]); // Depends on token

  // --- useEffect to get token and initial data ---
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }
    setToken(storedToken);
    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) setRoleId(parseInt(storedRoleId, 10));
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) setUserId(parseInt(storedUserId, 10));
  }, []);

  // --- useEffect to fetch data once token is set ---
  useEffect(() => {
    if (token) {
      fetchRoadmaps();
    }
  }, [token, fetchRoadmaps]);

  // --- NEW: Fetch user profile to get division ID for roleId 8 ---
  useEffect(() => {
    if (token && userId && roleId === 8) {
      const fetchUserProfile = async () => {
        try {
          const res = await api.get(`/userdata/${userId}`);
          const data = res.data;
          if (data.status === 200 && data.user && data.user.UserDatum) {
            setUserDivisionId(data.user.UserDatum.divisionId);
          }
        } catch (err) {
          console.error('Failed to fetch user profile for division filtering:', err);
        }
      };
      fetchUserProfile();
    }
  }, [token, userId, roleId]);


  // --- useMemo to process data for search and sort ---
  const processedRoadmaps = useMemo(() => {
    let filteredData = [...roadmaps];

    // NEW: Filter by division for roleId 8
    if (roleId === 8 && userDivisionId) {
      filteredData = filteredData.filter(item => item.divisionId === userDivisionId);
    }

    // 1. Filter data based on search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.title.toLowerCase().includes(lowerSearch) ||
        item.desc.toLowerCase().includes(lowerSearch) ||
        item.Division.name.toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Sort data based on sort config
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // @ts-ignore
        const aValue = getNestedValue(a, sortConfig.key);
        // @ts-ignore 
        const bValue = getNestedValue(b, sortConfig.key);

        let comparison = 0;

        if (aValue === null || aValue === undefined) comparison = -1;
        if (bValue === null || bValue === undefined) comparison = 1;

        if (typeof aValue === 'string' && typeof bValue === 'string') {
          comparison = aValue.toLowerCase().localeCompare(bValue.toLowerCase());
        } else if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [roadmaps, searchTerm, sortConfig, roleId, userDivisionId]);

  // --- Function to handle sort clicks ---
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  // --- Helper to render sort icons ---
  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <span className="text-neutral-400">↕</span>;
    if (sortConfig.direction === 'ascending') return <span className="text-primary-800">▲</span>;
    return <span className="text-primary-800">▼</span>;
  };

  // --- Handlers to open modals ---
  const handleOpenEditModal = (item: Roadmap) => {
    setSelectedRoadmap(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: Roadmap) => {
    setSelectedRoadmap(item);
    setIsDeleteModalOpen(true);
  };

  const handleOpenViewModal = (item: Roadmap) => {
    setSelectedRoadmap(item);
    setIsViewModalOpen(true);
  };


  return (
    <div>
      {/* --- Top Bar: Header and Add Button --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-neutral-900">
          Roadmap
        </h1>
        {roleId !== 2 && roleId !== 8 && (
          <div className="flex gap-3">
            {/* Journey View Toggle */}
            <button
              onClick={() => setShowJourneyView(!showJourneyView)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white py-2 px-4 font-semibold text-body-md text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
            >
              {showJourneyView ? (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
                  </svg>
                  Table View
                </>
              ) : (
                <>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                  </svg>
                  Journey View
                </>
              )}
            </button>

            {/* Import CSV Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white py-2 px-4 font-semibold text-body-md text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
              </svg>
              Import CSV
            </button>
            <button
              className="flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
              onClick={() => setIsModalOpen(true)}
            >
              <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add New</span>
            </button>
          </div>
        )}
      </div>

      {/* --- Search Bar --- */}
      <div className="mb-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-neutral-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by title, description, or division..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      {roleId === 8 || showJourneyView ? (
        <JourneyView roadmaps={processedRoadmaps} />
      ) : (
        /* Table Container */
        <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
          <table className="w-full min-w-max text-left">
            {/* Table Header */}
            <thead className="border-b border-primary-200 bg-primary-50">
              <tr className="text-body-sm font-semibold text-primary-800">
                <th
                  className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => requestSort('title')}
                >
                  <div className="flex items-center justify-between">
                    Title {getSortIcon('title')}
                  </div>
                </th>
                <th
                  className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => requestSort('desc')}
                >
                  <div className="flex items-center justify-between">
                    Description {getSortIcon('desc')}
                  </div>
                </th>
                <th
                  className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                  onClick={() => requestSort('Division.name')}
                >
                  <div className="flex items-center justify-between">
                    Division {getSortIcon('Division.name')}
                  </div>
                </th>
                <th className="p-4">Actions</th>
              </tr>
            </thead>

            {/* Table Body: Conditional Rendering */}
            <tbody>
              {isLoading && (!roadmaps || roadmaps.length === 0) ? ( // Show loading only if table is empty
                // --- Loading State ---
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-600">
                    Loading roadmap data...
                  </td>
                </tr>
              ) : error ? (
                // --- Error State ---
                <tr>
                  <td colSpan={4} className="p-8 text-center text-error">
                    Error: {error}
                  </td>
                </tr>
              ) : processedRoadmaps.length === 0 ? (
                // --- Empty State ---
                <tr>
                  <td colSpan={4} className="p-8 text-center text-neutral-600">
                    {searchTerm ? 'No roadmaps found matching your search.' : 'No roadmaps found.'}
                  </td>
                </tr>
              ) : (
                // --- Data State ---
                processedRoadmaps.map((item, index) => (
                  <tr
                    key={item.id}
                    className={`
                      border-b border-neutral-200 text-body-md text-neutral-800
                      ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                    `}
                  >
                    {/* Title */}
                    <td className="p-4 font-semibold">{item.title}</td>

                    {/* Description */}
                    <td className="p-4 max-w-sm truncate" title={item.desc}>{item.desc}</td>

                    {/* Division */}
                    <td className="p-4">{item.Division.name}</td>

                    {/* Actions: only show if current user id is not 2 */}
                    <td className="p-4">
                      {roleId !== 2 ? (
                        <div className="flex space-x-3">
                          <button
                            onClick={() => handleOpenEditModal(item)} // <-- Connect handler
                            title="Edit"
                            className="text-neutral-500 hover:text-primary-600 transition-colors"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                            </svg>
                          </button>
                          <button
                            onClick={() => handleOpenDeleteModal(item)} // <-- Connect handler
                            title="Delete"
                            className="text-neutral-500 hover:text-error transition-colors"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ) : (
                        <div>
                          <button
                            onClick={() => handleOpenViewModal(item)}
                            title="View"
                            className="text-neutral-500 hover:text-primary-600 transition-colors"
                          >
                            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* --- Modals --- */}
      <AddRoadmapModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onRoadmapAdded={fetchRoadmaps}
      />

      <ImportRoadmapModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        token={token}
        onRoadmapsImported={fetchRoadmaps}
      />

      {selectedRoadmap && (
        <>
          <EditRoadmapModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            token={token}
            onRoadmapUpdated={fetchRoadmaps}
            roadmap={selectedRoadmap}
          />
          <DeleteRoadmapConfirmationModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            token={token}
            onRoadmapDeleted={fetchRoadmaps}
            roadmap={selectedRoadmap}
          />
          <ViewRoadmapModal
            isOpen={isViewModalOpen}
            onClose={() => setIsViewModalOpen(false)}
            roadmap={selectedRoadmap}
          />
        </>
      )}
    </div>
  );
}