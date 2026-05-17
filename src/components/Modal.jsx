import React from 'react';
import { AlertCircle, HelpCircle, X } from 'lucide-react';

const Modal = ({ isOpen, onClose, onConfirm, title, message, type = 'confirm', confirmText = 'Confirm', cancelText = 'Cancel' }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300 animate-fade-in"
        onClick={onClose}
      />
      
      {/* Modal Container */}
      <div className="glass-card p-6 w-full max-w-md relative z-10 border border-white/10 shadow-2xl space-y-6">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors cursor-pointer"
        >
          <X size={20} />
        </button>

        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl ${type === 'danger' || type === 'alert' ? 'bg-red-500/20 text-red-400' : 'bg-vibrant-secondary/20 text-vibrant-secondary'}`}>
            {type === 'danger' || type === 'alert' ? <AlertCircle size={24} /> : <HelpCircle size={24} />}
          </div>
          <div className="space-y-2 flex-grow">
            <h3 className="text-xl font-bold text-white leading-none">{title}</h3>
            <p className="text-slate-300 text-sm leading-relaxed">{message}</p>
          </div>
        </div>

        <div className="flex justify-end gap-3 pt-2">
          {type === 'confirm' || type === 'danger' ? (
            <>
              <button 
                type="button" 
                onClick={onClose}
                className="btn-secondary px-4 py-2 text-sm cursor-pointer"
              >
                {cancelText}
              </button>
              <button 
                type="button" 
                onClick={() => {
                  onConfirm();
                  onClose();
                }}
                className={`px-4 py-2 rounded-xl text-sm font-bold text-white transition-all shadow-md cursor-pointer ${
                  type === 'danger' 
                    ? 'bg-red-500 hover:bg-red-600 shadow-red-900/20 border border-red-500/20' 
                    : 'btn-primary shadow-vibrant-primary/20'
                }`}
              >
                {confirmText}
              </button>
            </>
          ) : (
            <button 
              type="button" 
              onClick={onClose}
              className="btn-primary px-5 py-2 text-sm cursor-pointer"
            >
              OK
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Modal;
