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

// --- Define Types ---
type User = {
  id: number;
  name: string;
  profileUrl: string;
  UserDatum: {
    fullName: string;
    divisionId: number;
    Division: {
      id: number;
      name: string;
    }
  };
};

type Attendance = {
  id: number;
  status: string;
  user: { // included in raw attendance
    id: number;
    profileUrl: string;
    name: string;
    UserDatum?: {
      fullName: string;
    };
  };
};

type Event = {
  id: number;
  name: string;
  date: string;
  Division: {
    id: number;
    name: string;
  }
};

// Merged type for the table
type StudentAttendance = {
  user: User;
  attendance: Attendance | null;
};

type SortKey = 'user.UserDatum.fullName' | 'status';
type SortDirection = 'ascending' | 'descending';
type SortConfig = {
  key: SortKey | null;
  direction: SortDirection;
};


export default function AttendancesPage() {
  const router = useRouter();

  // --- State ---
  const [events, setEvents] = useState<Event[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [attendances, setAttendances] = useState<Attendance[]>([]);
  
  const [selectedEventId, setSelectedEventId] = useState<number | null>(null);
  
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingAction, setIsLoadingAction] = useState<number | null>(null); // To block row while saving
  const [error, setError] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // Auth/Role State
  const [token, setToken] = useState<string | null>(null);
  const [roleId, setRoleId] = useState<number | null>(null);
  const [userId, setUserId] = useState<number | null>(null);
  const [userDivisionId, setUserDivisionId] = useState<number | null>(null);

  // Pagination State
  const [currentPage, setCurrentPage] = useState(1);
  const [limit, setLimit] = useState(10);
  
  // --- Initialize Auth ---
  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (!storedToken) {
      setError('You are not authenticated.');
      setIsLoading(false);
      router.push('/login');
      return;
    }
    setToken(storedToken);
    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) setRoleId(parseInt(storedRoleId, 10));
    const storedUserId = localStorage.getItem('userId');
    if (storedUserId) setUserId(parseInt(storedUserId, 10));
  }, [router]);

  // --- Fetch Events & Users on Load ---
  const fetchInitialData = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      // Fetch Events
      const eventRes = await api.get('/event?limit=500');
      const eventData = eventRes.data;
      if (eventData.status === 200) {
        setEvents(eventData.events);
        if (eventData.events.length > 0 && !selectedEventId) {
          setSelectedEventId(eventData.events[0].id);
        }
      }

      // Fetch All Detailed Student Users
      const userRes = await api.get('/user/all?students=true&detailed=true&limit=500');
      const userData = userRes.data;
      if (userData.status === 200) {
        setUsers(userData.users);
      }
    } catch (err) {
      console.error("Failed to fetch initial data:", err);
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedEventId]);

  useEffect(() => {
    if (token) {
      fetchInitialData();
    }
  }, [token, fetchInitialData]);

  // --- Fetch user profile for division filtering (Admin/Teacher specific) ---
  useEffect(() => {
    if (token && userId && (roleId === 8 || roleId === 7)) {
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

  // --- Fetch Attendances when Event Selection Changes ---
  const fetchAttendances = useCallback(async () => {
    if (!token || !selectedEventId) {
      setAttendances([]);
      return;
    }
    
    setIsLoading(true);
    try {
      const res = await api.get(`/event/${selectedEventId}`);
      const data = res.data;

      if (data.status === 200 && data.event && Array.isArray(data.event.Attendances)) {
        setAttendances(data.event.Attendances);
        setError(null);
      } else {
        throw new Error(data.message || 'Failed to parse attendance data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, selectedEventId]);

  useEffect(() => {
    fetchAttendances();
  }, [fetchAttendances, selectedEventId]);

  // --- Compute Combined List (Users + Their Attendance) ---
  const combinedList = useMemo(() => {
    if (!selectedEventId || events.length === 0) return [];
    
    const currentEvent = events.find(e => e.id === selectedEventId);
    if (!currentEvent || !currentEvent.Division) return [];

    // Filter Users by the Event's Division
    // Note: Adjust property checks based on your actual nested objects
    let filteredUsers = users.filter(u => 
      u.UserDatum?.Division?.name === currentEvent.Division.name
    );

    // Filter by User's own division context if roleId allows it
    if ((roleId === 8 || roleId === 7) && userDivisionId) {
      filteredUsers = filteredUsers.filter(u => u.UserDatum?.divisionId === userDivisionId);
    }

    // Map each applicable user to the StudentAttendance object
    const mergedData: StudentAttendance[] = filteredUsers.map(user => {
      // Try to find if user has an attendance report already
      const userAttendance = attendances.find(att => att.user?.id === user.id);
      return {
        user,
        attendance: userAttendance || null,
      };
    });

    return mergedData;
  }, [selectedEventId, events, users, attendances, roleId, userDivisionId]);

  // --- Apply Search, Sort, and Pagination on Client ---
  const processedData = useMemo(() => {
    let data = [...combinedList];

    // Search
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      data = data.filter(item =>
        (item.user.UserDatum?.fullName || item.user.name).toLowerCase().includes(lowerSearch) ||
        (item.attendance?.status || 'not marked').toLowerCase().includes(lowerSearch)
      );
    }

    // Sort
    if (sortConfig.key) {
      data.sort((a, b) => {
        let aValue: string | null = null;
        let bValue: string | null = null;

        if (sortConfig.key === 'user.UserDatum.fullName') {
          aValue = a.user.UserDatum?.fullName || a.user.name;
          bValue = b.user.UserDatum?.fullName || b.user.name;
        } else if (sortConfig.key === 'status') {
          aValue = a.attendance?.status || 'not marked';
          bValue = b.attendance?.status || 'not marked';
        }

        if (aValue === null || aValue === undefined) return sortConfig.direction === 'ascending' ? -1 : 1;
        if (bValue === null || bValue === undefined) return sortConfig.direction === 'ascending' ? 1 : -1;

        const comparison = aValue > bValue ? 1 : aValue < bValue ? -1 : 0;
        return sortConfig.direction === 'ascending' ? comparison : -comparison;
      });
    }

    return data;
  }, [combinedList, searchTerm, sortConfig]);

  // Pagination bounds
  const filteredCount = processedData.length;
  const displayedTotalPages = Math.ceil(filteredCount / limit) || 1;
  const paginatedData = processedData.slice((currentPage - 1) * limit, currentPage * limit);

  // --- Handlers ---
  const requestSort = (key: SortKey) => {
    let direction: SortDirection = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const getSortIcon = (key: SortKey) => {
    if (sortConfig.key !== key) return <span className="text-neutral-400">↕</span>;
    if (sortConfig.direction === 'ascending') return <span className="text-primary-800">▲</span>;
    return <span className="text-primary-800">▼</span>;
  };

  const handleStatusChange = async (studentId: number, currentAttendance: Attendance | null, newStatus: string) => {
    setIsLoadingAction(studentId);
    setError(null);
    try {
      if (newStatus === '' || newStatus === 'not marked') {
        // Option "Not Marked" meaning we should delete attendance record if exists
        if (currentAttendance) {
          await api.delete(`/attendance/${currentAttendance.id}`);
        }
      } else if (currentAttendance) {
        // Update existing record
        await api.put(`/attendance/${currentAttendance.id}`, { status: newStatus });
      } else {
        // Create new record
        await api.post('/attendance', {
          userId: studentId,
          eventId: selectedEventId,
          status: newStatus
        });
      }
      
      // Update local state without waiting for a full fetch
      await fetchAttendances();
    } catch (err) {
      console.error("Update failed", err);
      // Fallback
      setError((err as Error).message || "Failed to update attendance");
    } finally {
      setIsLoadingAction(null);
    }
  };

  const selectedEvent = events.find(e => e.id === selectedEventId);

  return (
    <div>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <h1 className="text-4xl text-neutral-900">
          Attendances
        </h1>
      </div>

      {/* --- Top Bar: Event Selection & Search --- */}
      <div className="mb-4 flex flex-col md:flex-row gap-4">
        {/* Event Selector */}
        <div className="w-full md:w-1/3">
          <select
            value={selectedEventId || ''}
            onChange={(e) => {
              const id = Number(e.target.value);
              setSelectedEventId(id);
              setCurrentPage(1); // Reset page on event change
            }}
            className="w-full rounded-lg border border-neutral-300 px-4 py-2.5 text-body-md text-neutral-800 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          >
            <option value="" disabled>Select Event</option>
            {events.map(event => (
              <option key={event.id} value={event.id}>
                {event.name}
              </option>
            ))}
          </select>
        </div>

        {/* Search Bar */}
        <div className="relative w-full md:w-2/3">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <svg className="h-5 w-5 text-neutral-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </span>
          <input
            type="text"
            placeholder="Search by name, status..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-lg border border-neutral-300 py-2.5 pl-10 pr-4 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      {error && (
        <div className="mb-4 p-4 rounded-lg bg-error/10 text-error text-body-md border border-error/20">
          {error}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
        <table className="w-full min-w-max text-left">
          <thead className="border-b border-primary-200 bg-primary-50">
            <tr className="text-body-sm font-semibold text-primary-800">
              <th className="p-4">#</th>

              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('user.UserDatum.fullName')}
              >
                <div className="flex items-center justify-between">
                  Person {getSortIcon('user.UserDatum.fullName')}
                </div>
              </th>
              <th className="p-4">Event Name</th>
              <th className="p-4">Date</th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('status')}
              >
                <div className="flex items-center justify-between">
                  Status {getSortIcon('status')}
                </div>
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && combinedList.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600">
                  Loading attendance data...
                </td>
              </tr>
            ) : processedData.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600">
                  {searchTerm ? 'No results found matching your search.' : 'No students found for this event division.'}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => {
                const currentStatus = item.attendance?.status || '';
                const isSaving = isLoadingAction === item.user.id;

                // Colorize the dropdown background slightly based on status
                let selectClassName = 'w-[140px] rounded-lg border border-neutral-300 px-3 py-1.5 text-body-sm focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none outline-none transition-all disabled:opacity-50 cursor-pointer';
                if (currentStatus === 'present') selectClassName += ' bg-success/10 text-success border-success/30 font-semibold';
                else if (currentStatus === 'absent') selectClassName += ' bg-error/10 text-error border-error/30 font-semibold';
                else if (currentStatus === 'excused') selectClassName += ' bg-info/10 text-info border-info/30 font-semibold';
                else if (currentStatus === 'sick') selectClassName += ' bg-warning/10 text-warning border-warning/30 font-semibold';
                else selectClassName += ' bg-white text-neutral-700';

                return (
                  <tr
                    key={item.user.id}
                    className={`border-b border-neutral-200 text-body-md text-neutral-800 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} ${isSaving ? 'opacity-60' : ''}`}
                  >
                    <td className="p-4 font-medium text-neutral-500">
                      {(currentPage - 1) * limit + index + 1}
                    </td>

                    <td className="p-4">
                      <div className="flex items-center space-x-3">
                        <Image
                          src={item.user.profileUrl || `https://placehold.co/40x40/DEDEDE/424242?text=${item.user.name?.charAt(0) || 'U'}`}
                          alt={item.user.UserDatum?.fullName || item.user.name || 'User'}
                          width={40}
                          height={40}
                          className="rounded-full object-cover bg-neutral-200"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.onerror = null;
                            target.src = `https://placehold.co/40x40/DEDEDE/424242?text=${item.user.name?.charAt(0) || 'U'}`;
                          }}
                        />
                        <span className="font-semibold">
                          {item.user.UserDatum?.fullName || item.user.name}
                        </span>
                      </div>
                    </td>

                    <td className="p-4">
                      {selectedEvent?.name || 'N/A'}
                    </td>

                    <td className="p-4">
                      {formatDate(selectedEvent?.date || '')}
                    </td>

                    <td className="p-4">
                      <select
                        value={currentStatus}
                        onChange={(e) => handleStatusChange(item.user.id, item.attendance, e.target.value)}
                        disabled={isSaving}
                        className={selectClassName}
                      >
                        <option value="" className="text-neutral-700 font-normal">Not Marked</option>
                        <option value="present" className="text-neutral-700 font-normal">Present</option>
                        <option value="absent" className="text-neutral-700 font-normal">Absent</option>
                        <option value="excused" className="text-neutral-700 font-normal">Excused</option>
                        <option value="sick" className="text-neutral-700 font-normal">Sick</option>
                      </select>
                      {isSaving && <span className="ml-2 text-xs text-neutral-500">Saving...</span>}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <Pagination
        currentPage={currentPage}
        totalPages={displayedTotalPages}
        onPageChange={setCurrentPage}
        limit={limit}
        onLimitChange={setLimit}
        totalItems={filteredCount}
      />
    </div>
  );
}