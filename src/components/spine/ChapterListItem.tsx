import React from 'react';
import { GripVertical, ChevronUp, ChevronDown, Trash2, Plus, AlertTriangle, AlertCircle } from 'lucide-react';
import type { Chapter } from '../../types';

export interface ChapterWithVirtualProps extends Chapter {
 originalIndex: number;
 position: number | null;
}

interface ChapterListItemProps {
 chapter: ChapterWithVirtualProps;
 isSelected: boolean;
 hasDuplicate: boolean;
 isOutOfOrder: boolean;
 gapIssue?: { missingNumbers?: number[] };
 searchQuery: string;
 totalChapters: number;
 style?: React.CSSProperties;
 onSelectChapter: (id: string) => void;
 onUpdateChapter: (id: string, updatedFields: Partial<Chapter>) => void;
 onDeleteChapter: (id: string) => void;
 onInsertChapterAt: (title: string, index: number) => void;
 handleDragStart: (e: React.DragEvent, index: number) => void;
 handleDragOver: (e: React.DragEvent, index: number) => void;
 handleDrop: (e: React.DragEvent, index: number) => void;
 handleMoveUp: (index: number, e: React.MouseEvent) => void;
 handleMoveDown: (index: number, e: React.MouseEvent) => void;
 handleMoveToPosition: (currentIndex: number, e: React.MouseEvent) => void;
 getBookBadgeColor: (bookId: string | null) => string;
 virtualMeasureRef?: (node: Element | null) => void;
 dataIndex?: number;
}

export const ChapterListItem: React.FC<ChapterListItemProps> = ({
 chapter,
 isSelected,
 hasDuplicate,
 isOutOfOrder,
 gapIssue,
 searchQuery,
 totalChapters,
 style,
 onSelectChapter,
 onUpdateChapter,
 onDeleteChapter,
 onInsertChapterAt,
 handleDragStart,
 handleDragOver,
 handleDrop,
 handleMoveUp,
 handleMoveDown,
 handleMoveToPosition,
 getBookBadgeColor,
 virtualMeasureRef,
 dataIndex,
}) => {
  let wrapperClasses = 'border-zinc-800 hover:border-zinc-700 bg-zinc-900/40 hover:bg-zinc-800/50';
  if (isSelected) {
    wrapperClasses = 'border-zinc-500 bg-zinc-800/40 ring-1 ring-zinc-500/50';
  } else if (chapter.exclude) {
    wrapperClasses = 'opacity-40 border-zinc-800/50 bg-black border-dashed hover:border-zinc-700 hover:opacity-60';
  } else if (hasDuplicate) {
    wrapperClasses = 'border-rose-500/40 bg-rose-500/5 hover:border-rose-500/60 ring-1 ring-rose-500/20';
  } else if (isOutOfOrder) {
    wrapperClasses = 'border-amber-500/40 bg-amber-500/5 hover:border-amber-500/60 ring-1 ring-amber-500/20';
  }

  let badgeClasses = 'text-zinc-400 border-zinc-800 bg-zinc-800/50 hover:bg-violet-500/10 hover:border-zinc-500/30';
  if (chapter.exclude) {
    badgeClasses = 'text-zinc-600 border-zinc-800/50 bg-transparent';
  } else if (hasDuplicate) {
    badgeClasses = 'text-rose-400 border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 hover:border-rose-500/50';
  } else if (isOutOfOrder) {
    badgeClasses = 'text-amber-400 border-amber-500/30 bg-amber-500/10 hover:bg-amber-500/20 hover:border-amber-500/50';
  }

  let titleClasses = chapter.exclude ? 'text-zinc-500 line-through' : 'text-white';

  return (
  <div
  key={chapter.id}
  data-index={dataIndex}
  ref={virtualMeasureRef}
  style={style}
  >
  <div
  id={`chapter-${chapter.id}`}
  draggable
  onDragStart={(e) => handleDragStart(e, chapter.originalIndex)}
  onDragOver={(e) => handleDragOver(e, chapter.originalIndex)}
  onDrop={(e) => handleDrop(e, chapter.originalIndex)}
  onClick={() => onSelectChapter(chapter.id)}
  className={`rounded-md transition-colors duration-150 p-3 mx-1 flex items-center gap-3 cursor-pointer group select-none border ${wrapperClasses}`}
  >
 {/* Drag Handle */}
 <div className="text-zinc-600 group-hover:text-zinc-400 cursor-grab active:cursor-grabbing p-1">
 <GripVertical size={16} />
 </div>

 {/* Exclude Checkbox */}
 <div
 onClick={(e) => {
 e.stopPropagation();
 onUpdateChapter(chapter.id, { exclude: !chapter.exclude });
 }}
 className="p-1 rounded hover:bg-zinc-800/50"
 >
 <input
 type="checkbox"
 checked={!chapter.exclude}
 onChange={() => { }} // handled by onClick on wrapper
 className="accent-zinc-500 cursor-pointer"
 aria-label={`Include Chapter ${chapter.originalIndex + 1} in spine`}
 />
 </div>

 {/* Info & Title edit */}
 <div className="flex-1 flex flex-col gap-1 min-w-0" onClick={(e) => e.stopPropagation()}>
 <input
 type="text"
 value={chapter.title}
 onChange={(e) => onUpdateChapter(chapter.id, { title: e.target.value })}
 onClick={() => onSelectChapter(chapter.id)}
 className={`bg-transparent border-b border-transparent hover:border-zinc-700/80 focus:border-zinc-500 focus:outline-none text-sm font-medium w-full py-0.5 truncate ${titleClasses}`}
 aria-label={`Edit title for Chapter ${chapter.originalIndex + 1}`}
 />
 <div className="flex items-center gap-2 flex-wrap">
 <button
 onClick={(e) => handleMoveToPosition(chapter.originalIndex, e)}
 className={`text-[10px] px-1.5 py-0.5 rounded border cursor-pointer transition-all flex items-center gap-1 ${badgeClasses}`}
 title={
 hasDuplicate
 ? 'Duplicate chapter number detected (Click to change position)'
 : isOutOfOrder
 ? 'This chapter appears out of order (Click to change position)'
 : 'Change chapter position (Move to index)'
 }
 >
 {(hasDuplicate || isOutOfOrder) && <AlertCircle size={10} />}
 {chapter.position === null ? <span className="opacity-50">Ex</span> : `#${chapter.position}`}
 </button>
 <span className={`text-[9px] px-1.5 py-0.5 rounded border uppercase font-semibold tracking-wider truncate max-w-37.5 ${getBookBadgeColor(chapter.sourceBookId)}`}>
 {chapter.sourceBookTitle || 'Manual'}
 </span>
 </div>
 </div>

 {/* Action Buttons */}
 <div className="flex items-center gap-1 shrink-0">
 <button
 onClick={(e) => handleMoveUp(chapter.originalIndex, e)}
 disabled={chapter.originalIndex === 0}
 className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
 title="Move Up"
 >
 <ChevronUp size={16} />
 </button>
 <button
 onClick={(e) => handleMoveDown(chapter.originalIndex, e)}
 disabled={chapter.originalIndex === totalChapters - 1}
 className="p-1 text-zinc-400 hover:text-white disabled:opacity-30 disabled:hover:text-zinc-400"
 title="Move Down"
 >
 <ChevronDown size={16} />
 </button>
 <button
 onClick={(e) => {
 e.stopPropagation();
 onDeleteChapter(chapter.id);
 }}
 className="p-1 text-zinc-300 hover:text-rose-300 transition-colors"
 title="Delete Chapter"
 >
 <Trash2 size={15} />
 </button>
 </div>
 </div>

 {/* Inline Gap Warning Alert */}
 {gapIssue && gapIssue.missingNumbers && !searchQuery && (
 <div className="mx-2 my-1.5 py-2 px-3 rounded-lg bg-amber-500/5 border border-dashed border-zinc-700 text-zinc-300 text-xs flex items-center justify-between animate-pulse">
 <span className="font-medium flex items-center gap-1.5 truncate">
 <AlertTriangle size={13} className="text-zinc-400 shrink-0" />
 Missing: {gapIssue.missingNumbers.map((n: number) => `Chapter ${n}`).join(', ')}
 </span>
 <button
 onClick={(e) => {
 e.stopPropagation();
 const missingNum = gapIssue.missingNumbers![0];
 onInsertChapterAt(`Chapter ${missingNum}`, chapter.originalIndex + 1);
 }}
 className="justify-center font-semibold rounded-md transition-colors duration-150 hover:border-zinc-400 hover:text-zinc-100 py-1 px-2 text-[10px] bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700 text-zinc-200 flex items-center gap-1 cursor-pointer shrink-0 ml-2"
 >
 <Plus size={11} />
 Insert {gapIssue.missingNumbers[0]}
 </button>
 </div>
 )}
 </div>
 );
};
