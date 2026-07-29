import React, { useState, useEffect, useRef } from 'react';
import { X, Plus, Sparkles, Loader2, Regex, Trash2, AlertCircle, Key } from 'lucide-react';
import type { ReconstructionSettings, RegexRule } from '../../types';
import { generateRegexWithAI } from '../../utils/aiRegex';

interface RegexManagerModalProps {
 settings: ReconstructionSettings;
 onChangeSettings: (settings: ReconstructionSettings) => void;
 onClose: () => void;
 onTriggerReclean: () => void;
}

export const RegexManagerModal: React.FC<RegexManagerModalProps> = ({
 settings,
 onChangeSettings,
 onClose,
 onTriggerReclean
}) => {
 const dialogRef = useRef<HTMLDialogElement>(null);

 // Custom Regex State
 const [regexPattern, setRegexPattern] = useState('');
 const [regexReplace, setRegexReplace] = useState('');
 const [caseInsensitive, setCaseInsensitive] = useState(true);

 // AI Auto-Regex State
 const [aiSampleText, setAiSampleText] = useState('');
 const [isGeneratingAi, setIsGeneratingAi] = useState(false);
 const [aiError, setAiError] = useState('');

 // Handle Dialog Mounting
 useEffect(() => {
 if (dialogRef.current && !dialogRef.current.open) {
 dialogRef.current.showModal();
 }
 }, []);

 const handleCloseClick = () => {
 dialogRef.current?.close();
 };

 // Add custom regex cleaner
 const handleAddRegex = (e: React.FormEvent) => {
 e.preventDefault();
 if (!regexPattern) return;

 try {
 new RegExp(regexPattern, caseInsensitive ? 'i' : '');
 } catch {
 alert('Invalid Regex pattern!');
 return;
 }

 const newRule: RegexRule = {
 id: crypto.randomUUID(),
 pattern: regexPattern,
 replace: regexReplace,
 active: true,
 caseInsensitive,
 };

 onChangeSettings({
 ...settings,
 regexRules: [...settings.regexRules, newRule],
 });

 setRegexPattern('');
 setRegexReplace('');

 // Automatically trigger reclean when a rule is added
 setTimeout(() => {
 onTriggerReclean();
 }, 50);
 };

 // Delete regex rule
 const handleDeleteRegex = (id: string) => {
 onChangeSettings({
 ...settings,
 regexRules: settings.regexRules.filter((r) => r.id !== id),
 });
 setTimeout(() => {
 onTriggerReclean();
 }, 50);
 };

 // Toggle regex rule active state
 const handleToggleRegex = (id: string) => {
 onChangeSettings({
 ...settings,
 regexRules: settings.regexRules.map((r) =>
 r.id === id ? { ...r, active: !r.active } : r
 ),
 });
 setTimeout(() => {
 onTriggerReclean();
 }, 50);
 };

 // Generate AI Regex
 const handleGenerateAiRegex = async () => {
 if (!aiSampleText.trim()) return;
 if (!settings.geminiApiKey) {
 setAiError('Please configure your Gemini API Key in Global Settings first.');
 return;
 }

 setIsGeneratingAi(true);
 setAiError('');
 try {
 const generatedPattern = await generateRegexWithAI(settings.geminiApiKey, aiSampleText);
 setRegexPattern(generatedPattern);
 setAiSampleText('');
 } catch (err) {
 setAiError(err instanceof Error ? err.message : String(err));
 } finally {
 setIsGeneratingAi(false);
 }
 };

 return (
 <dialog
 ref={dialogRef}
 onClose={onClose}
 className="bg-transparent p-0 m-auto backdrop:bg-zinc-950/60 backdrop:backdrop-blur-sm open:animate-in open:fade-in open:zoom-in duration-200"
 >
 <div className="bg-zinc-900/90 border border-zinc-700/80 rounded-xl hover:border-zinc-600 transition-colors duration-150 w-[90vw] max-w-3xl max-h-[90vh] shadow-2xl flex flex-col overflow-hidden">

 {/* Header */}
 <div
 className="flex items-center justify-between p-4 border-b border-zinc-700/80 bg-zinc-950/20 shrink-0 select-none"
 >
 <div>
 <h2 className="text-lg font-semibold text-white flex items-center gap-2">
 <Regex size={18} className="text-zinc-300" />
 Global Regex Cleaners
 </h2>
 <p className="text-[11px] text-zinc-400 mt-1">
 Rules defined here execute dynamically across all chapters in the workspace during reconstruction.
 </p>
 </div>
 <button
 type="button"
 onClick={handleCloseClick}
 className="text-zinc-400 hover:text-white p-1 rounded transition-colors self-start"
 >
 <X size={20} />
 </button>
 </div>

 {/* Content Body - Split View */}
 <div className="flex-1 flex flex-row min-h-0 overflow-hidden">

 {/* Left Column: Builders */}
 <div className="w-[50%] p-5 border-r border-zinc-700/80 overflow-y-auto custom-scrollbar flex flex-col gap-6 bg-zinc-950/20">

 {/* AI Auto-Regex Generator */}
 <div className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 flex flex-col gap-3 relative overflow-hidden shrink-0">
 <div className="absolute top-0 left-0 w-full h-1 bg-linear-to-r from-violet-600 via-fuchsia-500 to-orange-500 opacity-50"></div>
 <div className="flex items-center justify-between">
 <span className="text-xs font-semibold text-white flex items-center gap-1.5">
 <Sparkles size={14} className="text-zinc-300" /> AI Auto-Regex
 </span>
 </div>
 <p className="text-[10px] text-zinc-400 -mt-1">
 Paste the exact junk text you want to remove. Gemini will generate a highly accurate Regex pattern to clean it globally.
 </p>

 <div className="flex flex-col gap-2">
 <div className="flex flex-col mb-1 gap-1.5">
 <label htmlFor="geminiApiKey" className="text-xs font-medium text-zinc-400 flex items-center gap-1.5">
 <Key size={12} /> Gemini API Key
 </label>
 <input
 id="geminiApiKey"
 type="password"
 value={settings.geminiApiKey || ''}
 onChange={(e) => onChangeSettings({ ...settings, geminiApiKey: e.target.value.trim() })}
 placeholder="AIzaSy..."
 className="w-full bg-zinc-950/40 border border-zinc-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-violet-500/50 transition-colors"
 />
 </div>

 <textarea
 value={aiSampleText}
 onChange={(e) => setAiSampleText(e.target.value)}
 placeholder="e.g. Prev // Toc // Next"
 className="px-3.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60 py-2 text-xs w-full resize-y min-h-15 max-h-50 custom-scrollbar"
 disabled={isGeneratingAi}
 />

 {aiError && (
 <div className="text-[10px] text-zinc-300 flex items-start gap-1">
 <AlertCircle size={12} className="shrink-0 mt-0.5" />
 <span>{aiError}</span>
 </div>
 )}

 <div className="flex justify-end mt-1">
 <button
 type="button"
 onClick={handleGenerateAiRegex}
 disabled={isGeneratingAi || !aiSampleText.trim()}
 className="justify-center rounded-md cursor-pointer border-transparent transition-colors duration-150 bg-linear-to-r from-violet-600 to-fuchsia-600 hover:from-violet-500 hover:to-fuchsia-500 text-white border-0 py-1.5 px-4 text-xs font-medium flex items-center gap-1.5 disabled:opacity-50 disabled:cursor-not-allowed"
 >
 {isGeneratingAi ? (
 <>
 <Loader2 size={13} className="animate-spin" /> Generating...
 </>
 ) : (
 <>
 <Sparkles size={13} /> Generate Pattern
 </>
 )}
 </button>
 </div>
 </div>
 </div>

 {/* Manual Rule Form */}
 <form onSubmit={handleAddRegex} className="bg-zinc-950/40 p-4 rounded-xl border border-zinc-800 flex flex-col gap-4 shrink-0">
 <span className="text-xs font-semibold text-white flex items-center gap-1">
 <Plus size={14} className="text-zinc-300" /> Add Custom Regex Cleaner
 </span>

 <div className="flex flex-col gap-3">
 <div>
 <label className="block font-bold text-zinc-400 mb-1.5 uppercase tracking-widest text-[10px]" htmlFor="regex-pattern">Find Regex Pattern</label>
 <input
 id="regex-pattern"
 type="text"
 value={regexPattern}
 onChange={(e) => setRegexPattern(e.target.value)}
 placeholder="e.g. (Sponsored|Visit novel.*\.com)"
 className="w-full px-3.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60 py-1.5 text-xs"
 />
 </div>
 <div>
 <label className="block font-bold text-zinc-400 mb-1.5 uppercase tracking-widest text-[10px]" htmlFor="regex-replace">Replace With</label>
 <input
 id="regex-replace"
 type="text"
 value={regexReplace}
 onChange={(e) => setRegexReplace(e.target.value)}
 placeholder="e.g. [Ad Removed] or leave empty"
 className="w-full px-3.5 bg-zinc-950/40 border border-zinc-800 rounded-lg text-white font-[inherit] transition-all focus:outline-none focus:border-[#00F0FF] focus:ring-2 focus:ring-[#00F0FF]/25 focus:bg-zinc-950/60 py-1.5 text-xs"
 />
 </div>
 </div>

 <div className="flex items-center justify-between mt-1 pt-3 border-t border-zinc-800">
 <label className="flex items-center gap-2 cursor-pointer">
 <input
 type="checkbox"
 checked={caseInsensitive}
 onChange={() => setCaseInsensitive(!caseInsensitive)}
 className="accent-zinc-500"
 />
 <span className="text-[11px] text-zinc-400">Case Insensitive (/i flag)</span>
 </label>
 <button type="submit" className="inline-flex items-center justify-center gap-2 font-semibold rounded-md cursor-pointer border border-transparent transition-colors duration-150 bg-zinc-100 text-zinc-900 hover:bg-white active:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed py-1 px-3 text-xs">
 Save Rule
 </button>
 </div>
 </form>
 </div>

 {/* Right Column: Active Rules */}
 <div className="w-[50%] p-5 flex flex-col min-h-0">
 <div className="flex items-center justify-between mb-3 shrink-0">
 <span className="block text-[0.75rem] font-bold text-zinc-400 mb-1.5 uppercase tracking-widest">Active Rules ({settings.regexRules.length})</span>
 </div>

 <div className="flex-1 overflow-y-auto bg-zinc-950/30 border border-zinc-800 rounded-xl p-2 flex flex-col gap-2 custom-scrollbar">
 {settings.regexRules.length === 0 ? (
 <div className="text-center p-8 text-zinc-400 text-xs italic flex flex-col items-center gap-3">
 <Regex size={24} className="opacity-30" />
 No custom regex rules defined. Use the builder to remove publisher tags, watermarks, etc.
 </div>
 ) : (
 settings.regexRules.map((rule) => (
 <div
 key={rule.id}
 className={`flex items-center justify-between p-2.5 rounded-lg border text-xs bg-zinc-950/40 transition-colors ${rule.active ? 'border-zinc-700/80 hover:border-zinc-500/30' : 'border-zinc-800 opacity-50'}`}
 >
 <div className="flex items-center gap-3 flex-1 min-w-0 mr-3">
 <input
 type="checkbox"
 checked={rule.active}
 onChange={() => handleToggleRegex(rule.id)}
 className="accent-zinc-500 cursor-pointer shrink-0"
 title="Toggle rule active state"
 />
 <div className="font-mono text-zinc-300 truncate">
 <span className="text-pink-400">/{rule.pattern}/</span>
 {rule.caseInsensitive && <span className="text-zinc-300 text-[10px] ml-0.5">i</span>}
 <span className="text-zinc-400 mx-2">→</span>
 <span className="text-zinc-400">"{rule.replace}"</span>
 </div>
 </div>
 <button
 onClick={() => handleDeleteRegex(rule.id)}
 className="text-zinc-400 hover:text-zinc-300 p-1.5 rounded transition-colors shrink-0 bg-zinc-800/50 hover:bg-zinc-800"
 title="Delete Rule"
 >
 <Trash2 size={14} />
 </button>
 </div>
 ))
 )}
 </div>
 </div>

 </div>
 </div>
 </dialog>
 );
};
