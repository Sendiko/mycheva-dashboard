'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';

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
  const [roles, setRoles] = useState<Role[]>([]);

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

  // Fetch divisions and roles when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [divisionRes, roleRes] = await Promise.all([
            api.get('/division'),
            api.get('/role')
          ]);

          console.log('DEBUG_DIV', divisionRes.data); if (divisionRes.data.status === 200) setDivisions(divisionRes.data.divisions);
          console.log('DEBUG_ROLE', roleRes.data); if (roleRes.data.status === 200) setRoles(roleRes.data.roles);

        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
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
      const res = await api.post('/register', {
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
          <div className="py-12 text-center text-neutral-600">Loading data...</div>
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
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
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
  const [roles, setRoles] = useState<Role[]>([]);

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

  // Fetch divisions and roles when modal opens
  useEffect(() => {
    if (isOpen && token) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [divisionRes, roleRes] = await Promise.all([
            api.get('/division'),
            api.get('/role')
          ]);

          if (divisionRes.data.status === 200) setDivisions(divisionRes.data.divisions);
          if (roleRes.data.status === 200) setRoles(roleRes.data.roles);

        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
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
      const res = await api.put(`/user/${user.id}`, body);

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
          <div className="py-12 text-center text-neutral-600">Loading data...</div>
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
                  className={`w-full rounded-lg border px-3 py-2 text-body-md outline-none bg-white ${isReadOnly ? 'bg-neutral-100 text-neutral-600 border-neutral-200 appearance-none' : 'border-neutral-300 focus:border-primary-500 focus:ring-1 focus:ring-primary-200'}`}
                >
                  <option value="" disabled>Select role</option>
                  {roles.map((role) => (
                    <option key={role.id} value={role.id}>
                      {role.name}
                    </option>
                  ))}
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
      const res = await api.delete(`/user/delete/${user.id}`);

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



// --- ImportUsersModal Component ---
const ImportUsersModal = ({
  isOpen,
  onClose,
  token,
  onUsersImported
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onUsersImported: () => void
}) => {
  const [file, setFile] = useState<File | null>(null);
  const [roleId, setRoleId] = useState('');
  const [roles, setRoles] = useState<Role[]>([]);
  const [divisions, setDivisions] = useState<Division[]>([]);

  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [progress, setProgress] = useState<{ current: number, total: number } | null>(null);
  const [logs, setLogs] = useState<string[]>([]);

  // Fetch roles and divisions
  useEffect(() => {
    if (isOpen && token) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          const [divisionRes, roleRes] = await Promise.all([
            api.get('/division'),
            api.get('/role')
          ]);

          if (divisionRes.data.status === 200) setDivisions(divisionRes.data.divisions);
          if (roleRes.data.status === 200) setRoles(roleRes.data.roles);

        } catch (err) {
          setError((err as Error).message);
        } finally {
          setIsLoading(false);
        }
      };
      fetchData();
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
        const headers = lines[0].split(',').map(h => h.trim());

        const result = [];
        for (let i = 1; i < lines.length; i++) {
          if (!lines[i].trim()) continue;

          // Simple CSV split handling quotes roughly if needed, but for now simple split
          // A better regex for splitting CSV lines handling quotes:
          const matches = lines[i].match(/(".*?"|[^",\s]+)(?=\s*,|\s*$)/g);
          // Fallback to simple split if regex fails or for simple cases
          const currentLine = lines[i].split(',');

          const obj: any = {};
          headers.forEach((header, index) => {
            // Clean up quotes if present
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

  const findDivisionId = (divisionName: string): number | null => {
    if (!divisionName) return null;
    // Normalize the input division name to lowercase
    const normalizedName = divisionName.trim().toLowerCase();

    // Find the division by comparing lowercased names
    const division = divisions.find(d => d.name.trim().toLowerCase() === normalizedName);

    return division ? division.id : null;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!file || !roleId) {
      setError('Please select a file and a role.');
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
        // CSV Headers: Timestamp, Akun Email Google, Username, Full Name, NIM, Email Telkom University, Fakultas, Jurusan/Prodi, DIVISI

        const name = row['Username'];
        const fullName = row['Full Name'];
        const nim = row['NIM'];
        const email = row['Email Telkom University']; // Fallback
        const faculty = row['Fakultas'];
        const major = row['Jurusan/Prodi'];
        const divisionName = row['DIVISI'];

        const divisionId = findDivisionId(divisionName);

        if (!name || !fullName || !nim || !email || !divisionId) {
          newLogs.push(`Row ${i + 2}: Skipped - Missing required fields or Division not found (${divisionName})`);
          failCount++;
          setProgress({ current: i + 1, total: parsedData.length });
          continue;
        }

        try {
          await api.post('/register', {
            name,
            fullName,
            nim,
            email,
            faculty,
            major,
            roleId: Number(roleId),
            password: nim, // Use NIM as password
            password_confirmation: nim,
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
        onUsersImported();
      }

    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setFile(null);
    setRoleId('');
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
          <h2 className="text-h4 text-neutral-900">Import Users from CSV</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading data...</div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">

            {/* Role Selection */}
            <div>
              <label htmlFor="import-role" className="block text-body-md font-semibold text-neutral-800 mb-1">
                Assign Role to All Users
              </label>
              <select
                id="import-role" value={roleId} onChange={(e) => setRoleId(e.target.value)}
                className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none bg-white"
              >
                <option value="" disabled>Select role</option>
                {roles.map((role) => (
                  <option key={role.id} value={role.id}>
                    {role.name}
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
                Expected columns: Username, Full Name, NIM, Email Telkom University, Fakultas, Jurusan/Prodi, DIVISI
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
                disabled={isSubmitting || !file || !roleId}
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
  const [isImportModalOpen, setIsImportModalOpen] = useState(false); // NEW: State for import modal
  const [editingUser, setEditingUser] = useState<User | null>(null); // For edit/view modal
  const [deletingUser, setDeletingUser] = useState<User | null>(null); // For delete modal
  const [isReadOnlyModal, setIsReadOnlyModal] = useState(false); // To differentiate edit from view


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
      // Get roleId from localStorage
      const storedRoleId = localStorage.getItem('roleId');

      // Build query string
      let queryString = 'detailed=true';
      if (storedRoleId === '7') {
        queryString += '&students=true';
      }

      const res = await api.get(`/user/all?${queryString}`);

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
    setEditingUser(item);
    setIsReadOnlyModal(false); // Set to false for editing
  };

  const handleOpenDeleteModal = (item: User) => {
    setDeletingUser(item);
  };

  // --- NEW: Handler for View Modal ---
  const handleOpenViewModal = (item: User) => {
    setEditingUser(item);
    setIsReadOnlyModal(true); // Set to true for viewing
  };


  return (
    <div>
      {/* --- Header & Actions --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl text-neutral-900">User Management</h1>
        </div>
        <div className="flex gap-3">
          {/* Import CSV Button */}
          <button
            onClick={() => setIsImportModalOpen(true)}
            className="flex items-center gap-2 rounded-lg border border-neutral-300 bg-white py-2.5 px-4 font-semibold text-body-md text-neutral-700 hover:bg-neutral-50 transition-all shadow-sm"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Import CSV
          </button>
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 rounded-lg bg-primary-500 py-2.5 px-4 font-semibold text-body-md text-white shadow-md hover:bg-primary-600 transition-all hover:shadow-lg"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add User
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="py-12 text-center text-neutral-600">Loading data...</div>
      ) : (
        <>
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
                  <th className="p-4 w-16">No</th>

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
                    <td colSpan={6} className="p-8 text-center text-neutral-600"> {/* Adjusted colSpan */}
                      Loading user data...
                    </td>
                  </tr>
                ) : error ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-error"> {/* Adjusted colSpan */}
                      Error: {error}
                    </td>
                  </tr>
                ) : processedUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-neutral-600"> {/* Adjusted colSpan */}
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
                      {/* Numbering */}
                      <td className="p-4">{index + 1}</td>

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
        </>
      )}

      {/* --- Modals --- */}
      <AddUserModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        token={token}
        onUserAdded={fetchUsers}
      />

      <ImportUsersModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        token={token}
        onUsersImported={fetchUsers}
      />

      {editingUser && (
        <EditUserModal
          isOpen={!!editingUser}
          onClose={() => {
            setEditingUser(null);
            setIsReadOnlyModal(false); // Reset read-only state on close
          }}
          token={token}
          onUserUpdated={fetchUsers}
          user={editingUser}
          isReadOnly={isReadOnlyModal}
        />
      )}

      {deletingUser && (
        <DeleteUserConfirmationModal
          isOpen={!!deletingUser}
          onClose={() => setDeletingUser(null)}
          token={token}
          onUserDeleted={fetchUsers}
          user={deletingUser}
        />
      )}
    </div>
  );
}
