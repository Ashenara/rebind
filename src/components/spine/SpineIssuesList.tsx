import React from 'react';
import { CheckSquare, AlertTriangle, AlertCircle, Plus } from 'lucide-react';
import type { Chapter } from '../../types';
import type { SpineIssue } from '../../utils/sequenceDetector';

interface SpineIssuesListProps {
  issues: SpineIssue[];
 chapters: Chapter[];
 onInsertChapterAt: (title: string, index: number) => void;
 onJumpToIssue: (targetId: string | undefined) => void;
}

export const SpineIssuesList: React.FC<SpineIssuesListProps> = ({
 issues,
 chapters,
 onInsertChapterAt,
 onJumpToIssue
}) => {
 return (
 <div
 id="pane2"
 className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 bg-zinc-950/10 rounded-xl border border-zinc-800 relative custom-scrollbar p-1"
 style={{ height: '100%' }}
 >
 <div className="text-[10px] font-bold text-zinc-400/80 uppercase tracking-widest px-3 py-2 sticky top-0 bg-zinc-950/80 backdrop-blur z-10 border-b border-zinc-800 mb-1 flex justify-between items-center">
 <span>Detected Sequence Issues</span>
 <span className="text-zinc-400 font-normal">{issues.length} Issues</span>
 </div>

 {issues.length === 0 ? (
 <div className="text-center p-8 text-zinc-400 flex flex-col items-center justify-center h-full gap-3">
 <CheckSquare size={32} className="opacity-80" />
 <p className="text-sm font-medium">No sequence issues detected!<br /><span className="text-xs opacity-70">Your spine looks clean.</span></p>
 </div>
 ) : (
 <div className="flex flex-col gap-2 w-full pb-8">
 {issues.map((issue, idx) => {
 const targetId = issue.type === 'gap' ? issue.afterChapterId : issue.chapterId;
 const isGap = issue.type === 'gap';
 const isDuplicate = issue.type === 'duplicate_number';

 let wrapperClasses = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 ring-1 ring-amber-500/20';
 let iconClasses = 'text-amber-400';
 
 if (isDuplicate) {
   wrapperClasses = 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 ring-1 ring-rose-500/20';
   iconClasses = 'text-rose-400';
 } else if (isGap) {
   wrapperClasses = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 ring-1 ring-amber-500/20 border-dashed';
 }

 return (
 <div key={`issue-${idx}`} className="w-full relative pb-1 mx-1">
 <div
 onClick={() => onJumpToIssue(targetId)}
 className={`rounded-md transition-colors duration-150 p-3 flex items-center gap-3 cursor-pointer group select-none border ${wrapperClasses}`}
 >
 <div className={`shrink-0 ${iconClasses}`}>
 {isGap ? <AlertTriangle size={18} /> : <AlertCircle size={18} />}
 </div>
 <div className="flex-1 flex flex-col gap-1 min-w-0">
 <div className="text-sm font-medium text-gray-200">
 {issue.message}
 </div>
 <div className="text-[10px] text-zinc-400 flex items-center justify-between">
 <span className="opacity-0 group-hover:opacity-100 transition-opacity">Click to locate in spine</span>
 {isGap && issue.afterChapterId && (
 <button
 onClick={(e) => {
 e.stopPropagation();
 const afterIndex = chapters.findIndex(c => c.id === issue.afterChapterId);
 if (afterIndex !== -1 && issue.missingNumbers) {
 const missingNum = issue.missingNumbers[0];
 onInsertChapterAt(`Chapter ${missingNum}`, afterIndex + 1);
 }
 }}
 className="justify-center font-semibold rounded-md transition-colors duration-150 hover:border-amber-400 hover:text-amber-100 py-0.5 px-2 text-[10px] bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-200 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
 >
 <Plus size={10} />
 Insert {issue.missingNumbers?.[0]}
 </button>
 )}
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
