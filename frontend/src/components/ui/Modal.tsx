import React, { useEffect } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Modal: React.FC<ModalProps> = ({ 
  isOpen, 
  onClose, 
  title, 
  children,
  maxWidth = '480px'
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Prevent background scrolling
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'unset';
    return () => { document.body.style.overflow = 'unset'; };
  }, [isOpen]);

  if (!isOpen && typeof document === 'undefined') return null;

  // Parse maxWidth - handle both tailwind and raw values
  const parsedMaxWidth = maxWidth.startsWith('max-w-') 
    ? { 'max-w-sm': '384px', 'max-w-md': '448px', 'max-w-lg': '512px', 'max-w-xl': '576px', 'max-w-2xl': '672px', 'max-w-3xl': '768px' }[maxWidth] || '480px'
    : maxWidth;

  return createPortal(
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            style={{
              position: 'fixed', inset: 0, zIndex: 40,
              backgroundColor: 'rgba(6,14,32,0.85)',
              backdropFilter: 'blur(8px)',
            }}
          />
          <div style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 16, pointerEvents: 'none' }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              style={{
                width: '100%',
                maxWidth: parsedMaxWidth,
                backgroundColor: 'rgba(15,25,48,0.92)',
                backdropFilter: 'blur(32px)',
                border: '1px solid rgba(163,166,255,0.08)',
                borderRadius: 20,
                boxShadow: '0 20px 80px rgba(0,0,0,0.4), 0 0 60px rgba(96,99,238,0.06), inset 0 1px 0 rgba(255,255,255,0.03)',
                overflow: 'hidden',
                pointerEvents: 'auto',
                display: 'flex',
                flexDirection: 'column' as const,
                maxHeight: '90vh',
              }}
            >
              {/* Header */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 28px' }}>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: '#dee5ff' }}>{title}</h2>
                <button
                  onClick={onClose}
                  style={{
                    padding: 8, color: '#a3aac4', backgroundColor: 'transparent',
                    border: 'none', borderRadius: 10, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.backgroundColor = 'rgba(20,31,56,0.8)'; e.currentTarget.style.color = '#dee5ff'; }}
                  onMouseLeave={e => { e.currentTarget.style.backgroundColor = 'transparent'; e.currentTarget.style.color = '#a3aac4'; }}
                >
                  <X size={20} />
                </button>
              </div>
              {/* Divider */}
              <div style={{ height: 1, backgroundColor: 'rgba(64,72,93,0.12)', margin: '0 28px' }} />
              {/* Body */}
              <div className="custom-scrollbar" style={{ padding: '24px 28px', overflowY: 'auto' }}>
                {children}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};
