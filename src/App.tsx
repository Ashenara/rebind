import { useState, useEffect, startTransition, useCallback } from 'react';
import { Sparkles, CheckCircle2, List, FileText, Settings } from 'lucide-react';
import type { SourceBook, Chapter, ReconstructionSettings } from './types';
import { DropZone } from './components/layout/DropZone';
import { AppHeader } from './components/layout/AppHeader';
import { AppSidebar } from './components/layout/AppSidebar';
import { ChapterList } from './components/spine/ChapterList';
import { ChapterPreview } from './components/editor/ChapterPreview';
import { LogConsole } from './components/layout/LogConsole';
import { extractChapterTitle } from './utils/epubParser';
import { cleanChapterContent, applyRegexRules } from './utils/textCleaner';
import { generateEpub } from './utils/epubGenerator';
import { RegexManagerModal } from './components/modals/RegexManagerModal';
import { ReconstructionSettingsModal } from './components/modals/ReconstructionSettingsModal';
import { BulkRenameModal } from './components/modals/BulkRenameModal';
import { useGoogleLogin, googleLogout } from '@react-oauth/google';
import { fetchSettingsFromDrive, uploadSettingsToDrive } from './lib/driveSync';

declare global {
 interface Window {
 ezstandalone?: unknown;
 }
}

export default function App() {
 // Fix for Vite HMR sometimes leaving the body stuck in a scrolled state after overflow:hidden is applied
 useEffect(() => {
 document.documentElement.scrollTop = 0;
 document.body.scrollTop = 0;
 }, []);


 const [books, setBooks] = useState<SourceBook[]>([]);
 const [chapters, setChapters] = useState<Chapter[]>([]);
 const [selectedChapterId, setSelectedChapterId] = useState<string | null>(null);
 const [isProcessing, setIsProcessing] = useState(false);
 const [showSuccessOverlay, setShowSuccessOverlay] = useState(false);
 const [showRegexManager, setShowRegexManager] = useState(false);
 const [showReconstructionSettings, setShowReconstructionSettings] = useState(false);
 const [showBulkRenameModal, setShowBulkRenameModal] = useState(false);
 const [logs, setLogs] = useState<string[]>([]);

  // Resizable columns & collapsible panels states
  const [spineWidth, setSpineWidth] = useState(() => typeof window !== 'undefined' ? Math.min(450, Math.max(280, window.innerWidth * 0.28)) : 340);
  const [sidebarWidth, setSidebarWidth] = useState(320);
  const [isSidebarMinimized, setIsSidebarMinimized] = useState(() => typeof window !== 'undefined' ? window.innerWidth <= 1280 : false);
  const [isLogsMinimized, setIsLogsMinimized] = useState(false);
  const [swapPanels, setSwapPanels] = useState(false);

  // Mobile navigation state
  const [mobileTab, setMobileTab] = useState<'spine' | 'editor' | 'inspector'>('editor');

  // Google Drive Sync states
  const [driveToken, setDriveToken] = useState<string | null>(null);
  const [isSyncActive, setIsSyncActive] = useState(false);

  const handleSpineResizeStart = (e: React.MouseEvent) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = spineWidth;
  let rafId: number | null = null;

  const handleMouseMove = (moveEvent: MouseEvent) => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
  const deltaX = moveEvent.clientX - startX;
  const effectiveDelta = swapPanels ? -deltaX : deltaX;
  // Restrict width to between 240px and max screen width
  const newWidth = Math.max(240, Math.min(window.innerWidth - 100, startWidth + effectiveDelta));
  setSpineWidth(newWidth);
  });
  };

  const handleMouseUp = () => {
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  };

  const handleSidebarResizeStart = (e: React.MouseEvent) => {
  e.preventDefault();
  const startX = e.clientX;
  const startWidth = sidebarWidth;
  let rafId: number | null = null;

  const handleMouseMove = (moveEvent: MouseEvent) => {
  if (rafId) cancelAnimationFrame(rafId);
  rafId = requestAnimationFrame(() => {
  const deltaX = startX - moveEvent.clientX; // Invert because it's on the right
  const newWidth = Math.max(200, Math.min(600, startWidth + deltaX));
  setSidebarWidth(newWidth);
  });
  };

  const handleMouseUp = () => {
  if (rafId) cancelAnimationFrame(rafId);
  document.removeEventListener('mousemove', handleMouseMove);
  document.removeEventListener('mouseup', handleMouseUp);
  };

  document.addEventListener('mousemove', handleMouseMove);
  document.addEventListener('mouseup', handleMouseUp);
  };

 // Metadata state
 const [metadata, setMetadata] = useState({
 title: '',
 author: '',
 language: 'en',
 publisher: '',
 description: '',
 });

 const [coverUrl, setCoverUrl] = useState<string | null>(null);

 // Settings state
 const [settings, setSettings] = useState<ReconstructionSettings>(() => {
 try {
 const saved = localStorage.getItem('rebind_settings');
 if (saved) return JSON.parse(saved);
 } catch {
 console.warn('Failed to load settings from localStorage');
 }
 return {
 keepBold: true,
 keepItalic: true,
 keepUnderline: true,
 keepBrTags: true,
 regexRules: [],
 };
 });

  // Add a log message
  const addLog = useCallback((msg: string) => {
  setLogs((prev) => [...prev, msg]);
  }, []);

  // Google Drive Login handler
  const handleDriveLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      const token = tokenResponse.access_token;
      setDriveToken(token);
      setIsSyncActive(true);
      addLog('[System] Successfully authenticated with Google Drive.');
      
      const driveSettings = await fetchSettingsFromDrive(token);
      if (driveSettings) {
        setSettings(driveSettings);
        addLog('[System] Settings restored from Google Drive.');
      } else {
        // Upload initial settings if none found
        await uploadSettingsToDrive(token, settings);
      }
    },
    scope: 'https://www.googleapis.com/auth/drive.appdata',
    onError: () => addLog('[Error] Google Login Failed'),
  });

  const handleDriveLogout = () => {
    googleLogout();
    setDriveToken(null);
    setIsSyncActive(false);
    addLog('[System] Disconnected from Google Drive Sync.');
  };

  // Persist settings locally and to Drive
  useEffect(() => {
    localStorage.setItem('rebind_settings', JSON.stringify(settings));
    
    if (isSyncActive && driveToken) {
      const timeout = setTimeout(() => {
        uploadSettingsToDrive(driveToken, settings).catch(() => {
           // Silently fail or log
        });
      }, 1000); // 1-second debounce
      return () => clearTimeout(timeout);
    }
  }, [settings, isSyncActive, driveToken]);

  // Clear logs
  const handleClearLogs = () => {
  setLogs([]);
  };

 // Handle files upload
 const handleFilesSelected = async (files: FileList) => {
 setIsProcessing(true);
 addLog(`[System] Initializing extraction for ${files.length} files...`);

 const newBooks: SourceBook[] = [];
 let newChapters: Chapter[] = [];

 for (let i = 0; i < files.length; i++) {
 const file = files[i];
 try {
 addLog(`[Parser] Starting Web Worker for ${file.name}...`);

 // 1. Offload heavy JSZip extraction to Web Worker
 const result = await new Promise<{ book: SourceBook, rawChapters: { href: string, rawContent: string }[] }>((resolve, reject) => {
 const worker = new Worker(new URL('./workers/epubParser.worker.ts', import.meta.url), { type: 'module' });
 worker.onmessage = (e) => {
 if (e.data.success) {
 const { title, author, description, coverUrl, fileName, rawChapters } = e.data.data;
 const bookId = crypto.randomUUID();
 const book: SourceBook = {
 id: bookId,
 title,
 author,
 coverUrl,
 fileName,
 chaptersCount: rawChapters.length,
 description
 };
 resolve({ book, rawChapters });
 } else {
 reject(new Error(e.data.error));
 }
 worker.terminate();
 };
 worker.onerror = (e) => {
 reject(new Error(e.message));
 worker.terminate();
 };
 worker.postMessage({ file, id: '1' });
 });

 newBooks.push(result.book);
 addLog(`[System] Extracted ${result.rawChapters.length} raw chapters. Parsing DOM and filtering...`);

 // 2. Process DOM and cleanup on main thread with dynamic chunking
 const parser = new DOMParser();
 let validChapterCount = 1;
 const bookChapters: Chapter[] = [];

 const CHUNK_TIME_MS = 16; // 60 FPS budget
 let lastYieldTime = performance.now();

 for (let j = 0; j < result.rawChapters.length; j++) {
 const raw = result.rawChapters[j];

 // Yield to UI thread if we spent too much time in this chunk
 if (performance.now() - lastYieldTime > CHUNK_TIME_MS) {
 await new Promise(r => setTimeout(r, 0));
 lastYieldTime = performance.now();
 }

 const chapterDoc = parser.parseFromString(raw.rawContent, 'text/html');
 const extracted = extractChapterTitle(chapterDoc, raw.href, validChapterCount);

 const chapterTitle = extracted.title;
 const isJunk = extracted.isJunk;

 if (!isJunk) {
 validChapterCount++;
 }

 const bodyContent = chapterDoc.body ? chapterDoc.body.innerHTML : raw.rawContent;

 const chapter: Chapter = {
 id: `${result.book.id}-ch-${j}`,
 sourceBookId: result.book.id,
 sourceBookTitle: result.book.title,
 originalTitle: chapterTitle,
 title: chapterTitle,
 originalContent: bodyContent,
 cleanedContent: '',
 exclude: isJunk
 };

 // Pre-clean
 const stripped = cleanChapterContent(chapter.originalContent, settings, chapter.title);
 chapter.cleanedContent = applyRegexRules(stripped, settings.regexRules);

 bookChapters.push(chapter);
 }

 newChapters = [...newChapters, ...bookChapters];
 addLog(`[System] Successfully processed ${bookChapters.length} chapters from ${file.name}.`);
 } catch (err: unknown) {
 addLog(`[Error] Failed to parse ${file.name}: ${err instanceof Error ? err.message : String(err)}`);
 }
 }

 if (newBooks.length > 0) {
 setBooks((prev) => [...prev, ...newBooks]);
 setChapters((prev) => [...prev, ...newChapters]);

 // If metadata is empty, prefill from first imported book
 setMetadata((prev) => {
 if (!prev.title) {
 const firstBook = newBooks[0];
 addLog(`[System] Auto-setting metadata from first book: "${firstBook.title}"`);
 return {
 title: firstBook.title.replace(/\s*\(Reconstructed\)/gi, ''),
 author: firstBook.author,
 language: 'en',
 publisher: '',
 description: firstBook.description || `Merged edition containing chapters from ${newBooks.map(b => b.title).join(', ')}.`,
 };
 }
 return prev;
 });

 // Set cover from first book if no cover is selected
 if (!coverUrl) {
 const firstCover = newBooks.find((b) => b.coverUrl)?.coverUrl;
 if (firstCover) {
 setCoverUrl(firstCover);
 addLog('[System] Auto-selected cover from source book.');
 }
 }

 // Auto-select first chapter if nothing is selected
 if (newChapters.length > 0 && !selectedChapterId) {
 setSelectedChapterId(newChapters[0].id);
 }
 }

 setIsProcessing(false);
 addLog('[System] Import complete!');
 };

 // Reclean chapters when settings change
 const handleUpdateSettings = (newSettings: ReconstructionSettings) => {
 setSettings(newSettings);

 setChapters((prev) =>
 prev.map((ch) => {
 if (ch.sourceBookId === null) {
 // Manual chapters: keep content, only apply regex rules
 const filtered = applyRegexRules(ch.originalContent, newSettings.regexRules);
 return {
 ...ch,
 cleanedContent: filtered,
 };
 }

 // Imported chapters: tag-strip and run regex
 const stripped = cleanChapterContent(ch.originalContent, newSettings, ch.title);
 const filtered = applyRegexRules(stripped, newSettings.regexRules);
 return {
 ...ch,
 cleanedContent: filtered,
 };
 })
 );
 addLog('[System] Applied clean-up settings to all chapters.');
 };

 // Reclean trigger (used when preview rules pane forces it)
 const handleTriggerReclean = useCallback(() => {
 setChapters((prev) =>
 prev.map((ch) => {
 if (ch.sourceBookId === null) return ch;
 const stripped = cleanChapterContent(ch.originalContent, settings, ch.title);
 const filtered = applyRegexRules(stripped, settings.regexRules);
 return {
 ...ch,
 cleanedContent: filtered,
 };
 })
 );
 }, [settings]);

 // Update a single chapter's properties
 const handleUpdateChapter = useCallback((id: string, updatedFields: Partial<Chapter>) => {
 setChapters(prev => prev.map(ch => {
 if (ch.id === id) {
 // Invalidate cache if title changes
 if (updatedFields.title !== undefined && updatedFields.title !== ch.title) {
 return { ...ch, ...updatedFields, _cachedCandidateNumbers: undefined };
 }
 return { ...ch, ...updatedFields };
 }
 return ch;
 }));
 }, []);

 const handleReorderChapters = useCallback((startIndex: number, endIndex: number) => {
 startTransition(() => {
 setChapters(prev => {
 const result = Array.from(prev);
 const [removed] = result.splice(startIndex, 1);
 result.splice(endIndex, 0, removed);
 return result;
 });
 });
 }, []);

 // Delete chapter
 const handleDeleteChapter = (id: string) => {
 setChapters((prev) => prev.filter((ch) => ch.id !== id));
 if (selectedChapterId === id) {
 setSelectedChapterId(null);
 }
 addLog(`[System] Chapter deleted.`);
 };

 // Create manual chapter
 const handleAddManualChapter = () => {
 const newChapterId = `manual-ch-${Date.now()}`;
 const newChapter: Chapter = {
 id: newChapterId,
 sourceBookId: null,
 sourceBookTitle: null,
 originalTitle: 'New Chapter',
 title: 'New Chapter',
 originalContent: '<p>Write your content here...</p>',
 cleanedContent: '<p>Write your content here...</p>',
 exclude: false,
 };

 setChapters((prev) => {
 // Find selected index to insert directly after it
 const selectedIdx = prev.findIndex((c) => c.id === selectedChapterId);
 if (selectedIdx !== -1) {
 const copy = [...prev];
 copy.splice(selectedIdx + 1, 0, newChapter);
 return copy;
 }
 return [...prev, newChapter];
 });

 setSelectedChapterId(newChapterId);
 addLog(`[System] Inserted manual chapter.`);
 };

 // Insert a manual chapter at a specific 0-based index
 const handleInsertChapterAt = (title: string, index: number) => {
 const newChapterId = `manual-ch-${Date.now()}`;
 const newChapter: Chapter = {
 id: newChapterId,
 sourceBookId: null,
 sourceBookTitle: null,
 originalTitle: title,
 title: title,
 originalContent: '<p>Write your content here...</p>',
 cleanedContent: '<p>Write your content here...</p>',
 exclude: false,
 };

 setChapters((prev) => {
 const copy = [...prev];
 copy.splice(index, 0, newChapter);
 return copy;
 });
 setSelectedChapterId(newChapterId);
 addLog(`[System] Inserted empty chapter "${title}" at index ${index + 1}.`);
 };

  const handleBulkRename = (pattern: string, replacement: string) => {
    setChapters(prev => prev.map(ch => {
      try {
        const regex = new RegExp(pattern, 'g');
        const newTitle = ch.title.replace(regex, replacement).trim();
        if (newTitle !== ch.title) {
          return { ...ch, title: newTitle };
        }
      } catch (e) {}
      return ch;
    }));
  };

  const handleAutoSequenceTitles = () => {
    setChapters(prev => prev.map((ch, index) => ({ ...ch, title: `Chapter ${index + 1}` })));
  };

 // Clear workspace
 const handleClearAll = () => {
 if (window.confirm('Are you sure you want to clear your workspace? All imported chapters and manual edits will be lost.')) {
 setBooks([]);
 setChapters([]);
 setSelectedChapterId(null);
 setCoverUrl(null);
 setMetadata({
 title: '',
 author: '',
 language: 'en',
 publisher: '',
 description: '',
 });
 setLogs([]);
 addLog('[System] Workspace cleared.');
 }
 };

 // Reconstruct and export EPUB 3 file
 const handleExport = async () => {
 const activeChapters = chapters.filter((c) => !c.exclude);
 if (activeChapters.length === 0) {
 alert('Cannot export: No active chapters in spine. Make sure to check include checkboxes.');
 return;
 }
 if (!metadata.title.trim()) {
 alert('Cannot export: Book Title is required.');
 return;
 }

 setIsProcessing(true);
 try {
 const blob = await generateEpub(metadata, chapters, coverUrl, addLog);

 // Trigger browser download
 const downloadUrl = URL.createObjectURL(blob);
 const link = document.createElement('a');
 link.href = downloadUrl;

 const cleanTitle = metadata.title.trim().replace(/[/\\?%*:|"<>\s]+/g, '_');
 const lastChapterNum = activeChapters.length;
 link.download = `${cleanTitle}_c1-${lastChapterNum}.epub`;

 document.body.appendChild(link);
 link.click();
 document.body.removeChild(link);
 URL.revokeObjectURL(downloadUrl);

 addLog(`[System] EPUB export successful! File downloaded.`);
 setShowSuccessOverlay(true);
 } catch (err: unknown) {
 addLog(`[Error] Failed to reconstruct EPUB: ${err instanceof Error ? err.message : String(err)}`);
 alert(`Export failed: ${err instanceof Error ? err.message : String(err)}`);
 }
 setIsProcessing(false);
 };

 // Gather cover image objects for Metadata Editor
 const extractedCovers = books
 .filter((b) => b.coverUrl)
 .map((b) => ({
 bookId: b.id,
 bookTitle: b.title,
 coverUrl: b.coverUrl!,
 }));

 return (
 <div className="app-container animate-slide-up box-border w-full h-screen overflow-hidden flex flex-col bg-[#050505]">
 {/* SUCCESS FLOATING BOX */}
 {showSuccessOverlay && (
 <div className="fixed bottom-6 right-6 z-50 transition-all">
 <div className="bg-zinc-950/80 border rounded-lg hover:border-zinc-600 transition-colors duration-150 p-4 w-[320px] flex items-start gap-3 border-emerald-500/30" style={{ boxShadow: '0 10px 40px rgba(0,0,0,0.5)' }}>
 <CheckCircle2 size={20} className="text-zinc-400 shrink-0 mt-0.5" />
 <div className="flex-1 min-w-0 text-left">
 <h2 className="text-sm font-bold text-white mb-1">EPUB Export Success</h2>
 <p className="text-[11px] text-zinc-300 mb-3 leading-relaxed">
 Your EPUB 3 book has been reconstructed, cleaned, and downloaded successfully.
 </p>
 <div className="flex justify-end">
 <button
 onClick={() => setShowSuccessOverlay(false)}
 className="text-xs px-3 py-1 rounded bg-zinc-800/50 hover:bg-zinc-800 text-gray-200 transition-colors border border-zinc-700/80"
 >
 Dismiss
 </button>
 </div>
 </div>
 </div>
 </div>
 )}
      {/* TOPBAR */}
      <AppHeader
        settings={settings}
        setShowRegexManager={setShowRegexManager}
        setShowReconstructionSettings={setShowReconstructionSettings}
        isLogsMinimized={isLogsMinimized}
        setIsLogsMinimized={setIsLogsMinimized}
        isSidebarMinimized={isSidebarMinimized}
        setIsSidebarMinimized={setIsSidebarMinimized}
        handleExport={handleExport}
        handleClearAll={handleClearAll}
        isProcessing={isProcessing}
        hasActiveChapters={chapters.some((c) => !c.exclude)}
        hasBooks={books.length > 0}
        swapPanels={swapPanels}
        setSwapPanels={setSwapPanels}
        driveToken={driveToken}
        onDriveLogin={handleDriveLogin}
        onDriveLogout={handleDriveLogout}
      />

      {/* MAIN WRAPPER */}
      <div 
        className="flex-1 flex flex-col md:flex-row min-h-0 overflow-hidden bg-[#09090b]"
        style={{
          '--spine-width': `${spineWidth}px`,
          '--sidebar-width': `${sidebarWidth}px`
        } as React.CSSProperties}
      >
        
        {/* SWAP WRAPPER (Spine & Preview) */}
        <div className={`
          ${mobileTab === 'inspector' ? 'hidden' : 'flex'} md:flex
          flex-1 min-h-0 overflow-hidden ${swapPanels ? 'md:flex-row-reverse' : 'md:flex-row'}
        `}>
          {/* LEFT SIDEBAR (Explorer / Spine) */}
          <div
            className={`
              ${mobileTab === 'spine' ? 'flex' : 'hidden'} md:flex 
              w-full md:w-[var(--spine-width)] 
              h-full flex-col shrink-0 overflow-hidden min-h-0 
              ${swapPanels ? 'md:border-l' : 'md:border-r'} border-zinc-800 bg-zinc-900/40 relative group
              ${chapters.length === 0 ? 'md:hidden' : ''}
            `}
          >
            {chapters.length > 0 ? (
              <>
                <ChapterList
                  chapters={chapters}
                  selectedChapterId={selectedChapterId}
                  onSelectChapter={setSelectedChapterId}
                  onUpdateChapter={handleUpdateChapter}
                  onReorderChapters={handleReorderChapters}
                  onAddManualChapter={handleAddManualChapter}
                  onDeleteChapter={handleDeleteChapter}
                  onInsertChapterAt={handleInsertChapterAt}
                  onBulkRename={() => setShowBulkRenameModal(true)}
                  onAutoSequenceTitles={handleAutoSequenceTitles}
                  books={books}
                />
                {/* Resize Divider Drag Handle */}
                <div
                  className={`hidden md:block absolute ${swapPanels ? 'left-0 -ml-1' : 'right-0'} top-0 bottom-0 w-2 cursor-col-resize hover:bg-zinc-700 active:bg-zinc-500 z-10 transition-colors`}
                  onMouseDown={handleSpineResizeStart}
                />
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-6 text-center text-sm text-zinc-500">
                Import EPUB files in the Editor tab to populate the spine.
              </div>
            )}
          </div>

          {/* CENTER PANE (Editor & Terminal) */}
          <div className={`
            ${mobileTab === 'editor' ? 'flex' : 'hidden'} md:flex 
            flex-1 flex-col min-h-0 overflow-hidden relative
          `}>
          <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-[#09090b]">
            {chapters.length === 0 ? (
              <div className="flex-1 overflow-y-auto p-4 md:p-8 w-full">
                <div className="flex flex-col items-center justify-center min-h-full max-w-2xl mx-auto w-full py-4">
                  <div className="text-center mb-6 md:mb-8 flex flex-col items-center mt-auto">
                    <div className="p-2 rounded-2xl bg-zinc-800 border border-zinc-700/50 text-zinc-300 mb-4 shadow-lg">
                      <img src="/logo.svg" alt="ReBind" className="w-12 h-12 md:w-16 md:h-16 rounded-xl object-cover" />
                    </div>
                    <h2 className="text-xl md:text-2xl font-extrabold text-white mb-2">ReBind Workspace</h2>
                    <p className="text-xs md:text-sm text-zinc-400 max-w-md leading-relaxed">
                      Import ongoing chapter volumes, clean extraneous styles, reorder content files, and reconstruct them into a single clean EPUB 3 document.
                    </p>
                  </div>
                  <div className="w-full">
                    <DropZone onFilesSelected={handleFilesSelected} isProcessing={isProcessing} />
                  </div>
                  <div className="mt-6 flex items-center gap-3 mb-auto">
                    <span className="text-xs text-zinc-400">Or start fresh:</span>
                    <button
                    onClick={handleAddManualChapter}
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-1.5 text-xs font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100"
                    disabled={isProcessing}
                  >
                    <Sparkles size={14} className="text-zinc-300" />
                    Create Empty Chapter
                  </button>
                </div>
              </div>
            </div>
          ) : (
              <ChapterPreview
                chapter={chapters.find((c) => c.id === selectedChapterId) || null}
                onUpdateChapter={handleUpdateChapter}
                settings={settings}
                onTriggerReclean={handleTriggerReclean}
              />
            )}
          </div>

          {/* Bottom Terminal Panel */}
          {!isLogsMinimized && (
            <div className="h-62.5 shrink-0 border-t border-zinc-800 bg-[#09090b] flex flex-col">
              <LogConsole
                logs={logs}
                onClearLogs={handleClearLogs}
              />
            </div>
          )}
        </div> {/* END CENTER PANE */}
        </div> {/* END SWAP WRAPPER */}

        {/* RIGHT SIDEBAR (Inspector) */}
        {!isSidebarMinimized && (
          <div className={`
            ${mobileTab === 'inspector' ? 'flex' : 'hidden'} md:flex 
            w-full md:w-[var(--sidebar-width)] 
            relative h-full shrink-0 group
          `}>
            {/* Drag Handle */}
            <div
              className="hidden md:block absolute left-0 -ml-1 top-0 bottom-0 w-2 cursor-col-resize hover:bg-zinc-700 active:bg-zinc-500 z-10 transition-colors"
              onMouseDown={handleSidebarResizeStart}
            />
            <AppSidebar
              books={books}
              setBooks={setBooks}
              setChapters={setChapters}
              addLog={addLog}
              isProcessing={isProcessing}
              handleFilesSelected={handleFilesSelected}
              metadata={metadata}
              setMetadata={setMetadata}
              coverUrl={coverUrl}
              setCoverUrl={setCoverUrl}
              extractedCovers={extractedCovers}
            />
          </div>
        )}
      </div>

      {/* MOBILE BOTTOM NAVIGATION */}
      <div className="md:hidden shrink-0 h-14 bg-zinc-900 border-t border-zinc-800 flex items-center justify-around z-20 px-2 pb-safe">
        <button
          onClick={() => setMobileTab('spine')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${mobileTab === 'spine' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <List size={20} />
          <span className="text-[10px] font-medium">Spine</span>
        </button>
        <button
          onClick={() => setMobileTab('editor')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${mobileTab === 'editor' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <FileText size={20} />
          <span className="text-[10px] font-medium">Editor</span>
        </button>
        <button
          onClick={() => setMobileTab('inspector')}
          className={`flex flex-col items-center justify-center w-full h-full gap-1 transition-colors ${mobileTab === 'inspector' ? 'text-violet-400' : 'text-zinc-500 hover:text-zinc-300'}`}
        >
          <Settings size={20} />
          <span className="text-[10px] font-medium">Inspector</span>
        </button>
      </div>

       {/* Regex Manager Modal */}
  {showRegexManager && (
  <RegexManagerModal
  settings={settings}
  onChangeSettings={handleUpdateSettings}
  onTriggerReclean={handleTriggerReclean}
  onClose={() => setShowRegexManager(false)}
  />
  )}
  {/* Reconstruction Settings Modal */}
  {showReconstructionSettings && (
  <ReconstructionSettingsModal
  settings={settings}
  onSave={handleUpdateSettings}
  onClose={() => setShowReconstructionSettings(false)}
  />
  )}
  <BulkRenameModal
    chapters={chapters}
    isOpen={showBulkRenameModal}
    onClose={() => setShowBulkRenameModal(false)}
    onApply={handleBulkRename}
  />

  </div>
 );
}
