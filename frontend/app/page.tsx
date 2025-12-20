'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, MessageSquare, Loader2, AlertCircle, Trash2 } from 'lucide-react';

// Add custom scrollbar styles
const customScrollbarStyles = `
  .custom-scrollbar::-webkit-scrollbar {
    width: 8px;
    height: 8px;
  }
  .custom-scrollbar::-webkit-scrollbar-track {
    background: #f1f5f9;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb {
    background: #cbd5e1;
    border-radius: 10px;
  }
  .custom-scrollbar::-webkit-scrollbar-thumb:hover {
    background: #94a3b8;
  }
`;

// TYPE DEFINITIONS

interface Citation {
  page_start: number;
  page_end: number;
  snippet: string;
}

interface ChatResponse {
  answer: string;
  citations: Citation[];
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  citations?: Citation[];
}

interface UploadedDocument {
  doc_id: string;
  filename: string;
  uploadedAt: string;
}

type ChatMode = 'qa' | 'summarize';

// API SERVICE

const API_BASE = 'https://sanskarmodi-atlasrag-backend.hf.space';

class ApiService {
  static async uploadDocuments(files: File[]): Promise<Record<string, any>> {
    const formData = new FormData();
    files.forEach(file => formData.append('files', file));

    const response = await fetch(`${API_BASE}/docs/upload`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async removeDocument(docId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/docs/remove/${docId}`, {
      method: 'DELETE',
    });

    if (!response.ok) {
      throw new Error(`Remove failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async chat(
    query: string,
    mode: ChatMode,
    topK: number,
    sessionId: string,
    docIds?: string[]
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        mode,
        top_k: topK,
        session_id: sessionId,
        doc_ids: docIds || null,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
    }

    return response.json();
  }

  static async clearConversation(sessionId: string): Promise<any> {
    const response = await fetch(`${API_BASE}/chat/clear?session_id=${sessionId}`, {
      method: 'POST',
    });

    if (!response.ok) {
      throw new Error(`Clear failed: ${response.statusText}`);
    }

    return response.json();
  }
}

// DOCUMENT STORAGE

function getStoredDocuments(): UploadedDocument[] {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('atlasrag_documents');
  return stored ? JSON.parse(stored) : [];
}

function saveDocuments(docs: UploadedDocument[]): void {
  localStorage.setItem('atlasrag_documents', JSON.stringify(docs));
  localStorage.setItem('atlasrag_docs_uploaded', docs.length > 0 ? 'true' : 'false');
}

// SESSION MANAGEMENT

function getSessionId(): string {
  if (typeof window === 'undefined') return 'default';
  
  let sessionId = localStorage.getItem('atlasrag_session_id');
  if (!sessionId) {
    sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem('atlasrag_session_id', sessionId);
  }
  return sessionId;
}

// MARKDOWN RENDERING

function renderMarkdown(text: string): React.ReactNode {
  const lines = text.split('\n');
  const elements: React.ReactNode[] = [];
  let inTable = false;
  let tableRows: string[][] = [];
  let tableHeaders: string[] = [];

  const flushTable = () => {
    if (tableRows.length > 0) {
      elements.push(
        <div key={`table-${elements.length}`} className="overflow-x-auto my-4">
          <table className="min-w-full border-collapse border border-gray-300 text-sm">
            {tableHeaders.length > 0 && (
              <thead className="bg-gray-50">
                <tr>
                  {tableHeaders.map((header, idx) => (
                    <th key={idx} className="border border-gray-300 px-3 py-2 text-left font-semibold">
                      {header.trim()}
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {tableRows.map((row, rowIdx) => (
                <tr key={rowIdx} className={rowIdx % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  {row.map((cell, cellIdx) => (
                    <td key={cellIdx} className="border border-gray-300 px-3 py-2">
                      {renderInlineMarkdown(cell.trim())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
      tableRows = [];
      tableHeaders = [];
      inTable = false;
    }
  };

  lines.forEach((line, idx) => {
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      
      if (cells.every(cell => /^[\s\-:]+$/.test(cell))) {
        return;
      }
      
      if (!inTable) {
        inTable = true;
        tableHeaders = cells;
      } else {
        tableRows.push(cells);
      }
      return;
    } else if (inTable) {
      flushTable();
    }

    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-xl font-bold mt-5 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>);
    } else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={idx} className="ml-6 mb-1 list-decimal">{renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.match(/^[-*]\s/)) {
      elements.push(<li key={idx} className="ml-6 mb-1 list-disc">{renderInlineMarkdown(line.slice(2))}</li>);
    } else if (line.startsWith('```')) {
      return;
    } else if (line.trim()) {
      elements.push(<p key={idx} className="mb-2">{renderInlineMarkdown(line)}</p>);
    } else {
      elements.push(<br key={idx} />);
    }
  });

  flushTable();
  return elements;
}

function renderInlineMarkdown(text: string): React.ReactNode {
  const parts: React.ReactNode[] = [];
  let remaining = text;
  let key = 0;

  while (remaining) {
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) parts.push(before);
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
      continue;
    }

    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index);
      if (before) parts.push(before);
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
      continue;
    }

    const codeMatch = remaining.match(/`(.+?)`/);
    if (codeMatch) {
      const before = remaining.slice(0, codeMatch.index);
      if (before) parts.push(before);
      parts.push(<code key={key++} className="bg-gray-200 px-1 rounded text-xs">{codeMatch[1]}</code>);
      remaining = remaining.slice(codeMatch.index! + codeMatch[0].length);
      continue;
    }

    parts.push(remaining);
    break;
  }

  return parts;
}

// COMPONENTS

function MessageBubble({ message, mode }: { message: Message; mode?: ChatMode }) {
  const isUser = message.role === 'user';
  const isSummary = mode === 'summarize' && !isUser;

  return (
    <div className={`flex ${isUser ? 'justify-end' : isSummary ? 'justify-center' : 'justify-start'} mb-4`}>
      <div
        className={`${
          isUser 
            ? 'max-w-[75%]' 
            : isSummary 
            ? 'max-w-full w-full' 
            : 'max-w-[90%]'
        } rounded-lg px-5 py-4 ${
          isUser
            ? 'bg-blue-600 text-white shadow-sm'
            : 'bg-white text-gray-900 border border-gray-200 shadow-sm'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words leading-relaxed">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none leading-relaxed">
            {renderMarkdown(message.content)}
          </div>
        )}
      </div>
    </div>
  );
}

function CitationCard({ citation }: { citation: Citation }) {
  const pageRange =
    citation.page_start === citation.page_end
      ? `Page ${citation.page_start}`
      : `Pages ${citation.page_start}-${citation.page_end}`;

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4 text-sm shadow-sm hover:shadow-md transition-shadow">
      <div className="font-semibold text-amber-900 mb-2 flex items-center gap-2">
        <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
        {pageRange}
      </div>
      <p className="text-gray-700 leading-relaxed">{citation.snippet}</p>
    </div>
  );
}

function CitationsDisplay({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-4 ml-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="h-px bg-gradient-to-r from-amber-300 to-transparent flex-1" />
        <div className="text-xs font-bold text-amber-800 uppercase tracking-wider px-3 py-1 bg-amber-100 rounded-full">
          📚 Sources ({citations.length})
        </div>
        <div className="h-px bg-gradient-to-l from-amber-300 to-transparent flex-1" />
      </div>
      <div className="space-y-2">
        {citations.map((citation, idx) => (
          <CitationCard key={idx} citation={citation} />
        ))}
      </div>
    </div>
  );
}

function UploadPanel({ onUploadSuccess }: { onUploadSuccess: (docs: UploadedDocument[]) => void }) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const pdfFiles = Array.from(files).filter(f => f.name.toLowerCase().endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      setError('Please select PDF files only');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await ApiService.uploadDocuments(pdfFiles);
      
      const existingDocs = getStoredDocuments();
      const newDocs: UploadedDocument[] = [];
      
      Object.keys(response).forEach((docId, idx) => {
        newDocs.push({
          doc_id: docId,
          filename: pdfFiles[idx].name,
          uploadedAt: new Date().toISOString(),
        });
      });
      
      const allDocs = [...existingDocs, ...newDocs];
      saveDocuments(allDocs);
      
      setSuccess(true);
      onUploadSuccess(allDocs);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="space-y-4">
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf"
        multiple
        onChange={handleUpload}
        disabled={uploading}
        className="hidden"
        id="pdf-upload"
      />
      
      <label
        htmlFor="pdf-upload"
        className={`flex items-center justify-center gap-3 px-6 py-4 rounded-xl font-semibold transition-all cursor-pointer shadow-md ${
          uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white hover:from-blue-700 hover:to-indigo-700 hover:shadow-lg'
        }`}
      >
        {uploading ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Uploading...
          </>
        ) : (
          <>
            <Upload className="w-5 h-5" />
            Upload PDF Documents
          </>
        )}
      </label>

      {error && (
        <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-xl text-sm text-red-800 shadow-sm">
          <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-3 p-4 bg-green-50 border border-green-200 rounded-xl text-sm text-green-800 shadow-sm">
          <div className="w-5 h-5 mt-0.5 flex-shrink-0 rounded-full bg-green-600 flex items-center justify-center">
            <div className="w-2 h-2 bg-white rounded-full" />
          </div>
          <span className="font-medium">Documents uploaded successfully!</span>
        </div>
      )}
    </div>
  );
}

function DocumentManager({ 
  documents, 
  onRemove, 
  onClearAll 
}: { 
  documents: UploadedDocument[];
  onRemove: (docId: string) => void;
  onClearAll: () => void;
}) {
  if (documents.length === 0) return null;

  return (
    <div className="mt-6 pt-6 border-t border-gray-200">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
          <FileText className="w-5 h-5 text-blue-600" />
          Uploaded Documents ({documents.length})
        </h3>
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:text-red-700 font-semibold hover:bg-red-50 px-3 py-1.5 rounded-lg transition-colors"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto custom-scrollbar pr-2">
        {documents.map((doc) => (
          <div
            key={doc.doc_id}
            className="flex items-center justify-between p-4 bg-gradient-to-r from-gray-50 to-blue-50 border border-gray-200 rounded-xl hover:shadow-md transition-all group"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <div className="w-10 h-10 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <FileText className="w-5 h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 truncate group-hover:text-blue-600 transition-colors">
                  {doc.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(doc.doc_id)}
              className="ml-3 p-2.5 text-red-600 hover:bg-red-100 rounded-lg transition-all opacity-0 group-hover:opacity-100"
              title="Remove document"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

interface ChatInterfaceProps {
  documentsUploaded: boolean;
  documents: UploadedDocument[];
  qaMessages: Message[];
  setQaMessages: React.Dispatch<React.SetStateAction<Message[]>>;
  summarizeMessages: Message[];
  setSummarizeMessages: React.Dispatch<React.SetStateAction<Message[]>>;
}

function ChatInterface({ 
  documentsUploaded,
  documents,
  qaMessages, 
  setQaMessages,
  summarizeMessages,
  setSummarizeMessages 
}: ChatInterfaceProps) {
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<ChatMode>('qa');
  const [topK, setTopK] = useState(3);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const messages = mode === 'qa' ? qaMessages : summarizeMessages;
  const setMessages = mode === 'qa' ? setQaMessages : setSummarizeMessages;

  useEffect(() => {
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds(documents.map(d => d.doc_id));
    }
  }, [documents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleClearOutput = async () => {
    if (confirm('Are you sure you want to clear this conversation?')) {
      setMessages([]);
      try {
        const sessionId = getSessionId();
        await ApiService.clearConversation(sessionId);
      } catch (err) {
        console.error('Error clearing conversation:', err);
      }
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!documentsUploaded) {
      setError('Please upload documents first');
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    setQaMessages(prev => [...prev, userMessage]);
    
    setInput('');
    setError(null);
    setLoading(true);

    try {
      const sessionId = getSessionId();
      const response = await ApiService.chat(
        userMessage.content,
        'qa',
        topK,
        sessionId,
        selectedDocIds.length === documents.length ? undefined : selectedDocIds
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
        citations: response.citations,
      };

      setQaMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    if (loading || !documentsUploaded) return;

    if (selectedDocIds.length === 0) {
      setError('Please select at least one document to summarize');
      return;
    }

    setError(null);
    setLoading(true);

    try {
      const sessionId = getSessionId();
      const selectedDocs = documents.filter(d => selectedDocIds.includes(d.doc_id));
      const docNames = selectedDocs.map(d => d.filename).join(', ');
      
      const response = await ApiService.chat(
        `Please provide a comprehensive summary of the following documents: ${docNames}`,
        'summarize',
        5,
        sessionId,
        selectedDocIds
      );

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.answer,
      };

      setSummarizeMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const toggleDocSelection = (docId: string) => {
    setSelectedDocIds(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  };

  const selectAllDocs = () => {
    setSelectedDocIds(documents.map(d => d.doc_id));
  };

  const deselectAllDocs = () => {
    setSelectedDocIds([]);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full">
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMode('qa')}
              disabled={!documentsUploaded}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                mode === 'qa'
                  ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-md'
                  : documentsUploaded
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              QA Mode
            </button>
            
            <button
              onClick={() => setMode('summarize')}
              disabled={!documentsUploaded}
              className={`px-5 py-2.5 rounded-xl font-semibold transition-all shadow-sm ${
                mode === 'summarize'
                  ? 'bg-gradient-to-r from-green-600 to-emerald-600 text-white shadow-md'
                  : documentsUploaded
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200 hover:shadow-sm'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Summarize Mode
            </button>

            {messages.length > 0 && (
              <button
                onClick={handleClearOutput}
                className="px-4 py-2.5 rounded-xl font-semibold text-red-600 hover:bg-red-50 transition-all flex items-center gap-2 shadow-sm hover:shadow-md"
              >
                <Trash2 className="w-4 h-4" />
                Clear Output
              </button>
            )}
          </div>

          {mode === 'qa' && (
            <div className="flex items-center gap-3 bg-gray-50 px-4 py-2 rounded-xl border border-gray-200">
              <label className="text-sm text-gray-700 font-medium">Top Results:</label>
              <select
                value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm font-medium bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              > 
                <option value={1}>1</option>
                <option value={2}>2</option>
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gradient-to-b from-gray-50 to-white custom-scrollbar">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center p-8">
              {mode === 'qa' ? (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-10 h-10 text-blue-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    {documentsUploaded ? 'Ready to Answer' : 'Upload Documents'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {documentsUploaded
                      ? 'Ask any question about your documents'
                      : 'Upload PDF documents to get started'}
                  </p>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center">
                    <FileText className="w-10 h-10 text-green-600" />
                  </div>
                  <p className="text-lg font-medium text-gray-600 mb-2">
                    {documentsUploaded ? 'Ready to Summarize' : 'Upload Documents'}
                  </p>
                  <p className="text-sm text-gray-500">
                    {documentsUploaded
                      ? 'Generate a comprehensive summary of your documents'
                      : 'Upload PDF documents to get started'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx}>
            <MessageBubble message={msg} mode={mode} />
            {msg.role === 'assistant' && msg.citations && (
              <CitationsDisplay citations={msg.citations} />
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-center">
            <div className="bg-white rounded-lg px-6 py-4 border border-gray-200 shadow-sm flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin text-blue-600" />
              <span className="text-sm text-gray-600 font-medium">
                {mode === 'summarize' ? 'Generating summary...' : 'Thinking...'}
              </span>
            </div>
          </div>
        )}

        {error && (
          <div className="flex justify-center">
            <div className="flex items-start gap-2 p-4 bg-red-50 border border-red-200 rounded-lg text-sm text-red-800 shadow-sm max-w-2xl">
              <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4 shadow-lg">
        {mode === 'qa' ? (
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={documentsUploaded ? 'Ask a question...' : 'Upload documents to begin'}
              disabled={loading || !documentsUploaded}
              rows={2}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-400 shadow-sm"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !documentsUploaded}
              className="px-6 py-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all shadow-sm hover:shadow-md disabled:shadow-none flex items-center justify-center"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {documents.length > 1 && (
              <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5 shadow-sm">
                <div className="flex items-center justify-between mb-4">
                  <label className="text-sm font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-4 h-4 text-blue-600" />
                    Select documents to summarize
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllDocs}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllDocs}
                      className="text-xs text-blue-600 hover:text-blue-700 font-semibold px-2 py-1 hover:bg-blue-100 rounded transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                  {documents.map(doc => (
                    <label
                      key={doc.doc_id}
                      className="flex items-center gap-3 p-3 hover:bg-white rounded-lg cursor-pointer transition-colors border border-transparent hover:border-blue-200"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.doc_id)}
                        onChange={() => toggleDocSelection(doc.doc_id)}
                        className="w-4 h-4 text-blue-600 rounded focus:ring-2 focus:ring-blue-500"
                      />
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1 font-medium">
                        {doc.filename}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
            )}
            <button
              onClick={handleSummarize}
              disabled={loading || !documentsUploaded || selectedDocIds.length === 0}
              className="w-full px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-300 disabled:to-gray-300 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg disabled:shadow-none flex items-center justify-center gap-3"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Summary...
                </>
              ) : (
                <>
                  <FileText className="w-5 h-5" />
                  Generate Summary {selectedDocIds.length > 0 && `(${selectedDocIds.length} ${selectedDocIds.length === 1 ? 'document' : 'documents'})`}
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

// MAIN APP

export default function AtlasRAGApp() {
  const [currentPage, setCurrentPage] = useState<'home' | 'chat'>('home');
  const [documentsUploaded, setDocumentsUploaded] = useState(false);
  const [documents, setDocuments] = useState<UploadedDocument[]>([]);
  const [qaMessages, setQaMessages] = useState<Message[]>([]);
  const [summarizeMessages, setSummarizeMessages] = useState<Message[]>([]);

  useEffect(() => {
    const docs = getStoredDocuments();
    setDocuments(docs);
    setDocumentsUploaded(docs.length > 0);
  }, []);

  const handleUploadSuccess = (docs: UploadedDocument[]) => {
    setDocuments(docs);
    setDocumentsUploaded(true);
  };

  const handleRemoveDocument = async (docId: string) => {
    try {
      await ApiService.removeDocument(docId);
      const updated = documents.filter(d => d.doc_id !== docId);
      saveDocuments(updated);
      setDocuments(updated);
      setDocumentsUploaded(updated.length > 0);
      
      if (updated.length === 0) {
        setQaMessages([]);
        setSummarizeMessages([]);
      }
    } catch (err) {
      console.error('Error removing document:', err);
      alert('Failed to remove document. Please try again.');
    }
  };

  const handleClearDocuments = async () => {
    if (confirm('Are you sure you want to clear all uploaded documents? This will reset your session.')) {
      try {
        for (const doc of documents) {
          await ApiService.removeDocument(doc.doc_id);
        }
      } catch (err) {
        console.error('Error clearing documents:', err);
      }
      
      localStorage.removeItem('atlasrag_documents');
      localStorage.removeItem('atlasrag_docs_uploaded');
      localStorage.removeItem('atlasrag_session_id');
      setDocuments([]);
      setDocumentsUploaded(false);
      setQaMessages([]);
      setSummarizeMessages([]);
      setCurrentPage('home');
    }
  };

  return (
    <>
      <style dangerouslySetInnerHTML={{ __html: customScrollbarStyles }} />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex flex-col">
        {/* Header */}
        <header className="bg-white border-b border-gray-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">AtlasRAG</h1>
                <p className="text-xs text-gray-500">Multi-Document Research Assistant</p>
              </div>
            </div>

            <nav className="flex items-center gap-2">
              <button
                onClick={() => setCurrentPage('home')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'home'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Home
              </button>
              <button
                onClick={() => setCurrentPage('chat')}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  currentPage === 'chat'
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Chat
              </button>
              {documentsUploaded && (
                <button
                  onClick={handleClearDocuments}
                  className="px-4 py-2 rounded-lg font-medium text-red-600 hover:bg-red-50 transition-colors"
                  title="Clear all documents and reset session"
                >
                  Clear Docs
                </button>
              )}
            </nav>
          </div>
        </header>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {currentPage === 'home' ? (
            <div className="max-w-4xl mx-auto px-4 py-12">
              <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-8">
                <div className="text-center mb-8">
                  <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl mb-4 shadow-lg">
                    <FileText className="w-8 h-8 text-white" />
                  </div>
                  <h2 className="text-3xl font-bold text-gray-900 mb-3">
                    Welcome to AtlasRAG
                  </h2>
                  <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                    A powerful multi-document research assistant powered by hybrid Graph-RAG retrieval.
                    Upload your PDF documents to ask questions or generate comprehensive summaries.
                  </p>
                </div>

                <div className="mb-8 flex justify-center">
                  <div
                    className={`inline-flex items-center gap-3 px-5 py-3 rounded-full text-sm font-semibold shadow-md transition-all ${
                      documentsUploaded
                        ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div
                      className={`w-3 h-3 rounded-full animate-pulse ${
                        documentsUploaded ? 'bg-white' : 'bg-gray-400'
                      }`}
                    />
                    {documentsUploaded ? `${documents.length} Document${documents.length !== 1 ? 's' : ''} Ready` : 'No Documents Uploaded'}
                  </div>
                </div>

                <div className="space-y-8">
                  <div>
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <Upload className="w-5 h-5 text-blue-600" />
                      Upload Documents
                    </h3>
                    <UploadPanel onUploadSuccess={handleUploadSuccess} />
                  </div>

                  <DocumentManager
                    documents={documents}
                    onRemove={handleRemoveDocument}
                    onClearAll={handleClearDocuments}
                  />

                  <div className="pt-6 border-t border-gray-200">
                    <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center gap-2">
                      <MessageSquare className="w-5 h-5 text-blue-600" />
                      Features
                    </h3>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">QA Mode</h4>
                            <p className="text-sm text-gray-600">Ask questions and get precise answers with citations</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-green-50 to-emerald-50 border border-green-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-green-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">Summarize Mode</h4>
                            <p className="text-sm text-gray-600">Generate comprehensive document summaries</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-purple-50 to-pink-50 border border-purple-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-purple-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <MessageSquare className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">Conversation Memory</h4>
                            <p className="text-sm text-gray-600">Context-aware multi-turn conversations</p>
                          </div>
                        </div>
                      </div>
                      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3">
                          <div className="w-8 h-8 bg-orange-600 rounded-lg flex items-center justify-center flex-shrink-0">
                            <FileText className="w-5 h-5 text-white" />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900 mb-1">Hybrid Retrieval</h4>
                            <p className="text-sm text-gray-600">Vector search + Graph-RAG for better accuracy</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {documentsUploaded && (
                    <button
                      onClick={() => setCurrentPage('chat')}
                      className="w-full mt-6 px-6 py-4 bg-gradient-to-r from-blue-600 to-indigo-600 text-white rounded-xl font-bold text-lg hover:from-blue-700 hover:to-indigo-700 transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-3"
                    >
                      <MessageSquare className="w-6 h-6" />
                      Start Chatting
                    </button>
                  )}
                </div>
              </div>
            </div>
          ) : (
            <div className="h-full">
              <ChatInterface 
                documentsUploaded={documentsUploaded}
                documents={documents}
                qaMessages={qaMessages}
                setQaMessages={setQaMessages}
                summarizeMessages={summarizeMessages}
                setSummarizeMessages={setSummarizeMessages}
              />
            </div>
          )}
        </main>

        {/* Footer */}
        <footer className="bg-white border-t border-gray-200 py-4">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-gray-500">
            AtlasRAG Backend v0.0.0 • Powered by FastAPI + Graph-RAG
          </div>
        </footer>
      </div>
    </>
  );
}