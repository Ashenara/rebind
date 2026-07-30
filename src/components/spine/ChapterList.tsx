import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Plus, ChevronDown, ArrowUpToLine, ArrowDownToLine, AlertTriangle } from 'lucide-react';
import type { Chapter, SourceBook } from '../../types';
import { detectSpineIssues } from '../../utils/sequenceDetector';
import { useVirtualizer } from '@tanstack/react-virtual';
import { ChapterListItem } from './ChapterListItem';
import type { ChapterWithVirtualProps } from './ChapterListItem';
import { SpineIssuesList } from './SpineIssuesList';
import { ExcludedChapterList } from './ExcludedChapterList';
import { ChapterListToolbar } from './ChapterListToolbar';

interface ChapterListProps {
 chapters: Chapter[];
 selectedChapterId: string | null;
 onSelectChapter: (id: string) => void;
 onUpdateChapter: (id: string, updatedFields: Partial<Chapter>) => void;
 onReorderChapters: (startIndex: number, endIndex: number) => void;
 onAddManualChapter: () => void;
 onDeleteChapter: (id: string) => void;
 onInsertChapterAt: (title: string, index: number) => void;
 onBulkRename: () => void;
 onAutoSequenceTitles: () => void;
 books: SourceBook[];
}

export const ChapterList: React.FC<ChapterListProps> = ({
 chapters,
 selectedChapterId,
 onSelectChapter,
 onUpdateChapter,
 onReorderChapters,
 onAddManualChapter,
 onDeleteChapter,
 onInsertChapterAt,
 onBulkRename,
 onAutoSequenceTitles,
 books,
}) => {
 const [searchTerm, setSearchTerm] = useState('');
 const [searchQuery, setSearchQuery] = useState('');
 const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
 const [currentIssueIndex, setCurrentIssueIndex] = useState(0);
 const [splitViewMode, setSplitViewMode] = useState<'none' | 'issues' | 'excluded'>('none');
 const [showBulkDropdown, setShowBulkDropdown] = useState(false);
 const [forceVirtualize, setForceVirtualize] = useState<boolean | null>(null);

 // Debounce search
 useEffect(() => {
 const timer = setTimeout(() => {
 setSearchQuery(searchTerm);
 }, 300);
 return () => clearTimeout(timer);
 }, [searchTerm]);

 // Scan spine sequence for gaps, duplicates, and out-of-order chapters
 const { issues, duplicateIds, outOfOrderIds } = useMemo(() => detectSpineIssues(chapters), [chapters]);

 // Auto-reset index if issues count changes
 useEffect(() => {
 setCurrentIssueIndex(0);
 }, [issues.length]);

 const handleJumpToIssue = (targetId?: string) => {
 if (!targetId && issues.length === 0) return;
 
 let finalTargetId = targetId;
 if (!finalTargetId) {
 const issue = issues[currentIssueIndex % issues.length];
 finalTargetId = issue.type === 'gap' ? issue.afterChapterId : issue.chapterId;
 setCurrentIssueIndex((prev) => (prev + 1) % issues.length);
 }

 if (finalTargetId) {
 const index = filteredChapters.findIndex(ch => ch.id === finalTargetId);
 if (index !== -1) {
 if (isVirtualized) {
 virtualizer1.scrollToIndex(index, { align: 'center' });
 } else {
 const element = document.getElementById(`chapter-${finalTargetId}`);
 element?.scrollIntoView({ behavior: 'smooth', block: 'center' });
 }

 // Add flash effect after a short delay
 setTimeout(() => {
 const element = document.getElementById(`chapter-${finalTargetId}`);
 if (element) {
 element.classList.add('ring-2', 'ring-white');
 setTimeout(() => element.classList.remove('ring-2', 'ring-white'), 1500);
 }
 }, 100);
 }
 }
 };

 // Move a chapter to a specific 1-based index position
 const handleMoveToPosition = (currentIndex: number, e: React.MouseEvent) => {
 e.stopPropagation();
 const currentPos = currentIndex + 1;
 const targetPosStr = prompt(
 `Enter target position for "${chapters[currentIndex].title}" (1 to ${chapters.length}):`,
 currentPos.toString()
 );
 if (targetPosStr === null) return;
 const targetPos = parseInt(targetPosStr, 10);
 if (isNaN(targetPos) || targetPos < 1 || targetPos > chapters.length) {
 alert(`Please enter a valid number between 1 and ${chapters.length}.`);
 return;
 }
 onReorderChapters(currentIndex, targetPos - 1);
 };

 // Get color for source books
 const getBookBadgeColor = (bookId: string | null) => {
 if (!bookId) return 'bg-zinc-800/80 text-zinc-300 border-zinc-700';
 const index = books.findIndex(b => b.id === bookId);
 const colors = [
 'bg-violet-500/15 text-zinc-300 border-zinc-500/30',
 'bg-pink-500/15 text-pink-300 border-pink-500/30',
 'bg-zinc-800 text-zinc-300 border-zinc-700',
 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
 'bg-indigo-500/15 text-indigo-300 border-indigo-500/30',
 ];
 return colors[index % colors.length];
 };

 // HTML5 Drag and Drop Handlers
 const handleDragStart = (e: React.DragEvent, index: number) => {
 setDraggedIndex(index);
 e.dataTransfer.effectAllowed = 'move';
 e.dataTransfer.setData('text/plain', index.toString());
 };

 const handleDragOver = (e: React.DragEvent, index: number) => {
 e.preventDefault();
 if (draggedIndex === null || draggedIndex === index) return;
 };

 const handleDrop = (e: React.DragEvent, index: number) => {
 e.preventDefault();
 if (draggedIndex === null || draggedIndex === index) return;
 onReorderChapters(draggedIndex, index);
 setDraggedIndex(null);
 };

 const handleMoveUp = (index: number, e: React.MouseEvent) => {
 e.stopPropagation();
 if (index > 0) {
 onReorderChapters(index, index - 1);
 }
 };

 const handleMoveDown = (index: number, e: React.MouseEvent) => {
 e.stopPropagation();
 if (index < chapters.length - 1) {
 onReorderChapters(index, index + 1);
 }
 };

 const handleToggleAll = (exclude: boolean) => {
 chapters.forEach(ch => {
 onUpdateChapter(ch.id, { exclude });
 });
 };

 const handleExcludeSmallChapters = () => {
 let count = 0;
 chapters.forEach(ch => {
 if (!ch.exclude) {
 const byteSize = new Blob([ch.originalContent]).size;
 if (byteSize < 1000) {
 onUpdateChapter(ch.id, { exclude: true });
 count++;
 }
 }
 });
 if (count > 0) {
 alert(`Auto-excluded ${count} chapters that were under 1000 bytes.`);
 } else {
 alert('No included chapters found under 1000 bytes.');
 }
 };

 const handleToggleVolumes = (excludeMode: boolean) => {
 let count = 0;
 chapters.forEach(ch => {
 if (ch.exclude !== excludeMode && /\b(volume|vol|jilid)\b/i.test(ch.title)) {
 onUpdateChapter(ch.id, { exclude: excludeMode });
 count++;
 }
 });
 if (count > 0) {
 alert(`${excludeMode ? 'Excluded' : 'Re-included'} ${count} volume chapters.`);
 } else {
 alert(`No volume chapters found to ${excludeMode ? 'exclude' : 'include'}.`);
 }
 };

 const filteredChapters = useMemo(() => {
 let currentPosition = 1;
 return chapters.map((ch, originalIndex) => {
 const position = ch.exclude ? null : currentPosition++;
 return {
 ...ch,
 originalIndex,
 position
 } as ChapterWithVirtualProps;
 }).filter(ch =>
 ch.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
 (ch.sourceBookTitle && ch.sourceBookTitle.toLowerCase().includes(searchQuery.toLowerCase()))
 );
 }, [chapters, searchQuery]);

 const isVirtualized = forceVirtualize !== null ? forceVirtualize : filteredChapters.length > 500;

 // Virtualization Refs & Hooks
 const listRef1 = useRef<HTMLDivElement>(null);

 // eslint-disable-next-line react-hooks/incompatible-library
 const virtualizer1 = useVirtualizer({
 count: filteredChapters.length,
 getScrollElement: () => listRef1.current,
 estimateSize: () => 64,
 overscan: 10,
 });

 // Reusable render for reconstructed spine pane
 const renderList = (
 listRef: React.RefObject<HTMLDivElement | null>,
 virtualizer: ReturnType<typeof useVirtualizer<HTMLDivElement, Element>>,
 listId: string
 ) => {
 return (
 <div
 ref={isVirtualized ? listRef : undefined}
 id={!isVirtualized ? listId : undefined}
 className="flex-1 overflow-y-auto overflow-x-hidden flex flex-col min-h-0 bg-transparent relative custom-scrollbar p-1"
 style={{ height: '100%' }}
 >
 {filteredChapters.length === 0 ? (
 <div className="text-center p-8 text-zinc-400">
 {searchQuery ? 'No chapters match your search.' : 'No chapters imported yet.'}
 </div>
 ) : isVirtualized ? (
 <div
 style={{
 height: `${virtualizer.getTotalSize()}px`,
 width: '100%',
 position: 'relative',
 }}
 >
 {virtualizer.getVirtualItems().map((virtualItem) => {
 const chapter = filteredChapters[virtualItem.index];
 const isSelected = selectedChapterId === chapter.id;
 const hasDuplicate = duplicateIds.has(chapter.id);
 const isOutOfOrder = outOfOrderIds.has(chapter.id);
 const gapIssue = issues.find(
 (issue) => issue.type === 'gap' && issue.afterChapterId === chapter.id
 );

 return (
 <ChapterListItem
 key={chapter.id}
 dataIndex={virtualItem.index}
 virtualMeasureRef={virtualizer.measureElement}
 style={{
 position: 'absolute',
 top: 0,
 left: 0,
 width: '100%',
 transform: `translateY(${virtualItem.start}px)`,
 paddingBottom: '8px'
 }}
 chapter={chapter}
 isSelected={isSelected}
 hasDuplicate={hasDuplicate}
 isOutOfOrder={isOutOfOrder}
 gapIssue={gapIssue}
 searchQuery={searchQuery}
 totalChapters={chapters.length}
 onSelectChapter={onSelectChapter}
 onUpdateChapter={onUpdateChapter}
 onDeleteChapter={onDeleteChapter}
 onInsertChapterAt={onInsertChapterAt}
 handleDragStart={handleDragStart}
 handleDragOver={handleDragOver}
 handleDrop={handleDrop}
 handleMoveUp={handleMoveUp}
 handleMoveDown={handleMoveDown}
 handleMoveToPosition={handleMoveToPosition}
 getBookBadgeColor={getBookBadgeColor}
 />
 );
 })}
 </div>
 ) : (
 <div className="flex flex-col gap-2 w-full pb-8">
 {filteredChapters.map((chapter) => {
 const isSelected = selectedChapterId === chapter.id;
 const hasDuplicate = duplicateIds.has(chapter.id);
 const isOutOfOrder = outOfOrderIds.has(chapter.id);
 const gapIssue = issues.find(
 (issue) => issue.type === 'gap' && issue.afterChapterId === chapter.id
 );

 return (
 <div key={`${listId}-${chapter.id}`} className="w-full relative pb-2">
 <ChapterListItem
 chapter={chapter}
 isSelected={isSelected}
 hasDuplicate={hasDuplicate}
 isOutOfOrder={isOutOfOrder}
 gapIssue={gapIssue}
 searchQuery={searchQuery}
 totalChapters={chapters.length}
 onSelectChapter={onSelectChapter}
 onUpdateChapter={onUpdateChapter}
 onDeleteChapter={onDeleteChapter}
 onInsertChapterAt={onInsertChapterAt}
 handleDragStart={handleDragStart}
 handleDragOver={handleDragOver}
 handleDrop={handleDrop}
 handleMoveUp={handleMoveUp}
 handleMoveDown={handleMoveDown}
 handleMoveToPosition={handleMoveToPosition}
 getBookBadgeColor={getBookBadgeColor}
 />
 </div>
 );
 })}
 </div>
 )}
 </div>
 );
 };


 return (
 <div className="h-full flex flex-col min-h-0 bg-transparent">
 <div className="p-3 flex items-center justify-between border-b border-zinc-800 shrink-0">
 <h2 className="text-sm font-semibold text-zinc-400 uppercase tracking-wider flex items-center gap-2 flex-wrap">
 <span>Reconstructed Spine</span>
 <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-300 text-center leading-tight shrink-0">
 {chapters.filter(c => !c.exclude).length} / {chapters.length} Active
 </span>
 </h2>
 <div className="flex items-center gap-2">
 <button
 onClick={() => setForceVirtualize(prev => prev === null ? !isVirtualized : !prev)}
 className={`px-2 py-1 text-[10px] rounded border transition-colors ${isVirtualized ? 'bg-zinc-700/50 text-zinc-300 border-zinc-500/30 hover:bg-zinc-600/50' : 'bg-zinc-800 text-zinc-400 border-zinc-700 hover:bg-zinc-700'}`}
 title="Toggle virtualization (improves performance for >500 chapters, but breaks drag-scroll)"
 >
 Virtualizer: {isVirtualized ? 'ON' : 'OFF'}
 </button>
 <button
 onClick={onAddManualChapter}
 className="justify-center font-semibold rounded-md cursor-pointer border border-transparent transition-colors duration-150 bg-zinc-100 text-zinc-900 hover:bg-white active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-1 px-3 text-xs flex items-center gap-1"
 >
 <Plus size={14} />
 Add Chapter
 </button>
 </div>
 </div>

 {/* Sequence Issues Summary Banner */}
 {issues.length > 0 && (
 <div className="mb-3 p-2.5 rounded-lg bg-amber-900/20 border border-amber-700/50 flex items-center justify-between text-xs text-amber-200">
 <div className="flex items-center gap-1.5 font-medium">
 <AlertTriangle size={14} className="text-amber-400" />
 <span>{issues.length} sequence {issues.length === 1 ? 'issue' : 'issues'} detected</span>
 </div>
 <button
 onClick={() => handleJumpToIssue()}
 className="justify-center font-semibold rounded-md duration-150 hover:border-amber-400 hover:text-amber-100 py-1 px-2 text-[10px] bg-amber-900/40 hover:bg-amber-800/60 border border-amber-700/50 text-amber-300 flex items-center gap-1 cursor-pointer transition-colors"
 >
 <ChevronDown size={12} />
 Jump to Next Issue
 </button>
 </div>
 )}

 {/* Toolbar */}
 <div className="p-3 pb-0 shrink-0 flex flex-col">
 <ChapterListToolbar
 searchTerm={searchTerm}
 setSearchTerm={setSearchTerm}
 showBulkDropdown={showBulkDropdown}
 setShowBulkDropdown={setShowBulkDropdown}
 handleToggleAll={handleToggleAll}
 handleToggleVolumes={handleToggleVolumes}
 handleExcludeSmallChapters={handleExcludeSmallChapters}
 onBulkRename={onBulkRename}
 onAutoSequenceTitles={onAutoSequenceTitles}
 splitViewMode={splitViewMode}
 setSplitViewMode={setSplitViewMode}
 />
 </div>

 {/* List Area */}
 <div className="flex-1 flex gap-2 min-h-0 overflow-hidden relative px-3 pb-3">
 {renderList(listRef1, virtualizer1, 'pane1')}
 {splitViewMode === 'issues' && (
 <SpineIssuesList 
 issues={issues} 
 chapters={chapters} 
 onInsertChapterAt={onInsertChapterAt} 
 onJumpToIssue={handleJumpToIssue} 
 />
 )}
 {splitViewMode === 'excluded' && (
 <ExcludedChapterList 
 chapters={chapters} 
 onUpdateChapter={onUpdateChapter} 
 onJumpToIssue={handleJumpToIssue} 
 />
 )}

 {/* Fast Scroll Buttons */}
 <div className="absolute bottom-6 right-6 flex flex-col gap-2 z-10">
 <button
 onClick={() => {
 if (isVirtualized) {
 virtualizer1.scrollToIndex(0);
 } else {
 document.getElementById('pane1')?.scrollTo({ top: 0, behavior: 'smooth' });
 }
 if (splitViewMode === 'issues') {
 document.getElementById('pane2')?.scrollTo({ top: 0, behavior: 'smooth' });
 } else if (splitViewMode === 'excluded') {
 document.getElementById('pane3')?.scrollTo({ top: 0, behavior: 'smooth' });
 }
 }}
 className="p-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded shadow border border-zinc-700 focus:outline-none opacity-50 hover:opacity-100 transition-opacity"
 title="Scroll to Top"
 >
 <ArrowUpToLine size={16} />
 </button>
 <button
 onClick={() => {
 if (isVirtualized) {
 const lastIndex = filteredChapters.length - 1;
 if (lastIndex >= 0) {
 virtualizer1.scrollToIndex(lastIndex);
 }
 } else {
 const pane1 = document.getElementById('pane1');
 if (pane1) pane1.scrollTo({ top: pane1.scrollHeight, behavior: 'smooth' });
 }
 if (splitViewMode === 'issues') {
 const pane2 = document.getElementById('pane2');
 if (pane2) pane2.scrollTo({ top: pane2.scrollHeight, behavior: 'smooth' });
 } else if (splitViewMode === 'excluded') {
 const pane3 = document.getElementById('pane3');
 if (pane3) pane3.scrollTo({ top: pane3.scrollHeight, behavior: 'smooth' });
 }
 }}
 className="p-2 bg-zinc-800 text-zinc-300 hover:bg-zinc-700 rounded shadow border border-zinc-700 focus:outline-none opacity-50 hover:opacity-100 transition-opacity"
 title="Scroll to Bottom"
 >
 <ArrowDownToLine size={16} />
 </button>
 </div>
 </div>
 </div>
 );
};
