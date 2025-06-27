import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import './EmailForm.css';

const EmailForm = ({ fileDetail, documentId, onClose, onEmailSent }) => {
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    documentId: documentId || ''
  });

  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  console.log("EmailForm props:", { fileDetail, documentId, onClose, onEmailSent });

  // Auto-insert image tag in message if fileDetail is an image with a URL
  useEffect(() => {
    if (fileDetail?.type?.startsWith('image/') && fileDetail?.url) {
      const imgHtml = `<p><img src="${fileDetail.url}" alt="Attachment" style="max-width:100%;"/></p>`;
      setFormData(prev => ({
        ...prev,
        message: prev.message.includes(fileDetail.url) ? prev.message : prev.message + '\n' + imgHtml,
      }));
    }
  }, [fileDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSending(true);
    setErrorMessage('');
    setSuccessMessage('');

    try {
      const formDataToSend = new FormData();
      formDataToSend.append('To', formData.to);
      formDataToSend.append('Cc', formData.cc);
      formDataToSend.append('Bcc', formData.bcc);
      formDataToSend.append('Subject', formData.subject);
      formDataToSend.append('Message', formData.message); // Contains embedded HTML
      formDataToSend.append('DocumentId', formData.documentId);

      if (fileDetail?.file) {
        formDataToSend.append('Attachment', fileDetail.file);
      }

      const response = await fetch('/apis/email/send', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      setSuccessMessage('Email sent successfully!');
      if (onEmailSent) onEmailSent();
      setTimeout(() => onClose(), 2000);
    } catch (error) {
      setErrorMessage(error.message || 'Failed to send email. Please try again.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="email-form-overlay">
      <form className="email-form-container" onSubmit={handleSubmit}>
        <div className="email-form-header">
          <span className="email-form-header-title">New Message</span>
          <button className="close-button" type="button" onClick={onClose} aria-label="Close">
            <FaTimes />
          </button>
        </div>

        <div className="email-form-fields">
          {successMessage && <div className="alert alert-success">{successMessage}</div>}
          {errorMessage && <div className="alert alert-danger">{errorMessage}</div>}

          <div className="email-form-row">
            <span className="email-form-label">To</span>
            <input
              type="email"
              name="to"
              value={formData.to}
              onChange={handleChange}
              required
              multiple
              className="email-form-input"
              placeholder="Recipients"
            />
            <button type="button" className="email-form-icon" onClick={() => setShowCc(v => !v)}>Cc</button>
            <button type="button" className="email-form-icon" onClick={() => setShowBcc(v => !v)}>Bcc</button>
          </div>

          {showCc && (
            <div className="email-form-row">
              <span className="email-form-label">Cc</span>
              <input
                type="email"
                name="cc"
                value={formData.cc}
                onChange={handleChange}
                multiple
                className="email-form-input"
                placeholder="Cc"
              />
            </div>
          )}

          {showBcc && (
            <div className="email-form-row">
              <span className="email-form-label">Bcc</span>
              <input
                type="email"
                name="bcc"
                value={formData.bcc}
                onChange={handleChange}
                multiple
                className="email-form-input"
                placeholder="Bcc"
              />
            </div>
          )}

          <div className="email-form-row">
            <span className="email-form-label">Subject</span>
            <input
              type="text"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              required
              className="email-form-input"
              placeholder="Subject"
            />
          </div>

          <textarea
            name="message"
            value={formData.message}
            onChange={handleChange}
            required
            className="email-form-textarea"
            placeholder="Message (HTML allowed)"
          />

          {fileDetail?.name && (
            <div className="email-form-attachment">Attachment: {fileDetail.name}</div>
          )}
        </div>

        <div className="email-form-actions">
          <button type="submit" className="send-button" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default EmailForm;
