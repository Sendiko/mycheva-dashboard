'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import Image from 'next/image';

// --- Define a type for the detailed user data ---
type UserProfile = {
  id: number;
  roleId: number;
  name: string; // Username
  profileUrl: string; // Actual profile picture URL
  UserDatum: {
    id: number;
    userId: number;
    fullName: string;
    email: string;
    faculty: string;
    major: string;
    divisionId: number;
    nim: string;
    imageUrl: string;
    Division: {
      name: string;
    };
  };
  Role: {
    name: string;
  };
};

// --- NEW: Define a type for division data ---
type Division = {
  id: number;
  name: string;
};

// --- Helper Component for Profile Fields ---
const ProfileField = ({ label, value }: { label: string, value: string | undefined | null }) => {
  if (!value) return null;
  return (
    <div>
      <label className="block text-sm font-medium text-neutral-500">{label}</label>
      {/* --- FIX: Added break-words to prevent overflow --- */}
      <p className="mt-1 text-body-md font-semibold text-neutral-900 break-words">
        {value}
      </p>
    </div>
  );
};

// --- NEW: EditProfileModal Component ---
const EditProfileModal = ({
  isOpen,
  onClose,
  token,
  onProfileUpdated,
  user // Pass the user data to edit
}: {
  isOpen: boolean,
  onClose: () => void,
  token: string | null,
  onProfileUpdated: () => void,
  user: UserProfile
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
  // Photo upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState(false);

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
      // Reset photo selection when modal opens/changes
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  }, [user]);


  // Handle form submission for EDIT (PUT)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
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
      setSuccessMessage('Profile updated successfully!');
      onProfileUpdated(); // Refresh the profile data

      setTimeout(() => {
        handleClose(); // Close the modal
      }, 1500);

    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  // --- Photo upload handlers ---
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setSelectedFile(file);
    if (file) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }
  };

  useEffect(() => {
    // cleanup object URL when component unmounts or file changes
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handlePhotoUpload = async () => {
    if (!selectedFile || !token) {
      setError('No file selected or not authenticated.');
      return;
    }

    setIsUploadingPhoto(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const form = new FormData();
      form.append('photo', selectedFile);

      // Using POST to /change_profile/:id as requested (omit Content-Type so browser sets boundary)
      // Axios automatically sets Content-Type to multipart/form-data when data is FormData
      const res = await api.post(`/change_profile/${user.id}`, form, {
        headers: {
          'Content-Type': 'multipart/form-data', // Explicitly set if needed, but usually auto-detected
        },
      });

      const data = res.data;
      if (data.status !== 200) throw new Error(data.message || 'Failed to upload photo');

      setSuccessMessage('Profile photo uploaded successfully.');
      setSelectedFile(null);
      setPreviewUrl(null);
      onProfileUpdated();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsUploadingPhoto(false);
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
          <h2 className="text-h4 text-neutral-900">Edit Profile</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {isLoading ? (
          <div className="py-12 text-center text-neutral-600">Loading divisions...</div>
        ) : (
          <>
            {/* --- Photo upload block --- */}
            <div className="mb-4">
              <label className="block text-body-md font-semibold text-neutral-800 mb-2">Profile Photo</label>
              <div className="flex items-center space-x-4">
                <Image
                  src={user.profileUrl}
                  alt={user.UserDatum.fullName}
                  width={96}
                  height={96}
                  className="rounded-full object-cover h-24 w-24 border"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/96x96/DEDEDE/424242?text=${user.name.charAt(0)}`;
                  }}
                />

                <div className="flex-1">
                  <input type="file" accept="image/*" onChange={handleFileChange} className="block w-full text-sm text-neutral-700 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-primary-50 file:text-primary-700" />
                  <div className="flex items-center space-x-3 mt-3">
                    <button type="button" onClick={handlePhotoUpload} disabled={!selectedFile || isUploadingPhoto} className="rounded-lg bg-primary-500 py-2 px-4 font-semibold text-body-md text-white shadow-sm hover:bg-primary-600 disabled:opacity-50">
                      {isUploadingPhoto ? 'Uploading...' : 'Upload Photo'}
                    </button>
                    {selectedFile && <span className="text-sm text-neutral-600">{selectedFile.name}</span>}
                  </div>
                  {error && <p className="text-body-sm text-error mt-2">{error}</p>}
                  {successMessage && <p className="text-body-sm text-success mt-2">{successMessage}</p>}
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Username */}
              <div>
                <label htmlFor="edit-user-name" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Username
                </label>
                <input
                  id="edit-user-name" type="text" value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
              {/* Full Name */}
              <div>
                <label htmlFor="edit-user-fullname" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Full Name
                </label>
                <input
                  id="edit-user-fullname" type="text" value={fullName} onChange={(e) => setFullName(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
              {/* NIM */}
              <div>
                <label htmlFor="edit-user-nim" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  NIM
                </label>
                <input
                  id="edit-user-nim" type="text" value={nim} onChange={(e) => setNim(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                />
              </div>
              {/* Email */}
              <div>
                <label htmlFor="edit-user-email" className="block text-body-md font-semibold text-neutral-800 mb-1">
                  Email
                </label>
                <input
                  id="edit-user-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
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
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-major" className="block text-body-md font-semibold text-neutral-800 mb-1">
                    Major
                  </label>
                  <input
                    id="edit-user-major" type="text" value={major} onChange={(e) => setMajor(e.target.value)}
                    className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
                  />
                </div>
              </div>
              {/* Role & Division */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label htmlFor="edit-user-role" className="block text-body-md font-semibold text-neutral-800 mb-1">
                    Role
                  </label>
                  {/* Role is usually not editable by the user themselves, so we show it as disabled */}
                  <input
                    id="edit-user-role" type="text" value={user.Role.name} disabled
                    className="w-full rounded-lg border border-neutral-200 bg-neutral-100 px-3 py-2 text-body-md text-neutral-600 outline-none"
                  />
                </div>
                <div>
                  <label htmlFor="edit-user-division" className="block text-body-md font-semibold text-neutral-800 mb-1">
                    Division
                  </label>
                  <select
                    id="edit-user-division" value={divisionId} onChange={(e) => setDivisionId(e.target.value)}
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
              {/* Password & Confirmation (Optional) */}
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
          </>
        )}
      </div>
    </div>
  );
};


// --- Main Profile Page Component ---
export default function ProfilePage() {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Get token and user info from localStorage
  const [token, setToken] = useState<string | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  // --- NEW: State for modal ---
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Get token and user info on mount
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

  // --- Fetch user data ---
  const fetchProfile = useCallback(async () => {
    if (!token || !userId) {
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get(`/userdata/${userId}`);
      const data = res.data;
      if (data.status === 200 && data.user) {
        setProfile(data.user);
      } else {
        throw new Error(data.message || 'Failed to parse user data');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  }, [token, userId]);

  // Fetch data once token and userId are set
  useEffect(() => {
    if (token && userId) {
      fetchProfile();
    }
  }, [token, userId, fetchProfile]);

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl text-neutral-900">My Profile</h1>
        <button
          className="flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
          onClick={() => setIsEditModalOpen(true)} // <-- Hook up the modal
        >
          <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
          </svg>
          <span>Edit Profile</span>
        </button>
      </div>

      {/* --- Profile Content --- */}
      <div className="max-w-4xl mx-auto">
        {isLoading ? (
          <div className="text-center text-neutral-600 py-12">Loading profile...</div>
        ) : error ? (
          <div className="text-center text-error bg-error/10 p-6 rounded-lg">Error: {error}</div>
        ) : !profile ? (
          <div className="text-center text-neutral-600 py-12">Could not find profile data.</div>
        ) : (
          <div className="bg-white rounded-xl border border-neutral-200 shadow-sm overflow-hidden">

            {/* --- Profile Header --- */}
            <div className="p-6 md:p-8">
              <div className="flex flex-col md:flex-row items-center space-y-4 md:space-y-0 md:space-x-6">
                {/* Profile Picture */}
                <Image
                  src={profile.profileUrl}
                  alt={profile.UserDatum.fullName}
                  width={128}
                  height={128}
                  className="rounded-full object-cover h-24 w-24 md:h-32 md:w-32 border-4 border-primary-100"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://placehold.co/128x128/DEDEDE/424242?text=${profile.name.charAt(0)}`;
                  }}
                />


                {/* Name and Role */}
                <div className="text-center md:text-left">
                  <h2 className="text-h3 text-neutral-900 break-words">{profile.UserDatum.fullName}</h2>
                  <p className="text-body-lg text-neutral-600 mt-1 break-words">@{profile.name}</p>
                  <span className="mt-2 inline-block rounded-full bg-primary-100 px-3 py-1 text-sm font-semibold text-primary-700">
                    {profile.Role.name}
                  </span>
                </div>
              </div>
            </div>

            {/* --- Profile Details --- */}
            <div className="border-t border-neutral-200 p-6 md:p-8">
              <h3 className="text-h4 text-neutral-900 mb-6">User Information</h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <ProfileField label="Email Address" value={profile.UserDatum.email} />
                <ProfileField label="NIM" value={profile.UserDatum.nim} />
                <ProfileField label="Division" value={profile.UserDatum.Division.name} />
                <ProfileField label="Faculty" value={profile.UserDatum.faculty} />
                <ProfileField label="Major" value={profile.UserDatum.major} />
              </div>
            </div>

          </div>
        )}
      </div>

      {/* --- NEW: Render Edit Profile Modal --- */}
      {profile && (
        <EditProfileModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          token={token}
          onProfileUpdated={fetchProfile} // Pass the refresh function
          user={profile}
        />
      )}

    </div>
  );
}