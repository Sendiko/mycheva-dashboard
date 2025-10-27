'use client'; // This layout needs to be a client component to use hooks

import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import React from 'react';
// import Image from 'next/image'; // Uncomment to add your logo

// Define the menu items
const menuItems = [
  { name: 'Attendances', href: '/dashboard/attendances', icon: '📅' }, // Placeholder icons
  { name: 'Announcements', href: '/dashboard/announcements', icon: '📢' },
  { name: 'Roadmap', href: '/dashboard/roadmap', icon: '🗺️' },
  { name: 'Discussion Forum', href: '/dashboard/discussion', icon: '💬' },
  { name: 'Profile', href: '/dashboard/profile', icon: '👤' },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname(); // Get the current URL path

  return (
    <div className="flex h-screen bg-neutral-100 font-sans">
      {/* Sidebar */}
      <aside className="w-64 flex-shrink-0 bg-white shadow-lg">
        <div className="h-full flex flex-col">
          {/* Logo Area */}
          <Link className="h-20 flex items-center justify-center border-b border-neutral-200" href='/dashboard'>
            <Image src="/image/logo.png" alt="Logo" width={40} height={40} />
            <div className='m-1'></div>
            <span className="text-xl font-bold text-primary-500">MyCheva</span>
          </Link>

          {/* Navigation Menu */}
          <nav className="flex-1 space-y-2 p-4">
            {menuItems.map((item) => {
              // Check if the current path starts with the item's href
              const isActive =
                item.href === '/dashboard'
                  ? pathname === item.href
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`
                    flex items-center space-x-3 rounded-lg p-3 text-body-md font-semibold 
                    transition-all duration-200
                    ${
                      isActive
                        ? 'bg-primary-500 text-white shadow-md' // Active state (your orange highlight)
                        : 'text-neutral-700 hover:bg-primary-100 hover:text-primary-600' // Inactive state
                    }
                  `}
                >
                  <span>{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>

          {/* Sidebar Footer (e.g., Logout) */}
          <div className="p-4 border-t border-neutral-200">
            <button className="w-full text-left flex items-center space-x-3 rounded-lg p-3 text-body-md font-semibold text-neutral-700 hover:bg-neutral-100">
              <span>🚪</span>
              <span>Logout</span>
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        {/* You could add a header bar here if needed */}
        {/* <header className="h-20 bg-white shadow-sm border-b border-neutral-200"></header> */}

        {/* Page content */}
        <div className="p-8">
          {children}
        </div>
      </main>
    </div>
  );
}