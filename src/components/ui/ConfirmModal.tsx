import React, { useEffect, useRef } from 'react';
import { Trash2, AlertTriangle, Info, X } from 'lucide-react';

export type ConfirmVariant = 'danger' | 'warning' | 'info';

export interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: React.ReactNode;
  detail?: string | React.ReactNode;
  onConfirm: () => void;
  onCancel: () => void;
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  title,
  message,
  confirmText = 'ยืนยัน',
  cancelText = 'ยกเลิก',
  variant = 'danger',
  icon,
  detail,
  onConfirm,
  onCancel,
}) => {
  const confirmBtnRef = useRef<HTMLButtonElement>(null);

  // Handle keyboard: Escape -> Cancel, Enter -> Confirm
  useEffect(() => {
    if (!isOpen) return;

    // Focus confirm button when opened
    const timer = setTimeout(() => {
      confirmBtnRef.current?.focus();
    }, 50);

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onCancel();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onCancel]);

  if (!isOpen) return null;

  // Variant styling configurations matching Muji Minimalist aesthetic
  const variantStyles = {
    danger: {
      badgeBg: 'bg-rose-50 text-[#D9383A] dark:bg-rose-950/40 dark:text-rose-400 ring-8 ring-rose-100/60 dark:ring-rose-900/30',
      defaultIcon: <Trash2 className="w-7 h-7 stroke-[1.8]" />,
      confirmBtn: 'bg-[#D9383A] hover:bg-[#C42E30] text-white shadow-sm hover:shadow-md focus:ring-rose-500/30',
    },
    warning: {
      badgeBg: 'bg-amber-50 text-amber-600 dark:bg-amber-950/40 dark:text-amber-400 ring-8 ring-amber-100/60 dark:ring-amber-900/30',
      defaultIcon: <AlertTriangle className="w-7 h-7 stroke-[1.8]" />,
      confirmBtn: 'bg-amber-600 hover:bg-amber-700 text-white shadow-sm hover:shadow-md focus:ring-amber-500/30',
    },
    info: {
      badgeBg: 'bg-[#EFECE6] text-[#2D2824] dark:bg-[#2A2725] dark:text-[#ECE9E4] ring-8 ring-[#E5DFD3]/60 dark:ring-[#363230]/50',
      defaultIcon: <Info className="w-7 h-7 stroke-[1.8]" />,
      confirmBtn: 'bg-[#2D2824] hover:bg-[#1C1816] text-[#FAF8F5] dark:bg-[#ECE9E4] dark:text-[#1D1B1A] dark:hover:bg-white shadow-sm hover:shadow-md focus:ring-black/20',
    },
  };

  const currentStyle = variantStyles[variant] || variantStyles.danger;
  const displayIcon = icon || currentStyle.defaultIcon;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-fadeIn"
      onClick={onCancel}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
    >
      <div
        className="w-full max-w-[395px] min-h-[350px] bg-[#FAF8F5] dark:bg-[#1C1A18] rounded-[36px] shadow-2xl border border-[#E6E0D4] dark:border-[#383330] p-8 sm:p-9 overflow-hidden flex flex-col items-center justify-between text-center relative animate-scaleUp"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top Close Button */}
        <button
          type="button"
          onClick={onCancel}
          className="absolute top-4 right-4 w-8 h-8 rounded-full flex items-center justify-center text-[#8A857D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] hover:bg-black/5 dark:hover:bg-white/5 transition-colors cursor-pointer"
          aria-label="ปิด"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Centered Content Container */}
        <div className="flex-1 flex flex-col items-center justify-center w-full my-auto py-2">
          {/* Centered Icon Badge with soft ring aura */}
          <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-5 transition-transform ${currentStyle.badgeBg}`}>
            {displayIcon}
          </div>

          {/* Centered Title */}
          <h3 
            id="confirm-modal-title" 
            className="text-xl sm:text-[22px] font-bold text-[#2D2824] dark:text-[#ECE9E4] leading-snug tracking-tight mb-2"
          >
            {title}
          </h3>

          {/* Optional Message */}
          {message && (
            <div className="mt-0.5 mb-1.5">
              {typeof message === 'string' ? (
                <p className="text-sm sm:text-base text-[#7A756E] dark:text-[#A6A097] leading-relaxed max-w-[320px]">
                  {message}
                </p>
              ) : (
                message
              )}
            </div>
          )}

          {/* Optional Detail Box */}
          {detail && (
            <div className="w-full mt-3.5 p-3.5 rounded-2xl bg-[#F3EFE8] dark:bg-[#252220] border border-[#E5DFD3] dark:border-[#363230] text-xs text-[#59544D] dark:text-[#C4C0B8] leading-relaxed text-center">
              {detail}
            </div>
          )}
        </div>

        {/* Centered Balanced Action Buttons */}
        <div className="flex items-center justify-center gap-3.5 w-full mt-6 pt-1">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3.5 px-4 rounded-2xl text-sm sm:text-base font-semibold text-[#59544D] dark:text-[#A6A097] bg-[#EFECE6] dark:bg-[#2A2725] hover:bg-[#E5DFD3] dark:hover:bg-[#34302D] hover:text-[#2D2824] dark:hover:text-[#ECE9E4] border border-[#E0DBD0] dark:border-[#3A3633] transition-all active:scale-95 cursor-pointer"
          >
            {cancelText}
          </button>
          <button
            ref={confirmBtnRef}
            type="button"
            onClick={onConfirm}
            className={`flex-1 py-3.5 px-4 rounded-2xl text-sm sm:text-base font-semibold transition-all active:scale-95 focus:outline-none focus:ring-2 cursor-pointer ${currentStyle.confirmBtn}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};
