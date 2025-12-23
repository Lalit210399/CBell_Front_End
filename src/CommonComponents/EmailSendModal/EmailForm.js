import React, { useState, useEffect } from 'react';
import { FaTimes } from 'react-icons/fa';
import { Users } from 'lucide-react';
import GroupSelector from './GroupSelector';
import './EmailForm.css';

const EmailForm = ({ fileDetail = {}, documentId, onClose, onEmailSent, taskId }) => {
  // Get documentId from props or fileDetail - prioritize the passed documentId
  const actualDocumentId = documentId || fileDetail?.document?.documentId || fileDetail?.document?.fileId || fileDetail?.documentId;
  
  
  const [formData, setFormData] = useState({
    to: '',
    cc: '',
    bcc: '',
    subject: '',
    message: '',
    documentId: fileDetail?.document?.fileId || actualDocumentId || '',
  });

  const [isSending, setIsSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [showCc, setShowCc] = useState(false);
  const [showBcc, setShowBcc] = useState(false);
  const [showGroupSelector, setShowGroupSelector] = useState(false);
  const [attachment, setAttachment] = useState(fileDetail);

  useEffect(() => {
    const fetchFile = async () => {
      // Use fileId for API calls if available, otherwise fall back to documentId
      const fileId = fileDetail?.document?.fileId;
      const docId = fileDetail?.document?.documentId;
      const apiId = fileId || docId || actualDocumentId;
      
      if (apiId && !fileDetail?.file) {
        try {
          const response = await fetch(`/apis/task/download_document/${apiId}`, {
            method: 'GET',
            headers: {
              'ngrok-skip-browser-warning': '1'
            }
          });
          const blob = await response.blob();

          const filename = fileDetail?.filename || fileDetail?.name || 'attachment';
          const file = new File([blob], filename, { type: blob.type });

          const url = `/apis/document/view/${apiId}`;

          const updated = {
            ...fileDetail,
            file,
            name: filename,
            url,
            type: blob.type,
          };

          setAttachment(updated);

          if (blob.type.startsWith('image/')) {
            const imgHtml = `<p><img src="${url}" alt="Attachment" style="max-width:100%;" /></p>`;
            setFormData((prev) => ({
              ...prev,
              message: prev.message.includes(url)
                ? prev.message
                : prev.message + '\n' + imgHtml,
            }));
          }
        } catch (error) {
          console.error('Error fetching file:', error);
        }
      }
    };

    fetchFile();
  }, [actualDocumentId, fileDetail]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSelectGroups = (emails, field) => {
    const currentValue = formData[field];
    const emailsToAdd = currentValue ? [...currentValue.split(','), ...emails] : emails;
    const uniqueEmails = [...new Set(emailsToAdd.map(e => e.trim()))].join(', ');
    
    setFormData((prev) => ({
      ...prev,
      [field]: uniqueEmails,
    }));

    // Auto-show Cc/Bcc fields when groups are added to them
    if (field === 'cc') setShowCc(true);
    if (field === 'bcc') setShowBcc(true);
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
      formDataToSend.append('bcc', formData.bcc);
      formDataToSend.append('Subject', formData.subject);
      formDataToSend.append('Message', formData.message);
      formDataToSend.append('DocumentId', formData.documentId);
      if (taskId) {
        formDataToSend.append('TaskId', taskId);
      }

      // if (attachment?.file) {
      //   formDataToSend.append('Attachment', attachment.file, attachment.file.name);
      // }

      const response = await fetch('/apis/email/send', {
        method: 'POST',
        body: formDataToSend,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to send email');
      }

      setSuccessMessage('Email sent successfully!');
      // Call onEmailSent to trigger the publish record
      onEmailSent?.('email');
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
            <button type="button" className="email-form-icon" onClick={() => setShowCc((v) => !v)}>Cc</button>
            <button type="button" className="email-form-icon" onClick={() => setShowBcc((v) => !v)}>Bcc</button>
            <button 
              type="button" 
              className="email-form-icon email-form-groups-btn" 
              onClick={() => setShowGroupSelector(true)}
              title="Add from Email Groups"
            >
              <Users size={16} />
            </button>
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

          {attachment?.name && (
            <div className="email-form-attachment">
              Attachment: <strong>{attachment.name}</strong>
              {(fileDetail?.document?.fileId || fileDetail?.document?.documentId || actualDocumentId) && (
                <>
                  <a
                    href={`/apis/document/view/${fileDetail?.document?.fileId || fileDetail?.document?.documentId || actualDocumentId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ marginLeft: '10px' }}
                  >
                    View
                  </a>
                  <a
                    href={`/apis/task/download_document/${fileDetail?.document?.fileId || fileDetail?.document?.documentId || actualDocumentId}`}
                    download={attachment.name}
                    style={{ marginLeft: '10px' }}
                  >
                    Download
                  </a>
                </>
              )}
            </div>
          )}
        </div>

        <div className="email-form-actions">
          <button type="submit" className="send_button" disabled={isSending}>
            {isSending ? 'Sending...' : 'Send'}
          </button>
        </div>
      </form>

      {showGroupSelector && (
        <GroupSelector
          onClose={() => setShowGroupSelector(false)}
          onSelectGroups={handleSelectGroups}
        />
      )}
    </div>
  );
};

export default EmailForm;
