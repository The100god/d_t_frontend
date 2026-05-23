import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Image, Upload, Camera, Search, Trash2, Copy, Check, Loader2, RefreshCw } from 'lucide-react';
import ImageUploadAndCapture from '../components/ImageUploadAndCapture';

const Library = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkConfirmOpen, setBulkConfirmOpen] = useState(false);

  const isLightMode = localStorage.getItem('app-mode') === 'light';

  // Fetch Library Images
  const fetchLibrary = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/media`);
      setImages(res.data);
    } catch (err) {
      console.error('Error fetching library:', err);
      setError('Failed to fetch media library. Please ensure your backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibrary();
  }, []);

  // Copy to clipboard helper
  const handleCopyUrl = (url, id) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    setTimeout(() => {
      setCopiedId(null);
    }, 2000);
  };

  // Delete handler
  const handleDeleteMedia = async (id) => {
    setIsDeleting(true);
    setError('');
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/media/${id}`);
      setImages(prev => prev.filter(img => img._id !== id));
      setDeleteConfirmId(null);
    } catch (err) {
      console.error('Error deleting media:', err);
      setError('Failed to delete media asset. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Callback when a new image is uploaded in the library dashboard
  const handleQuickUpload = async (newImageUrl) => {
    if (newImageUrl) {
      fetchLibrary(); // Refetch library to get the complete new document
    }
  };

  // Selection handlers
  const handleToggleSelect = (id) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredImages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredImages.map(img => img._id));
    }
  };

  const handleClearSelection = () => {
    setSelectedIds([]);
  };

  const handleBulkDelete = async () => {
    setIsDeleting(true);
    setError('');
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/media/delete-bulk`, { ids: selectedIds });
      setImages(prev => prev.filter(img => !selectedIds.includes(img._id)));
      setSelectedIds([]);
      setBulkConfirmOpen(false);
    } catch (err) {
      console.error('Error bulk deleting media:', err);
      setError('Failed to bulk delete media assets. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Filtered Images
  const filteredImages = images.filter(img => 
    (img.fileName && img.fileName.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (img.url && img.url.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
      return url;
    }
    return `${import.meta.env.VITE_API_URL}${url}`;
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl min-h-screen">
      
      {/* Header section */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <Image className="text-vibrant-primary animate-pulse" size={32} />
            Media Library
          </h1>
          <p className="text-slate-400 mt-1 max-w-lg">
            Manage your Cloudinary media files. Upload photos, copy secure URLs, and integrate them directly into your quizzes.
          </p>
        </div>
        
        {/* Quick Upload Action */}
        <div className="flex items-center gap-3 shrink-0">
          <ImageUploadAndCapture 
            value="" 
            onChange={handleQuickUpload}
            label="Upload to Library"
            multiple={true}
          />
          <button 
            onClick={fetchLibrary} 
            className="btn-secondary px-3 py-2.5 flex items-center justify-center cursor-pointer"
            title="Refresh Library"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      {/* Main card */}
      <div className="glass-card p-6 space-y-6">
        
        {/* Search Bar */}
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
          <input 
            type="text" 
            placeholder="Search assets by filename or URL keyword..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-12 text-sm"
          />
        </div>

        {/* Selection Bar */}
        {images.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-white/5 border border-white/10 rounded-2xl animate-in fade-in duration-300">
            <div className="flex items-center gap-3">
              <input 
                type="checkbox"
                checked={filteredImages.length > 0 && selectedIds.length === filteredImages.length}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-white/20 text-vibrant-primary focus:ring-vibrant-primary/50 bg-white/5 cursor-pointer"
              />
              <span className="text-sm font-semibold text-slate-300">
                {selectedIds.length > 0 
                  ? `${selectedIds.length} of ${filteredImages.length} selected`
                  : 'Select items to bulk manage'
                }
              </span>
            </div>
            
            {selectedIds.length > 0 && (
              <div className="flex items-center gap-3 animate-in slide-in-from-right-3 duration-200">
                <button
                  onClick={handleClearSelection}
                  className="px-3 py-1.5 rounded-xl border border-white/10 text-xs font-bold text-slate-400 hover:text-white hover:bg-white/5 cursor-pointer transition-all"
                >
                  Clear Selection
                </button>
                <button
                  onClick={() => setBulkConfirmOpen(true)}
                  className="px-4 py-1.5 rounded-xl text-xs font-bold text-white bg-red-500/20 hover:bg-red-500 border border-red-500/30 hover:border-red-600 shadow-lg shadow-red-950/10 cursor-pointer flex items-center gap-1.5 transition-all"
                >
                  <Trash2 size={14} />
                  <span>Delete Selected</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Errors */}
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        {/* Loading Spinner */}
        {loading ? (
          <div className="py-20 flex flex-col items-center justify-center text-slate-400 gap-2">
            <Loader2 className="animate-spin text-vibrant-primary" size={40} />
            <p className="text-sm font-semibold">Loading media assets...</p>
          </div>
        ) : filteredImages.length === 0 ? (
          /* Empty State */
          <div className="py-20 flex flex-col items-center justify-center text-slate-500 border border-white/5 border-dashed rounded-2xl p-8 bg-white/5 text-center">
            <Image size={48} className="mb-4 text-slate-600 animate-bounce" />
            <h3 className="text-lg font-bold text-white mb-1">No Media Assets Found</h3>
            <p className="text-sm text-slate-400 max-w-sm">
              {searchQuery ? "No assets match your search criteria. Try a different query." : "You haven't uploaded any media files yet. Click 'Upload to Library' above to start!"}
            </p>
          </div>
        ) : (
          /* Media Grid */
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredImages.map((img) => (
              <div 
                key={img._id}
                className="group relative glass-card border border-white/10 rounded-2xl overflow-hidden shadow-lg hover:border-vibrant-primary/50 hover:shadow-vibrant-primary/5 transition-all duration-300 flex flex-col"
              >
                
                {/* Image Container */}
                <div className="aspect-video w-full bg-black overflow-hidden relative border-b border-white/10 shrink-0">
                  {/* Selection Checkbox */}
                  <div className={`absolute top-3 left-3 z-10 transition-opacity duration-200 ${
                    selectedIds.length > 0 ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                  }`}>
                    <input 
                      type="checkbox"
                      checked={selectedIds.includes(img._id)}
                      onChange={() => handleToggleSelect(img._id)}
                      className="w-5 h-5 rounded-full border-white/30 text-vibrant-primary focus:ring-vibrant-primary/50 bg-black/50 cursor-pointer transition-transform duration-200 hover:scale-110"
                    />
                  </div>

                  <img 
                    src={getFullImageUrl(img.url)} 
                    alt={img.fileName}
                    className={`w-full h-full object-cover group-hover:scale-105 transition-transform duration-500 ${
                      selectedIds.length > 0 ? 'cursor-pointer' : ''
                    }`}
                    onClick={() => {
                      if (selectedIds.length > 0) {
                        handleToggleSelect(img._id);
                      }
                    }}
                  />
                  
                  {/* Floating Action Overlay */}
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 hidden sm:flex items-center justify-center gap-3 transition-opacity duration-300">
                    <button 
                      onClick={() => handleCopyUrl(img.url, img._id)}
                      className="p-2.5 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      title="Copy Secure URL"
                    >
                      {copiedId === img._id ? <Check size={18} className="text-emerald-400" /> : <Copy size={18} />}
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(img._id)}
                      className="p-2.5 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-xl border border-red-500/10 cursor-pointer hover:scale-105 active:scale-95 transition-all"
                      title="Delete Asset"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Metadata */}
                <div className="p-4 flex-grow flex flex-col justify-between gap-3 min-w-0">
                  <div className="min-w-0">
                    <h4 className="text-sm font-bold text-white truncate min-w-0" title={img.fileName}>
                      {img.fileName || 'Captured Photo'}
                    </h4>
                    <div className="flex justify-between items-center gap-2 text-[10px] text-slate-500 font-medium mt-1">
                      <span className="truncate max-w-[120px]">{img.publicId}</span>
                      <span>{new Date(img.createdAt).toLocaleDateString()}</span>
                    </div>
                  </div>
                  
                  {/* Mobile tactile action buttons */}
                  <div className="flex gap-2 sm:hidden mt-1 shrink-0">
                    <button 
                      onClick={() => handleCopyUrl(img.url, img._id)}
                      className="flex-grow py-2 bg-white/5 hover:bg-white/10 text-white rounded-xl border border-white/10 flex items-center justify-center gap-1.5 text-xs font-bold transition-all active:scale-95 cursor-pointer"
                    >
                      {copiedId === img._id ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
                      <span>{copiedId === img._id ? 'Copied!' : 'Copy URL'}</span>
                    </button>
                    <button 
                      onClick={() => setDeleteConfirmId(img._id)}
                      className="py-2 px-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl border border-red-500/10 flex items-center justify-center transition-all active:scale-95 cursor-pointer"
                      title="Delete Asset"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>

              </div>
            ))}
          </div>
        )}

      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setDeleteConfirmId(null)} />
          
          <div className="glass-card p-6 w-full max-w-md relative z-10 border border-white/10 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white">Delete Media Asset</h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to permanently delete this media asset? This will remove it from Cloudinary and your Library, and cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                disabled={isDeleting}
                onClick={() => setDeleteConfirmId(null)}
                className="btn-secondary px-4 py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={isDeleting}
                onClick={() => handleDeleteMedia(deleteConfirmId)}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-950/20 border border-red-500/20 cursor-pointer flex items-center gap-1.5"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Delete Asset</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Modal */}
      {bulkConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={() => setBulkConfirmOpen(false)} />
          
          <div className="glass-card p-6 w-full max-w-md relative z-10 border border-white/10 shadow-2xl space-y-6">
            <h3 className="text-xl font-bold text-white flex items-center gap-2">
              <Trash2 className="text-red-500" size={24} />
              Bulk Delete Assets
            </h3>
            <p className="text-slate-300 text-sm leading-relaxed">
              Are you sure you want to permanently delete the <span className="text-white font-bold">{selectedIds.length}</span> selected media assets? This will permanently remove them from Cloudinary and your Library, and cannot be undone.
            </p>
            
            <div className="flex justify-end gap-3 pt-2">
              <button 
                disabled={isDeleting}
                onClick={() => setBulkConfirmOpen(false)}
                className="btn-secondary px-4 py-2 text-sm cursor-pointer"
              >
                Cancel
              </button>
              <button 
                disabled={isDeleting}
                onClick={handleBulkDelete}
                className="px-4 py-2 rounded-xl text-sm font-bold text-white bg-red-500 hover:bg-red-600 shadow-lg shadow-red-950/20 border border-red-500/20 cursor-pointer flex items-center gap-1.5 transition-colors"
              >
                {isDeleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                <span>Delete Selected ({selectedIds.length})</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};

export default Library;
