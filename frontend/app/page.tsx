'use client'

import React, { useState, useEffect, useRef } from 'react';
import { Upload, Send, FileText, MessageSquare, Loader2, AlertCircle } from 'lucide-react';

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

const API_BASE = 'http://localhost:8000';

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

  static async chat(
    query: string,
    mode: ChatMode,
    topK: number,
    sessionId: string
  ): Promise<ChatResponse> {
    const response = await fetch(`${API_BASE}/chat/ask`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        query,
        mode,
        top_k: topK,
        session_id: sessionId,
      }),
    });

    if (!response.ok) {
      throw new Error(`Chat request failed: ${response.statusText}`);
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
  // Split into lines for processing
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
    // Table detection
    if (line.trim().startsWith('|') && line.trim().endsWith('|')) {
      const cells = line.split('|').slice(1, -1);
      
      // Check if separator row
      if (cells.every(cell => /^[\s\-:]+$/.test(cell))) {
        return; // Skip separator
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

    // Headers
    if (line.startsWith('### ')) {
      elements.push(<h3 key={idx} className="text-lg font-bold mt-4 mb-2">{line.slice(4)}</h3>);
    } else if (line.startsWith('## ')) {
      elements.push(<h2 key={idx} className="text-xl font-bold mt-5 mb-3">{line.slice(3)}</h2>);
    } else if (line.startsWith('# ')) {
      elements.push(<h1 key={idx} className="text-2xl font-bold mt-6 mb-3">{line.slice(2)}</h1>);
    }
    // Lists
    else if (line.match(/^\d+\.\s/)) {
      elements.push(<li key={idx} className="ml-6 mb-1 list-decimal">{renderInlineMarkdown(line.replace(/^\d+\.\s/, ''))}</li>);
    } else if (line.match(/^[-*]\s/)) {
      elements.push(<li key={idx} className="ml-6 mb-1 list-disc">{renderInlineMarkdown(line.slice(2))}</li>);
    }
    // Code blocks
    else if (line.startsWith('```')) {
      return; // Skip for simplicity
    }
    // Regular text
    else if (line.trim()) {
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
    // Bold
    const boldMatch = remaining.match(/\*\*(.+?)\*\*/);
    if (boldMatch) {
      const before = remaining.slice(0, boldMatch.index);
      if (before) parts.push(before);
      parts.push(<strong key={key++}>{boldMatch[1]}</strong>);
      remaining = remaining.slice(boldMatch.index! + boldMatch[0].length);
      continue;
    }

    // Italic
    const italicMatch = remaining.match(/\*(.+?)\*/);
    if (italicMatch) {
      const before = remaining.slice(0, italicMatch.index);
      if (before) parts.push(before);
      parts.push(<em key={key++}>{italicMatch[1]}</em>);
      remaining = remaining.slice(italicMatch.index! + italicMatch[0].length);
      continue;
    }

    // Code
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

function MessageBubble({ message }: { message: Message }) {
  const isUser = message.role === 'user';

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
      <div
        className={`${isUser ? 'max-w-[75%]' : 'max-w-[90%]'} rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-900 border border-gray-200'
        }`}
      >
        {isUser ? (
          <p className="text-sm whitespace-pre-wrap break-words">{message.content}</p>
        ) : (
          <div className="text-sm prose prose-sm max-w-none">
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
    <div className="bg-amber-50 border border-amber-200 rounded-md p-3 text-sm">
      <div className="font-medium text-amber-900 mb-1">{pageRange}</div>
      <p className="text-gray-700 line-clamp-3">{citation.snippet}</p>
    </div>
  );
}

function CitationsDisplay({ citations }: { citations: Citation[] }) {
  if (!citations || citations.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      <div className="text-xs font-semibold text-gray-500 uppercase tracking-wide">
        Sources
      </div>
      {citations.map((citation, idx) => (
        <CitationCard key={idx} citation={citation} />
      ))}
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
      
      // Create document entries
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
    <div className="space-y-3">
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
        className={`flex items-center justify-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors cursor-pointer ${
          uploading
            ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
            : 'bg-blue-600 text-white hover:bg-blue-700'
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
        <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
          <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {success && (
        <div className="flex items-start gap-2 p-3 bg-green-50 border border-green-200 rounded-md text-sm text-green-800">
          <div className="w-4 h-4 mt-0.5 flex-shrink-0 rounded-full bg-green-600" />
          <span>Documents uploaded successfully!</span>
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
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-lg font-semibold text-gray-900">Uploaded Documents</h3>
        <button
          onClick={onClearAll}
          className="text-sm text-red-600 hover:text-red-700 font-medium"
        >
          Clear All
        </button>
      </div>
      <div className="space-y-2">
        {documents.map((doc) => (
          <div
            key={doc.doc_id}
            className="flex items-center justify-between p-3 bg-gray-50 border border-gray-200 rounded-lg"
          >
            <div className="flex items-center gap-3 flex-1 min-w-0">
              <FileText className="w-5 h-5 text-blue-600 flex-shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-medium text-gray-900 truncate">
                  {doc.filename}
                </p>
                <p className="text-xs text-gray-500">
                  {new Date(doc.uploadedAt).toLocaleString()}
                </p>
              </div>
            </div>
            <button
              onClick={() => onRemove(doc.doc_id)}
              className="ml-3 p-2 text-red-600 hover:bg-red-50 rounded-md transition-colors"
              title="Remove document"
            >
              <AlertCircle className="w-4 h-4" />
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
  const [topK, setTopK] = useState(5);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedDocIds, setSelectedDocIds] = useState<string[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Get messages for current mode
  const messages = mode === 'qa' ? qaMessages : summarizeMessages;
  const setMessages = mode === 'qa' ? setQaMessages : setSummarizeMessages;

  // Initialize with all documents selected
  useEffect(() => {
    if (documents.length > 0 && selectedDocIds.length === 0) {
      setSelectedDocIds(documents.map(d => d.doc_id));
    }
  }, [documents]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    if (!documentsUploaded) {
      setError('Please upload documents first');
      return;
    }

    const userMessage: Message = { role: 'user', content: input.trim() };
    
    // Add to QA messages
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
        sessionId
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
        sessionId
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
      {/* Controls */}
      <div className="flex-shrink-0 border-b border-gray-200 bg-white p-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMode('qa')}
              disabled={!documentsUploaded}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'qa'
                  ? 'bg-blue-600 text-white'
                  : documentsUploaded
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <MessageSquare className="w-4 h-4 inline mr-2" />
              QA Mode
            </button>
            
            <button
              onClick={() => setMode('summarize')}
              disabled={!documentsUploaded}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                mode === 'summarize'
                  ? 'bg-blue-600 text-white'
                  : documentsUploaded
                  ? 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  : 'bg-gray-100 text-gray-400 cursor-not-allowed'
              }`}
            >
              <FileText className="w-4 h-4 inline mr-2" />
              Summarize Mode
            </button>
          </div>

          {mode === 'qa' && (
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Results:</label>
              <select
                value={topK}
                onChange={e => setTopK(Number(e.target.value))}
                className="px-3 py-1.5 border border-gray-300 rounded-md text-sm"
              >
                <option value={3}>3</option>
                <option value={5}>5</option>
                <option value={7}>7</option>
                <option value={10}>10</option>
              </select>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="h-full flex items-center justify-center text-gray-400">
            <div className="text-center">
              {mode === 'qa' ? (
                <>
                  <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {documentsUploaded
                      ? 'Ask a question about your documents'
                      : 'Upload documents to begin'}
                  </p>
                </>
              ) : (
                <>
                  <FileText className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="text-sm">
                    {documentsUploaded
                      ? 'Click "Generate Summary" to get a comprehensive overview'
                      : 'Upload documents to begin'}
                  </p>
                </>
              )}
            </div>
          </div>
        )}

        {messages.map((msg, idx) => (
          <div key={idx}>
            <MessageBubble message={msg} />
            {msg.role === 'assistant' && msg.citations && (
              <div className="ml-4">
                <CitationsDisplay citations={msg.citations} />
              </div>
            )}
          </div>
        ))}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-gray-100 rounded-lg px-4 py-3 border border-gray-200">
              <Loader2 className="w-5 h-5 animate-spin text-gray-500" />
            </div>
          </div>
        )}

        {error && (
          <div className="flex items-start gap-2 p-3 bg-red-50 border border-red-200 rounded-md text-sm text-red-800">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div ref={chatEndRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 border-t border-gray-200 bg-white p-4">
        {mode === 'qa' ? (
          <div className="flex gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder={documentsUploaded ? 'Ask a question...' : 'Upload documents to begin'}
              disabled={loading || !documentsUploaded}
              rows={2}
              className="flex-1 px-4 py-2 border border-gray-300 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim() || !documentsUploaded}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {documents.length > 1 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-gray-700">
                    Select documents to summarize:
                  </label>
                  <div className="flex gap-2">
                    <button
                      onClick={selectAllDocs}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Select All
                    </button>
                    <span className="text-gray-300">|</span>
                    <button
                      onClick={deselectAllDocs}
                      className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {documents.map(doc => (
                    <label
                      key={doc.doc_id}
                      className="flex items-center gap-3 p-2 hover:bg-blue-100 rounded cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={selectedDocIds.includes(doc.doc_id)}
                        onChange={() => toggleDocSelection(doc.doc_id)}
                        className="w-4 h-4 text-blue-600 rounded"
                      />
                      <FileText className="w-4 h-4 text-blue-600 flex-shrink-0" />
                      <span className="text-sm text-gray-700 truncate flex-1">
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
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
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

  const handleRemoveDocument = (docId: string) => {
    const updated = documents.filter(d => d.doc_id !== docId);
    saveDocuments(updated);
    setDocuments(updated);
    setDocumentsUploaded(updated.length > 0);
    
    if (updated.length === 0) {
      setQaMessages([]);
      setSummarizeMessages([]);
    }
  };

  const handleClearDocuments = () => {
    if (confirm('Are you sure you want to clear all uploaded documents? This will reset your session.')) {
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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <FileText className="w-8 h-8 text-blue-600" />
            <div>
              <h1 className="text-xl font-bold text-gray-900">AtlasRAG</h1>
              <p className="text-xs text-gray-500">Multi-Document Research Assistant</p>
            </div>
          </div>

          <nav className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage('home')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'home'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              Home
            </button>
            <button
              onClick={() => setCurrentPage('chat')}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                currentPage === 'chat'
                  ? 'bg-blue-100 text-blue-700'
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
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Welcome to AtlasRAG
              </h2>
              <p className="text-gray-600 mb-8">
                A powerful multi-document research assistant powered by hybrid Graph-RAG retrieval.
                Upload your PDF documents to ask questions or generate comprehensive summaries.
              </p>

              <div className="mb-8">
                <div
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-medium ${
                    documentsUploaded
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  <div
                    className={`w-2 h-2 rounded-full ${
                      documentsUploaded ? 'bg-green-600' : 'bg-gray-400'
                    }`}
                  />
                  {documentsUploaded ? 'Documents Uploaded' : 'No Documents Uploaded'}
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">
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
                  <h3 className="text-lg font-semibold text-gray-900 mb-3">Features</h3>
                  <ul className="space-y-2 text-gray-600">
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>
                        <strong>QA Mode:</strong> Ask questions and get precise answers with citations
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>
                        <strong>Summarize Mode:</strong> Generate comprehensive document summaries
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>
                        <strong>Conversation Memory:</strong> Context-aware multi-turn conversations
                      </span>
                    </li>
                    <li className="flex items-start gap-2">
                      <span className="text-blue-600 font-bold">•</span>
                      <span>
                        <strong>Hybrid Retrieval:</strong> Vector search + Graph-RAG for better accuracy
                      </span>
                    </li>
                  </ul>
                </div>

                {documentsUploaded && (
                  <button
                    onClick={() => setCurrentPage('chat')}
                    className="w-full mt-6 px-6 py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
                  >
                    Go to Chat
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
  );
}