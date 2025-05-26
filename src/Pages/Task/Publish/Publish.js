import React from 'react';
import Table from "../../../CommonComponents/Table/Table";
import { Download, Mail } from "lucide-react";
import "../Tasks.css";

// Define columns
const columns = [
  { key: 'creative_name', label: 'Creative Name' },
  { key: 'creative_type', label: 'Creative Type' },
  { key: 'files', label: 'Files' },
  { key: 'status', label: 'Status' },
  { key: 'Download', label: 'Download' },
  { key: 'sent_mail', label: 'Sent Mail' },
];

// Dummy data
const dummyPublishData = [
  {
    id: 1,
    creative_name: "Summer Campaign Banner",
    creative_type: "Image",
    files: ["https://example.com/files/summer_banner.jpg"],
    status: "Published",
  },
  {
    id: 2,
    creative_name: "Product Launch Video",
    creative_type: "Video",
    files: ["https://example.com/files/launch_video.mp4"],
    status: "Scheduled",
  },
  {
    id: 3,
    creative_name: "Email Newsletter",
    creative_type: "Email Template",
    files: ["https://example.com/files/newsletter.html"],
    status: "In Review",
  },
  {
    id: 4,
    creative_name: "App Store Screenshots",
    creative_type: "Image",
    files: ["https://example.com/files/screenshots.zip"],
    status: "Published",
  },
  {
    id: 5,
    creative_name: "Promo Animation",
    creative_type: "GIF",
    files: ["https://example.com/files/promo.gif"],
    status: "Scheduled",
  },
];

// Publish component
const Publish = () => {
  const handleDownload = (files) => {
    console.log("Downloading:", files);
    // Add download logic if needed
  };

  const handleSendMail = (creativeName) => {
    console.log("Sending mail for:", creativeName);
    // Add email trigger logic if needed
  };

  const renderCell = (key, item) => {
    if (key === 'Download') {
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
    if (key === 'sent_mail') {
      return (
        <button
          className="icon-btn"
          onClick={() => handleSendMail(item.creative_name)}
          title="Send Mail"
        >
          <Mail size={18} />
        </button>
      );
    }
    if (key === 'files') {
      return item.files?.[0] || "No File";
    }
    return item[key];
  };

  return (
    <div className='Publish_Section'>
      <Table
        columns={columns}
        data={dummyPublishData}
        renderCell={renderCell}
        showActions={false}
        noDataText="No Publish Scheduled at this time"
        addEventText="Click here to add a New Publish"
        onAddEventClick={() => alert("Add Publish clicked")}
      />
    </div>
  );
};

export default Publish;
