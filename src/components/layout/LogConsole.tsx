import { useEffect, useRef } from 'react';
import { Terminal, Trash2 } from 'lucide-react';

interface LogConsoleProps {
 logs: string[];
 onClearLogs: () => void;
}

export const LogConsole: React.FC<LogConsoleProps> = ({
 logs,
 onClearLogs,
}) => {
 const consoleEndRef = useRef<HTMLDivElement>(null);

 // Auto-scroll to bottom of logs
 useEffect(() => {
 if (consoleEndRef.current && consoleEndRef.current.parentElement) {
 const parent = consoleEndRef.current.parentElement;
 parent.scrollTop = parent.scrollHeight;
 }
 }, [logs]);

 return (
 <div className="bg-[#09090b] p-4 flex flex-col h-full min-h-0 overflow-hidden">
 <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-zinc-800 shrink-0">
 <div className="flex items-center gap-2">
 <Terminal className="text-zinc-400" size={16} />
 <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
 Execution Console
 </span>
 </div>
 
 <div className="flex items-center gap-3">
 {logs.length > 0 && (
 <button
 onClick={onClearLogs}
 className="text-[10px] text-zinc-400 hover:text-zinc-300 flex items-center gap-1 transition-colors"
 title="Clear Console Logs"
 >
 <Trash2 size={12} />
 Clear
 </button>
 )}
 </div>
 </div>

 {/* Log list */}
 <div className="flex-1 overflow-y-auto bg-black/45 p-3 rounded-lg border border-zinc-800 font-mono text-[11px] leading-relaxed text-zinc-400 min-h-0">
 {logs.length === 0 ? (
 <span className="text-zinc-600 italic">Console idle. Ready for operations...</span>
 ) : (
 logs.map((log, index) => {
 // Color code log tags
 let colorClass = 'text-zinc-300';
 if (log.includes('[Parser]')) {
 colorClass = 'text-zinc-300';
 } else if (log.includes('[Generator]')) {
 colorClass = 'text-pink-400';
 } else if (log.includes('[Warning]')) {
 colorClass = 'text-zinc-400';
 } else if (log.includes('[Error]')) {
 colorClass = 'text-zinc-300 font-semibold';
 }
 
 return (
 <div key={index} className="whitespace-pre-wrap mb-1">
 <span className="text-zinc-600 mr-1.5 font-sans select-none">
 {new Date().toLocaleTimeString(undefined, { hour12: false })}
 </span>
 <span className={colorClass}>{log}</span>
 </div>
 );
 })
 )}
 <div ref={consoleEndRef} />
 </div>
 </div>
 );
};
