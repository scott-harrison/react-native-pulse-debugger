import React from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';

interface DebuggerLayoutProps {
  isConnected: boolean;
}

export function DebuggerLayout({ isConnected }: DebuggerLayoutProps) {
  return (
    <div className="flex h-screen bg-gray-950 text-white overflow-hidden">
      <Sidebar isConnected={isConnected} />
      <main className="flex-1 overflow-hidden">
        <Outlet />
      </main>
    </div>
  );
}
