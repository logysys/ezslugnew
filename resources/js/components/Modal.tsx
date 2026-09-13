import { useEffect } from 'react';

interface ModalProps {
    children: React.ReactNode;
    onClose: () => void;
    show: boolean;
}

const Modal = ({ children, onClose, show }: ModalProps) => {
    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };

        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    if (!show) return null;

    return (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center text-center sm:block sm:p-0">
                <div className="fixed inset-0" onClick={onClose}>
                    <div className="absolute inset-0"></div>
                </div>
                <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
                    {children}
            </div>
        </div>
    );
};

export default Modal;