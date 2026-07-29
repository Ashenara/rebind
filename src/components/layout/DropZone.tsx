import React, { useState, useRef } from 'react';
import { UploadCloud, FileUp } from 'lucide-react';

interface DropZoneProps {
 onFilesSelected: (files: FileList) => void;
 isProcessing: boolean;
}

export const DropZone: React.FC<DropZoneProps> = ({ onFilesSelected, isProcessing }) => {
 const [isDragActive, setIsDragActive] = useState(false);
 const fileInputRef = useRef<HTMLInputElement>(null);

 const handleDrag = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 if (e.type === 'dragenter' || e.type === 'dragover') {
 setIsDragActive(true);
 } else if (e.type === 'dragleave') {
 setIsDragActive(false);
 }
 };

 const handleDrop = (e: React.DragEvent) => {
 e.preventDefault();
 e.stopPropagation();
 setIsDragActive(false);
 
 if (isProcessing) return;
 
 if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
 // Filter out non-epub files
 const validFiles = Array.from(e.dataTransfer.files).filter(
 f => f.name.endsWith('.epub') || f.type === 'application/epub+zip'
 );
 if (validFiles.length > 0) {
 // Construct FileList equivalent or just pass the filtered list as FileList (DataTransfer helper)
 const dt = new DataTransfer();
 validFiles.forEach(f => dt.items.add(f));
 onFilesSelected(dt.files);
 }
 }
 };

 const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
 e.preventDefault();
 if (isProcessing) return;
 if (e.target.files && e.target.files.length > 0) {
 onFilesSelected(e.target.files);
 }
 };

 const onButtonClick = () => {
 if (isProcessing) return;
 fileInputRef.current?.click();
 };

 return (
 <div
 className={`rounded-lg p-8 text-center flex flex-col items-center justify-center border-2 border-dashed transition-all duration-300 ${ isDragActive ? 'border-cyan-400 bg-zinc-800 scale-[1.02] shadow-[0_0_30px_rgba(0,240,255,0.3)]' : 'border-zinc-700/80 bg-zinc-950/20 hover:border-zinc-600 hover:shadow-[0_0_15px_rgba(0,240,255,0.15)]' } ${isProcessing ? 'opacity-60 cursor-not-allowed' : 'cursor-pointer'}`}
 onDragEnter={handleDrag}
 onDragOver={handleDrag}
 onDragLeave={handleDrag}
 onDrop={handleDrop}
 onClick={onButtonClick}
 style={{ minHeight: '180px' }}
 >
 <input
 ref={fileInputRef}
 type="file"
 multiple
 accept=".epub,application/epub+zip"
 onChange={handleChange}
 className="hidden"
 disabled={isProcessing}
 />
 
 <div className={`p-4 rounded-full bg-zinc-800/50 mb-4 text-zinc-300 border border-zinc-800 transition-all duration-300 ${isDragActive ? 'scale-110 rotate-3 text-zinc-300 shadow-[0_0_20px_rgba(0,240,255,0.4)]' : ''}`}>
 {isDragActive ? <FileUp size={36} className="animate-bounce" /> : <UploadCloud size={36} />}
 </div>
 
 <h3 className="text-lg font-semibold mb-1 text-white">
 {isDragActive ? 'Drop your EPUB files here!' : 'Import EPUB Source Files'}
 </h3>
 
 <p className="text-sm text-zinc-400 max-w-sm mb-2">
 Drag & drop one or multiple EPUBs here, or click to browse files on your computer.
 </p>
 
 <span className="text-xs text-zinc-300/80 font-medium px-2 py-1 rounded bg-zinc-800 border border-zinc-700">
 EPUB format only • Merges sequentially
 </span>
 </div>
 );
};
