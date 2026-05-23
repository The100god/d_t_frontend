import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { Camera, Upload, Trash2, Image, RotateCw, X, Check, Loader2 } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const ImageUploadAndCapture = ({ value, onChange, label = 'Add Image', className = '' }) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('upload'); // 'upload' | 'camera' | 'library'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  
  // Camera state
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null); // base64 / blob URL
  const [capturedBlob, setCapturedBlob] = useState(null);
  const [facingMode, setFacingMode] = useState('environment'); // 'user' | 'environment'
  
  // Library state
  const [libraryImages, setLibraryImages] = useState([]);
  const [libraryLoading, setLibraryLoading] = useState(false);

  const videoRef = useRef(null);
  const streamRef = useRef(null);

  // Stop camera stream helper
  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    setStream(null);
  };

  // Start camera stream helper
  const startCamera = async (mode = facingMode) => {
    stopCamera();
    setCapturedImage(null);
    setCapturedBlob(null);
    setError('');
    
    try {
      const constraints = {
        video: { facingMode: mode, width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false
      };
      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      streamRef.current = mediaStream;
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error('Camera access error:', err);
      setError('Could not access camera. Please check camera permissions.');
    }
  };

  // Fetch Library Images
  const fetchLibrary = async () => {
    if (user?.role !== 'admin') return;
    setLibraryLoading(true);
    setError('');
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/media`);
      setLibraryImages(res.data);
    } catch (err) {
      console.error('Error fetching library images:', err);
      setError('Failed to load media library images.');
    } finally {
      setLibraryLoading(false);
    }
  };

  // Tab switcher
  useEffect(() => {
    if (activeTab === 'camera' && isOpen) {
      startCamera();
    } else {
      stopCamera();
    }

    if (activeTab === 'library' && isOpen) {
      fetchLibrary();
    }
  }, [activeTab, isOpen]);

  // Clean up on unmount or close
  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleOpen = () => {
    setIsOpen(true);
    setActiveTab(user?.role === 'admin' ? 'library' : 'upload');
    setError('');
    setCapturedImage(null);
    setCapturedBlob(null);
  };

  const handleClose = () => {
    stopCamera();
    setIsOpen(false);
  };

  const handleUploadFile = async (file) => {
    if (!file) return;
    setIsLoading(true);
    setError('');
    
    const formData = new FormData();
    formData.append('image', file);
    
    try {
      const endpoint = user?.role === 'admin' 
        ? `${import.meta.env.VITE_API_URL}/api/media/upload` 
        : `${import.meta.env.VITE_API_URL}/api/submissions/upload`;
        
      const res = await axios.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      
      // /api/media/upload returns media object {url, publicId...}, /api/submissions/upload returns {imageUrl}
      const finalUrl = res.data.url || res.data.imageUrl;
      onChange(finalUrl);
      handleClose();
    } catch (err) {
      console.error('Upload failed:', err);
      setError(err.response?.data?.error || 'Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  // Capture photo from video stream
  const capturePhoto = () => {
    if (!videoRef.current) return;
    
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    const dataUrl = canvas.toDataURL('image/jpeg');
    setCapturedImage(dataUrl);
    
    canvas.toBlob((blob) => {
      setCapturedBlob(blob);
    }, 'image/jpeg', 0.9);
    
    // Stop camera feed after capture
    stopCamera();
  };

  // Confirm and upload captured photo
  const handleConfirmCapture = async () => {
    if (!capturedBlob) return;
    
    setIsLoading(true);
    setError('');
    
    const file = new File([capturedBlob], `camera_photo_${Date.now()}.jpg`, { type: 'image/jpeg' });
    await handleUploadFile(file);
  };

  const handleSwitchCamera = () => {
    const nextMode = facingMode === 'user' ? 'environment' : 'user';
    setFacingMode(nextMode);
    startCamera(nextMode);
  };

  const handleSelectFromLibrary = (imageUrl) => {
    onChange(imageUrl);
    handleClose();
  };

  const getFullImageUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:image')) {
      return url;
    }
    return `${import.meta.env.VITE_API_URL}${url}`;
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {value ? (
        <div className="relative group w-full max-w-[200px] aspect-video glass-card overflow-hidden border border-white/10 rounded-xl hover:border-vibrant-primary/50 transition-all duration-300">
          <img 
            src={getFullImageUrl(value)} 
            alt="Uploaded Preview" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center gap-3 transition-opacity duration-300">
            <button 
              type="button"
              onClick={handleOpen}
              className="p-2 bg-white/10 hover:bg-white/20 text-white rounded-lg border border-white/10 hover:scale-105 transition-all text-xs font-semibold cursor-pointer"
            >
              Change
            </button>
            <button 
              type="button"
              onClick={() => onChange('')}
              className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg border border-red-500/10 hover:scale-105 transition-all cursor-pointer"
            >
              <Trash2 size={16} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={handleOpen}
          className="flex items-center justify-center gap-2 px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 border-dashed rounded-xl text-slate-300 hover:text-white hover:border-vibrant-primary/50 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer text-sm font-semibold"
        >
          <Camera size={16} className="text-vibrant-primary animate-pulse" />
          <span>{label}</span>
        </button>
      )}

      {/* Upload/Capture Modal */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/80 backdrop-blur-md animate-fade-in" onClick={handleClose} />
          
          {/* Content Container */}
          <div className="glass-card p-6 w-full max-w-2xl relative z-10 border border-white/10 shadow-2xl flex flex-col max-h-[90vh]">
            {/* Close Button */}
            <button 
              type="button"
              onClick={handleClose}
              className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
            >
              <X size={20} />
            </button>

            <h3 className="text-xl font-bold text-white mb-6">Select Image Source</h3>

            {/* Tabs */}
            <div className="flex border-b border-white/10 mb-6">
              {user?.role === 'admin' && (
                <button
                  type="button"
                  onClick={() => setActiveTab('library')}
                  className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                    activeTab === 'library' ? 'border-vibrant-primary text-vibrant-primary' : 'border-transparent text-slate-400 hover:text-white'
                  }`}
                >
                  <Image size={16} />
                  Media Library
                </button>
              )}
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'upload' ? 'border-vibrant-primary text-vibrant-primary' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Upload size={16} />
                Upload Device
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('camera')}
                className={`px-4 py-2 text-sm font-bold border-b-2 transition-all cursor-pointer flex items-center gap-2 ${
                  activeTab === 'camera' ? 'border-vibrant-primary text-vibrant-primary' : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                <Camera size={16} />
                Take Photo
              </button>
            </div>

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-xs font-semibold">
                {error}
              </div>
            )}

            {/* Tab Panels */}
            <div className="flex-grow overflow-y-auto min-h-[300px] flex flex-col">
              
              {/* Media Library Tab */}
              {activeTab === 'library' && (
                <div className="flex-grow flex flex-col">
                  {libraryLoading ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-400 gap-2">
                      <Loader2 className="animate-spin text-vibrant-primary" size={32} />
                      <p className="text-sm font-medium">Fetching Library Assets...</p>
                    </div>
                  ) : libraryImages.length === 0 ? (
                    <div className="flex-grow flex flex-col items-center justify-center text-slate-500 border border-white/5 border-dashed rounded-xl p-8 bg-white/5">
                      <Image size={40} className="mb-3 text-slate-600" />
                      <p className="text-sm font-semibold">Your Media Library is Empty</p>
                      <p className="text-xs text-slate-500 mt-1">Upload images in the Library dashboard or the Device tab first.</p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                      {libraryImages.map((img) => (
                        <div 
                          key={img._id} 
                          onClick={() => handleSelectFromLibrary(img.url)}
                          className="group relative cursor-pointer glass-card border border-white/10 rounded-xl overflow-hidden aspect-video hover:border-vibrant-primary/50 hover:scale-[1.02] transition-all"
                        >
                          <img 
                            src={getFullImageUrl(img.url)} 
                            alt={img.fileName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                            <span className="bg-vibrant-primary text-white text-[10px] uppercase font-bold px-2 py-1 rounded">Select</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Device Upload Tab */}
              {activeTab === 'upload' && (
                <div className="flex-grow flex flex-col items-center justify-center">
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-white/10 hover:border-vibrant-primary/50 rounded-2xl p-8 bg-white/5 w-full h-[250px] cursor-pointer hover:bg-white/[0.08] transition-all duration-300">
                    <Upload className="mb-4 text-vibrant-primary animate-bounce" size={40} />
                    <span className="text-sm font-bold text-white mb-1">Click to Upload Image</span>
                    <span className="text-xs text-slate-400">Supports JPEG, PNG, and JPG (Max 5MB)</span>
                    <input 
                      type="file" 
                      accept="image/jpeg,image/png,image/jpg" 
                      className="hidden" 
                      onChange={(e) => handleUploadFile(e.target.files[0])}
                      disabled={isLoading}
                    />
                  </label>
                  {isLoading && (
                    <div className="mt-4 flex items-center gap-2 text-slate-400 text-sm font-semibold animate-pulse">
                      <Loader2 className="animate-spin text-vibrant-primary" size={18} />
                      <span>Uploading Image...</span>
                    </div>
                  )}
                </div>
              )}

              {/* Take Photo Tab */}
              {activeTab === 'camera' && (
                <div className="flex-grow flex flex-col items-center justify-center relative">
                  {!capturedImage ? (
                    /* Live Feed */
                    <div className="w-full max-w-md aspect-video bg-black rounded-2xl overflow-hidden border border-white/10 relative">
                      <video 
                        ref={videoRef}
                        autoPlay 
                        playsInline 
                        muted 
                        className="w-full h-full object-cover"
                      />
                      {/* Live Indicators */}
                      <div className="absolute top-3 left-3 bg-red-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                        <span className="w-1.5 h-1.5 rounded-full bg-white" />
                        Live Camera
                      </div>
                      
                      {/* Control buttons overlay */}
                      <div className="absolute bottom-4 inset-x-0 flex justify-center items-center gap-4">
                        <button
                          type="button"
                          onClick={handleSwitchCamera}
                          className="p-3 bg-white/15 hover:bg-white/25 border border-white/10 rounded-full text-white cursor-pointer hover:scale-105 transition-all"
                          title="Switch Camera"
                        >
                          <RotateCw size={18} />
                        </button>
                        <button
                          type="button"
                          onClick={capturePhoto}
                          className="w-14 h-14 bg-vibrant-primary hover:bg-vibrant-primary/90 border border-white/20 rounded-full flex items-center justify-center text-white cursor-pointer hover:scale-105 active:scale-95 shadow-lg shadow-vibrant-primary/30 transition-all"
                          title="Capture Photo"
                        >
                          <Camera size={26} />
                        </button>
                        <div className="w-11" /> {/* Spacer */}
                      </div>
                    </div>
                  ) : (
                    /* Captured Photo Review */
                    <div className="w-full max-w-md flex flex-col items-center gap-4 animate-in zoom-in-95 duration-200">
                      <div className="aspect-video bg-black rounded-2xl overflow-hidden border border-emerald-500/30 relative">
                        <img 
                          src={capturedImage} 
                          alt="Captured preview" 
                          className="w-full h-full object-cover"
                        />
                        <div className="absolute top-3 left-3 bg-emerald-500 text-white text-[9px] font-bold uppercase px-2 py-0.5 rounded-full">
                          Captured Photo
                        </div>
                      </div>
                      
                      <div className="flex gap-3">
                        <button
                          type="button"
                          onClick={() => startCamera(facingMode)}
                          disabled={isLoading}
                          className="btn-secondary px-5 py-2 text-xs flex items-center gap-1.5"
                        >
                          <RotateCw size={14} /> Retake
                        </button>
                        <button
                          type="button"
                          onClick={handleConfirmCapture}
                          disabled={isLoading}
                          className="btn-primary bg-emerald-600 hover:bg-emerald-500 shadow-emerald-950/20 px-5 py-2 text-xs flex items-center gap-1.5"
                        >
                          {isLoading ? (
                            <Loader2 className="animate-spin" size={14} />
                          ) : (
                            <Check size={14} />
                          )}
                          <span>Confirm & Upload</span>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploadAndCapture;
