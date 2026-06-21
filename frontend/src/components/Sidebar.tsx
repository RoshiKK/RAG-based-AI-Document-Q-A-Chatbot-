import { MessageSquarePlus, MessageSquare, User, Settings, FileText } from "lucide-react";

interface SidebarProps {
  currentSession: string | null;
  fileName: string | null;
}

export default function Sidebar({ currentSession, fileName }: SidebarProps) {
  return (
    <div className="w-64 bg-[#202123] h-full flex flex-col text-gray-300">
      <div className="p-2">
        <button className="flex items-center gap-3 w-full border border-gray-600 rounded-md p-3 hover:bg-gray-800 transition-colors">
          <MessageSquarePlus className="w-4 h-4" />
          <span className="text-sm font-medium">New chat</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {currentSession && (
          <div className="text-xs text-gray-500 font-semibold px-2 mb-2 mt-4">Today</div>
        )}
        {currentSession ? (
          <button className="flex items-center gap-3 w-full rounded-md p-3 bg-gray-800 text-white">
            <FileText className="w-4 h-4 text-gray-400" />
            <span className="text-sm truncate">{fileName || "Document Q&A"}</span>
          </button>
        ) : (
          <div className="text-sm text-gray-500 italic p-3">No active document</div>
        )}
      </div>

      <div className="p-2 border-t border-gray-700">
        <button className="flex items-center gap-3 w-full rounded-md p-3 hover:bg-gray-800 transition-colors">
          <User className="w-4 h-4" />
          <span className="text-sm font-medium">Upgrade to Plus</span>
        </button>
        <button className="flex items-center gap-3 w-full rounded-md p-3 hover:bg-gray-800 transition-colors">
          <Settings className="w-4 h-4" />
          <span className="text-sm font-medium">Settings</span>
        </button>
      </div>
    </div>
  );
}
