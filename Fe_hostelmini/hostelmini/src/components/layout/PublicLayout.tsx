import React from 'react';
import { Outlet } from 'react-router-dom';
import { PublicHeader } from './PublicHeader';
import { PublicFooter } from './PublicFooter';

export const PublicLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col bg-[#F7F5F0] text-stone-900 font-sans selection:bg-amber-400 selection:text-stone-950">
      {/* GLOBAL SHARED PUBLIC HEADER */}
      <PublicHeader />

      {/* PAGE OUTLET */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* GLOBAL SHARED PUBLIC FOOTER */}
      <PublicFooter />
    </div>
  );
};
