'use client'; // This layout needs to be a client component to use hooks

import React, { useState, useEffect } from 'react'; // <-- Import useState, useEffect
import Image from 'next/image'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import Link from 'next/link'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import { usePathname } from 'next/navigation'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import { useRouter } from 'next/navigation'; // <-- PREVIEW FIX: Commented out for the preview environment.


// --- Define ALL possible menu items ---
const allMenuItems = [
  { id: 'attendances', name: 'Attendances', href: '/dashboard/attendances', icon: '📅' },
  { id: 'announcements', name: 'Announcements', href: '/dashboard/announcements', icon: '📢' },
  { id: 'roadmap', name: 'Roadmap', href: '/dashboard/roadmap', icon: '🗺️' },
  { id: 'discussion', name: 'Discussion Forum', href: '/dashboard/forums', icon: '💬' },
  { id: 'meetings', name: 'Meetings', href: '/dashboard/meetings', icon: '🤝' },
  { id: 'users', name: 'User Management', href: '/dashboard/users', icon: '👥' },
  { id: 'roles', name: 'Roles', href: '/dashboard/roles', icon: '🛡️' },
  { id: 'divisions', name: 'Divisions', href: '/dashboard/divisions', icon: '🏢' },
  { id: 'profile', name: 'Profile', href: '/dashboard/profile', icon: '👤' },
];

// --- Function to determine visible items based on roleId ---
const getVisibleMenuItems = (roleId: number | null) => {
  if (roleId === null) return []; // No role, show nothing (or maybe just Profile?)

  switch (roleId) {
    case 7: // Mentor
      return allMenuItems.filter(item =>
        ['attendances', 'announcements', 'roadmap', 'discussion', 'meetings', 'profile', 'users'].includes(item.id)
      );
    case 8: // Student
      return allMenuItems.filter(item =>
        ['roadmap', 'discussion', 'meetings', 'profile'].includes(item.id)
      );
    case 1: // Core (Admin)
      return allMenuItems; // Show all (now includes divisions)
    default:
      return allMenuItems.filter(item =>
        ['announcements', 'roadmap', 'discussion', 'meetings', 'profile'].includes(item.id)
      ); // Unknown role
  }
};


// --- SidebarLink Component (with Preview Fixes) ---
const SidebarLink = ({
  href,
  children
}: {
  href: string,
  children: React.ReactNode
}) => {
  const pathname = usePathname(); // <-- PREVIEW FIX: Commented out.

  // --- PREVIEW FIX ---
  // const isActive = false; 
  const isActive = (href === '/dashboard' && pathname === href) ||
    (href !== '/dashboard' && pathname.startsWith(href));

  const baseClasses = 'flex items-center space-x-3 rounded-lg p-3 text-body-lg font-semibold transition-colors';
  const activeClasses = 'bg-primary-500 text-white';
  const inactiveClasses = 'text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900';

  return (
    // --- PREVIEW FIX --- (Replaced <Link> with <a>)
    <Link
      href={href}
      className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
    >
      {children}
    </Link>
  );
};

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname(); // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
  const [userRoleId, setUserRoleId] = useState<number | null>(null);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');

    router.push('/login');
  };

  // --- Get roleId from localStorage on mount ---
  useEffect(() => {
    // Verify authentication token first. If missing/empty, force redirect to /login.
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      // No token -> navigate to login
      router.push('/login');
      return; // stop further processing in this effect
    }

    const storedRoleId = localStorage.getItem('roleId');
    if (storedRoleId) {
      setUserRoleId(parseInt(storedRoleId, 10)); // Convert string to number
    } else {
      console.error("Role ID not found in localStorage.");
      // Optionally you could also redirect here, but token exists so let user see limited UI
    }

    setIsLoadingRole(false);
  }, []); // Empty dependency array means run once on mount

  // --- Filter menu items based on the fetched role ---
  const visibleMenuItems = getVisibleMenuItems(userRoleId);

  return (
    <div className="flex h-screen bg-neutral-100 font-sans overflow-hidden">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 z-20 bg-black/50 md:hidden transition-opacity"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out
          md:relative md:translate-x-0
          ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <div className="h-20 flex items-center justify-between px-4 border-b border-neutral-200">
            <Link className="flex items-center justify-center flex-1" href='/dashboard'>
              <Image src="/image/logo.png" alt="Logo" width={40} height={40} />
              <div className='m-1'></div>
              <span className="text-xl font-bold text-primary-500">MyCheva</span>
            </Link>
            {/* Close button for mobile */}
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="md:hidden p-2 text-neutral-500 hover:text-neutral-700"
            >
              ✕
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2 p-4 overflow-y-auto">
            {isLoadingRole ? (
              // Optional: Show a loading state while fetching role
              <div className="text-center text-neutral-500 py-4">Loading...</div>
            ) : (
              // Map over VISIBLE menu items
              visibleMenuItems.map((item) => (
                <SidebarLink key={item.name} href={item.href}>
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </SidebarLink>
              ))
            )}
          </nav>

          {/* Sidebar Footer (e.g., Logout) */}
          <div className="p-4 border-t border-neutral-200">
            <button onClick={handleLogout} className="w-full text-left flex items-center space-x-3 rounded-lg p-3 text-body-md font-semibold text-neutral-700 hover:bg-error hover:text-white transition-all duration-200">
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header */}
        <header className="md:hidden bg-white border-b border-neutral-200 p-4 flex items-center justify-between flex-shrink-0">
          <button
            onClick={() => setIsMobileMenuOpen(true)}
            className="p-2 -ml-2 text-neutral-700 hover:bg-neutral-100 rounded-lg"
          >
            <span className="text-xl">☰</span>
          </button>
          <span className="text-lg font-bold text-primary-500">MyCheva</span>
          <div className="w-8"></div> {/* Spacer for centering */}
        </header>

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8">
          {children}
        </div>
      </main>
    </div>
  );
}
