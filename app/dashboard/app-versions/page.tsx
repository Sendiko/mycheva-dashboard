'use client';

import React, { useState, useEffect } from 'react';
import api from '@/lib/axios';

// --- Type Definitions ---
type AppVersion = {
  id: number;
  iosVer: string;
  androidVer: string;
  createdAt: string;
  updatedAt: string;
};

// --- AddAppVersionModal Component ---
const AddAppVersionModal = ({
  isOpen,
  onClose,
  onVersionAdded
}: {
  isOpen: boolean,
  onClose: () => void,
  onVersionAdded: () => void
}) => {
  const [iosVer, setIosVer] = useState('');
  const [androidVer, setAndroidVer] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!iosVer || !androidVer) {
      setError('Both iOS and Android versions are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.post('/app-version', {
        iosVer,
        androidVer,
      });

      const data = res.data;
      if (data.status !== 201) {
        throw new Error(data.message || 'Failed to create app version');
      }

      setSuccessMessage('App version created successfully!');
      onVersionAdded();
      handleClose();
    } catch (err) {
      setError((err as Error).message);
      setIsSubmitting(false);
    }
  };

  const handleClose = () => {
    setIosVer('');
    setAndroidVer('');
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
          <h2 className="text-h4 text-neutral-900">Add App Version</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="ios-ver" className="block text-body-md font-semibold text-neutral-800 mb-1">
              iOS Version
            </label>
            <input
              id="ios-ver" type="text" value={iosVer} onChange={(e) => setIosVer(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              placeholder="e.g. 1.0.0-rc01"
            />
          </div>
          <div>
            <label htmlFor="android-ver" className="block text-body-md font-semibold text-neutral-800 mb-1">
              Android Version
            </label>
            <input
              id="android-ver" type="text" value={androidVer} onChange={(e) => setAndroidVer(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
              placeholder="e.g. 1.0.0-rc02"
            />
          </div>

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
              {isSubmitting ? 'Creating...' : 'Create Version'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// --- EditAppVersionModal Component ---
const EditAppVersionModal = ({
  isOpen,
  onClose,
  onVersionUpdated,
  version
}: {
  isOpen: boolean,
  onClose: () => void,
  onVersionUpdated: () => void,
  version: AppVersion
}) => {
  const [iosVer, setIosVer] = useState(version.iosVer);
  const [androidVer, setAndroidVer] = useState(version.androidVer);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    if (version) {
      setIosVer(version.iosVer);
      setAndroidVer(version.androidVer);
    }
  }, [version]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!iosVer || !androidVer) {
      setError('Both iOS and Android versions are required.');
      return;
    }

    setIsSubmitting(true);

    try {
      const res = await api.put(`/app-version/${version.id}`, {
        iosVer,
        androidVer,
      });

      const data = res.data;
      if (data.status !== 200) {
        throw new Error(data.message || 'Failed to update app version');
      }

      setSuccessMessage('App version updated successfully!');
      onVersionUpdated();
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
          <h2 className="text-h4 text-neutral-900">Edit App Version</h2>
          <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
            <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="edit-ios-ver" className="block text-body-md font-semibold text-neutral-800 mb-1">
              iOS Version
            </label>
            <input
              id="edit-ios-ver" type="text" value={iosVer} onChange={(e) => setIosVer(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
            />
          </div>
          <div>
            <label htmlFor="edit-android-ver" className="block text-body-md font-semibold text-neutral-800 mb-1">
              Android Version
            </label>
            <input
              id="edit-android-ver" type="text" value={androidVer} onChange={(e) => setAndroidVer(e.target.value)}
              className="w-full rounded-lg border border-neutral-300 px-3 py-2 text-body-md focus:border-primary-500 focus:ring-1 focus:ring-primary-200 outline-none"
            />
          </div>

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

// --- DeleteAppVersionModal Component ---
const DeleteAppVersionModal = ({
  isOpen,
  onClose,
  onVersionDeleted,
  version
}: {
  isOpen: boolean,
  onClose: () => void,
  onVersionDeleted: () => void,
  version: AppVersion
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const res = await api.delete(`/app-version/${version.id}`);
      const data = res.data;

      if (data && data.status && data.status !== 200) {
        throw new Error(data.message || 'Failed to delete app version');
      }

      onVersionDeleted();
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
          Are you sure you want to delete version <strong className="text-neutral-900">iOS: {version.iosVer}, Android: {version.androidVer}</strong>?
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
            {isSubmitting ? 'Deleting...' : 'Delete Version'}
          </button>
        </div>
      </div>
    </div>
  );
};

// --- Main Page Component ---
export default function AppVersionPage() {
  const [versions, setVersions] = useState<AppVersion[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedVersion, setSelectedVersion] = useState<AppVersion | null>(null);

  const fetchVersions = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await api.get('/app-version');
      if (res.data.status === 200) {
        setVersions(res.data.data);
      } else {
        throw new Error(res.data.message || 'Failed to fetch versions');
      }
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVersions();
  }, []);

  const handleEditClick = (version: AppVersion) => {
    setSelectedVersion(version);
    setIsEditModalOpen(true);
  };

  const handleDeleteClick = (version: AppVersion) => {
    setSelectedVersion(version);
    setIsDeleteModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-4xl text-neutral-900">App Versions</h1>
        </div>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="flex w-fit items-center space-x-2 rounded-lg bg-primary-500 px-4 py-2 font-semibold text-white shadow-sm hover:bg-primary-600 transition-all"
        >
          <span className="text-xl">+</span>
          <span>Add Version</span>
        </button>
      </div>

      {/* Error State */}
      {error && (
        <div className="rounded-lg bg-error/10 p-4 text-error">
          Error: {error}
        </div>
      )}

      {/* Table Container */}
      <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
        <table className="w-full min-w-max text-left">
          {/* Table Header */}
          <thead className="border-b border-primary-200 bg-primary-50">
            <tr className="text-body-sm font-semibold text-primary-800">
              <th className="p-4 w-16">No</th>
              <th className="p-4">iOS Version</th>
              <th className="p-4">Android Version</th>
              <th className="p-4">Created At</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          {/* Table Body */}
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600">
                  Loading versions...
                </td>
              </tr>
            ) : versions.length === 0 ? (
              <tr>
                <td colSpan={5} className="p-8 text-center text-neutral-600">
                  No app versions found.
                </td>
              </tr>
            ) : (
              versions.map((version, index) => (
                <tr
                  key={version.id}
                  className={`border-b border-neutral-200 text-body-md text-neutral-800 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-neutral-100 transition-colors`}
                >
                  <td className="p-4 text-neutral-900">
                    {index + 1}
                  </td>
                  <td className="p-4 text-neutral-900 font-medium">
                    {version.iosVer}
                  </td>
                  <td className="p-4 text-neutral-900 font-medium">
                    {version.androidVer}
                  </td>
                  <td className="p-4 text-body-sm text-neutral-500">
                    {new Date(version.createdAt).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    })}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex space-x-3 justify-end">
                      <button
                        onClick={() => handleEditClick(version)}
                        title="Edit"
                        className="text-neutral-500 hover:text-primary-600 transition-colors"
                      >
                        <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteClick(version)}
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

      {/* Modals */}
      <AddAppVersionModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onVersionAdded={fetchVersions}
      />
      {selectedVersion && (
        <>
          <EditAppVersionModal
            isOpen={isEditModalOpen}
            onClose={() => setIsEditModalOpen(false)}
            onVersionUpdated={fetchVersions}
            version={selectedVersion}
          />
          <DeleteAppVersionModal
            isOpen={isDeleteModalOpen}
            onClose={() => setIsDeleteModalOpen(false)}
            onVersionDeleted={fetchVersions}
            version={selectedVersion}
          />
        </>
      )}
    </div>
  );
}
