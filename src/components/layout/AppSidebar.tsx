import React from 'react';
import { BookOpen } from 'lucide-react';
import { MetadataEditor } from '../editor/MetadataEditor';
import type { SourceBook, Chapter } from '../../types';

interface AppSidebarProps {
 sidebarWidth: number;
 books: SourceBook[];
 setBooks: React.Dispatch<React.SetStateAction<SourceBook[]>>;
 setChapters: React.Dispatch<React.SetStateAction<Chapter[]>>;
 addLog: (msg: string) => void;
 isProcessing: boolean;
 handleFilesSelected: (files: FileList) => Promise<void>;
 metadata: {
 title: string;
 author: string;
 language: string;
 publisher: string;
 description: string;
 };
 setMetadata: React.Dispatch<React.SetStateAction<{
 title: string;
 author: string;
 language: string;
 publisher: string;
 description: string;
 }>>;
 coverUrl: string | null;
 setCoverUrl: React.Dispatch<React.SetStateAction<string | null>>;
 extractedCovers: { bookId: string; bookTitle: string; coverUrl: string; }[];
}

export const AppSidebar: React.FC<AppSidebarProps> = ({
 sidebarWidth,
 books,
 setBooks,
 setChapters,
 addLog,
 isProcessing,
 handleFilesSelected,
 metadata,
 setMetadata,
 coverUrl,
 setCoverUrl,
 extractedCovers,
}) => {
 return (
  <aside
    className="border-l border-zinc-800 bg-[#09090b] flex flex-col min-h-0 shrink-0 transition-all duration-300"
    style={{ width: `${sidebarWidth}px` }}
  >
    {/* Sidebar Header */}
    <div className="p-3 border-b border-zinc-800 shrink-0 flex items-center justify-between">
      <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">Project Config</span>
    </div>

    {/* Sidebar Configurations (Scrollable) */}
    <div className="flex-1 overflow-y-auto p-5 flex flex-col gap-5 min-h-0">

 {/* Imported Source EPUB Summaries */}
 {books.length > 0 && (
 <div className="border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors duration-150 p-4 bg-zinc-950/25 flex flex-col gap-3">
 <span className="block text-[0.75rem] font-bold text-slate-500 mb-1.5 uppercase tracking-widest">Source Volumes ({books.length})</span>
 <div className="flex flex-col gap-2 max-h-35 overflow-y-auto pr-1">
 {books.map((book) => (
 <div
 key={book.id}
 className="flex items-center justify-between text-xs p-2 rounded bg-zinc-800/50 border border-zinc-800"
 >
 <div className="min-w-0 flex-1 mr-2">
 <p className="text-white font-medium truncate" title={book.title}>
 {book.title}
 </p>
 <p className="text-zinc-500 text-[10px] truncate">
 {book.chaptersCount} chapters • {book.author}
 </p>
 </div>
 <button
 onClick={() => {
 setBooks((prev) => prev.filter((b) => b.id !== book.id));
 setChapters((prev) => prev.filter((c) => c.sourceBookId !== book.id));
 addLog(`[System] Removed source book and chapters: ${book.title}`);
 }}
 className="text-zinc-300 hover:text-rose-300 text-[10px] font-bold p-1 transition-colors"
 title="Remove Book"
 >
 Delete
 </button>
 </div>
 ))}
 </div>

 {/* Sidebar file upload button to append more files */}
 <div>
 <button
 onClick={() => document.getElementById('sidebar-file-input')?.click()}
 className="font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100 py-1.5 px-3 text-xs w-full justify-center flex items-center gap-1.5"
 disabled={isProcessing}
 >
 <BookOpen size={13} />
 + Import More EPUBs
 </button>
 <input
 id="sidebar-file-input"
 type="file"
 multiple
 accept=".epub,application/epub+zip"
 onChange={(e) => {
 if (e.target.files && e.target.files.length > 0) {
 handleFilesSelected(e.target.files);
 }
 }}
 className="hidden"
 />
 </div>
 </div>
 )}

 {/* Metadata & Cleaner Controls */}
 <MetadataEditor
 metadata={metadata}
 onChangeMetadata={setMetadata}
 coverUrl={coverUrl}
 onChangeCover={setCoverUrl}
 extractedCovers={extractedCovers}
 />
 </div>
 </aside>
 );
};
