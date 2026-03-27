import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Smartphone, ArrowRight, X } from 'lucide-react';
import { useDeviceStore } from '@/store/deviceStore';
import { useRouter } from 'next/navigation';

export const SmartSearchModal = ({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) => {
  const { searchQuery, setSearchQuery, searchResults } = useDeviceStore();
  const [selectedIndex, setSelectedIndex] = useState(0);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus input on open
  useEffect(() => {
    if (isOpen) setTimeout(() => inputRef.current?.focus(), 100);
  }, [isOpen]);

  const handleSelect = (variantId: number) => {
    router.push(`/product/${variantId}`); // In production, this maps to the SKU
    onClose();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') setSelectedIndex(prev => Math.min(prev + 1, searchResults.length - 1));
    if (e.key === 'ArrowUp') setSelectedIndex(prev => Math.max(prev - 1, 0));
    if (e.key === 'Enter' && searchResults[selectedIndex]) handleSelect(searchResults[selectedIndex].variantId);
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[10vh] px-4">
          {/* Backdrop */}
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative w-full max-w-2xl overflow-hidden rounded-2xl border border-ct-border bg-ct-bg-secondary shadow-2xl"
            onKeyDown={handleKeyDown}
          >
            {/* Input Area */}
            <div className="flex items-center border-b border-ct-border p-4">
              <Search className="mr-3 h-5 w-5 text-ct-text-secondary" />
              <input
                ref={inputRef}
                type="text"
                className="w-full bg-transparent text-lg text-ct-text outline-none placeholder:text-ct-text-secondary"
                placeholder="Search models or part numbers (e.g. 'A3089')..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setSelectedIndex(0);
                }}
              />
              <button onClick={onClose} className="p-1 hover:bg-ct-bg rounded">
                <X className="h-5 w-5 text-ct-text-secondary" />
              </button>
            </div>

            {/* Results Area */}
            <div className="max-h-[60vh] overflow-y-auto p-2">
              {searchResults.length > 0 ? (
                searchResults.map((result, index) => (
                  <div
                    key={result.variantId}
                    onClick={() => handleSelect(result.variantId)}
                    className={`group flex cursor-pointer items-center justify-between rounded-xl p-4 transition-all ${
                      index === selectedIndex ? 'bg-ct-accent/10 border-ct-accent/20' : 'hover:bg-ct-bg'
                    } border border-transparent`}
                  >
                    <div className="flex items-center">
                      <div className="mr-4 flex h-10 w-10 items-center justify-center rounded-lg bg-ct-bg text-ct-accent group-hover:shadow-glow">
                        <Smartphone size={20} />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                           <span className="font-medium text-ct-text">{result.displayName}</span>
                           {/* SKU/Model highlighting can go here */}
                        </div>
                        <p className="text-xs text-ct-text-secondary uppercase tracking-widest font-mono">
                          {result.path}
                        </p>
                      </div>
                    </div>
                    <ArrowRight className={`h-4 w-4 text-ct-accent transition-transform ${index === selectedIndex ? 'translate-x-0' : '-translate-x-4 opacity-0'}`} />
                  </div>
                ))
              ) : searchQuery.length > 1 ? (
                <div className="p-12 text-center text-ct-text-secondary">
                  <p>No matching devices found for "{searchQuery}"</p>
                </div>
              ) : (
                <div className="p-12 text-center text-ct-text-secondary">
                  <p className="text-sm">Start typing a model number or brand...</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between border-t border-ct-border bg-ct-bg/50 px-4 py-3">
              <div className="flex gap-4">
                 <span className="flex items-center text-[10px] font-mono text-ct-text-secondary">
                   <kbd className="mr-1 rounded bg-ct-bg px-1 border border-ct-border">↑↓</kbd> Navigate
                 </span>
                 <span className="flex items-center text-[10px] font-mono text-ct-text-secondary">
                   <kbd className="mr-1 rounded bg-ct-bg px-1 border border-ct-border">↵</kbd> Select
                 </span>
              </div>
              <span className="text-[10px] font-mono text-ct-accent uppercase tracking-tighter">
                CellTech SmartSearch v1.0
              </span>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
