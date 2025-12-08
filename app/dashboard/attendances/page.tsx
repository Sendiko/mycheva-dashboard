'use client';

import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';
import Pagination from '@/components/Pagination';

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
    return dateString; // Return original string if formatting fails
  }
};

// --- StatusBadge component ---
const StatusBadge = ({ status }: { status: string }) => {
  let classes = '';
  // Capitalize first letter for display
  const displayStatus = status.charAt(0).toUpperCase() + status.slice(1);

  switch (status.toLowerCase()) {
    case 'present':
      classes = 'bg-success/10 text-success';
      break;
    case 'absent':
      classes = 'bg-error/10 text-error';
      break;
    case 'excused':
      classes = 'bg-info/10 text-info';
      break;
    case 'sick':
      classes = 'bg-warning/10 text-warning';
      break;
    default:
      classes = 'bg-neutral-400/10 text-neutral-700';
  }

  return (
    <span
      className={`
        rounded-full px-3 py-1 text-body-sm font-semibold
        inline-block ${classes}
      `}
    >
      {displayStatus}
    </span>
  );
};

// --- Define a type for the attendance data ---
type Attendance = {
  id: number;
  status: 'present' | 'absent' | 'excused' | 'sick' | string;
  Event: {
    name: string;
    date: string;
  };
  user: {
    profileUrl: string;
    name: string;
    UserDatum: {
      fullName: string;
    };
  };
};

// --- NEW: Define types for dropdown data ---
type User = {
  id: number;
  name: string;
  UserDatum: {
    fullName: string;
    Division: {
      name: string,
    }
  };
};

type Event = {
  id: number;
  name: string;
  Division: {
    name: string,
  }
};

// --- Define types for sorting ---
type SortKey = 'user.UserDatum.fullName' | 'Event.name' | 'Event.date' | 'status';
type SortDirection = 'ascending' | 'descending';
type SortConfig = {
  key: SortKey | null;
  direction: SortDirection;
};

// --- Helper function to get nested values for sorting ---
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
};


// --- AddAttendanceModal Component ---
const AddAttendanceModal = ({
  isOpen,
  onClose,
  token,
  onAttendanceAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onAttendanceAdded: () => void
}) => {
  // Dropdown data state
  const [users, setUsers] = useState<User[]>([]);
  const [events, setEvents] = useState<Event[]>([]);

  // Form input state
  const [selectedUserId, setSelectedUserId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [selectedStatus, setSelectedStatus] = useState('');
  const [userSearch, setUserSearch] = useState(''); // New state for user search

  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const statusOptions = ['present', 'absent', 'excused', 'sick'];

  // Fetch users and events when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const fetchDropdownData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          // Fetch Users
          const userRes = await api.get('/user/all?students=true&detailed=true');
          const userData = userRes.data;
          if (userData.status === 200) setUsers(userData.users);

          // Fetch Events
          const eventRes = await api.get('/event');
          const eventData = eventRes.data;
          if (eventData.status === 200) setEvents(eventData.events);

        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchDropdownData();
    }
  }, [isOpen, token]);

  // Filter users based on selected event and search term
  const filteredUsers = useMemo(() => {
    let filtered = users;

    // Filter by Search Term
    if (userSearch) {
      const lowerSearch = userSearch.toLowerCase();
      filtered = filtered.filter(user =>
        (user.UserDatum?.fullName || user.name).toLowerCase().includes(lowerSearch)
      );
    }

    return filtered;
  }, [users, selectedEventId, events, userSearch]);

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUserId || !selectedEventId || !selectedStatus) {
      setError('All fields are required.');
      setSuccessMessage(null); // Clear any previous success
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null); // Clear messages

    try {
      const res = await api.post('/attendance', {
        userId: Number(selectedUserId),
        eventId: Number(selectedEventId),
        status: selectedStatus,
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to create attendance');
      }

      // Success
      setSuccessMessage('Attendance created successfully!');
      onAttendanceAdded(); // Refresh the table in the background

      // Close modal immediately after successful creation and refresh
      handleClose();

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    setSelectedUserId('');
    setSelectedEventId('');
    setSelectedStatus('');
    setUserSearch('');
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
          <h2 className="text-xl font-bold text-neutral-900">Add New Attendance</h2>
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
          <div className="py-12 text-center text-neutral-600">Loading form data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Event Dropdown (Moved to Top) */}
            <div>
              <label htmlFor="event" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Event
              </label>
              <select
                id="event"
                value={selectedEventId}
                onChange={(e) => {
                  setSelectedEventId(e.target.value);
                  setSelectedUserId(''); // Reset user selection when event changes
                }}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="" disabled>Select an event</option>
                {events.map(event => (
                  <option key={event.id} value={event.id}>{event.name}</option>
                ))}
              </select>
            </div>

            {/* User Dropdown with Search */}
            <div>
              <label htmlFor="user" className="block text-body-md font-semibold text-neutral-800 mb-2">
                User
              </label>

              {/* Search Input */}
              <input
                type="text"
                placeholder="Search user..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full mb-2 rounded-lg border border-neutral-300 px-3 py-2 text-body-sm text-neutral-800 placeholder-neutral-400 focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none transition-all"
              />

              <select
                id="user"
                value={selectedUserId}
                onChange={(e) => setSelectedUserId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="" disabled>Select a user</option>
                {filteredUsers.map(user => (
                  <option key={user.id} value={user.id}>
                    {user.UserDatum?.fullName || user.name}
                  </option>
                ))}
                {filteredUsers.length === 0 && (
                  <option disabled>No users found</option>
                )}
              </select>
              {selectedEventId && filteredUsers.length === 0 && (
                <p className="text-xs text-neutral-500 mt-1">No users found for this event's division.</p>
              )}
            </div>

            {/* Status Dropdown */}
            <div>
              <label htmlFor="status" className="block text-body-md font-semibold text-neutral-800 mb-2">
                Status
              </label>
              <select
                id="status"
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
              >
                <option value="" disabled>Select a status</option>
                {statusOptions.map(status => (
                  <option key={status} value={status} className="capitalize">{status}</option>
                ))}
              </select>
            </div>

            {/* --- Improved Feedback --- */}
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
                {isSubmitting ? 'Saving...' : 'Save Attendance'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- NEW: EditAttendanceModal Component ---
const EditAttendanceModal = ({
  isOpen,
  onClose,
  token,
  onAttendanceUpdated,
  attendance,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onAttendanceUpdated: () => void;
  attendance: Attendance;
}) => {
  const [selectedStatus, setSelectedStatus] = useState(attendance.status);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const statusOptions = ['present', 'absent', 'excused', 'sick'];

  // Update state if the prop changes (e.g., opening modal for a different user)
  useEffect(() => {
    if (attendance) {
      setSelectedStatus(attendance.status);
    }
  }, [attendance]);

  // Handle form submission for EDIT (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Per your API spec: PUT to /attendance with ID and status in body
      const res = await api.put(`/attendance/${attendance.id}`, {
        status: selectedStatus,
      });

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update attendance');
      }

      // Success
      setSuccessMessage('Attendance updated successfully!');
      onAttendanceUpdated(); // Refresh the table

      setTimeout(() => {
        handleClose();
      }, 1500);

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Reset form when closing
  const handleClose = () => {
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
          <h2 className="text-xl font-bold text-neutral-900">Edit Attendance</h2>
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
          {/* Read-only User */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">
              User
            </label>
            <p className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-body-md text-neutral-600">
              {attendance.user.UserDatum.fullName || attendance.user.name}
            </p>
          </div>

          {/* Read-only Event */}
          <div>
            <label className="block text-body-md font-semibold text-neutral-800 mb-2">
              Event
            </label>
            <p className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-4 py-3 text-body-md text-neutral-600">
              {attendance.Event.name}
            </p>
          </div>

          {/* Status Dropdown */}
          <div>
            <label htmlFor="status" className="block text-body-md font-semibold text-neutral-800 mb-2">
              Status
            </label>
            <select
              id="status"
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
            >
              {statusOptions.map(status => (
                <option key={status} value={status} className="capitalize">{status}</option>
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
      </div>
    </div>
  );
};

// --- NEW: DeleteConfirmationModal Component ---
const DeleteConfirmationModal = ({
  isOpen,
  onClose,
  token,
  onAttendanceDeleted,
  attendance,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onAttendanceDeleted: () => void;
  attendance: Attendance;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle DELETE request
  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Per your API spec: DELETE to /attendance with ID in body
      const res = await api.delete(`/attendance/${attendance.id}`);

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to delete attendance');
      }

      // Success
      onAttendanceDeleted(); // Refresh the table
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
        <h2 className="text-xl font-bold text-neutral-900 mb-4">Confirm Deletion</h2>
        <p className="text-body-md text-neutral-700 mb-6">
          Are you sure you want to delete the attendance record for{' '}
          <strong className="text-neutral-900">{attendance.user.UserDatum.fullName || attendance.user.name}</strong>{' '}
          at the event{' '}
          <strong className="text-neutral-900">{attendance.Event.name}</strong>?
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


export default function AttendancesPage() {
  const router = useRouter();
  // --- State for data, loading, and errors ---
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // --- New State for Search, Sort, Modal, and Token ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // --- Pagination State ---
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [totalItems, setTotalItems] = useState(0);
  const [limit, setLimit] = useState(10);

  // --- NEW: State for Edit/Delete Modals ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedAttendance, setSelectedAttendance] = useState<Attendance | null>(null);


  // --- Refactored fetchAttendances ---
  const fetchAttendances = useCallback(async (page = 1) => {
    if (!token) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    try {
      const res = await api.get(`/attendance?page=${page}&limit=${limit}`);

      const data = res.data;

      if (data.status === 200 && Array.isArray(data.attendances)) {
        setAttendances(data.attendances);
        setTotalPages(data.meta?.totalPages || 1);
        setTotalItems(data.meta?.totalItems || 0);
        setCurrentPage(page);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to parse data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, limit]); // Depends on token and limit

  // --- useEffect to get token and initial data ---
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('You are not authenticated.');
      setIsLoading(false);
      // Maybe redirect to login here
      router.push('/login');
      return;
    }
    setToken(storedToken);
  }, []);

  // --- useEffect to fetch data once token is set ---
  useEffect(() => {
    if (token) {
      fetchAttendances(1);
    }
  }, [token, fetchAttendances]);


  // --- useMemo to process data for search and sort ---
  const processedAttendances = useMemo(() => {
    let filteredData = [...attendances];

    // 1. Filter data based on search term
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(item =>
        (item.user.UserDatum.fullName || item.user.name).toLowerCase().includes(lowerSearch) ||
        item.Event.name.toLowerCase().includes(lowerSearch) ||
        formatDate(item.Event.date).toLowerCase().includes(lowerSearch) ||
        item.status.toLowerCase().includes(lowerSearch)
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

        if (sortConfig.key === 'Event.date') {
          comparison = new Date(aValue).getTime() - new Date(bValue).getTime();
        } else if (aValue > bValue) {
          comparison = 1;
        } else if (aValue < bValue) {
          comparison = -1;
        }

        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return filteredData;
  }, [attendances, searchTerm, sortConfig]);

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
  const handleOpenEditModal = (item: Attendance) => {
    setSelectedAttendance(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: Attendance) => {
    setSelectedAttendance(item);
    setIsDeleteModalOpen(true);
  };


  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl text-neutral-900">
          Attendances
        </h1>
        <button
          className="flex items-center gap-2 rounded-lg bg-primary-500 py-2.5 px-4 font-semibold text-body-md text-white shadow-md hover:bg-primary-600 transition-all hover:shadow-lg w-fit"
          onClick={() => setIsModalOpen(true)}
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New</span>
        </button>
      </div>
      {/* --- Top Bar: Search and Add Button --- */}
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

              {/* Sortable Headers */}
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('user.UserDatum.fullName')}
              >
                <div className="flex items-center justify-between">
                  Person {getSortIcon('user.UserDatum.fullName')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('Event.name')}
              >
                <div className="flex items-center justify-between">
                  Event Name {getSortIcon('Event.name')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('Event.date')}
              >
                <div className="flex items-center justify-between">
                  Date {getSortIcon('Event.date')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center justify-between">
                  Status {getSortIcon('status')}
                </div>
              </th>
              {/* --- NEW: Actions Header --- */}
              <th className="p-4">Actions</th>
            </tr>
          </thead>

          {/* Table Body: Conditional Rendering */}
          <tbody>
            {isLoading && (!attendances || attendances.length === 0) ? (
              // --- Loading State (only show if table is empty) ---
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-600">
                  Loading attendance data...
                </td>
              </tr>
            ) : error ? (
              // --- Error State ---
              <tr>
                <td colSpan={6} className="p-8 text-center text-error">
                  Error: {error}
                </td>
              </tr>
            ) : processedAttendances.length === 0 ? (
              // --- Empty State (different message based on context) ---
              <tr>
                <td colSpan={6} className="p-8 text-center text-neutral-600">
                  {searchTerm ? 'No results found matching your search.' : 'No attendance records found.'}
                </td>
              </tr>
            ) : (
              // --- Data State ---
              processedAttendances.map((item, index) => (
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

                  {/* Person (Photo + Name) */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      <Image
                        src={item.user.profileUrl}
                        alt={item.user.UserDatum.fullName || item.user.name}
                        width={40}
                        height={40}
                        className="rounded-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null; // prevent infinite loop
                          target.src = `https://placehold.co/40x40/DEDEDE/424242?text=${item.user.name.charAt(0)}`;
                        }}
                      />
                      <span className="font-semibold">
                        {item.user.UserDatum.fullName || item.user.name}
                      </span>
                    </div>
                  </td>

                  {/* Event Name */}
                  <td className="p-4">
                    {item.Event.name}
                  </td>

                  {/* Date - Now formatted! */}
                  <td className="p-4">
                    {formatDate(item.Event.date)}
                  </td>

                  {/* Status */}
                  <td className="p-4">
                    <StatusBadge status={item.status} />
                  </td>

                  {/* --- NEW: Actions Cell --- */}
                  <td className="p-4">
                    <div className="flex space-x-3">
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        title="Edit"
                        className="text-neutral-500 hover:text-primary-600 transition-colors"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(item)}
                        title="Delete"
                        className="text-neutral-500 hover:text-error transition-colors"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Control */}
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={fetchAttendances}
        limit={limit}
        onLimitChange={setLimit}
        totalItems={totalItems}
      />

      {/* --- Render Modals --- */}
      <AddAttendanceModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        token={token}
        onAttendanceAdded={() => fetchAttendances(currentPage)}
      />

      {/* --- NEW: Render Edit/Delete Modals --- */}
      {selectedAttendance && (
        <EditAttendanceModal
          isOpen={isEditModalOpen}
          onClose={() => {
            setIsEditModalOpen(false);
            setSelectedAttendance(null);
          }}
          token={token}
          onAttendanceUpdated={() => fetchAttendances(currentPage)}
          attendance={selectedAttendance}
        />
      )}

      {selectedAttendance && (
        <DeleteConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => {
            setIsDeleteModalOpen(false);
            setSelectedAttendance(null);
          }}
          token={token}
          onAttendanceDeleted={() => fetchAttendances(currentPage)}
          attendance={selectedAttendance}
        />
      )}
    </div>
  );
}