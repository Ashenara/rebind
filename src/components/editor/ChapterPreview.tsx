import React, { useState, useEffect, useRef } from 'react';
import { Eye, Edit3, Eraser, ChevronDown } from 'lucide-react';
import type { Chapter, ReconstructionSettings } from '../../types';

interface ChapterPreviewProps {
 chapter: Chapter | null;
 onUpdateChapter: (id: string, updatedFields: Partial<Chapter>) => void;
 settings: ReconstructionSettings;
 onTriggerReclean: () => void;
}

export const ChapterPreview: React.FC<ChapterPreviewProps> = ({
 chapter,
 onUpdateChapter,
 settings,
 onTriggerReclean,
}) => {
 const [activeTab, setActiveTab] = useState<'preview' | 'raw'>('preview');
 const [isDropdownOpen, setIsDropdownOpen] = useState(false);
 const dropdownRef = useRef<HTMLDivElement>(null);

 // Close dropdown on outside click
 useEffect(() => {
   const handleClickOutside = (event: MouseEvent) => {
     if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
       setIsDropdownOpen(false);
     }
   };
   document.addEventListener('mousedown', handleClickOutside);
   return () => {
     document.removeEventListener('mousedown', handleClickOutside);
   };
 }, []);

 // Reclean all when settings change
 useEffect(() => {
 onTriggerReclean();
 }, [
    settings.regexRules, 
    settings.keepBrTags, 
    settings.keepBold, 
    settings.keepItalic, 
    settings.keepUnderline, 
    onTriggerReclean
  ]);

 if (!chapter) {
 return (
 <div className="bg-[#09090b] p-6 h-full flex flex-col items-center justify-center text-center text-zinc-400 min-h-0 relative">
 <Edit3 size={48} className="mb-3 opacity-30 text-zinc-300" />
 <h3 className="text-lg font-semibold text-white mb-1">No Chapter Selected</h3>
 <p className="text-sm max-w-xs leading-relaxed">
 Select a chapter from the list to view its contents, edit text, or configure custom clean-up filters.
 </p>
 </div>
 );
 }

 // Handle direct text edits
 const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
 onUpdateChapter(chapter.id, {
 cleanedContent: e.target.value,
 });
 };

 return (
 <div className="bg-[#09090b] p-5 h-full flex flex-col min-h-0 overflow-hidden @container">
 {/* Header and Tabs */}
 <div className="flex flex-wrap items-center justify-between gap-3 mb-4 pb-2 border-b border-zinc-800">
 <div className="min-w-0 flex-1 mr-2">
 <h2 className="text-md font-semibold text-white truncate" title={chapter.title}>
 {chapter.title}
 </h2>
 <span className="text-[10px] text-zinc-400 truncate block">
 Source: {chapter.sourceBookTitle || 'Manual Entry'}
 </span>
 </div>

 {/* Tab triggers & Minimize Button */}
 <div className="flex flex-wrap items-center gap-2 self-start shrink-0 justify-end">
 <div className="flex flex-wrap bg-black/45 p-1 rounded-lg border border-zinc-800 gap-1">
 <button
 onClick={() => setActiveTab('preview')}
 className={`py-1 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${ activeTab === 'preview' ? 'bg-violet-600 text-white' : 'text-zinc-400 hover:text-white' }`}
 >
 <Eye size={13} />
 <span className="hidden @md:inline">Preview</span>
 </button>
 <button
 onClick={() => setActiveTab('raw')}
 className={`py-1 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 ${ activeTab === 'raw' ? 'bg-violet-600 text-white shadow-md shadow-violet-900/20' : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50' }`}
 >
 <Edit3 size={14} /> <span className="hidden @md:inline">Raw HTML</span>
 </button>
 </div>

  <div className="relative z-20" ref={dropdownRef}>
  <button 
  onClick={() => setIsDropdownOpen(!isDropdownOpen)}
  className="py-1 px-3 text-xs font-medium rounded-md flex items-center gap-1.5 transition-all duration-200 bg-black/45 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 hover:border-zinc-700">
  <Eraser size={13} />
  <span className="hidden @md:inline">Cleaners</span>
  <ChevronDown size={12} className={`transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 opacity-100' : 'opacity-50'}`} />
  </button>
  
  <div className={`absolute right-0 top-full mt-1 w-40 bg-zinc-900 border border-zinc-700 rounded-lg shadow-xl transition-all flex flex-col p-1 z-50 transform origin-top ${isDropdownOpen ? 'opacity-100 visible translate-y-0' : 'opacity-0 invisible -translate-y-2'}`}>
  <button
  onClick={() => {
  const cleaned = chapter.cleanedContent.replace(/<\/?b\b[^>]*>|<\/?strong\b[^>]*>/gi, '');
  onUpdateChapter(chapter.id, { cleanedContent: cleaned });
  }}
  className="w-full text-left py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-2 transition-all duration-200 text-yellow-400 hover:text-yellow-300 hover:bg-yellow-500/10"
  title="Remove all <b> and </b> tags from the chapter content"
  >
  <span className="font-mono bg-yellow-500/10 px-1 rounded opacity-80">&lt;b&gt;</span> Strip Bold
  </button>
  
  <button
  onClick={() => {
  const cleaned = chapter.cleanedContent.replace(/<\/?i\b[^>]*>|<\/?em\b[^>]*>/gi, '');
  onUpdateChapter(chapter.id, { cleanedContent: cleaned });
  }}
  className="w-full text-left py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-2 transition-all duration-200 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10"
  title="Remove all <i> and </i> tags from the chapter content"
  >
  <span className="font-mono bg-blue-500/10 px-1 rounded opacity-80">&lt;i&gt;</span> Strip Italic
  </button>
  
  <button
  onClick={() => {
  const cleaned = chapter.cleanedContent.replace(/<\/?u\b[^>]*>/gi, '');
  onUpdateChapter(chapter.id, { cleanedContent: cleaned });
  }}
  className="w-full text-left py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-2 transition-all duration-200 text-purple-400 hover:text-purple-300 hover:bg-purple-500/10"
  title="Remove all <u> and </u> tags from the chapter content"
  >
  <span className="font-mono bg-purple-500/10 px-1 rounded opacity-80">&lt;u&gt;</span> Strip Underline
  </button>
  
  <div className="h-px bg-zinc-800 my-1"></div>
  
  <button
  onClick={() => {
  const cleaned = chapter.cleanedContent
  .replace(/<(?!\/?(p|b|i|u|strong|em|br)\b)[^>]+>/gi, '')
  .replace(/<p[^>]*>/gi, '<p>')
  .replace(/<b[^>]*>/gi, '<b>')
  .replace(/<i[^>]*>/gi, '<i>')
  .replace(/(?:<br\s*\/?>\s*)+/gi, '</p><p>')
  .replace(/<p>\s*<\/p>/gi, '');
  onUpdateChapter(chapter.id, { cleanedContent: cleaned });
  }}
  className="w-full text-left py-1.5 px-3 text-xs font-medium rounded-md flex items-center gap-2 transition-all duration-200 text-zinc-300 hover:text-white hover:bg-zinc-800"
  title="Strip web formatting and clean HTML tags from pasted text"
  >
  <Eraser size={13} className="text-zinc-400" />
  Clean HTML
  </button>
  </div>
  </div>
 </div>
 </div>

 {/* Tab Panels */}
 <div className="flex-1 flex flex-col overflow-hidden min-h-0">
 
 {/* PANEL: PREVIEW */}
 {activeTab === 'preview' && (
 <div className="flex-1 flex flex-col min-h-0">
 {/* Web/Article Reader Viewport */}
 <div className="flex-1 overflow-y-auto bg-zinc-950/40 text-zinc-300 border border-zinc-800 rounded-xl p-6 md:p-10 shadow-inner relative min-h-0 custom-scrollbar">
 {/* Article Style Simulation */}
 <div 
 className="max-w-3xl mx-auto"
 style={{
 fontFamily: 'Inter, system-ui, sans-serif',
 lineHeight: '1.85',
 fontSize: '16px',
 textAlign: 'left'
 }}
 >
 <h1 
 contentEditable
 suppressContentEditableWarning
 onBlur={(e) => {
 const newTitle = e.currentTarget.innerText.trim();
 if (newTitle && newTitle !== chapter.title) {
 onUpdateChapter(chapter.id, { title: newTitle });
 }
 }}
 className="text-left font-sans text-3xl font-bold text-gray-100 border-b border-zinc-700/80 pb-4 mb-8 outline-none focus:bg-zinc-800/50 rounded transition-all tracking-tight"
 >
 {chapter.title}
 </h1>
 
 {/* Cleaned content inject */}
 <div 
 contentEditable
 suppressContentEditableWarning
 onBlur={(e) => {
 const newHtml = e.currentTarget.innerHTML;
 if (newHtml !== chapter.cleanedContent) {
 onUpdateChapter(chapter.id, { cleanedContent: newHtml });
 }
 }}
 dangerouslySetInnerHTML={{ __html: chapter.cleanedContent || '<p class="text-zinc-400 italic">This chapter has no text content.</p>' }} 
 className="editor-content outline-none min-h-50"
 />
 </div>
 </div>
 <div className="mt-2 text-[10px] text-zinc-400 text-right flex justify-between">
 <span>* Click anywhere inside the reader view above to edit text or paste rich text from your browser.</span>
 <span>Auto-saves on blur</span>
 </div>
 </div>
 )}

 {/* PANEL: EDIT HTML */}
 {activeTab === 'raw' && (
 <div className="flex-1 flex flex-col min-h-0">
 <textarea
 value={chapter.cleanedContent}
 onChange={handleContentChange}
 className="flex-1 w-full bg-gray-950 text-gray-200 font-mono text-xs p-4 rounded-xl border border-zinc-700/80 focus:outline-none focus:border-zinc-500/50 resize-none min-h-0 leading-relaxed"
 placeholder="Chapter HTML content..."
 aria-label="Chapter HTML Content"
 />
 <div className="mt-2 text-[10px] text-zinc-400 flex justify-between">
 <span>* Editable XHTML structure. Make changes and click Preview to verify.</span>
 <span>Length: {chapter.cleanedContent.length} chars</span>
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
