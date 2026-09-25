import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { AITutorDrawer } from '../ai/AITutorDrawer';

export const AppLayout: React.FC = () => {
  const [isAITutorOpen, setIsAITutorOpen] = useState(false);

  return (
    <div className="flex h-screen bg-slate-950 text-slate-100 overflow-hidden font-sans">
      {/* Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopBar onOpenAITutor={() => setIsAITutorOpen(true)} />
        <main className="flex-1 overflow-y-auto p-6 md:p-8 bg-slate-950/90 relative">
          <Outlet />
        </main>
      </div>

      {/* Global AI Tutor Drawer */}
      <AITutorDrawer
        isOpen={isAITutorOpen}
        onClose={() => setIsAITutorOpen(false)}
      />
    </div>
  );
};
