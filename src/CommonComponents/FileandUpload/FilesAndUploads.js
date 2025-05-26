import React, { useState, useEffect, useRef } from 'react';
import {
  Image as ImageIcon,
  Music as MusicIcon,
  Clapperboard,
  File as FileIcon,
  FileText,
  PlusCircle,
  Loader2,
  X
} from 'lucide-react';
import './FilesandUploads.css';

const FilesUploads = ({
  files = [],
  onDataChange,
  taskId,
  eventId,
  organizationId,
  readOnly = false
}) => {
  const [links, setLinks] = useState([]);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [isUploading, setIsUploading] = useState(false);
  const [previewFile, setPreviewFile] = useState(null);

  useEffect(() => {
    return () => {
      [...files, ...uploadedFiles].forEach(file => {
        if (file.src && file.src.startsWith('blob:')) {
          URL.revokeObjectURL(file.src);
        }
      });
    };
  }, [files, uploadedFiles]);

  useEffect(() => {
    onDataChange?.({ links, uploadedFiles });
  }, [links, uploadedFiles]);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  };

  const handleAddLink = () => {
    const newLink = prompt("Enter the new link URL:");
    if (newLink) {
      const updatedLinks = [...links, newLink];
      setLinks(updatedLinks);
      onDataChange?.({ links: updatedLinks, uploadedFiles });
    }
  };

  const uploadFileToBackend = async (file) => {
    const formData = new FormData();
    formData.append('File', file);
    formData.append('description', file.name);

    const response = await fetch('/apis/document/upload_document', {
      method: 'POST',
      body: formData,
      headers: { 'ngrok-skip-browser-warning': '1' }
    });

    if (!response.ok) throw new Error('File upload failed');
    const data = await response.json();
    return data.documentId;
  };

  const linkDocumentToTask = async (documentId) => {
    const payload = {
      eventId,
      organizationId,
      documentId,
    };

    if (taskId) payload.taskId = taskId;

    const response = await fetch('/apis/Document-Details', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': '1'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) throw new Error('Failed to link document to task');
    return await response.json();
  };

  const handleFileUpload = async (e) => {
    const filesToUpload = Array.from(e.target.files);
    if (filesToUpload.length === 0) return;

    setIsUploading(true);

    try {
      for (const file of filesToUpload) {
        try {
          const documentId = await uploadFileToBackend(file);
          await linkDocumentToTask(documentId);

          const type = getFileTypeFromMime(file.type);
          const src = URL.createObjectURL(file);

          const newFile = {
            name: file.name,
            type,
            src,
            documentId
          };

          setUploadedFiles(prev => [...prev, newFile]);
        } catch (error) {
          console.error(`Failed to process file ${file.name}:`, error);
        }
      }
    } finally {
      setIsUploading(false);
      onDataChange?.({ links, uploadedFiles });
    }
  };

  const LazyFileCard = ({ file }) => {
    const [isVisible, setIsVisible] = useState(false);
    const ref = useRef();

    useEffect(() => {
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observer.disconnect();
          }
        },
        { threshold: 0.1 }
      );

      if (ref.current) observer.observe(ref.current);
      return () => observer.disconnect();
    }, []);

    return (
      <div ref={ref} className="file-card" onClick={() => setPreviewFile(file)}>
        {isVisible ? (
          <>
            <div className="file-header">
              {file.type === 'image' && <ImageIcon size={20} />}
              {file.type === 'video' && <Clapperboard size={20} />}
              {file.type === 'audio' && <MusicIcon size={20} />}
              {file.type === 'pdf' && <FileText size={20} />}
              {!['image', 'video', 'audio', 'pdf'].includes(file.type) && <FileIcon size={20} />}
              <span className="file-name" title={file.name}>{file.name}</span>
            </div>
            <div className="file-icon">
              {file.type === 'image' && <img src={file.src} alt={file.name} className="image-preview" />}
              {file.type === 'video' && <video src={file.src} className="video-preview" controls />}
              {file.type === 'audio' && (
                <div className="audio-container">
                  <MusicIcon size={60} />
                  <audio src={file.src} className="audio-preview" controls />
                </div>
              )}
              {file.type === 'pdf' && (
                <div className="pdf-preview">
                  <FileText size={60} />
                  <span>PDF Document</span>
                </div>
              )}
              {!['image', 'video', 'audio', 'pdf'].includes(file.type) && (
                <div className="fallback-preview">
                  <FileIcon size={60} />
                  <span>Download File</span>
                </div>
              )}
            </div>
          </>
        ) : (
          <div className="file-card-placeholder">Loading...</div>
        )}
      </div>
    );
  };

  return (
    <div className="files-uploads-container">
      <div className="links-container">
        <h3>Links</h3>
        <ul>
          {links.map((link, index) => (
            <li key={index}>
              <a href={link} target="_blank" rel="noopener noreferrer">{link}</a>
            </li>
          ))}
        </ul>
        {!readOnly && (
          <div className="add-link-icon" onClick={handleAddLink}>
            <PlusCircle size={30} />
          </div>
        )}
      </div>

      <div className="files-container">
        <div className="files-header">
          <h3>Files</h3>
          {!readOnly && (
            <label className="upload-button">
              {isUploading ? <Loader2 className="animate-spin" size={20} /> : 'Upload'}
              <input
                type="file"
                onChange={handleFileUpload}
                multiple
                accept="image/*,video/*,audio/*,.pdf"
                style={{ display: "none" }}
                disabled={isUploading}
              />
            </label>
          )}
        </div>

        <div className="files-grid">
          {[...files, ...uploadedFiles].map((file, index) => (
            <LazyFileCard key={index} file={file} />
          ))}
          {isUploading && <p>Loading...</p>}
        </div>
      </div>

      {previewFile && (
        <div className="popup" onClick={() => setPreviewFile(null)}>
          <div className="popup-content" onClick={(e) => e.stopPropagation()}>
            <X size={30} className="close-icon" onClick={() => setPreviewFile(null)} />
            {previewFile.type === 'image' && <img src={previewFile.src} alt={previewFile.name} />}
            {previewFile.type === 'video' && <video src={previewFile.src} controls autoPlay />}
            {previewFile.type === 'audio' && (
              <div className="audio-popup">
                <h3>{previewFile.name}</h3>
                <audio src={previewFile.src} controls autoPlay />
              </div>
            )}
            {previewFile.type === 'pdf' && (
              <div className="pdf-popup">
                <h3>{previewFile.name}</h3>
                <iframe src={previewFile.src} width="100%" height="500px" title={previewFile.name} />
                <a href={previewFile.src} download target="_blank" rel="noopener noreferrer" className="download-button">
                  Download PDF
                </a>
              </div>
            )}
            {!['image', 'video', 'audio', 'pdf'].includes(previewFile.type) && (
              <div className="fallback-popup">
                <h3>{previewFile.name}</h3>
                <FileIcon size={100} />
                <a href={previewFile.src} download target="_blank" rel="noopener noreferrer" className="download-button">
                  Download File
                </a>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default FilesUploads;
