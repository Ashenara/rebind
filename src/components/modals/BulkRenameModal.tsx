import React, { useState, useMemo } from 'react';
import { X, Search, ArrowRight, CheckCircle2, Type } from 'lucide-react';
import type { Chapter } from '../../types';

interface BulkRenameModalProps {
  chapters: Chapter[];
  isOpen: boolean;
  onClose: () => void;
  onApply: (pattern: string, replacement: string) => void;
}

export const BulkRenameModal: React.FC<BulkRenameModalProps> = ({
  chapters,
  isOpen,
  onClose,
  onApply,
}) => {
  const [pattern, setPattern] = useState('');
  const [replacement, setReplacement] = useState('');

  const { matches, error } = useMemo(() => {
    if (!pattern.trim()) {
      return { matches: [], error: null };
    }

    try {
      const regex = new RegExp(pattern, 'g');
      const matched = chapters.map(ch => {
        // Test if it actually changes anything
        const newTitle = ch.title.replace(regex, replacement).trim();
        if (newTitle !== ch.title) {
          return {
            id: ch.id,
            oldTitle: ch.title,
            newTitle: newTitle
          };
        }
        return null;
      }).filter(Boolean) as { id: string, oldTitle: string, newTitle: string }[];
      
      return { matches: matched, error: null };
    } catch (e: any) {
      return { matches: [], error: e.message };
    }
  }, [pattern, replacement, chapters]);

  if (!isOpen) return null;

  const handleApply = () => {
    if (!error && pattern.trim()) {
      onApply(pattern, replacement);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div 
        className="bg-[#0f0f11] border border-zinc-800 rounded-xl shadow-2xl w-full max-w-2xl flex flex-col max-h-[85vh] animate-scale-up overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-[#151518]">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Type className="text-zinc-400" size={20} />
            Bulk Rename Chapters
          </h2>
          <button onClick={onClose} className="p-2 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 flex flex-col gap-6 overflow-y-auto custom-scrollbar flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Search Regex</label>
              <div className="relative">
                <Search size={16} className="absolute left-3 top-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={pattern}
                  onChange={(e) => setPattern(e.target.value)}
                  placeholder="e.g. Book \d+ - "
                  className="w-full bg-zinc-900/50 border border-zinc-700/80 rounded-lg px-3 pl-9 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all font-mono"
                  autoFocus
                />
              </div>
              {error && <span className="text-xs text-rose-400 mt-1">{error}</span>}
            </div>
            
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Replacement</label>
              <input
                type="text"
                value={replacement}
                onChange={(e) => setReplacement(e.target.value)}
                placeholder="(Leave empty to delete)"
                className="w-full bg-zinc-900/50 border border-zinc-700/80 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00F0FF] focus:ring-1 focus:ring-[#00F0FF] transition-all font-mono"
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 flex-1 min-h-[200px]">
            <div className="flex items-center justify-between">
              <label className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Live Preview</label>
              <span className="text-xs text-zinc-500">{matches.length} chapters will be affected</span>
            </div>
            
            <div className="bg-zinc-950 border border-zinc-800 rounded-lg overflow-hidden flex flex-col flex-1">
              {!pattern.trim() ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm p-8 text-center h-full">
                  Enter a regex pattern to see affected chapters here.
                </div>
              ) : matches.length === 0 ? (
                <div className="flex-1 flex items-center justify-center text-zinc-500 text-sm p-8 h-full">
                  No chapters match the given pattern.
                </div>
              ) : (
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 flex flex-col gap-1 max-h-[40vh]">
                  {matches.map(match => (
                    <div key={match.id} className="bg-zinc-900/40 border border-zinc-800/80 rounded px-3 py-2 text-xs flex flex-col gap-1 hover:border-zinc-700 transition-colors">
                      <div className="text-rose-400/80 line-through truncate opacity-70">
                        {match.oldTitle}
                      </div>
                      <div className="text-emerald-400 flex items-center gap-1.5 truncate">
                        <ArrowRight size={12} className="shrink-0 opacity-50" />
                        {match.newTitle}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-800 bg-[#151518]">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-300 hover:text-white transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleApply}
            disabled={!pattern.trim() || matches.length === 0 || !!error}
            className="flex items-center gap-2 px-5 py-2 text-sm font-semibold bg-white text-black hover:bg-zinc-200 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <CheckCircle2 size={16} />
            Rename {matches.length > 0 ? matches.length : ''} Chapters
          </button>
        </div>
      </div>
    </div>
  );
};
