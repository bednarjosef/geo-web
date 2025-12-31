'use client';

import { useState, useRef, useEffect } from 'react';

// Types for our API response
interface GeoResult {
  lat: number;
  lon: number;
  confidence: number;
}

export default function GeoPage() {
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<GeoResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Clean up object URL to prevent memory leaks
  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  // Handle Global Paste (Ctrl+V)
  useEffect(() => {
    const handleGlobalPaste = (e: ClipboardEvent) => {
      if (e.clipboardData?.files) {
        const file = e.clipboardData.files[0];
        if (file && file.type.startsWith('image/')) {
          handleFileSelection(file);
        }
      }
    };
    window.addEventListener('paste', handleGlobalPaste);
    return () => window.removeEventListener('paste', handleGlobalPaste);
  }, []);

  const handleFileSelection = (file: File) => {
    setError(null);
    setResult(null);
    setImageFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const onUploadClick = () => fileInputRef.current?.click();

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileSelection(e.target.files[0]);
    }
  };

  const onPasteClick = async () => {
    try {
      const clipboardItems = await navigator.clipboard.read();
      for (const item of clipboardItems) {
        const imageType = item.types.find((type) => type.startsWith('image/'));
        if (imageType) {
          const blob = await item.getType(imageType);
          const file = new File([blob], "pasted-image.png", { type: imageType });
          handleFileSelection(file);
          return;
        }
      }
      setError("No image found in clipboard.");
    } catch (err) {
      console.error(err);
      setError("Clipboard access denied. Try Ctrl+V.");
    }
  };

  const handleLocate = async () => {
    if (!imageFile) return;

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append('file', imageFile);

    try {
      const res = await fetch('/api/v1/geolocate', {
        method: 'POST',
        body: formData,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Server Error: ${res.status}`);
      }

      const data: GeoResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 text-slate-50 flex flex-col items-center justify-center p-4 sm:p-6 font-sans">
      
      {/* Main Card */}
      <div className="w-full max-w-md bg-slate-800 rounded-xl shadow-2xl overflow-hidden flex flex-col border border-slate-700">
        
        {/* Header */}
        <div className="p-6 pb-2 text-center border-b border-slate-700/50">
          <h1 className="text-2xl font-bold text-white tracking-wide">
            NeuroGuessr
          </h1>
          <p className="text-slate-400 text-sm mt-1">
            Paste or upload image
          </p>
        </div>

        <div className="p-6 space-y-6 flex-grow flex flex-col">
          
          {/* Image Preview Area */}
          <div 
            className={`
              relative w-full aspect-[4/3] rounded-lg border-2 border-dashed transition-all duration-200
              flex items-center justify-center overflow-hidden
              ${previewUrl 
                ? 'border-blue-500/50 bg-black/20' 
                : 'border-slate-600 bg-slate-800/50 hover:bg-slate-700/50 hover:border-slate-500'
              }
            `}
          >
            {previewUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="w-full h-full object-contain" 
              />
            ) : (
              <div className="text-center p-4 text-slate-500">
                <svg className="w-10 h-10 mx-auto mb-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                <p className="text-sm font-medium">No image selected</p>
              </div>
            )}
          </div>

          {/* Controls */}
          <div className="grid grid-cols-2 gap-3">
            <input 
              type="file" 
              accept="image/*" 
              className="hidden" 
              ref={fileInputRef} 
              onChange={onFileChange} 
            />
            
            <button
              onClick={onUploadClick}
              className="flex items-center justify-center py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
              Upload
            </button>

            <button
              onClick={onPasteClick}
              className="flex items-center justify-center py-2.5 px-4 bg-slate-700 hover:bg-slate-600 text-slate-200 font-medium rounded-lg transition-colors active:scale-[0.98]"
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
              Paste
            </button>
          </div>

          {/* Action Button */}
          <button
            onClick={handleLocate}
            disabled={!imageFile || loading}
            className={`
              w-full py-3.5 text-lg font-semibold rounded-lg shadow-md transition-all duration-200
              flex items-center justify-center
              ${!imageFile || loading 
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
                : 'bg-blue-600 hover:bg-blue-500 text-white shadow-blue-900/20 active:bg-blue-700'
              }
            `}
          >
            {loading ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                Processing...
              </span>
            ) : (
              "Locate Image"
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-3 bg-red-900/30 border border-red-500/30 text-red-300 text-sm rounded-lg text-center">
              {error}
            </div>
          )}

        </div>
      </div>

      {/* Results Section */}
      {result && (
        <div className="w-full max-w-md mt-6 animate-in slide-in-from-bottom-4 fade-in duration-500">
          <div className="bg-slate-800 rounded-xl shadow-xl p-6 border border-slate-700">
            <div className="flex justify-between items-center mb-4 border-b border-slate-700 pb-3">
              <h2 className="text-lg font-bold text-white">Analysis Result</h2>
              <span className="text-xs font-semibold bg-green-900/40 text-green-400 px-2.5 py-1 rounded border border-green-500/20">
                SUCCESS
              </span>
            </div>
            
            <div className="grid grid-cols-2 gap-4 mb-5">
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Latitude</p>
                <p className="text-lg font-mono text-blue-200">{result.lat.toFixed(5)}</p>
              </div>
              <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-700/50">
                <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold mb-1">Longitude</p>
                <p className="text-lg font-mono text-blue-200">{result.lon.toFixed(5)}</p>
              </div>
            </div>

            <div className="flex items-center justify-between bg-slate-700/30 p-4 rounded-lg mb-5 border border-slate-700/50">
              <span className="text-sm font-medium text-slate-300">Confidence</span>
              <div className="flex items-center gap-3">
                <div className="w-24 h-1.5 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-blue-500" 
                    style={{ width: `${result.confidence * 100}%` }}
                  />
                </div>
                <span className="text-sm font-bold text-white">
                  {(result.confidence * 100).toFixed(1)}%
                </span>
              </div>
            </div>

            <a 
              href={`https://www.google.com/maps/search/?api=1&query=${result.lat},${result.lon}`}
              target="_blank"
              rel="noopener noreferrer"
              className="group block w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-center rounded-lg transition-all shadow-lg active:scale-[0.98]"
            >
              Open in Google Maps
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
