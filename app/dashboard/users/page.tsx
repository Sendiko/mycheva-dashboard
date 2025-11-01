'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import axios from 'axios';
import Image from 'next/image'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.


// --- Define a type for the detailed user data ---
type User = {
  id: number;
  roleId: number;
  name: string; // Username
  profileUrl: string; // Actual profile picture URL
  Role: {
    name: string;
  };
  UserDatum: {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    faculty: string;
    major: string;
    divisionId: number;
    nim: string;
    imageUrl: string; // Fallback image? Use profileUrl instead maybe.
    Division: {
      name: string;
    };
  };
};

// --- Define a type for division data ---
type Division = {
  id: number;
  name: string;
};

type Role = {
  id: number;
  name: string;
};

// --- Define types for sorting ---
// --- Adjusted SortKey for the simplified table ---
type SortKey = 'UserDatum.fullName' | 'UserDatum.Division.name' | 'UserDatum.faculty' | 'Role.name';
type SortDirection = 'ascending' | 'descending';
type SortConfig = {
  key: SortKey | null;
  direction: SortDirection;
};

// --- Helper function to get nested values for sorting ---
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined ? acc[part] : null), obj);
};

// --- AddUserModal Component ---
const AddUserModal = ({
  isOpen,
  onClose,
  token,
  onUserAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onUserAdded: () => void
}) => {
  // Dropdown data state
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Form input state
  const [name, setName] = useState(''); // Username
  const [fullName, setFullName] = useState('');
  const [nim, setNim] = useState('');
  const [email, setEmail] = useState('');
  const [faculty, setFaculty] = useState('');
  const [major, setMajor] = useState('');
  const [roleId, setRoleId] = useState(''); // 1 for mentor, 2 for member
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
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
      const res = await axios.get('https://my-cheva-api.kakashispiritnews.my.id/division', {
        headers: { 'Authorization': `Bearer ${token}` }
          });
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
    setError(null);
    setSuccessMessage(null);

    // Basic Validation
    if (!name || !fullName || !nim || !email || !faculty || !major || !roleId || !password || !passwordConfirmation || !divisionId) {
      setError('All fields are required.');
      return;
    }
    if (password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await axios.post('https://my-cheva-api.kakashispiritnews.my.id/register', {
        name,
        fullName,
        nim,
        email,
        faculty,
        major,
        roleId: Number(roleId), // Ensure it's a number
        password,
        password_confirmation: passwordConfirmation,
        divisionId: Number(divisionId), // Ensure it's a number
      }, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = res.data;
      if (data.status !== 201) { // Check API status code
        // Try to get a more specific error message
        throw new Error(data.message || 'Failed to register user');
      }

      // Success
      setSuccessMessage('User registered successfully!');
      onUserAdded(); // Refresh the table

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
    setFullName('');
    setNim('');
    setEmail('');
    setFaculty('');
    setMajor('');
    setRoleId('');
    setPassword('');
    setPasswordConfirmation('');
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
          <h2 className="text-h4 text-neutral-900">Add New User</h2>
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
            {/* Username */}
            <div>
              <label htmlFor="user-name" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Username
              </label>
              <input
                id="user-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              />
            </div>
            {/* Full Name */}
            <div>
              <label htmlFor="user-fullname" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Full Name
              </label>
              <input
                id="user-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              />
            </div>
            {/* NIM */}
            <div>
              <label htmlFor="user-nim" className="block text-body-md font-semibold text-neutral-800 mb-1">
                NIM
              </label>
              <input
                id="user-nim" type="text" value={nim} onChange={(e) => setNim(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              />
            </div>
            {/* Email */}
            <div>
              <label htmlFor="user-email" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Email
              </label>
              <input
                id="user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              />
            </div>
            {/* Faculty & Major */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-faculty" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Faculty
                </label>
                <input
                  id="user-faculty" type="text" value={faculty} onChange={(e) => setFaculty(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
              <div>
                <label htmlFor="user-major" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Major
                </label>
                <input
                  id="user-major" type="text" value={major} onChange={(e) => setMajor(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
            </div>
            {/* Role & Division */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-role" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Role
                </label>
                <select
                  id="user-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none bg-white"
                >
                  <option value="" disabled>Select role</option>
                  <option value="1">Mentor</option>
                  <option value="2">Student</option>
                  <option value="3">Coordinator</option>
                  <option value="4">Core</option>
                </select>
              </div>
              <div>
                <label htmlFor="user-division" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Division
                </label>
                <select
                  id="user-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none bg-white"
                >
                  <option value="" disabled>Select division</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Password & Confirmation */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="user-password" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Password
                </label>
                <input
                  id="user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
              <div>
                <label htmlFor="user-password-confirm" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Confirm Password
                </label>
                <input
                  id="user-password-confirm" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
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
                {isSubmitting ? 'Registering...' : 'Register User'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- EditUserModal Component (MODIFIED for read-only view) ---
const EditUserModal = ({
  isOpen,
  onClose,
  token,
  onUserUpdated,
  user, // Pass the user data to edit
  isReadOnly = false // <-- NEW: Read-only prop
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onUserUpdated: () => void,
  user: User,
  isReadOnly?: boolean // <-- NEW: Prop type
}) => {
  // Dropdown data state
  const [divisions, setDivisions] = useState<Division[]>([]);

  // Form input state - Initialize with user data
  const [name, setName] = useState(user.name); // Username
  const [fullName, setFullName] = useState(user.UserDatum.fullName);
  const [nim, setNim] = useState(user.UserDatum.nim);
  const [email, setEmail] = useState(user.UserDatum.email);
  const [faculty, setFaculty] = useState(user.UserDatum.faculty);
  const [major, setMajor] = useState(user.UserDatum.major);
  const [roleId, setRoleId] = useState(user.roleId.toString());
  const [divisionId, setDivisionId] = useState(user.UserDatum.divisionId.toString());
  // Password fields are optional for edit, leave blank unless changing
  const [password, setPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');


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
          const res = await axios.get('https://my-cheva-api.kakashispiritnews.my.id/division', {
            headers: { 'Authorization': `Bearer ${token}` }
          });
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

  // Update form if the user prop changes
  useEffect(() => {
    if (user) {
      setName(user.name);
      setFullName(user.UserDatum.fullName);
      setNim(user.UserDatum.nim);
      setEmail(user.UserDatum.email);
      setFaculty(user.UserDatum.faculty);
      setMajor(user.UserDatum.major);
      setRoleId(user.roleId.toString());
      setDivisionId(user.UserDatum.divisionId.toString());
      setPassword(''); // Reset password fields on open
      setPasswordConfirmation('');
    }
  }, [user]);


  // Handle form submission for EDIT (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isReadOnly) return; // Don't submit if read-only

    setError(null);
    setSuccessMessage(null);

    // Basic Validation (Password optional, but if entered must match)
    if (!name || !fullName || !nim || !email || !faculty || !major || !roleId || !divisionId) {
      setError('All fields except password are required.');
      return;
    }
    if (password && password !== passwordConfirmation) {
      setError('Passwords do not match.');
      return;
    }

    setIsSubmitting(true);

    // Construct body - include password only if provided
    const body: any = {
      name,
      fullName,
      nim,
      email,
      faculty,
      major,
      roleId: Number(roleId),
      divisionId: Number(divisionId),
    };
    if (password) {
      body.password = password;
      body.password_confirmation = passwordConfirmation;
    }


    try {
      // API: PUT to /user/:id
      const res = await axios.put(`https://my-cheva-api.kakashispiritnews.my.id/user/${user.id}`, body, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        }
      });

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update user');
      }

      // Success
      setSuccessMessage('User updated successfully!');
      onUserUpdated(); // Refresh the table

      setTimeout(() => {
        handleClose(); // Close the modal
      }, 1500);

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // Reset form when closing
  const handleClose = () => {
    // No need to reset fields here, useEffect will handle it if opened again
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
          {/* --- NEW: Dynamic Title --- */}
          <h2 className="text-h4 text-neutral-900">{isReadOnly ? 'User Details' : 'Edit User'}</h2>
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
            {/* Fields are the same as AddUserModal, but pre-filled */}
            {/* Username */}
            <div>
              <label htmlFor="edit-user-name" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Username
              </label>
              <input
                id="edit-user-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                disabled={isReadOnly} // <-- NEW: Disable if read-only
                className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
              />
            </div>
            {/* Full Name */}
            <div>
              <label htmlFor="edit-user-fullname" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Full Name
              </label>
              <input
                id="edit-user-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                disabled={isReadOnly}
                className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
              />
            </div>
            {/* NIM */}
            <div>
              <label htmlFor="edit-user-nim" className="block text-body-md font-semibold text-neutral-800 mb-1">
                NIM
              </label>
              <input
                id="edit-user-nim" type="text" value={nim} onChange={(e) => setNim(e.target.value)}
                disabled={isReadOnly}
                className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
              />
            </div>
            {/* Email */}
            <div>
              <label htmlFor="edit-user-email" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Email
              </label>
              <input
                id="edit-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                disabled={isReadOnly}
                className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
              />
            </div>
            {/* Faculty & Major */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-user-faculty" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Faculty
                </label>
                <input
                  id="edit-user-faculty" type="text" value={faculty} onChange={(e) => setFaculty(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
                />
              </div>
              <div>
                <label htmlFor="edit-user-major" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Major
                </label>
                <input
                  id="edit-user-major" type="text" value={major} onChange={(e) => setMajor(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
                />
              </div>
            </div>
            {/* Role & Division */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label htmlFor="edit-user-role" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Role
                </label>
                <select
                  id="edit-user-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none bg-white ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200 appearance-none' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
                >
                  <option value="" disabled>Select role</option>
                  <option value="1">Mentor</option>
                  <option value="2">Student</option>
                  <option value="3">Coordinator</option>
                  <option value="4">Core</option>
                </select>
              </div>
              <div>
                <label htmlFor="edit-user-division" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Division
                </label>
                <select
                  id="edit-user-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
                  disabled={isReadOnly}
                  className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none bg-white ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200 appearance-none' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
                >
                  <option value="" disabled>Select division</option>
                  {divisions.map(division => (
                    <option key={division.id} value={division.id}>
                      {division.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            {/* Password & Confirmation (Optional, hide if read-only) */}
            {!isReadOnly && (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-password" className="block text-body-md font-semibold text-neutral-800 mb-1">
                    New Password (Optional)
                  </label>
                  <input
                    id="edit-user-password" type="password" value={password} onChange={(e) => setPassword(e.target.value)}
                    placeholder="Leave blank to keep current"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-password-confirm" className="block text-body-md font-semibold text-neutral-800 mb-1">
                    Confirm New Password
                  </label>
                  <input
                    id="edit-user-password-confirm" type="password" value={passwordConfirmation} onChange={(e) => setPasswordConfirmation(e.target.value)}
                    placeholder="Required if changing password"
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                  />
                </div>
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

            {/* Action Buttons (Conditional) */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={handleClose}
                disabled={isSubmitting}
                className="rounded-lg bg-neutral-200 py-2 px-4 font-semibold text-body-md text-neutral-800 hover:bg-neutral-300 transition-all disabled:opacity-50"
              >
                {isReadOnly ? 'Close' : 'Cancel'}
              </button>
              {!isReadOnly && ( // <-- NEW: Only show Save if not read-only
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 transition-all disabled:opacity-50"
                >
                  {isSubmitting ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </div>
          </form>
        )}
      </div>
    </div>
  );
};

// --- DeleteUserConfirmationModal Component ---
const DeleteUserConfirmationModal = ({
  isOpen,
  onClose,
  token,
  onUserDeleted,
  user,
}: {
  isOpen: boolean;
  onClose: () => void;
  token: string | null;
  onUserDeleted: () => void;
  user: User;
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Handle DELETE request
  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // API: DELETE to /user/delete/:id
      const res = await axios.delete(`https://my-cheva-api.kakashispiritnews.my.id/user/delete/${user.id}`, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = res.data;
      // Check for successful status (might be 200 or 204 No Content)
      if (data && data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to delete user');
      }

      // Success
      onUserDeleted(); // Refresh the table
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
          Are you sure you want to delete the user:
          <strong className="text-neutral-900"> "{user.UserDatum.fullName}"</strong>?
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
            {isSubmitting ? 'Deleting...' : 'Delete User'}
          </button>
        </div>
      </div>
    </div>
  );
};


export default function UserManagementPage() {
  // --- State for data, loading, and errors ---
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [token, setToken] = useState<string | null>(null);

  // --- State for Search and Sort ---
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'ascending' });

  // --- State for Modals ---
  const [isAddModalOpen, setIsAddModalOpen] = useState(false); // Renamed for clarity
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false); // <-- NEW: State for view modal
  const [selectedUser, setSelectedUser] = useState<User | null>(null);


  // --- Refactored fetchUsers ---
  const fetchUsers = useCallback(async () => {
    if (!token) {
      setError('You are not authenticated.');
      setIsLoading(false);
      return;
    }

    // Don't show loading on refresh
    // setIsLoading(true); 
    setError(null);
    try {
      const res = await axios.get('https://my-cheva-api.kakashispiritnews.my.id/user/all?detailed=true', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      const data = res.data;

      if (data.status === 200 && Array.isArray(data.users)) {
        setUsers(data.users);
      } else {
        throw new Error(data.message || 'Failed to parse user data');
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
  }, []);

  // --- useEffect to fetch data once token is set ---
  useEffect(() => {
    if (token) {
      fetchUsers();
    }
  }, [token, fetchUsers]);


  // --- useMemo to process data for search and sort ---
  const processedUsers = useMemo(() => {
    let filteredData = [...users];

    // 1. Filter data based on search term (searching across multiple fields)
    if (searchTerm) {
      const lowerSearch = searchTerm.toLowerCase();
      filteredData = filteredData.filter(user =>
        user.UserDatum.fullName.toLowerCase().includes(lowerSearch) ||
        // user.UserDatum.email.toLowerCase().includes(lowerSearch) || // Search only relevant columns
        user.UserDatum.Division.name.toLowerCase().includes(lowerSearch) ||
        // user.UserDatum.nim.toLowerCase().includes(lowerSearch) ||
        // user.UserDatum.major.toLowerCase().includes(lowerSearch) ||
        user.UserDatum.faculty.toLowerCase().includes(lowerSearch) ||
        user.Role.name.toLowerCase().includes(lowerSearch)
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

        // Handle nulls or undefined values
        if (aValue === null || aValue === undefined) comparison = -1;
        if (bValue === null || bValue === undefined) comparison = 1;

        // Basic string comparison (case-insensitive)
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
  }, [users, searchTerm, sortConfig]);

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
  const handleOpenEditModal = (item: User) => {
    setSelectedUser(item);
    setIsEditModalOpen(true);
  };

  const handleOpenDeleteModal = (item: User) => {
    setSelectedUser(item);
    setIsDeleteModalOpen(true);
  };

  // --- NEW: Handler for View Modal ---
  const handleOpenViewModal = (item: User) => {
    setSelectedUser(item);
    setIsViewModalOpen(true);
  };


  return (
    <div>
      {/* --- Top Bar: Header and Add Button --- */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-neutral-900">
          User Management
        </h1>
        <button
          className="flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={() => setIsAddModalOpen(true)} // <-- Use specific state
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add New User</span>
        </button>
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
            placeholder="Search by name, division, faculty..." // Updated placeholder
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full max-w-sm rounded-lg border border-neutral-300 py-2 pl-10 pr-4 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
        <table className="w-full min-w-max text-left">
          {/* --- MODIFIED: Table Header --- */}
          <thead className="border-b border-primary-200 bg-primary-50">
            <tr className="text-body-sm font-semibold text-primary-800">
              {/* <th className="p-4">#</th> */} {/* Removed # */}
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('UserDatum.fullName')}
              >
                <div className="flex items-center justify-between">
                  User {getSortIcon('UserDatum.fullName')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('Role.name')}
              >
                <div className="flex items-center justify-between">
                  Role {getSortIcon('Role.name')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('UserDatum.Division.name')}
              >
                <div className="flex items-center justify-between">
                  Division {getSortIcon('UserDatum.Division.name')}
                </div>
              </th>
              <th
                className="p-4 cursor-pointer hover:bg-primary-100 transition-colors"
                onClick={() => requestSort('UserDatum.faculty')}
              >
                <div className="flex items-center justify-between">
                  Faculty {getSortIcon('UserDatum.faculty')}
                </div>
              </th>
              {/* Removed Email, NIM, Major */}
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>

          {/* Table Body: Conditional Rendering */}
          <tbody>
            {isLoading && (!users || users.length === 0) ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600"> {/* Adjusted colSpan */}
                  Loading user data...
                </td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-error"> {/* Adjusted colSpan */}
                  Error: {error}
                </td>
              </tr>
            ) : processedUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600"> {/* Adjusted colSpan */}
                  {searchTerm ? 'No users found matching your search.' : 'No users found.'}
                </td>
              </tr>
            ) : (
              processedUsers.map((user, index) => (
                // --- NEW: Wrap row content in a div for click handling (excluding Actions) ---
                <tr
                  key={user.id}
                  className={`border-b border-neutral-200 text-body-md text-neutral-800 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-neutral-100 cursor-pointer`}
                  onClick={() => handleOpenViewModal(user)} // <-- Open view modal on row click
                >
                  {/* --- MODIFIED: Table Cells --- */}
                  {/* Name (with Profile Pic) */}
                  <td className="p-4">
                    <div className="flex items-center space-x-3">
                      {/* --- PREVIEW FIX --- */}
                      <Image
                        src={user.profileUrl || user.UserDatum.imageUrl}
                        alt={user.UserDatum.fullName}
                        width={40}
                        height={40}
                        className="rounded-full object-cover h-10 w-10"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.onerror = null;
                          target.src = `https://placehold.co/40x40/DEDEDE/424242?text=${user.UserDatum.fullName.charAt(0)}`;
                        }}
                      />
                      <span className="font-semibold">{user.UserDatum.fullName}</span>
                    </div>
                  </td>

                  {/* Role */}
                  <td className="p-4">{user.Role.name}</td>

                  {/* Division */}
                  <td className="p-4">{user.UserDatum.Division.name}</td>

                  {/* Faculty */}
                  <td className="p-4">{user.UserDatum.faculty}</td>

                  {/* Actions (Separate cell, stop propagation to prevent row click) */}
                  <td
                    className="p-4 text-right"
                    onClick={(e) => e.stopPropagation()} // <-- Prevent row click handler
                  >
                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => handleOpenEditModal(user)}
                        title="Edit"
                        className="text-neutral-500 hover:text-primary-600 transition-colors"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleOpenDeleteModal(user)}
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

      {/* --- Modals --- */}
      {/* Add User Modal */}
      <AddUserModal
        isOpen={isAddModalOpen} // Use specific state
        onClose={() => setIsAddModalOpen(false)}
        token={token}
        onUserAdded={fetchUsers}
      />

      {/* --- Render Edit/Delete/View Modals --- */}
      {selectedUser && (
        <EditUserModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          token={token}
          onUserUpdated={fetchUsers}
          user={selectedUser}
          isReadOnly={false} // Explicitly set read-only to false for editing
        />
      )}
      {/* --- NEW: Render EditUserModal for Viewing --- */}
      {selectedUser && (
        <EditUserModal
          isOpen={isViewModalOpen}
          onClose={() => setIsViewModalOpen(false)}
          token={token}
          onUserUpdated={() => { }} // No update needed for view
          user={selectedUser}
          isReadOnly={true} // <-- Set read-only to true for viewing
        />
      )}
      {selectedUser && (
        <DeleteUserConfirmationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          token={token}
          onUserDeleted={fetchUsers}
          user={selectedUser}
        />
      )}
    </div>
  );
}