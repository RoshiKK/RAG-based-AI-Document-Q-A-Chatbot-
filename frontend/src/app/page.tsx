"use client";

import { useState } from "react";
import Sidebar from "@/components/Sidebar";
import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);

  return (
    <div className="flex h-screen w-full bg-[#343541] overflow-hidden">
      <Sidebar currentSession={sessionId} fileName={fileName} />
      <div className="flex-1 flex flex-col h-full relative">
        <ChatInterface 
          sessionId={sessionId} 
          onUploadSuccess={(id) => setSessionId(id)} 
          setFileName={setFileName}
        />
      </div>
    </div>
  );
}
