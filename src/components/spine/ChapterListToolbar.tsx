import React from 'react';
import { Search, CheckSquare, Square, ChevronDown, Filter, Columns, BookOpen, Type } from 'lucide-react';

interface ChapterListToolbarProps {
 searchTerm: string;
 setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
 showBulkDropdown: boolean;
 setShowBulkDropdown: React.Dispatch<React.SetStateAction<boolean>>;
 handleToggleAll: (exclude: boolean) => void;
 handleToggleVolumes: (excludeMode: boolean) => void;
 handleExcludeSmallChapters: () => void;
 onBulkRename: () => void;
 onAutoSequenceTitles: () => void;
 splitViewMode: 'none' | 'issues' | 'excluded';
 setSplitViewMode: React.Dispatch<React.SetStateAction<'none' | 'issues' | 'excluded'>>;
}

export const ChapterListToolbar: React.FC<ChapterListToolbarProps> = ({
 searchTerm,
 setSearchTerm,
 showBulkDropdown,
 setShowBulkDropdown,
 handleToggleAll,
 handleToggleVolumes,
 handleExcludeSmallChapters,
 onBulkRename,
 onAutoSequenceTitles,
 splitViewMode,
 setSplitViewMode,
}) => {
 return (
 <div className="flex flex-col gap-3 mb-4 shrink-0">
 {/* Search */}
 <div className="relative">
 <Search className="absolute left-3 top-2.5 text-zinc-400" size={16} />
 <input
 type="text"
 placeholder="Search chapters by title..."
 value={searchTerm}
 onChange={(e) => setSearchTerm(e.target.value)}
 className="w-full px-3.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60 pl-9 py-2 text-xs"
 aria-label="Search chapters by title"
 />
 </div>

 {/* Action Buttons */}
 <div className="flex flex-wrap gap-2">
 <div
 className="relative flex-1 min-w-27.5"
 tabIndex={-1}
 onBlur={(e) => {
 // Close dropdown if clicking outside of this container
 if (!e.currentTarget.contains(e.relatedTarget as Node)) {
 setShowBulkDropdown(false);
 }
 }}
 >
 <button
 onClick={() => setShowBulkDropdown(!showBulkDropdown)}
 className="font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100 py-1.5 px-3 text-xs flex items-center gap-1.5 justify-center w-full"
 title="Bulk Include/Exclude Actions"
 >
 <CheckSquare size={14} className="text-zinc-300" />
 Bulk Actions
 <ChevronDown size={14} className="opacity-70 ml-0.5" />
 </button>

 {showBulkDropdown && (
 <div className="absolute top-full left-0 mt-1 w-48 bg-zinc-900 border border-zinc-700/80 rounded-lg shadow-xl p-1.5 z-50 flex flex-col gap-1">
 <button
 onClick={() => { handleToggleAll(false); setShowBulkDropdown(false); }}
 className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded flex items-center gap-2 transition-colors"
 >
 <CheckSquare size={14} className="text-zinc-300" /> Include All
 </button>
 <button
 onClick={() => { handleToggleAll(true); setShowBulkDropdown(false); }}
 className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded flex items-center gap-2 transition-colors"
 >
 <Square size={14} className="text-zinc-400" /> Exclude All
 </button>
 <button
 onClick={() => { handleToggleVolumes(false); setShowBulkDropdown(false); }}
 className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded flex items-center gap-2 transition-colors"
 >
 <BookOpen size={14} className="text-zinc-400" /> Include Vols
 </button>
 <button
 onClick={() => { handleToggleVolumes(true); setShowBulkDropdown(false); }}
 className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded flex items-center gap-2 transition-colors"
 >
 <BookOpen size={14} className="text-zinc-400" /> Exclude Vols
 </button>
 <button
 onClick={() => { onAutoSequenceTitles(); setShowBulkDropdown(false); }}
 className="w-full text-left px-2 py-1.5 text-xs text-zinc-300 hover:text-white hover:bg-zinc-800/50 rounded flex items-center gap-2 transition-colors mt-1 pt-1 border-t border-zinc-700/50"
 >
 <Type size={14} className="text-[#00F0FF]" /> Auto-Sequence Titles
 </button>
 </div>
 )}
 </div>
 <button
 onClick={onBulkRename}
 className="font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] py-1.5 px-3 text-xs flex items-center gap-1.5 justify-center flex-1 min-w-27.5"
 title="Auto-rename chapter titles using Regex"
 >
 <Search size={14} className="text-zinc-300" />
 Bulk Rename
 </button>
 <button
 onClick={handleExcludeSmallChapters}
 className="font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100 py-1.5 px-3 text-xs flex items-center gap-1.5 justify-center min-w-25"
 title="Exclude small/empty chapters (under 1000 bytes)"
 >
 <Filter size={14} className="text-zinc-300" />
 Exclude {'<'} 1KB
 </button>
 <button
 onClick={() => setSplitViewMode(splitViewMode === 'issues' ? 'none' : 'issues')}
 className={`font-semibold rounded-md cursor-pointer duration-150 py-1.5 px-3 text-xs flex items-center gap-1 flex-1 justify-center transition-all min-w-25 ${splitViewMode === 'issues' ? 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:bg-zinc-700' : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/80'}`}
 title="Toggle Split View to show detected spine issues side-by-side"
 >
 <Columns size={14} className={splitViewMode === 'issues' ? 'text-zinc-400' : 'text-zinc-400'} />
 Issues
 </button>
 <button
 onClick={() => setSplitViewMode(splitViewMode === 'excluded' ? 'none' : 'excluded')}
 className={`font-semibold rounded-md cursor-pointer duration-150 py-1.5 px-3 text-xs flex items-center gap-1 flex-1 justify-center transition-all min-w-25 ${splitViewMode === 'excluded' ? 'bg-zinc-800 text-zinc-300 border border-zinc-600 hover:bg-gray-500/30' : 'text-zinc-400 hover:text-white bg-zinc-800/50 hover:bg-zinc-800 border border-zinc-700/80'}`}
 title="Toggle Split View to show excluded chapters side-by-side"
 >
 <Columns size={14} className={splitViewMode === 'excluded' ? 'text-zinc-400' : 'text-zinc-400'} />
 Excluded
 </button>
 </div>
 </div>
 );
};
