"use client";

import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Paperclip, Loader2 } from "lucide-react";

interface SourceSnippet {
  page_content: string;
  metadata: Record<string, unknown>;
}

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceSnippet[];
}

export default function ChatInterface({ 
  sessionId, 
  onUploadSuccess,
  setFileName
}: { 
  sessionId: string | null;
  onUploadSuccess: (id: string) => void;
  setFileName: (name: string | null) => void;
}) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      if (file.type !== "application/pdf") {
        alert("Please upload a valid PDF file.");
        return;
      }
      setIsUploading(true);
      setFileName(file.name);

      const formData = new FormData();
      formData.append("file", file);

      try {
        const response = await fetch("http://localhost:8000/upload", {
          method: "POST",
          body: formData,
        });

        if (!response.ok) {
          throw new Error("Failed to upload the file.");
        }

        const data = await response.json();
        onUploadSuccess(data.session_id);
        
        // Add a system message letting the user know upload succeeded
        setMessages((prev) => [
          ...prev, 
          {
            id: Date.now().toString(),
            role: "assistant",
            content: `I've successfully processed "${file.name}". How can I help you with this document?`
          }
        ]);
      } catch (err: unknown) {
        const errorMessage = err instanceof Error ? err.message : "An error occurred during upload.";
        alert(errorMessage);
        setFileName(null);
      } finally {
        setIsUploading(false);
      }
    }
  };

  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!input.trim() || isLoading || !sessionId) return;

    const userMsg: Message = { id: Date.now().toString(), role: "user", content: input };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:8000/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ session_id: sessionId, question: userMsg.content }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => null);
        throw new Error(errorData?.detail || "Failed to get answer");
      }

      const data = await response.json();
      
      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.answer,
        sources: data.sources,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (error: unknown) {
      console.error(error);
      const errorMessage = error instanceof Error ? error.message : "Sorry, I encountered an error while processing your request.";
      const errorMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: `Error: ${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <div className="flex flex-col h-full bg-[#343541] relative">
      <div className="flex-1 overflow-y-auto">
        {!sessionId && messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mb-6">
              <Bot className="w-10 h-10 text-[#343541]" />
            </div>
            <h1 className="text-3xl font-bold text-gray-200 mb-8">How can I help you today?</h1>
            <p className="text-gray-400 mb-8 max-w-md text-center">
              Please upload a PDF document using the attachment icon below to start asking questions.
            </p>
          </div>
        ) : (
          <div className="flex flex-col w-full pb-32">
            {messages.map((msg) => (
              <div 
                key={msg.id} 
                className={`w-full border-b border-black/10 dark:border-gray-900/50 ${
                  msg.role === "assistant" ? "bg-[#444654]" : "bg-[#343541]"
                }`}
              >
                <div className="max-w-3xl mx-auto flex p-4 md:p-6 gap-4 md:gap-6">
                  <div className="flex-shrink-0 flex flex-col relative items-end">
                    <div className={`w-8 h-8 rounded-sm flex items-center justify-center text-white ${
                      msg.role === "assistant" ? "bg-[#10a37f]" : "bg-[#5436DA]"
                    }`}>
                      {msg.role === "assistant" ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
                    </div>
                  </div>
                  <div className="flex-1 text-gray-100 whitespace-pre-wrap leading-relaxed">
                    {msg.content}
                    
                    {msg.sources && msg.sources.length > 0 && (
                      <div className="mt-6 pt-4 border-t border-gray-600/50">
                        <p className="text-xs font-bold text-gray-400 mb-3 uppercase tracking-wider">Sources</p>
                        <div className="space-y-3">
                          {msg.sources.map((src, i) => (
                            <div key={i} className="bg-gray-800/50 rounded-md p-3 text-sm text-gray-300 border border-gray-700/50">
                              <p className="italic">&quot;{src.page_content}&quot;</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="w-full border-b border-black/10 dark:border-gray-900/50 bg-[#444654]">
                <div className="max-w-3xl mx-auto flex p-4 md:p-6 gap-4 md:gap-6">
                  <div className="flex-shrink-0 flex flex-col relative items-end">
                    <div className="w-8 h-8 rounded-sm flex items-center justify-center text-white bg-[#10a37f]">
                      <Bot className="w-5 h-5" />
                    </div>
                  </div>
                  <div className="flex-1 text-gray-100 flex items-center">
                    <div className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.2s" }}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: "0.4s" }}></span>
                    </div>
                  </div>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      <div className="absolute bottom-0 left-0 w-full bg-gradient-to-t from-[#343541] via-[#343541] to-transparent pt-10 pb-6 px-4">
        <div className="max-w-3xl mx-auto relative flex items-end w-full border border-gray-600 bg-[#40414f] rounded-xl shadow-md overflow-hidden p-2">
          
          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept=".pdf"
            onChange={handleFileChange}
          />
          
          <button 
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isUploading}
            className="p-2 text-gray-400 hover:text-gray-200 transition-colors disabled:opacity-50"
            title="Attach PDF"
          >
            {isUploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
          </button>
          
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={!sessionId ? "Upload a document first..." : "Message ChatGPT..."}
            className="w-full max-h-48 py-3 px-2 bg-transparent border-none focus:ring-0 resize-none outline-none text-white overflow-y-auto custom-scrollbar"
            rows={1}
            disabled={!sessionId || isLoading}
            style={{ minHeight: "44px" }}
          />

          <button
            onClick={handleSubmit}
            disabled={isLoading || !input.trim() || !sessionId}
            className={`p-2 rounded-lg transition-colors flex-shrink-0 ${
              input.trim() && sessionId && !isLoading
                ? "bg-[#10a37f] text-white"
                : "bg-transparent text-gray-500"
            }`}
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
        <div className="text-center text-xs text-gray-400 mt-3">
          ChatGPT can make mistakes. Consider checking important information.
        </div>
      </div>
    </div>
  );
}
