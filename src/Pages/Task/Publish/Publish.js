import React, { useEffect, useState } from 'react';
import Table from "../../../CommonComponents/Table/Table";
import { Download, Share2 } from "lucide-react";
import { useUser } from "../../../Context/UserContext";
import InstagramMediaUploader from '../../../CommonComponents/SocialMediaPost/Instagram';
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
  const { user } = useUser();

  //console.log("User:", user);

  const handleDownload = (files) => {
    files.forEach(file => {
      const documentId = file.url.split('/').pop();
      const link = document.createElement("a");
      link.href = `/apis/document/download/${documentId}`;
      link.download = file.name;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    });
  };

  const handleSendMail = (creativeName) => {
    //console.log("Sending mail for:", creativeName);
    // Integrate email logic here
  };

  const handlePublishRecord = async (docId, platform) => {
    try {
      const response = await fetch(`/apis/document/publish-record/${docId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify({
          platforms: [platform],
          userId: user?.id || '',
          userName: user?.name || '',
        }),
      });
      if (!response.ok) throw new Error('Failed to record publish');
      // Optionally show a success message
    } catch (err) {
      console.error('Error calling publish-record:', err);
    }
  };

  const handleShare = async (file) => {
    setDescription(file.name || '');
    setDocumentId(file.url.split('/').pop());
    setOpen(true);
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

      if (!response.ok) {
        throw new Error("Failed to fetch published tasks");
      }

      const data = await response.json();

      const formatted = data.map(task => {
        const fileLinks = (task.documents || []).map(doc => ({
          name: doc.filename,
          url: `/apis/task/download_document/${doc.documentId}`
        }));

        return {
          id: task.id,
          creative_name: task.taskTitle,
          creative_type: task.creativeType,
          files: fileLinks,
          status: task.taskStatus,
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
    if (eventId) {
      fetchPublishedTasks();
    }
  }, [eventId]);

  const renderCell = (key, item) => {
    if (key === 'download') {
      return (
        <button
          className="icon-btn"
          onClick={() => handleDownload(item.files)}
          title="Download File"
        >
          <Download size={18} />
        </button>
      );
    }
    if (key === 'publish') {
      // Show share icon for each file
      return item.files?.map((file, idx) => (
        <button
          key={idx}
          className="icon-btn"
          onClick={() => handleShare(file)}
          title="Publish"
        >
          <Share2 size={18} />
        </button>
      )) || "-";
    }
    if (key === 'files') {
      return item.files?.map((file, idx) => (
        <div key={idx}>
          <a href={file.url.replace('/apis/task/download_document/', '/apis/document/view/')} target="_blank" rel="noopener noreferrer">
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
      <InstagramMediaUploader
        igUserId="17841474808473956"
        fbPageId="648945998310294"
        accessToken="EAAJ0QEHHOUIBO6BX2GUImguPnS4OR32GGZCmUDwVUnhmSVohMcZAZATGfZBkNQrbWL4Cxzzjx9fWXZCC5VmOiRKJq2dlSQZBO3hmLEHxZAOfIbiwe6yfg9hrpuzpZBroHlg6RkqU01jPX33P5wWup6yK0SVFkByGjsZCppm6NE8mtpeuPIzPCi3NrRgvZBZB28UKTB3"
        open={open}
        onClose={() => setOpen(false)}
        defaultImageUrl={documentId || ''}
        defaultCaption={description || ''}
        onSuccess={(platform) => handlePublishRecord(documentId, platform)}
      />
    </div>
  );
};

export default Publish;
