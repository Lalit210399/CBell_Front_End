import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Info, CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";
import "./MessageStrip.css";

const MessageStrip = ({
  text,
  type = "Information",
  showIcon = true,
  showCloseButton = true,
  duration = 0, // Auto-close after milliseconds (0 = manual close only)
  onClose,
}) => {
  const [isVisible, setIsVisible] = useState(true);

  // Auto-dismiss after `duration` milliseconds
  useEffect(() => {
    if (duration > 0) {
      const timer = setTimeout(() => {
        setIsVisible(false);
        if (onClose) onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [duration, onClose]);

  const handleClose = () => {
    setIsVisible(false);
    if (onClose) onClose();
  };

  const typeConfig = {
    info: { icon: <Info size={18} />, class: "info" },
    success: { icon: <CheckCircle2 size={18} />, class: "success" },
    warning: { icon: <AlertTriangle size={18} />, class: "warning" },
    error: { icon: <XCircle size={18} />, class: "error" },
  };

  // Use lowercase for lookup
  const { icon, class: typeClass } = typeConfig[type?.toLowerCase()] || typeConfig.info;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`message-strip ${typeClass} sapUiSmallMargin`}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, x: 50 }}
          transition={{ duration: 0.2 }}
        >
          {showIcon && <span className="message-icon">{icon}</span>}
          <span className="message-text">{text}</span>
          {showCloseButton && (
            <button className="close-button" onClick={handleClose}>
              <X size={16} />
            </button>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default MessageStrip;