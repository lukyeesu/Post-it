import React, { createContext, useState, useCallback, ReactNode } from 'react';
import { ConfirmModal, ConfirmVariant } from '@/components/ui/ConfirmModal';

export interface ConfirmOptions {
  title: string;
  message?: string | React.ReactNode;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  icon?: ReactNode;
  detail?: string | ReactNode;
}

interface ConfirmContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null);

export const ConfirmProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    options: ConfirmOptions;
    resolve?: (val: boolean) => void;
  }>({
    isOpen: false,
    options: {
      title: '',
      message: '',
    },
  });

  const confirm = useCallback((options: ConfirmOptions): Promise<boolean> => {
    return new Promise<boolean>((resolve) => {
      setModalState({
        isOpen: true,
        options,
        resolve,
      });
    });
  }, []);

  const handleConfirm = useCallback(() => {
    modalState.resolve?.(true);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, [modalState]);

  const handleCancel = useCallback(() => {
    modalState.resolve?.(false);
    setModalState((prev) => ({ ...prev, isOpen: false }));
  }, [modalState]);

  return (
    <ConfirmContext.Provider value={{ confirm }}>
      {children}
      <ConfirmModal
        isOpen={modalState.isOpen}
        title={modalState.options.title}
        message={modalState.options.message}
        confirmText={modalState.options.confirmText}
        cancelText={modalState.options.cancelText}
        variant={modalState.options.variant}
        icon={modalState.options.icon}
        detail={modalState.options.detail}
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
    </ConfirmContext.Provider>
  );
};

export { useConfirm } from '@/hooks/useConfirm';

