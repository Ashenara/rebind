import React from 'react';
import { Regex, Terminal, Sparkles, Trash2, ArrowRightLeft, Settings, Coffee } from 'lucide-react';
import type { ReconstructionSettings } from '../../types';

interface AppHeaderProps {
 settings: ReconstructionSettings;
 setShowRegexManager: React.Dispatch<React.SetStateAction<boolean>>;
 setShowReconstructionSettings: React.Dispatch<React.SetStateAction<boolean>>;
 isLogsMinimized: boolean;
 setIsLogsMinimized: React.Dispatch<React.SetStateAction<boolean>>;
 isSidebarMinimized: boolean;
 setIsSidebarMinimized: React.Dispatch<React.SetStateAction<boolean>>;
 handleExport: () => Promise<void>;
 handleClearAll: () => void;
 isProcessing: boolean;
 hasActiveChapters: boolean;
 hasBooks: boolean;
 swapPanels: boolean;
 setSwapPanels: React.Dispatch<React.SetStateAction<boolean>>;
 driveToken: string | null;
 onDriveLogin: () => void;
 onDriveLogout: () => void;
}

export const AppHeader: React.FC<AppHeaderProps> = ({
 settings,
 setShowRegexManager,
 setShowReconstructionSettings,
 isLogsMinimized,
 setIsLogsMinimized,
 isSidebarMinimized,
 setIsSidebarMinimized,
 handleExport,
 handleClearAll,
 isProcessing,
 hasActiveChapters,
 hasBooks,
 swapPanels,
 setSwapPanels,
 driveToken,
 onDriveLogin,
 onDriveLogout
}) => {
 return (
 <header className="shrink-0 h-14 flex items-center justify-between px-8 z-10 border-b border-zinc-700/80 bg-zinc-900/50">
 {/* App Title */}
 <div className="flex items-center gap-3">
 <h1 className="text-xl font-extrabold tracking-tight flex items-center gap-2">
 <span className="text-zinc-100">Ashenara ReBind</span>
 <span className="text-[9px] uppercase font-bold tracking-widest bg-zinc-800 text-zinc-300 px-1.5 py-0.5 rounded border border-zinc-700">
 EPUB 3
 </span>
 </h1>

 <div className="h-4 w-px bg-zinc-800 mx-2 hidden sm:block" />

 <a
  href="https://github.com/Ashenara/rebind"
  target="_blank"
  rel="noreferrer"
  className="p-1.5 bg-zinc-800/50 rounded-md hover:bg-zinc-800 text-zinc-400 hover:text-white border border-zinc-700/80 transition-colors flex items-center gap-1.5 text-xs"
  title="View on GitHub"
  >
  <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4" /><path d="M9 18c-4.51 2-5-2-7-2" /></svg>
  </a>

  <a
  href="https://ko-fi.com/ashenara"
  target="_blank"
  rel="noreferrer"
  className="p-1.5 bg-zinc-800/50 rounded-md hover:bg-rose-500/10 text-zinc-400 hover:text-rose-400 border border-zinc-700/80 hover:border-rose-500/50 transition-colors flex items-center gap-1.5 text-xs"
  title="Support me on Ko-Fi"
  >
  <Coffee size={14} />
  </a>

  <div className="h-4 w-px bg-zinc-800 mx-1" />

  {driveToken ? (
    <button
      onClick={onDriveLogout}
      className="py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20"
      title="Disconnect Google Drive Sync"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"/></svg>
      <span className="hidden xl:inline">Sync Active</span>
    </button>
  ) : (
    <button
      onClick={onDriveLogin}
      className="py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 bg-black/45 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
      title="Sign in to Google Drive to sync settings"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M21.35,11.1H12.18V13.83H18.69C18.36,17.64 15.19,19.27 12.19,19.27C8.36,19.27 5,16.25 5,12C5,7.9 8.2,4.73 12.2,4.73C15.29,4.73 17.1,6.7 17.1,6.7L19,4.72C19,4.72 16.56,2 12.1,2C6.42,2 2.03,6.8 2.03,12C2.03,17.05 6.16,22 12.25,22C17.6,22 21.5,18.33 21.5,12.91C21.5,11.76 21.35,11.1 21.35,11.1V11.1Z"/></svg>
      <span className="hidden xl:inline">Drive Sync</span>
    </button>
  )}

  <button
  onClick={() => setShowRegexManager(true)}
  className="justify-center cursor-pointer py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 bg-black/45 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
  title="Global Regex Cleaners"
  >
  <Regex size={14} /> <span className="hidden xl:inline">Regex Cleaners</span> ({settings.regexRules.length})
  </button>

  <button
  onClick={() => setShowReconstructionSettings(true)}
  className="justify-center cursor-pointer py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 bg-black/45 border border-zinc-800 text-zinc-300 hover:bg-zinc-800 hover:border-zinc-600"
  title="Reconstruction Settings"
  >
  <Settings size={14} /> <span className="hidden xl:inline">Settings</span>
  </button>
 </div>

 {/* Global Actions */}
 <div className="flex items-center gap-3">
  <button
    onClick={() => setSwapPanels(!swapPanels)}
    className={`p-1.5 rounded-md hover:bg-zinc-800 border transition-colors flex items-center gap-1.5 text-xs ${swapPanels ? 'bg-violet-600/20 text-violet-400 border-violet-500/30' : 'bg-zinc-800/50 text-zinc-400 border-zinc-700/80 hover:text-white'}`}
    title="Swap Spine and Preview Panels"
  >
    <ArrowRightLeft size={14} /> Swap
  </button>

  <button
    onClick={() => setIsLogsMinimized(!isLogsMinimized)}
    className={`p-1.5 rounded-md hover:bg-zinc-800 border transition-colors flex items-center gap-1.5 text-xs ${isLogsMinimized ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700/80 hover:text-white' : 'bg-zinc-700 text-white border-zinc-600'}`}
    title="Toggle Terminal / Log Console"
  >
    <Terminal size={14} /> Terminal
  </button>

  <button
    onClick={() => setIsSidebarMinimized(!isSidebarMinimized)}
    className={`p-1.5 rounded-md hover:bg-zinc-800 border transition-colors flex items-center gap-1.5 text-xs ${isSidebarMinimized ? 'bg-zinc-800/50 text-zinc-400 border-zinc-700/80 hover:text-white' : 'bg-zinc-700 text-white border-zinc-600'}`}
    title="Toggle Inspector Sidebar"
  >
    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="15" y1="3" x2="15" y2="21"/></svg> Sidebar
  </button>

 <div className="h-4 w-px bg-zinc-800 mx-1" />

  {hasBooks && (
    <button
      onClick={handleClearAll}
      className="p-1.5 bg-zinc-800/50 rounded-md hover:bg-rose-500/20 hover:text-rose-400 text-zinc-400 border border-zinc-700/80 hover:border-rose-500/30 transition-colors flex items-center gap-1.5 text-xs"
      title="Clear Workspace"
      disabled={isProcessing}
    >
      <Trash2 size={14} /> <span className="hidden lg:inline">Clear</span>
    </button>
  )}

  <button
    onClick={handleExport}
    disabled={isProcessing || !hasActiveChapters}
    className="py-1.5 px-3 bg-zinc-100 text-zinc-900 font-semibold rounded-md hover:bg-white border border-transparent disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-1.5 text-xs"
    title="Reconstruct and Export EPUB"
  >
    <Sparkles size={14} /> {isProcessing ? 'Exporting...' : 'Export EPUB'}
  </button>

  </div>
 </header>
 );
};
