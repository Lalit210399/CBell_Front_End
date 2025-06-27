import React, { useEffect, useState } from 'react';
import Table from "../../../CommonComponents/Table/Table";
import { Download, Share2 } from "lucide-react";
import { useUser } from "../../../Context/UserContext";
import InstagramMediaUploader from '../../../CommonComponents/SocialMediaPost/Instagram';
// import FileShareModel from '../../../CommonComponents/ShareModal/FileShareModel';
import FileShareModel from '../../../CommonComponents/FileShareModal/FileShareModel'; // Import the FileShareModel component
import "../Tasks.css";

const columns = [
  { key: 'creative_name', label: 'Creative Name' },
  { key: 'creative_type', label: 'Creative Type' },
  { key: 'files', label: 'Files' },
  { key: 'status', label: 'Status' },
  { key: 'download', label: 'Download' },
  { key: 'publish', label: 'Publish' },
];

const Publish = ({ eventId }) => {
  const [publishData, setPublishData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [description, setDescription] = useState('');
  const [fileDetail, setFileDetail] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false); // State for FileShareModel
  const { user } = useUser();
  console.log('Publish component props:', { eventId, user });

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

  const handlePublishRecord = async (docId, platform) => {
    const userId = user?.userID || '';
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    const payload = {
      platforms: [platform],
      userId,
      userName,
    };
    console.log('Publish record payload:', payload);
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
      console.log(` Publish record for ${platform} saved.`);
    } catch (err) {
      console.error(' Error calling publish-record:', err);
    }
  };

  const handleShare = async (file) => {
    setDescription(file.name || '');
    setDocumentId(file.url.split('/').pop());
    setFileDetail(file); // Store the full file object
    setShowShareModal(true); // Show the FileShareModel
    // setOpen(true); // No longer open InstagramMediaUploader
  };

  const fetchPublishedTasks = async () => {
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
          status: doc.status || "Not Published"
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
    }
  };

  useEffect(() => {
    if (eventId) fetchPublishedTasks();
  }, [eventId]);

  const renderCell = (key, item) => {
    if (key === 'download') {
      return (
        <button className="icon-btn" onClick={() => handleDownload(item.files)} title="Download File">
          <Download size={18} />
        </button>
      );
    }
    if (key === 'publish') {
      return item.files?.map((file, idx) => (
        <button
          key={idx}
          className="icon-btn"
          onClick={() => handleShare(file)}
          title="Publish"
          // disabled={file.status && file.status.toLowerCase() === 'published'}
        >
          <Share2 size={18} />
        </button>
      )) || "-";
    }
    if (key === 'files') {
      return item.files?.map((file, idx) => (
        <div key={idx}>
          <a
            href={file.url.replace('/apis/task/download_document/', '/apis/document/view/')}
            target="_blank"
            rel="noopener noreferrer"
          >
            {file.name}
          </a>
        </div>
      )) || "No File";
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


      {/* FileShareModel component */}
      {showShareModal && (
        <FileShareModel
          onClose={() => setShowShareModal(false)}
          fileDetail={fileDetail}
          documentId={documentId}
          description={description}
        />
      )}
     
    </div>
  );
};

export default Publish;