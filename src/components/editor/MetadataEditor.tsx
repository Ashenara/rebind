import { useRef } from 'react';
import { BookOpen, Image } from 'lucide-react';

interface Metadata {
 title: string;
 author: string;
 language: string;
 publisher: string;
 description: string;
}

interface MetadataEditorProps {
 metadata: Metadata;
 onChangeMetadata: (md: Metadata) => void;
 coverUrl: string | null;
 onChangeCover: (url: string | null) => void;
 extractedCovers: { bookId: string; bookTitle: string; coverUrl: string }[];
}

export const MetadataEditor: React.FC<MetadataEditorProps> = ({
 metadata,
 onChangeMetadata,
 coverUrl,
 onChangeCover,
 extractedCovers,
}) => {
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleTextChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
 const { name, value } = e.target;
 onChangeMetadata({
 ...metadata,
 [name]: value,
 });
 };

 const handleCustomCoverUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
 const file = e.target.files?.[0];
 if (file) {
 const reader = new FileReader();
 reader.onload = (event) => {
 if (event.target?.result) {
 onChangeCover(event.target.result as string);
 }
 };
 reader.readAsDataURL(file);
 }
 };

 return (
 <div className="flex flex-col gap-6">
 {/* Book Metadata Card */}
 <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors duration-150 p-5">
 <div className="flex items-center gap-2 mb-4 pb-2 border-b border-zinc-800">
 <BookOpen className="text-zinc-300" size={20} />
 <h2 className="text-md font-semibold text-white">EPUB Metadata</h2>
 </div>

 <div className="flex flex-col gap-3">
 <div>
 <label className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest" htmlFor="meta-title">Reconstructed Book Title</label>
 <input
 type="text"
 id="meta-title"
 name="title"
 value={metadata.title}
 onChange={handleTextChange}
 placeholder="e.g. My Combined Novel"
 className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] text-[0.9rem] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60"
 />
 </div>

 <div>
 <label className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest" htmlFor="meta-author">Author / Creator</label>
 <input
 type="text"
 id="meta-author"
 name="author"
 value={metadata.author}
 onChange={handleTextChange}
 placeholder="e.g. Novelist Name"
 className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] text-[0.9rem] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60"
 />
 </div>

 <div className="grid grid-cols-2 gap-3">
 <div>
 <label className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest" htmlFor="meta-language">Language</label>
 <input
 type="text"
 id="meta-language"
 name="language"
 value={metadata.language}
 onChange={handleTextChange}
 placeholder="e.g. en"
 className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] text-[0.9rem] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60"
 />
 </div>
 <div>
 <label className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest" htmlFor="meta-publisher">Publisher</label>
 <input
 type="text"
 id="meta-publisher"
 name="publisher"
 value={metadata.publisher}
 onChange={handleTextChange}
 placeholder="Optional"
 className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] text-[0.9rem] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60"
 />
 </div>
 </div>

 <div>
 <label className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest" htmlFor="meta-description">Description / Summary</label>
 <textarea
 id="meta-description"
 name="description"
 value={metadata.description}
 onChange={handleTextChange}
 placeholder="Provide a description for your reconstructed book..."
 rows={3}
 className="w-full px-3.5 py-2.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] text-[0.9rem] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60 resize-none"
 />
 </div>
 </div>
 </div>

 {/* Cover Image Selector Card */}
 <div className="bg-zinc-950/80 border border-zinc-800 rounded-lg hover:border-zinc-600 transition-colors duration-150 p-5">
 <div className="flex items-center justify-between mb-4 pb-2 border-b border-zinc-800">
 <div className="flex items-center gap-2">
 <Image className="text-zinc-300" size={20} />
 <h2 className="text-md font-semibold text-white">Cover Image</h2>
 </div>
 {coverUrl && (
 <button
 onClick={() => onChangeCover(null)}
 className="text-xs text-zinc-300 hover:text-rose-300 transition-colors"
 >
 Remove Cover
 </button>
 )}
 </div>

 <div className="flex gap-4 items-start mb-4">
 {/* Cover Preview Container */}
 <div className="w-24 h-36 rounded-lg bg-zinc-950/40 border border-zinc-700/80 flex flex-col items-center justify-center overflow-hidden shrink-0 relative group">
 {coverUrl ? (
 <img src={coverUrl} alt="Cover Preview" className="w-full h-full object-cover" />
 ) : (
 <div className="text-center p-2 text-zinc-400">
 <BookOpen size={24} className="mx-auto mb-1 opacity-40" />
 <span className="text-[10px]">No Cover Selected</span>
 </div>
 )}
 </div>

 <div className="flex-1 flex flex-col gap-2">
 <p className="text-xs text-zinc-400 leading-relaxed">
 Choose an image for the reconstructed book cover. You can upload an image or click on any of the extracted source covers below.
 </p>
 <button
 onClick={() => fileInputRef.current?.click()}
 className="inline-flex items-center gap-2 px-4 font-semibold rounded-md cursor-pointer border border-zinc-700/80 transition-colors duration-150 bg-zinc-800/50 text-white hover:bg-zinc-800 hover:border-zinc-400 hover:text-zinc-100 py-2 text-xs w-full justify-center"
 >
 Upload Custom Cover
 </button>
 <input
 ref={fileInputRef}
 type="file"
 accept="image/png, image/jpeg, image/webp"
 onChange={handleCustomCoverUpload}
 className="hidden"
 />
 </div>
 </div>

 {/* Extracted covers grid */}
 {extractedCovers.length > 0 && (
 <div>
 <span className="block text-[0.75rem] font-bold text-zinc-400 uppercase tracking-widest mb-2">Extracted from Sources:</span>
 <div className="grid grid-cols-4 gap-2 max-h-35 overflow-y-auto p-1 bg-zinc-950/20 rounded-lg border border-zinc-800">
 {extractedCovers.map((item, idx) => (
 <div
 key={`${item.bookId}-${idx}`}
 onClick={() => onChangeCover(item.coverUrl)}
 title={item.bookTitle}
 className={`aspect-2/3 rounded border overflow-hidden cursor-pointer transition-all duration-200 ${coverUrl === item.coverUrl ? 'border-zinc-500 ring-2 ring-violet-500/40 scale-[0.98]' : 'border-zinc-700/80 hover:border-zinc-600 hover:scale-[1.02]'}`}
 >
 <img src={item.coverUrl} alt="Source Cover" className="w-full h-full object-cover" />
 </div>
 ))}
 </div>
 </div>
 )}
 </div>
 </div>
 );
};
