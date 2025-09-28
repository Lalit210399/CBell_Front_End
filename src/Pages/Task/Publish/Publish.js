import React, { useEffect, useState, useRef, useCallback } from 'react';
import Table from "../../../CommonComponents/Table/Table";
import { Download, Share2 } from "lucide-react";
import { useUser } from "../../../Context/UserContext";
import { FaInstagram, FaFacebook, FaEnvelope, FaYoutube } from 'react-icons/fa';
import FileShareModel from '../../../CommonComponents/FileShareModal/FileShareModel';
import "./Publish.css";

const columns = [
  { key: 'creative_name', label: 'Creative Name' },
  { key: 'creative_type', label: 'Creative Type' },
  { key: 'files', label: 'Files' },
  { key: 'status', label: 'Status' },
  { key: 'download', label: 'Download' },
  { key: 'publish', label: 'Publish' },
];

const getPlatformIcon = (platform) => {
  const size = 14;
  switch (platform.toLowerCase()) {
    case 'instagram':
      return <FaInstagram size={size} color="#E1306C" title="Published on Instagram" />;
    case 'facebook':
      return <FaFacebook size={size} color="#4267B2" title="Published on Facebook" />;
    case 'youtube':
      return <FaYoutube size={size} color="#FF0000" title="Published on YouTube" />;
    case 'mail':
      return <FaEnvelope size={size} color="#0072C6" title="Published via Email" />;
    default:
      return null;
  }
};

// Helper function to check if file type is supported by platform
const isFileTypeSupported = (fileType, platform) => {
  if (!fileType) return true; // If no file type info, allow all platforms
  
  const lowerFileType = fileType.toLowerCase();
  
  switch (platform.toLowerCase()) {
    case 'youtube':
      // YouTube only supports video files
      return lowerFileType.startsWith('video/');
    case 'instagram':
      // Instagram supports image and video files
      return lowerFileType.startsWith('image/') || lowerFileType.startsWith('video/');
    case 'facebook':
      // Facebook supports all file types
      return true;
    case 'email':
      // Email supports all file types
      return true;
    default:
      return true;
  }
};

const Publish = ({ eventId }) => {
  const [publishData, setPublishData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [description, setDescription] = useState('');
  const [fileDetail, setFileDetail] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const { user } = useUser();
  const isFetchingRef = useRef(false);

  const handleDownload = (files) => {
    files.forEach(file => {
      const docId = file.url.split('/').pop();
      const link = document.createElement("a");
      link.href = `/apis/document/download/${docId}`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handlePlatformPublish = async (docId, platform, publishData = {}) => {
    const organizationId = user?.organizationId || '681460dcb8327b2e3417d8b1';
    
    let payload;
    let endpoint;

    if (platform === 'youtube') {
      endpoint = '/apis/youtube/upload';
      payload = {
        organizationId,
        documentId: docId,
        title: publishData.title || `${fileDetail?.name || 'Video'}`,
        description: publishData.description || '',
        tags: publishData.tags || [],
        privacyStatus: publishData.privacyStatus || 'public'
      };
    } else {
      endpoint = platform === 'instagram' 
        ? '/apis/socialmedia/post/instagram' 
        : '/apis/socialmedia/post/facebook';
      payload = {
        organizationId,
        documentId: docId,
        caption: publishData.caption || `${fileDetail?.name || 'Creative'} shared via platform`
      };
    }

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || `Failed to post to ${platform}`);
      }

      await handlePublishRecord(docId, platform);
      fetchPublishedTasks();
    } catch (err) {
      console.error(`Error posting to ${platform}:`, err);
      alert(`Error posting to ${platform}: ${err.message}`);
    }
  };

  const handlePublishRecord = async (docId, platform) => {
    const userId = user?.userID || '';
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    const payload = {
      platforms: [platform],
      userId,
      userName,
    };

    try {
      const response = await fetch(`/apis/document/publish-record/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify(payload),
      });
      if (!response.ok) throw new Error('Failed to record publish');
    } catch (err) {
      console.error('Error calling publish-record:', err);
    }
  };

  const handleShare = (file, fullTask) => {
    setDescription(file.name || '');
    // Use the correct document ID from the document object - prioritize documentId
    const docId = file.document?.documentId || file.document?.fileId;
    console.log('Publish - handleShare file:', file);
    console.log('Publish - file.document:', file.document);
    console.log('Publish - document ID:', docId);
    setDocumentId(docId);
    setFileDetail({ ...file, fullTask });
    setShowShareModal(true);
  };

  const fetchPublishedTasks = useCallback(async () => {
    if (!eventId || isFetchingRef.current) return;
    
    console.log("Executing fetchPublishedTasks for Publish with:", { eventId });
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const response = await fetch(`/apis/task/get_published_tasks_with_documents/${eventId}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "1",
        },
      });

      if (!response.ok) throw new Error("Failed to fetch published tasks");

      const data = await response.json();
      const formatted = data.map(task => {
        const fileLinks = (task.documents || []).map(doc => ({
          name: doc.filename,
          url: `/apis/task/download_document/${doc.documentId}`,
          status: doc.status || "Not Published",
          publishedTo: doc.publishedTo || [],
          fullTask: task,
          document: doc // This contains the document object with documentId field
        }));

        return {
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          files: fileLinks,
          status: fileLinks.length > 0 ? fileLinks.map(f => f.status).join(", ") : "No File",
        };
      });

      setPublishData(formatted);
    } catch (err) {
      console.error("Error fetching published tasks:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [eventId]);

  useEffect(() => {
    fetchPublishedTasks();
  }, [fetchPublishedTasks]);

  const renderCell = (key, item) => {
    if (key === 'download') {
      return (
        <button type="button" className="icon-btn" onClick={() => handleDownload(item.files)} title="Download File">
          <Download size={18} />
        </button>
      );
    }
    if (key === 'publish') {
      return item.files?.map((file, idx) => (
        <button
          key={idx}
          type="button"
          className="icon-btn"
          onClick={() => handleShare(file, file.fullTask)}
          title="Publish"
        >
          <Share2 size={18} />
        </button>
      )) || "-";
    }
    if (key === 'files') {
      return item.files?.map((file, idx) => (
        <div key={idx} className="file-entry">
          <span className="file-badge">
            <a
              href={file.url.replace('/apis/task/download_document/', '/apis/document/view/')}
              target="_blank"
              rel="noopener noreferrer"
            >
              {file.name}
            </a>
          </span>
          <span className="platform-icons">
            {file.publishedTo?.map((p, i) => {
              // Check if the platform supports this file type
              const fileType = file.document?.contentType || file.document?.type || file.type;
              const isSupported = isFileTypeSupported(fileType, p.platform);
              console.log(`Platform ${p.platform} for file type ${fileType}: ${isSupported ? 'supported' : 'not supported'}`);
              return isSupported ? (
                <span key={i} className="platform-icon">
                  {getPlatformIcon(p.platform)}
                </span>
              ) : null;
            }).filter(Boolean)}
          </span>
        </div>
      )) || "No File";
    }
    
    if (key === 'status') {
      const status = item[key] || "Unknown";
      const statusClass = status.toLowerCase().replace(/\s+/g, '-');
      return (
        <span className={`status-badge status-${statusClass}`}>
          {status}
        </span>
      );
    }
    
    return item[key] || "-";
  };

  return (
    <div className='Publish_Section'>
      <Table
        columns={columns}
        data={publishData}
        renderCell={renderCell}
        showActions={false}
        loading={loading}
        noDataText="No Publish Scheduled at this time"
        addEventText="Click here to add a New Publish"
        onAddEventClick={() => alert("Add Publish clicked")}
      />

      {showShareModal && (
        <FileShareModel
          onClose={() => setShowShareModal(false)}
          fileDetail={fileDetail}
          documentId={documentId}
          description={description}
          onPlatformPublish={handlePlatformPublish}
          documents={fileDetail && fileDetail.document ? [fileDetail.document] : []}
        />
      )}
    </div>
  );
};

export default Publish;