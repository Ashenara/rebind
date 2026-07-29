import React from 'react';
import { CheckSquare, Square } from 'lucide-react';
import type { Chapter } from '../../types';

interface ExcludedChapterListProps {
 chapters: Chapter[];
 onUpdateChapter: (id: string, updatedFields: Partial<Chapter>) => void;
 onJumpToIssue: (targetId: string | undefined) => void;
}

export const ExcludedChapterList: React.FC<ExcludedChapterListProps> = ({
 chapters,
 onUpdateChapter,
 onJumpToIssue
}) => {
 const excludedChapters = chapters.filter(ch => ch.exclude);

 return (
 <div
 id="pane3"
 className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 bg-zinc-950/10 rounded-xl border border-zinc-800 relative custom-scrollbar p-1"
 style={{ height: '100%' }}
 >
 <div className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-3 py-2 sticky top-0 bg-zinc-950/80 backdrop-blur z-10 border-b border-zinc-800 mb-1 flex justify-between items-center">
 <span>Excluded Chapters</span>
 <span className="text-zinc-400 font-normal">{excludedChapters.length} Excluded</span>
 </div>

 {excludedChapters.length === 0 ? (
 <div className="text-center p-8 text-zinc-400 flex flex-col items-center justify-center h-full gap-3">
 <CheckSquare size={32} className="opacity-80" />
 <p className="text-sm font-medium">No excluded chapters!<br /><span className="text-xs opacity-70">Everything is included.</span></p>
 </div>
 ) : (
 <div className="flex flex-col gap-2 w-full pb-8">
 {excludedChapters.map((chapter) => {
 return (
 <div key={`excluded-${chapter.id}`} className="w-full relative pb-1 mx-1">
 <div
 onClick={() => onJumpToIssue(chapter.id)}
 className={`rounded-md hover:bg-zinc-800/50 duration-150 p-3 flex items-center gap-3 cursor-pointer group select-none transition-colors border border-zinc-700/80 bg-zinc-950/20 hover:border-zinc-600`}
 >
 <div className="shrink-0 text-white/50">
 <Square size={18} />
 </div>
 <div className="flex-1 flex flex-col gap-1 min-w-0">
 <div className="text-sm font-medium text-zinc-400">
 {chapter.title}
 </div>
 <div className="text-[10px] text-zinc-400 flex items-center justify-between">
 <span className="opacity-0 group-hover:opacity-100 transition-opacity">Click to locate</span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onUpdateChapter(chapter.id, { exclude: false });
 }}
 className="justify-center font-semibold rounded-md transition-colors duration-150 hover:border-zinc-400 hover:text-zinc-100 py-0.5 px-2 text-[10px] bg-zinc-700/50 hover:bg-zinc-600/50 border border-zinc-500/40 text-zinc-100 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
 >
 <CheckSquare size={10} />
 Include
 </button>
 </div>
 </div>
 </div>
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
};
