'use client';

import React, { useState, useEffect, useCallback } from 'react';
import api from '@/lib/axios';
import { useRouter } from 'next/navigation';

// --- Data Structure ---
type Role = {
    id: number;
    name: string;
    createdAt: string;
    updatedAt: string;
};

// --- Helper function to format date ---
const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
        });
    } catch (error) {
        return dateString;
    }
};

// --- AddRoleModal Component ---
const AddRoleModal = ({
    isOpen,
    onClose,
    onRoleAdded
}: {
    isOpen: boolean,
    onClose: () => void,
    onRoleAdded: () => void
}) => {
    const [name, setName] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Role name is required.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await api.post('/role', { name });
            const data = res.data;

            if (data.status !== 201) {
                throw new Error(data.message || 'Failed to create role');
            }

            setSuccessMessage('Role created successfully!');
            onRoleAdded();
            setTimeout(() => {
                handleClose();
            }, 1000);
        } catch (err) {
            setError((err as Error).message);
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        setName('');
        setError(null);
        setSuccessMessage(null);
        setIsSubmitting(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h4 text-neutral-900">New Role</h2>
                    <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="roleName" className="block text-body-md font-semibold text-neutral-800 mb-2">
                            Role Name
                        </label>
                        <input
                            id="roleName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Enter role name"
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
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
                            {isSubmitting ? 'Creating...' : 'Create Role'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

// --- EditRoleModal Component ---
const EditRoleModal = ({
    isOpen,
    onClose,
    onRoleUpdated,
    role
}: {
    isOpen: boolean,
    onClose: () => void,
    onRoleUpdated: () => void,
    role: Role
}) => {
    const [name, setName] = useState(role.name);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [successMessage, setSuccessMessage] = useState<string | null>(null);

    useEffect(() => {
        setName(role.name);
    }, [role]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!name.trim()) {
            setError('Role name is required.');
            return;
        }

        setIsSubmitting(true);
        setError(null);
        setSuccessMessage(null);

        try {
            const res = await api.put(`/role/${role.id}`, { name });
            const data = res.data;

            if (data.status !== 200) {
                throw new Error(data.message || 'Failed to update role');
            }

            setSuccessMessage('Role updated successfully!');
            onRoleUpdated();
            setTimeout(() => {
                handleClose();
            }, 1000);
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-xl bg-white p-6 shadow-2xl">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-h4 text-neutral-900">Edit Role</h2>
                    <button onClick={handleClose} className="text-neutral-500 hover:text-neutral-800">
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="editRoleName" className="block text-body-md font-semibold text-neutral-800 mb-2">
                            Role Name
                        </label>
                        <input
                            id="editRoleName"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full rounded-lg border border-neutral-300 px-4 py-3 text-body-md text-neutral-800 placeholder-neutral-500 focus:border-primary-500 focus:ring-2 focus:ring-primary-200 outline-none transition-all"
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

// --- DeleteRoleModal Component ---
const DeleteRoleModal = ({
    isOpen,
    onClose,
    onRoleDeleted,
    role
}: {
    isOpen: boolean,
    onClose: () => void,
    onRoleDeleted: () => void,
    role: Role
}) => {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleDelete = async () => {
        setIsSubmitting(true);
        setError(null);

        try {
            const res = await api.delete(`/role/${role.id}`);
            const data = res.data;

            if (data.status !== 200) {
                throw new Error(data.message || 'Failed to delete role');
            }

            onRoleDeleted();
            handleClose();
        } catch (err) {
            setError((err as Error).message);
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
                    Are you sure you want to delete the role <strong className="text-neutral-900">"{role.name}"</strong>?
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

// --- Main Roles Page ---
export default function RolesPage() {
    const [roles, setRoles] = useState<Role[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
    const [selectedRole, setSelectedRole] = useState<Role | null>(null);

    const fetchRoles = useCallback(async () => {
        setError(null);
        try {
            const res = await api.get('/role');
            const data = res.data;

            if (data.status === 200 && Array.isArray(data.roles)) {
                setRoles(data.roles);
            } else {
                throw new Error(data.message || 'Failed to fetch roles');
            }
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchRoles();
    }, [fetchRoles]);

    const handleOpenEditModal = (role: Role) => {
        setSelectedRole(role);
        setIsEditModalOpen(true);
    };

    const handleOpenDeleteModal = (role: Role) => {
        setSelectedRole(role);
        setIsDeleteModalOpen(true);
    };

    return (
        <div>
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                <h1 className="text-4xl text-neutral-900">Role Management</h1>
                <button
                    className="w-fit flex items-center space-x-2 rounded-lg bg-primary-500 py-2 px-4 text-white font-semibold text-body-md shadow-sm hover:bg-primary-600 transition-all focus:outline-none focus:ring-2 focus:ring-primary-300"
                    onClick={() => setIsAddModalOpen(true)}
                >
                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>Add New Role</span>
                </button>
            </div>

            <div className="max-w-4xl mx-auto">
                {isLoading ? (
                    <div className="text-center text-neutral-600 py-12">
                        Loading roles...
                    </div>
                ) : error ? (
                    <div className="text-center text-error bg-error/10 p-6 rounded-lg">
                        Error: {error}
                    </div>
                ) : roles.length === 0 ? (
                    <div className="text-center text-neutral-600 py-12">
                        No roles found.
                    </div>
                ) : (
                    <div className="overflow-x-auto rounded-lg shadow-md border border-neutral-200">
                        <table className="w-full min-w-max text-left">
                            <thead className="border-b border-primary-200 bg-primary-50">
                                <tr className="text-body-sm font-semibold text-primary-800">
                                    <th scope="col" className="p-4">
                                        ID
                                    </th>
                                    <th scope="col" className="p-4">
                                        Name
                                    </th>
                                    <th scope="col" className="p-4">
                                        Created At
                                    </th>
                                    <th scope="col" className="p-4 text-right">
                                        Actions
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {roles.map((role, index) => (
                                    <tr
                                        key={role.id}
                                        className={`border-b border-neutral-200 text-body-md text-neutral-800 ${index % 2 === 0 ? 'bg-white' : 'bg-neutral-50'} hover:bg-neutral-100 transition-colors`}
                                    >
                                        <td className="p-4">
                                            {role.id}
                                        </td>
                                        <td className="p-4 font-medium">
                                            {role.name}
                                        </td>
                                        <td className="p-4 text-neutral-600">
                                            {formatDate(role.createdAt)}
                                        </td>
                                        <td className="p-4 text-right">
                                            <div className="flex space-x-3 justify-end">
                                                <button
                                                    onClick={() => handleOpenEditModal(role)}
                                                    title="Edit"
                                                    className="text-neutral-500 hover:text-primary-600 transition-colors"
                                                >
                                                    <svg className="h-5 w-5" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.536L16.732 3.732z" />
                                                    </svg>
                                                </button>
                                                <button
                                                    onClick={() => handleOpenDeleteModal(role)}
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            <AddRoleModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onRoleAdded={fetchRoles}
            />

            {selectedRole && (
                <EditRoleModal
                    isOpen={isEditModalOpen}
                    onClose={() => setIsEditModalOpen(false)}
                    onRoleUpdated={fetchRoles}
                    role={selectedRole}
                />
            )}

            {selectedRole && (
                <DeleteRoleModal
                    isOpen={isDeleteModalOpen}
                    onClose={() => setIsDeleteModalOpen(false)}
                    onRoleDeleted={fetchRoles}
                    role={selectedRole}
                />
            )}
        </div>
    );
}
