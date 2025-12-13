import React, { useEffect, useCallback } from 'react';
import PropTypes from 'prop-types';
import './ConfirmationModal.css';

/**
 * Reusable Confirmation Modal Component
 * Used for delete confirmations, archive confirmations, etc.
 */
const ConfirmationModal = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message = "Are you sure you want to proceed?",
  warningText = "",
  confirmText = "Confirm",
  cancelText = "Cancel",
  confirmButtonVariant = "danger", // 'danger', 'primary', 'warning'
  loading = false,
  icon = null
}) => {
  // Handle escape key press
  const handleKeyDown = useCallback((e) => {
    if (e.key === 'Escape' && !loading) {
      onClose();
    }
  }, [onClose, loading]);

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
      // Prevent body scroll when modal is open
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, handleKeyDown]);

  // Handle backdrop click
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget && !loading) {
      onClose();
    }
  };

  if (!isOpen) return null;

  const getConfirmButtonClass = () => {
    switch (confirmButtonVariant) {
      case 'danger':
        return 'btn-confirm btn-confirm-danger';
      case 'warning':
        return 'btn-confirm btn-confirm-warning';
      case 'primary':
        return 'btn-confirm btn-confirm-primary';
      default:
        return 'btn-confirm btn-confirm-danger';
    }
  };

  return (
    <div 
      className="confirmation-modal-overlay" 
      onClick={handleBackdropClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmation-modal-title"
      aria-describedby="confirmation-modal-description"
    >
      <div className="confirmation-modal-content">
        <div className="confirmation-modal-header">
          {icon && <span className="confirmation-modal-icon">{icon}</span>}
          <h3 id="confirmation-modal-title">{title}</h3>
          <button 
            className="confirmation-modal-close"
            onClick={onClose}
            disabled={loading}
            aria-label="Close modal"
          >
            ×
          </button>
        </div>
        
        <div className="confirmation-modal-body" id="confirmation-modal-description">
          <p>{message}</p>
          {warningText && (
            <p className="confirmation-modal-warning">{warningText}</p>
          )}
        </div>
        
        <div className="confirmation-modal-footer">
          <button 
            className="btn-cancel"
            onClick={onClose}
            disabled={loading}
          >
            {cancelText}
          </button>
          <button 
            className={getConfirmButtonClass()}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? (
              <>
                <span className="btn-spinner"></span>
                Processing...
              </>
            ) : (
              confirmText
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

ConfirmationModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onConfirm: PropTypes.func.isRequired,
  title: PropTypes.string,
  message: PropTypes.string,
  warningText: PropTypes.string,
  confirmText: PropTypes.string,
  cancelText: PropTypes.string,
  confirmButtonVariant: PropTypes.oneOf(['danger', 'primary', 'warning']),
  loading: PropTypes.bool,
  icon: PropTypes.node
};

export default ConfirmationModal;
