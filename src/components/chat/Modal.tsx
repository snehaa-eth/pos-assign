import { X } from "lucide-react";
import { ReactNode } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

export function Modal({ isOpen, onClose, title, children }: ModalProps) {
  if (!isOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40 bg-black/20 "
        onClick={onClose}
      />
      
      <div
        className="fixed left-1/2 z-50 rounded-2xl bg-white p-6 shadow-2xl max-w-md w-full mx-4"
        style={{ top: '45%', transform: 'translate(-50%, -50%)' }}
        onClick={(e) => e.stopPropagation()}
      >
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-gray-400 hover:text-gray-600 transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="pr-8">
          <h2 className="text-lg font-semibold text-[#111827] mb-6">{title}</h2>
          {children}
        </div>
      </div>
    </>
  );
}

