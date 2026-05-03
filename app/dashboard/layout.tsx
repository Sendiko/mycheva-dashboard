'use client'; // This layout needs to be a client component to use hooks

import React, { useState, useEffect } from 'react'; // <-- Import useState, useEffect
import Image from 'next/image'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import Link from 'next/link'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import { usePathname } from 'next/navigation'; // <-- PREVIEW FIX: Commented out. Uncomment in your local project.
import { useRouter } from 'next/navigation'; // <-- PREVIEW FIX: Commented out for the preview environment.


import api from '@/lib/axios';

const iconMap: Record<string, string> = {
  attendances: '📅',
  announcements: '📢',
  roadmap: '🗺️',
  discussion: '💬',
  forums: '💬',
  meetings: '🤝',
  assignments: '📝',
  users: '👥',
  roles: '🛡️',
  divisions: '🏢',
  'app-versions': '📱',
  profile: '👤',
};

interface MenuItem {
  id: string;
  name: string;
  path: string;
}


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
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [isLoadingRole, setIsLoadingRole] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    // Clear all user data from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    localStorage.removeItem('roleId');
    localStorage.removeItem('role');

    router.push('/login');
  };

  // --- Get token and fetch menus on mount ---
  useEffect(() => {
    // Verify authentication token first. If missing/empty, force redirect to /login.
    const token = localStorage.getItem('token');
    if (!token || token.trim() === '') {
      // No token -> navigate to login
      router.push('/login');
      return; // stop further processing in this effect
    }

    api.get('/menus')
      .then((res) => {
        if (res.data.status === 200 && res.data.menus) {
          setMenus(res.data.menus);
        }
      })
      .catch((err) => {
        console.error("Failed to fetch menus", err);
      })
      .finally(() => {
        setIsLoadingRole(false);
      });
  }, [router]); 

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
              // Map over dynamic menu items
              <>
                {menus.map((item) => (
                  <SidebarLink key={item.id} href={item.path}>
                    <span>{iconMap[item.id] || '🔹'}</span>
                    <span>{item.name}</span>
                  </SidebarLink>
                ))}
                {/* Static Profile Menu Item */}
                <SidebarLink href="/dashboard/profile">
                  <span>{iconMap['profile']}</span>
                  <span>Profile</span>
                </SidebarLink>
              </>
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
