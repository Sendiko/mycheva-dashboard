'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/axios';
import QRCode from 'react-qr-code';

// --- Helper function to format the date ---
const formatDate = (dateString: string) => {
  if (!dateString) return 'N/A';
  try {
    const date = new Date(dateString);
    // Formats the date to "Oct 27, 2025"
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  } catch (error) {
    console.error("Failed to format date:", dateString, error);
    return dateString;
  }
};

// --- Helper function to format time ---
const formatTime = (timeString: string) => {
  if (!timeString) return 'N/A';
  try {
    // Assuming timeString is "HH:mm:ss"
    const [hours, minutes] = timeString.split(':');
    // You can use Intl.DateTimeFormat for more robust formatting if needed
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error("Failed to format time:", timeString, error);
    return timeString;
  }
};

// --- Helper to format date for input[type="date"] (YYYY-MM-DD) ---
const formatDateForInput = (dateString: string) => {
  if (!dateString) return '';
  try {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (error) {
    console.error("Failed to format date for input:", dateString, error);
    return '';
  }
};

// --- Helper to format time for input[type="time"] (HH:MM) ---
const formatTimeForInput = (timeString: string) => {
  if (!timeString) return '';
  try {
    // Assuming timeString is "HH:mm:ss"
    const [hours, minutes] = timeString.split(':');
    return `${hours}:${minutes}`;
  } catch (error) {
    console.error("Failed to format time for input:", timeString, error);
    return '';
  }
};


// --- Define a type for the meeting data (based on /event response) ---
type Meeting = {
  id: number;
  name: string;
  desc: string;
  type: 'onsite' | 'online' | string;
  details: string;
  date: string;
  time: string;
  divisionId: number;
  Division: { name: string }
};

// --- Define a type for division data ---
type Division = {
  id: number;
  name: string;
};

// --- Define types for sorting ---
type SortKey = 'name' | 'date' | 'time' | 'type';
type SortDirection = 'ascending' | 'descending';
type SortConfig = {
  key: SortKey | null;
  direction: SortDirection;
};

// --- Helper function to get nested values (simple version for this object) ---
const getValue = (obj: Meeting, key: SortKey) => {
  return obj[key];
};

// --- AddMeetingModal Component ---
const AddMeetingModal = ({
  isOpen,
  onClose,
  token,
  onMeetingAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onMeetingAdded: () => void
}) => {
  // Dropdown data state
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Form input state
  const [name, setName] = useState('');
  const [desc, setDesc] = useState('');
  const [type, setType] = useState<'onsite' | 'online' | ''>('');
  const [details, setDetails] = useState('');
  const [date, setDate] = useState(''); // Use 'YYYY-MM-DD' format for input type="date"
  const [time, setTime] = useState(''); // Use 'HH:MM' format for input type="time"
  const [divisionId, setDivisionId] = useState('');

  // UI state
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
    if (!name || !desc || !type || !details || !date || !time || !divisionId) {
      setError('All fields are required.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // API expects time with seconds, append ':00'
      const formattedTime = `${time}:00`;

      const res = await api.post('/event', {
        name,
        desc,
        type,
        details,
        date,
        time: formattedTime,
        divisionId: Number(divisionId),
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to create meeting');
      }

      // Success
      setSuccessMessage('Meeting created successfully!');
      onMeetingAdded(); // Refresh the table

      // Close modal immediately after successful creation and refresh
      handleClose();

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setName('');
    setDesc('');
    setType('');
    setDetails('');
    setDate('');
    setTime('');
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
          <h2 className="text-h4 text-neutral-900">Add New Meeting</h2>
          <button
            onClick={handleClose}
            className="text-neutral-500 hover:text-neutral-800"
          >
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading divisions...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <div>
              <label htmlFor="meeting-name" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Meeting Name
              </label>
              <input
                id="meeting-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="meeting-desc" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Description
              </label>
              <textarea
                id="meeting-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="meeting-type" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Type
              </label>
              <select
                id="meeting-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'onsite' | 'online' | '')}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="" disabled>Select type</option>
                <option value="onsite">Onsite</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Details */}
            <div>
              <label htmlFor="meeting-details" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Details (Location/Link)
              </label>
              <input
                id="meeting-details"
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Date & Time (Side-by-side) */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="meeting-date" className="block text-body-md font-semibold text-neutral-800 mb-2">
                  Date
                </label>
                <input
                  id="meeting-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="meeting-time" className="block text-body-md font-semibold text-neutral-800 mb-2">
                  Time
                </label>
                <input
                  id="meeting-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Division Dropdown */}
            <div>
              <label htmlFor="division" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Division
              </label>
              <select
                id="division"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="" disabled>Select a division</option>
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
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
                {isSubmitting ? 'Creating...' : 'Create Meeting'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- QrModal: Uses react-qr-code to render an SVG QR and offers PNG download ---
const QrModal = ({
  isOpen,
  onClose,
  meeting,
}: {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}) => {
  const [isGenerating, setIsGenerating] = React.useState(false);
  if (!isOpen || !meeting) return null;

  const downloadPng = async () => {
    try {
      setIsGenerating(true);
      const wrapperId = `qr-wrapper-${meeting.id}`;
      const wrapper = document.getElementById(wrapperId);
      if (!wrapper) return;
      const svg = wrapper.querySelector('svg') as SVGSVGElement | null;
      if (!svg) return;

      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svg);
      if (!svgString.match(/^<svg[^>]+xmlns="http:\/\/www.w3.org\/2000\/svg"/)) {
        svgString = svgString.replace(/^<svg/, '<svg xmlns="http://www.w3.org/2000/svg"');
      }
      const svgBlob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
      const url = URL.createObjectURL(svgBlob);
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = 300;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.fillStyle = '#ffffff';
          ctx.fillRect(0, 0, size, size);
          ctx.drawImage(img, 0, 0, size, size);
          const pngData = canvas.toDataURL('image/png');
          const a = document.createElement('a');
          a.href = pngData;
          a.download = `meeting-${meeting.id}-qr.png`;
          a.click();
        }
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      };
      img.onerror = () => {
        URL.revokeObjectURL(url);
        setIsGenerating(false);
      };
      img.src = url;
    } catch (err) {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-sm rounded-xl bg-white p-6 shadow-2xl my-8 text-center">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Meeting QR Code</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="py-4">
          <div id={`qr-wrapper-${meeting.id}`} className="mx-auto mb-4 flex items-center justify-center">
            <QRCode value={meeting.id.toString()} size={300} />
          </div>
          <p className="text-body-sm text-neutral-700 mb-4">Scan to open meeting details</p>
          <div className="flex justify-center space-x-3">
            <button onClick={downloadPng} disabled={isGenerating} className={`rounded-lg py-2 px-4 font-semibold text-body-md text-white shadow-sm transition-all ${isGenerating ? 'bg-neutral-200 text-neutral-600' : 'bg-primary-500 hover:bg-primary-600'}`}>
              {isGenerating ? 'Preparing...' : 'Download'}
            </button>
            <button onClick={onClose} className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 transition-all">Close</button>
          </div>
        </div>
      </div>
    </div>
  );
};

// --- NEW: EditMeetingModal Component ---
const EditMeetingModal = ({
  isOpen,
  onClose,
  token,
  onMeetingUpdated,
  meeting // Pass the meeting data to edit
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onMeetingUpdated: () => void,
  meeting: Meeting
}) => {
  // Dropdown data state
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Form input state - Initialize with meeting data
  const [name, setName] = useState(meeting.name);
  const [desc, setDesc] = useState(meeting.desc);
  const [type, setType] = useState<'onsite' | 'online' | string>(meeting.type);
  const [details, setDetails] = useState(meeting.details);
  const [date, setDate] = useState(formatDateForInput(meeting.date)); // Format for input
  const [time, setTime] = useState(formatTimeForInput(meeting.time)); // Format for input
  const [divisionId, setDivisionId] = useState(meeting.divisionId.toString());

  // UI state
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

  // Update state if the prop changes (e.g., opening modal for a different meeting)
  useEffect(() => {
    if (meeting) {
      setName(meeting.name);
      setDesc(meeting.desc);
      setType(meeting.type);
      setDetails(meeting.details);
      setDate(formatDateForInput(meeting.date));
      setTime(formatTimeForInput(meeting.time));
      setDivisionId(meeting.divisionId.toString());
    }
  }, [meeting]);


  // Handle form submission for EDIT (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !desc || !type || !details || !date || !time || !divisionId) {
      setError('All fields are required.');
      setSuccessMessage(null);
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const formattedTime = `${time}:00`;

      // API: PUT to /event/:id
      const res = await api.put(`/event/${meeting.id}`, {
        name,
        desc,
        type,
        details,
        date,
        time: formattedTime,
        divisionId: Number(divisionId),
      });

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update meeting');
      }

      setSuccessMessage('Meeting updated successfully!');
      onMeetingUpdated(); // Refresh the table

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
          <h2 className="text-h4 text-neutral-900">Edit Meeting</h2>
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
            {/* Name */}
            <div>
              <label htmlFor="edit-meeting-name" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Meeting Name
              </label>
              <input
                id="edit-meeting-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="edit-meeting-desc" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Description
              </label>
              <textarea
                id="edit-meeting-desc"
                value={desc}
                onChange={(e) => setDesc(e.target.value)}
                rows={3}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Type */}
            <div>
              <label htmlFor="edit-meeting-type" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Type
              </label>
              <select
                id="edit-meeting-type"
                value={type}
                onChange={(e) => setType(e.target.value as 'onsite' | 'online' | string)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="onsite">Onsite</option>
                <option value="online">Online</option>
              </select>
            </div>

            {/* Details */}
            <div>
              <label htmlFor="edit-meeting-details" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Details (Location/Link)
              </label>
              <input
                id="edit-meeting-details"
                type="text"
                value={details}
                onChange={(e) => setDetails(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              />
            </div>

            {/* Date & Time */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-meeting-date" className="block text-body-md font-semibold text-neutral-800 mb-2">
                  Date
                </label>
                <input
                  id="edit-meeting-date"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>
              <div>
                <label htmlFor="edit-meeting-time" className="block text-body-md font-semibold text-neutral-800 mb-2">
                  Time
                </label>
                <input
                  id="edit-meeting-time"
                  type="time"
                  value={time}
                  onChange={(e) => setTime(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
                />
              </div>
            </div>

            {/* Division Dropdown */}
            <div>
              <label htmlFor="edit-division" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Division
              </label>
              <select
                id="edit-division"
                value={divisionId}
                onChange={(e) => setDivisionId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                {divisions.map(division => (
                  <option key={division.id} value={division.id}>
                    {division.name}
                  </option>
                ))}
              </select>
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
        )}
      </div>
    </div>
  );
};

// --- NEW: DeleteConfirmationModal Component ---
const DeleteMeetingConfirmationModal = ({
  isOpen,
  onClose,
  token,
  onMeetingDeleted,
  meeting,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onMeetingDeleted: () => void;
  meeting: Meeting;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle DELETE request
  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // API: DELETE to /event/:id
      const res = await api.delete(`/event/${meeting.id}`);

      const data = res.data;
      // Check for successful status (might be 200 or 204 No Content)
      if (data && data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to delete meeting');
      }

      // Success
      onMeetingDeleted(); // Refresh the table
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
          Are you sure you want to delete the meeting:
          <strong className="text-neutral-900"> "{meeting.name}"</strong>?
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


// --- ViewMeetingModal Component (read-only form matching AddMeetingModal styles) ---
const ViewMeetingModal = ({
  isOpen,
  onClose,
  meeting,
}: {
  isOpen: boolean;
  onClose: () => void;
  meeting: Meeting;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl bg-white p-6 shadow-2xl my-8">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-h4 text-neutral-900">Meeting Details</h2>
          <button onClick={onClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        <form className="space-y-4">
          {/* Name */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Meeting Name</label>
            <input
              type="text"
              value={meeting.name}
              disabled
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 bg-neutral-50"
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Description</label>
            <textarea
              value={meeting.desc}
              disabled
              rows={3}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 bg-neutral-50"
            />
          </div>

          {/* Type */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Type</label>
            <select value={meeting.type} disabled className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md bg-neutral-50">
              <option value="onsite">Onsite</option>
              <option value="online">Online</option>
            </select>
          </div>

          {/* Details */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Details (Location/Link)</label>
            <input
              type="text"
              value={meeting.details}
              disabled
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 bg-neutral-50"
            />
          </div>

          {/* Date & Time */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-body-md font-semibold text-neutral-800 mb-2">Date</label>
              <input type="date" value={formatDateForInput(meeting.date)} disabled className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md bg-neutral-50" />
            </div>
            <div>
              <label className="block text-body-md font-semibold text-neutral-800 mb-2">Time</label>
              <input type="time" value={formatTimeForInput(meeting.time)} disabled className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md bg-neutral-50" />
            </div>
          </div>

          {/* Division */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">Division</label>
            <select value={meeting.divisionId.toString()} disabled className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md bg-neutral-50">
              <option value={meeting.divisionId}>{meeting.Division.name}</option>
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


export default function MeetingsPage() {
  // --- State for data, loading, and errors ---
  const [meetings, setMeetings] = useState<Meeting[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);

  // --- State for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // --- State for Modals (to hook up buttons) ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  // --- NEW: State for Edit/Delete ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedMeeting, setSelectedMeeting] = useState<Meeting | null>(null);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);


  // --- Refactored fetchMeetings ---
  const fetchMeetings = useCallback(async () => {
    if (!token) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }

    // Don't show loading on refresh
    // setIsLoading(true);
    try {
      const res = await api.get('/event');

      const data = res.data;

      if (data.status === 200 && Array.isArray(data.events)) {
        setMeetings(data.events);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to parse data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false); // Only set loading false on initial load or error
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
  }, []);

  // --- useEffect to fetch data once token is set ---
  useEffect(() => {
    if (token) {
      fetchMeetings();
    }
  }, [token, fetchMeetings]);


  // --- useMemo to process data for search and sort ---
  const processedMeetings = useMemo(() => {
    let filteredData = [...meetings];

    // 1. Filter data based on search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item =>
        item.name.toLowerCase().includes(lowerSearch) ||
        item.type.toLowerCase().includes(lowerSearch) ||
        item.details.toLowerCase().includes(lowerSearch) ||
        formatDate(item.date).toLowerCase().includes(lowerSearch)
      );
    }

    // 2. Sort data based on sort config
    if (sortConfig.key) {
      filteredData.sort((a, b) => {
        // @ts-ignore
        const aValue = getValue(a, sortConfig.key);
        // @ts-ignore
        const bValue = getValue(b, sortConfig.key);

        let comparison = 0;

        if (aValue === null || aValue === undefined) comparison = -1;
        if (bValue === null || bValue === undefined) comparison = 1;

        if (sortConfig.key === 'date') {
          // Compare dates correctly
          comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        } else if (sortConfig.key === 'time') {
          // Compare times correctly (convert HH:MM:SS to seconds)
          const timeToSeconds = (timeStr: string) => {
            const parts = timeStr.split(':').map(Number);
            return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
          }
          comparison = timeToSeconds(aValue) - timeToSeconds(bValue);
        } else if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [meetings, searchTerm, sortConfig]);

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

  // --- NEW: Handlers to open modals ---
  const handleOpenEditModal = (item: Meeting) => {
    setSelectedMeeting(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: Meeting) => {
    setSelectedMeeting(item);
    setIsDeleteModalOpen(true);
  };

  const handleOpenViewModal = (item: Meeting) => {
    setSelectedMeeting(item);
    setIsViewModalOpen(true);
  };

  const handleOpenQrModal = (item: Meeting) => {
    setSelectedMeeting(item);
    setIsQrModalOpen(true);
  };


  return (
    <div>
      {/* --- Top Bar: Header and Add Button --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl text-neutral-900">
          Meetings
        </h1>
        {roleId === 7 || roleId === 1 && (
          <button
            className="w-fit flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
            onClick={() => setIsModalOpen(true)}
          >
            <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add New</span>
          </button>
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
            placeholder="Search by name, type, details, or date..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
        <table className="w-full min-w-max text-left">
          {/* Table Header */}
          <thead className="border-b border-primary-200 bg-primary-50">
            <tr className="text-body-sm font-semibold text-primary-800">
              <th className="p-4">#</th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('name')}
              >
                <div className="flex items-center justify-between">
                  Name {getSortIcon('name')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('date')}
              >
                <div className="flex items-center justify-between">
                  Date {getSortIcon('date')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('time')}
              >
                <div className="flex items-center justify-between">
                  Time {getSortIcon('time')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('type')}
              >
                <div className="flex items-center justify-between">
                  Type {getSortIcon('type')}
                </div>
              </th>
              <th className="p-4">Details</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          {/* Table Body: Conditional Rendering */}
          <tbody>
            {isLoading && (!meetings || meetings.length === 0) ? ( // Show loading only if table is empty
              // --- Loading State ---
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-600">
                  Loading meetings data...
                </td>
              </tr>
            ) : error ? (
              // --- Error State ---
              <tr>
                <td colSpan={7} className="p-8 text-center text-error">
                  Error: {error}
                </td>
              </tr>
            ) : processedMeetings.length === 0 ? (
              // --- Empty State ---
              <tr>
                <td colSpan={7} className="p-8 text-center text-neutral-600">
                  {searchTerm ? 'No results found.' : 'No meetings found.'}
                </td>
              </tr>
            ) : (
              // --- Data State ---
              processedMeetings.map((item, index) => (
                <tr
                  key={item.id}
                  className={`
                    border-b border-neutral-200 text-body-md text-neutral-800
                    ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'}
                  `}
                >
                  {/* Number */}
                  <td className="p-4 font-medium text-neutral-500">
                    {index + 1}
                  </td>

                  {/* Name */}
                  <td className="p-4 font-semibold">
                    {item.name}
                  </td>

                  {/* Date */}
                  <td className="p-4">
                    {formatDate(item.date)}
                  </td>

                  {/* Time */}
                  <td className="p-4">
                    {formatTime(item.time)}
                  </td>

                  {/* Type */}
                  <td className="p-4 capitalize">
                    {item.type}
                  </td>

                  {/* Details */}
                  <td className="p-4 truncate max-w-xs" title={item.details}>
                    {item.details}
                  </td>

                  {/* Actions */}
                  <td className="p-4">
                    {roleId !== 2 ? (
                      <div className="flex space-x-3">
                        <button
                          onClick={() => handleOpenQrModal(item)}
                          title="QR Code"
                          className="text-neutral-500 hover:text-primary-600 transition-colors"
                        >
                          {/* QR icon */}
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h6v6H3V3zM15 3h6v6h-6V3zM3 15h6v6H3v-6zM8 8h8v8H8V8zM17 17h4v4h-4v-4z" />
                          </svg>
                        </button>
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

                        <button
                          onClick={() => handleOpenQrModal(item)}
                          title="QR Code"
                          className="text-neutral-500 hover:text-primary-600 transition-colors mr-2"
                        >
                          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h6v6H3V3zM15 3h6v6h-6V3zM3 15h6v6H3v-6zM8 8h8v8H8V8zM17 17h4v4h-4v-4z" />
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
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.269 2.943 9.542 7-1.273 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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

      {/* --- Render Add Meeting Modal --- */}
      <AddMeetingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onMeetingAdded={fetchMeetings}
      />

      {/* --- NEW: Render Edit/Delete Modals --- */}
      {selectedMeeting && (
        <EditMeetingModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          token={token}
          onMeetingUpdated={fetchMeetings}
          meeting={selectedMeeting}
        />
      )}
      {selectedMeeting && (
        <DeleteMeetingConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          token={token}
          onMeetingDeleted={fetchMeetings}
          meeting={selectedMeeting}
        />
      )}
      {selectedMeeting && (
        <ViewMeetingModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          meeting={selectedMeeting}
        />
      )}
      {selectedMeeting && (
        <QrModal
          isOpen={isQrModalOpen}
          onClose={() => setIsQrModalOpen(false)}
          meeting={selectedMeeting}
        />
      )}
    </div>
  );
}