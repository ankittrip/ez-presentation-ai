import React, { useState } from 'react';
import { Presentation, Loader2, Download, AlertCircle } from 'lucide-react';

export default function App() {
  const [markdown, setMarkdown] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    if (!markdown.trim()) {
      setError('Please enter some markdown content first.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/presentation/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ markdownContent: markdown }),
      });

      if (!response.ok) {
        throw new Error(`Server responded with status ${response.status}`);
      }

      // Extract the response as a binary Blob
      const blob = await response.blob();

      // Create a temporary object URL for the blob
      const url = window.URL.createObjectURL(blob);

      // Create a hidden anchor element to trigger the download
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `Presentation_${Date.now()}.pptx`);
      
      // Append, click, and clean up
      document.body.appendChild(link);
      link.click();
      link.parentNode.removeChild(link);
      window.URL.revokeObjectURL(url);

    } catch (err) {
      console.error('Generation Error:', err);
      setError(err.message || 'Failed to generate presentation. Check if backend is running.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 flex items-center justify-center p-4 font-sans selection:bg-indigo-500/30">
      <div className="w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden">
        
        {/* Header Section */}
        <div className="p-8 border-b border-slate-800 bg-slate-900/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-indigo-500/10 rounded-lg border border-indigo-500/20">
              <Presentation className="w-6 h-6 text-indigo-400" />
            </div>
            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
              AI Presentation Generator
            </h1>
          </div>
          <p className="text-slate-400 text-sm">
            Paste your Markdown below and let AI craft a beautifully formatted `.pptx` file in seconds.
          </p>
        </div>

        {/* Main Content */}
        <div className="p-8 space-y-6">
          
          {/* Error Alert */}
          {error && (
            <div className="flex items-center gap-2 p-4 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
              <AlertCircle className="w-5 h-5 shrink-0" />
              <p>{error}</p>
            </div>
          )}

          {/* Textarea */}
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-cyan-500 rounded-xl blur opacity-20 group-hover:opacity-40 transition duration-500"></div>
            <textarea
              value={markdown}
              onChange={(e) => setMarkdown(e.target.value)}
              placeholder="# Introduction&#10;Welcome to the presentation...&#10;&#10;## Key Metrics&#10;- Point 1&#10;- Point 2"
              className="relative w-full h-80 bg-slate-950 border border-slate-800 text-slate-200 placeholder:text-slate-600 rounded-xl p-5 font-mono text-sm resize-y focus:outline-none focus:ring-2 focus:ring-indigo-500/50 transition-all"
              spellCheck="false"
            />
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isLoading || !markdown.trim()}
            className={`w-full relative group overflow-hidden rounded-xl p-[1px] transition-all duration-300 ${
              isLoading || !markdown.trim() ? 'opacity-50 cursor-not-allowed' : 'hover:scale-[1.01] active:scale-[0.99]'
            }`}
          >
            <span className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500 rounded-xl opacity-70 group-hover:opacity-100 transition-opacity duration-300"></span>
            <div className="relative flex items-center justify-center gap-2 bg-slate-950 px-8 py-4 rounded-xl transition-all duration-300 group-hover:bg-slate-900/50">
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 text-indigo-400 animate-spin" />
                  <span className="font-semibold text-slate-200 tracking-wide">
                    Generating (Takes 5-8 seconds)...
                  </span>
                </>
              ) : (
                <>
                  <Download className="w-5 h-5 text-indigo-400" />
                  <span className="font-semibold text-slate-200 tracking-wide">
                    Generate & Download PPTX
                  </span>
                </>
              )}
            </div>
          </button>

        </div>
      </div>
    </div>
  );
}