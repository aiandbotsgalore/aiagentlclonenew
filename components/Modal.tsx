import React from 'react';

/**
 * Props for the Modal component.
 */
interface ModalProps {
  /**
   * The title of the modal.
   */
  title: string;
  /**
   * Callback function to handle closing the modal.
   */
  onClose: () => void;
  /**
   * The content to be displayed inside the modal.
   */
  children: React.ReactNode;
}

/**
 * A generic modal component.
 *
 * It provides a backdrop, a title bar with a close button, and a container for children.
 * Clicking the backdrop closes the modal.
 *
 * @component
 * @param {ModalProps} props - The component props.
 * @returns {JSX.Element} The modal component.
 */
const Modal: React.FC<ModalProps> = ({ title, onClose, children }) => {
  return (
    <div 
        className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center"
        onClick={onClose}
        aria-modal="true"
    >
      <div 
        className="bg-gray-800 rounded-lg shadow-2xl w-full max-w-md p-6 border border-gray-700"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-white">{title}</h2>
          <button 
            onClick={onClose}
            className="text-gray-400 hover:text-white transition"
            aria-label="Close modal"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
