import React, { useRef, useEffect, useState } from 'react';
import { X, Settings, Bold, Italic, Underline, WrapText, Download, Upload, GripHorizontal } from 'lucide-react';
import type { ReconstructionSettings } from '../../types';

interface ReconstructionSettingsModalProps {
  settings: ReconstructionSettings;
  onSave: (settings: ReconstructionSettings) => void;
  onClose: () => void;
}

export const ReconstructionSettingsModal: React.FC<ReconstructionSettingsModalProps> = ({
  settings,
  onSave,
  onClose
}) => {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [draggingIdx, setDraggingIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);

  useEffect(() => {
    // Open natively when mounted
    if (dialogRef.current && !dialogRef.current.open) {
      dialogRef.current.showModal();
    }
  }, []);

  const handleCloseClick = () => {
    dialogRef.current?.close();
  };

  const toggleSetting = (key: keyof ReconstructionSettings) => {
    onSave({
      ...settings,
      [key]: !settings[key]
    });
  };

  const currentOrder = settings.layoutOrder || ['spine', 'editor', 'inspector'];

  return (
    <dialog
      ref={dialogRef}
      onClose={onClose}
      className="bg-transparent p-0 m-auto backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in duration-200"
    >
      <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl hover:border-zinc-600 transition-colors duration-150 w-[90vw] max-w-md shadow-2xl flex flex-col overflow-hidden max-h-[90vh]">
        
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-700/80 bg-zinc-950/20 shrink-0">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <Settings size={18} className="text-zinc-300" />
            Reconstruction Options
          </h2>
          <button
            onClick={handleCloseClick}
            className="text-zinc-400 hover:text-white p-1 rounded transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 flex flex-col gap-6 overflow-y-auto">

          <div className="flex flex-col gap-3 pb-2 border-b border-zinc-800/80">
            <span className="block text-[0.75rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Layout Order (Left to Right)
            </span>
            <div className="flex items-center gap-2 overflow-x-auto pb-2">
              {currentOrder.map((panel, idx) => (
                <div
                  key={panel}
                  draggable
                  onDragStart={(e) => {
                    setDraggingIdx(idx);
                    // Required for Firefox
                    e.dataTransfer.effectAllowed = 'move';
                    e.dataTransfer.setData('text/plain', idx.toString());
                  }}
                  onDragEnter={() => setDragOverIdx(idx)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={() => {
                    if (draggingIdx !== null && dragOverIdx !== null && draggingIdx !== dragOverIdx) {
                      const newOrder = [...currentOrder];
                      const draggedItem = newOrder[draggingIdx];
                      newOrder.splice(draggingIdx, 1);
                      newOrder.splice(dragOverIdx, 0, draggedItem);
                      onSave({ ...settings, layoutOrder: newOrder });
                    }
                    setDraggingIdx(null);
                    setDragOverIdx(null);
                  }}
                  className={`
                    flex-1 flex flex-col items-center justify-center p-3 rounded-lg border transition-all cursor-grab active:cursor-grabbing
                    ${draggingIdx === idx ? 'opacity-50 border-violet-500/50 bg-violet-500/10' : 'bg-zinc-800/30 border-zinc-700/50 hover:bg-zinc-800/60'}
                    ${dragOverIdx === idx && draggingIdx !== idx ? 'border-violet-500 border-dashed bg-violet-500/20' : ''}
                  `}
                >
                  <GripHorizontal size={16} className="text-zinc-500 mb-2" />
                  <span className="text-xs font-medium text-zinc-300 capitalize text-center">
                    {panel === 'inspector' || panel === 'metadata' ? 'Metadata' : panel}
                  </span>
                </div>
              ))}
            </div>
            <span className="text-[10px] text-zinc-500 mb-2">
              Drag and drop to reorder the Spine, Editor, and Metadata panes.
            </span>
          </div>
          
          <div className="flex flex-col gap-3">
            <span className="block text-[0.75rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Formatting Removal
            </span>

            {/* Keep Bold */}
            <label className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950/50 flex items-center justify-center border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                  <Bold size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white group-hover:text-zinc-300 transition-colors">
                    Preserve Bold Text
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Keep &lt;b&gt; and &lt;strong&gt; tags
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.keepBold}
                  onChange={() => toggleSetting('keepBold')}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${settings.keepBold ? 'bg-violet-500' : 'bg-zinc-800'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${settings.keepBold ? 'left-4.25' : 'left-0.75'}`} />
                </div>
              </div>
            </label>

            {/* Keep Italic */}
            <label className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950/50 flex items-center justify-center border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                  <Italic size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white group-hover:text-zinc-300 transition-colors">
                    Preserve Italic Text
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Keep &lt;i&gt; and &lt;em&gt; tags
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.keepItalic}
                  onChange={() => toggleSetting('keepItalic')}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${settings.keepItalic ? 'bg-violet-500' : 'bg-zinc-800'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${settings.keepItalic ? 'left-4.25' : 'left-0.75'}`} />
                </div>
              </div>
            </label>

            {/* Keep Underline */}
            <label className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950/50 flex items-center justify-center border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                  <Underline size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white group-hover:text-zinc-300 transition-colors">
                    Preserve Underline Text
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Keep &lt;u&gt; tags
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.keepUnderline}
                  onChange={() => toggleSetting('keepUnderline')}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${settings.keepUnderline ? 'bg-violet-500' : 'bg-zinc-800'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${settings.keepUnderline ? 'left-4.25' : 'left-0.75'}`} />
                </div>
              </div>
            </label>

          </div>

          <div className="flex flex-col gap-3 pt-2 border-t border-zinc-800/80">
            <span className="block text-[0.75rem] font-bold text-zinc-400 uppercase tracking-widest mb-1">
              Structure
            </span>

            {/* Keep BR Tags */}
            <label className="flex items-center justify-between cursor-pointer group p-2 -mx-2 rounded-lg hover:bg-zinc-800/50 transition-colors">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-zinc-950/50 flex items-center justify-center border border-zinc-800 text-zinc-300 group-hover:text-white group-hover:border-zinc-600 transition-colors">
                  <WrapText size={14} />
                </div>
                <div className="flex flex-col">
                  <span className="text-xs font-medium text-white group-hover:text-zinc-300 transition-colors">
                    Keep &lt;br&gt; tags
                  </span>
                  <span className="text-[10px] text-zinc-400">
                    Preserve line breaks. Uncheck to strictly use &lt;p&gt; tags.
                  </span>
                </div>
              </div>
              <div className="relative">
                <input
                  type="checkbox"
                  checked={settings.keepBrTags}
                  onChange={() => toggleSetting('keepBrTags')}
                  className="sr-only"
                />
                <div className={`w-9 h-5 rounded-full transition-all duration-200 ${settings.keepBrTags ? 'bg-violet-500' : 'bg-zinc-800'}`}>
                  <div className={`w-3.5 h-3.5 rounded-full bg-white absolute top-0.75 transition-all duration-200 ${settings.keepBrTags ? 'left-4.25' : 'left-0.75'}`} />
                </div>
              </div>
            </label>

          </div>

        </div>

        {/* Footer actions */}
        <div className="flex gap-2 p-4 border-t border-zinc-700/80 bg-zinc-950/40">
          <button
            onClick={() => {
              const exportSettings = { ...settings };
              delete exportSettings.geminiApiKey; // Prevent exporting API keys in plaintext backups
              const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportSettings, null, 2));
              const downloadAnchorNode = document.createElement('a');
              downloadAnchorNode.setAttribute("href", dataStr);
              downloadAnchorNode.setAttribute("download", "rebind_settings.json");
              document.body.appendChild(downloadAnchorNode);
              downloadAnchorNode.click();
              downloadAnchorNode.remove();
            }}
            className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
          >
            <Download size={14} /> Backup
          </button>
          
          <label className="flex-1 flex items-center justify-center gap-2 py-2 px-3 text-xs font-medium rounded-lg border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer">
            <Upload size={14} /> Restore
            <input
              type="file"
              accept=".json"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (event) => {
                  try {
                    const parsed = JSON.parse(event.target?.result as string);
                    if (parsed && typeof parsed === 'object') {
                      onSave({ ...settings, ...parsed });
                      alert("Settings restored successfully!");
                    }
                  } catch {
                    alert("Invalid JSON file.");
                  }
                };
                reader.readAsText(file);
              }}
            />
          </label>
        </div>

      </div>
    </dialog>
  );
};
