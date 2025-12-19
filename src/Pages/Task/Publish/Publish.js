import React, { useEffect, useState, useRef, useCallback } from 'react';
import ReactDOM from 'react-dom';
import Table from "../../../CommonComponents/Table/Table";
import { Download, Share2 } from "lucide-react";
import { useUser } from "../../../Context/UserContext";
import { useMessages } from "../../../Context/MessageContext";
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

const Publish = ({ eventId, canPublish = true, user: userProp }) => {
  
  const [publishData, setPublishData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [documentId, setDocumentId] = useState('');
  const [description, setDescription] = useState('');
  const [fileDetail, setFileDetail] = useState(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [showPostLinkModal, setShowPostLinkModal] = useState(false);
  const [postLinkData, setPostLinkData] = useState(null);
  const [selectedPlatformIndex, setSelectedPlatformIndex] = useState(0);
  const { user: contextUser } = useUser();
  const { addMessage } = useMessages();
  const user = userProp || contextUser;
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

  const fetchPublishedLinks = async (docId, taskId) => {
    try {
      const response = await fetch(`/apis/socialmedia/post-links/task/${taskId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch published links');
      }

      const data = await response.json();
      
      // Group links by platform to avoid duplicates
      const platformMap = new Map();
      
      data.forEach(item => {
        if (item.links && Array.isArray(item.links)) {
          item.links.forEach(link => {
            const platform = link.platform;
            if (!platformMap.has(platform)) {
              platformMap.set(platform, link);
            }
          });
        }
      });
      
      // Convert map to array
      return Array.from(platformMap.values());
    } catch (err) {
      console.error('Error fetching published links:', err);
      return [];
    }
  };

  const handleViewPublishedLinks = async (docId, taskId) => {
    const links = await fetchPublishedLinks(docId, taskId);
    if (links.length > 0) {
      setPostLinkData({ links, viewMode: true });
      setSelectedPlatformIndex(0);
      setShowPostLinkModal(true);
    } else {
      addMessage({
        text: "No published links found for this document",
        type: "info",
        duration: 2000,
      });
    }
  };

  const saveSocialMediaPostLink = async (docId, platform, postData) => {
    const organizationId = user?.organizationId;
    const taskId = fileDetail?.fullTask?.id || fileDetail?.id;
    
    // Construct the payload
    const payload = {
      organizationId,
      eventId,
      taskId,
      documentId: docId,
      links: [
        {
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          url: postData.postUrl || '',
          postId: postData.postId || '',
          postedAt: new Date().toISOString()
        }
      ]
    };

    try {
      const response = await fetch('/apis/socialmedia/post-links', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'ngrok-skip-browser-warning': '1',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || 'Failed to save social media post link');
      }

      const result = await response.json();

      return result;
    } catch (err) {
      console.error('Error saving social media post link:', err);
      // Don't throw error to avoid disrupting the publish flow
      // Just log it for debugging
    }
  };

  const handlePlatformPublish = async (docId, platform, publishData = {}) => {
    // Check if user has permission to publish
    if (!canPublish) {
      alert("You don't have permission to publish content for this event. Only assigned users can perform this action.");
      return;
    }
    
    // For email platform, we don't need to make an API call here
    // The email API call is already handled in EmailForm.js
    if (platform === 'email') {
      await handlePublishRecord(docId, platform);
      fetchPublishedTasks();
      // Show success notification for email
      addMessage({
        text: "Email published successfully!",
        type: "success",
        duration: 3000,
      });
      return;
    }
    
    const organizationId = user?.organizationId;
    const taskId = fileDetail?.fullTask?.id || fileDetail?.id;
    
    let payload;
    let endpoint;

    if (platform === 'youtube') {
      endpoint = '/apis/youtube/upload';
      payload = {
        organizationId,
        documentId: docId,
        taskId: taskId,
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
        taskId: taskId,
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
        let errorMessage = `Failed to post to ${platform}`;
        
        // Clone the response to avoid "body stream already read" error
        const responseClone = response.clone();
        
        try {
          const errorData = await response.json();
          errorMessage = errorData.message || errorMessage;
          
          // Handle specific error for social media config not found
          if (response.status === 400 && (
            errorData.message?.includes('Social media config not found') ||
            errorData.message?.includes('social media account not configured') ||
            errorData.message?.includes('Social media account not configured') ||
            errorData.message?.includes('config not found') ||
            errorData.message?.includes('account not configured')
          )) {
            throw new Error('No social media account added. Please contact your administrator to add social media accounts for your organization.');
          }
        } catch (jsonError) {
          // If response is not valid JSON, check for specific error patterns in text
          try {
            const responseText = await responseClone.text();
            if (response.status === 400 && (
              responseText.includes('Social media config not found') ||
              responseText.includes('social media account not configured') ||
              responseText.includes('Social media account not configured') ||
              responseText.includes('config not found') ||
              responseText.includes('account not configured')
            )) {
              throw new Error('No social media account added. Please contact your administrator to add social media accounts for your organization.');
            }
            errorMessage = responseText || errorMessage;
          } catch (textError) {
            // If both JSON and text parsing fail, use default message
            console.error('Failed to parse response:', textError);
          }
        }
        

        
        throw new Error(errorMessage);
      }

      // Get the response data
      const responseData = await response.json();
      
      // Save the social media post link to database
      if (responseData.success && responseData.postUrl) {
        await saveSocialMediaPostLink(docId, platform, {
          postId: responseData.postId,
          postUrl: responseData.postUrl
        });
        
        // Show the post link in a modal
        setPostLinkData({
          platform: platform.charAt(0).toUpperCase() + platform.slice(1),
          postUrl: responseData.postUrl,
          postId: responseData.postId
        });
        setShowPostLinkModal(true);
      }

      await handlePublishRecord(docId, platform);
      fetchPublishedTasks();
      
      // Show success notification for social media platforms
      const platformName = platform.charAt(0).toUpperCase() + platform.slice(1);
      addMessage({
        text: `${platformName} published successfully!`,
        type: "success",
        duration: 3000,
      });
    } catch (err) {
      // Show error message using the message system for better UX
      addMessage({
        text: err.message,
        type: "error",
        duration: 5000,
      });
    }
  };

  const handlePublishRecord = async (docId, platform) => {
    // Try to get user ID from various possible field names
    const userId = user?.id || user?._id || user?.userId || user?.user_id || user?.uid || user?.userID;
    const userName = user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() : '';
    
    // Validate that we have a valid user ID
    if (!userId) {
      console.error("User ID not available for publish record");
      return;
    }
    
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
    }
  };

  const handleShare = (file, fullTask) => {
    // Check if user has permission to publish
    if (!canPublish) {
      alert("You don't have permission to publish content for this event. Only assigned users can perform this action.");
      return;
    }
    // Use file description as default, fallback to file name
    const fileDescription = file.document?.description || file.description || file.name || '';
    setDescription(fileDescription);
    // Use the correct document ID from the document object - prioritize documentId
    const docId = file.document?.documentId || file.document?.fileId;
    setDocumentId(docId);
    setFileDetail({ ...file, fullTask });
    setShowShareModal(true);
  };

  const fetchPublishedTasks = useCallback(async () => {
    if (!eventId || isFetchingRef.current) return;
    
    
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
      if (!canPublish) {
        return (
          <span className="permission-denied" title="You don't have permission to publish content for this event">
            No Access
          </span>
        );
      }
      
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
      return item.files?.map((file, idx) => {
        const docId = file.document?.documentId || file.document?.fileId;
        const taskId = file.fullTask?.id;
        return (
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
                return isSupported ? (
                  <span 
                    key={i} 
                    className="platform-icon clickable" 
                    onClick={() => handleViewPublishedLinks(docId, taskId)}
                    title={`View ${p.platform} post`}
                  >
                    {getPlatformIcon(p.platform)}
                  </span>
                ) : null;
              }).filter(Boolean)}
            </span>
          </div>
        );
      }) || "No File";
    }
    
    if (key === 'status') {
      const status = item[key] || "Unknown";
      const statusClass = status.toLowerCase().replace(/\s+/g, '-');
      const isPublished = status.toLowerCase().includes('published');
      const firstFile = item.files?.[0];
      const docId = firstFile?.document?.documentId || firstFile?.document?.fileId;
      const taskId = firstFile?.fullTask?.id;
      
      return (
        <span 
          className={`status-badge status-${statusClass} ${isPublished && docId ? 'clickable-status' : ''}`}
          onClick={() => isPublished && docId && handleViewPublishedLinks(docId, taskId)}
          title={isPublished && docId ? "Click to view published links" : ""}
        >
          {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
        </span>
      );
    }
    
    return item[key] || "-";
  };

  const handleCopyLink = () => {
    if (postLinkData?.postUrl) {
      navigator.clipboard.writeText(postLinkData.postUrl)
        .then(() => {
          addMessage({
            text: "Link copied to clipboard!",
            type: "success",
            duration: 2000,
          });
        })
        .catch(() => {
          addMessage({
            text: "Failed to copy link",
            type: "error",
            duration: 2000,
          });
        });
    }
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
        // addEventText="Click here to add a New Publish"
        // onAddEventClick={() => alert("Add Publish clicked")}
      />

      {showShareModal && (
        <FileShareModel
          onClose={() => setShowShareModal(false)}
          fileDetail={fileDetail}
          documentId={documentId}
          description={description}
          taskId={fileDetail?.fullTask?.id || fileDetail?.id}
          onPlatformPublish={handlePlatformPublish}
          documents={fileDetail && fileDetail.document ? [fileDetail.document] : []}
        />
      )}

      {showPostLinkModal && postLinkData && ReactDOM.createPortal(
        <div className="post-link-modal-overlay" onClick={() => setShowPostLinkModal(false)}>
          <div className="post-link-modal" onClick={(e) => e.stopPropagation()}>
            <div className="post-link-header">
              <h3>{postLinkData.viewMode ? 'Published Links' : 'Post Published Successfully!'}</h3>
              <button className="close-btn" onClick={() => setShowPostLinkModal(false)}>×</button>
            </div>
            <div className="post-link-body">
              {postLinkData.viewMode ? (
                // View mode: Show all published links
                <>
                  <div className="platform-icons-header">
                    {postLinkData.links?.map((link, idx) => {
                      const platformName = link.platform?.toLowerCase();
                      return (
                        <button
                          key={idx}
                          className={`platform-icon-btn ${selectedPlatformIndex === idx ? 'active' : ''}`}
                          onClick={() => setSelectedPlatformIndex(idx)}
                          title={`View ${link.platform} post`}
                        >
                          {platformName === 'facebook' && <FaFacebook size={24} color="#4267B2" />}
                          {platformName === 'instagram' && <FaInstagram size={24} color="#E1306C" />}
                          {platformName === 'youtube' && <FaYoutube size={24} color="#FF0000" />}
                          {platformName === 'mail' && <FaEnvelope size={24} color="#0072C6" />}
                        </button>
                      );
                    })}
                  </div>
                  {postLinkData.links?.[selectedPlatformIndex] && (
                    <div className="post-link-info">
                      <div className="platform-badge">
                        {postLinkData.links[selectedPlatformIndex].platform?.toLowerCase() === 'facebook' && <FaFacebook size={20} color="#4267B2" />}
                        {postLinkData.links[selectedPlatformIndex].platform?.toLowerCase() === 'instagram' && <FaInstagram size={20} color="#E1306C" />}
                        {postLinkData.links[selectedPlatformIndex].platform?.toLowerCase() === 'youtube' && <FaYoutube size={20} color="#FF0000" />}
                        {postLinkData.links[selectedPlatformIndex].platform?.toLowerCase() === 'mail' && <FaEnvelope size={20} color="#0072C6" />}
                        <span>{postLinkData.links[selectedPlatformIndex].platform}</span>
                      </div>
                      <div className="post-link-details">
                        <label>Post URL:</label>
                        <div className="link-container">
                          <input 
                            type="text" 
                            value={postLinkData.links[selectedPlatformIndex].url} 
                            readOnly 
                            className="link-input"
                          />
                          <button className="copy-btn" onClick={() => {
                            navigator.clipboard.writeText(postLinkData.links[selectedPlatformIndex].url)
                              .then(() => {
                                addMessage({
                                  text: "Link copied to clipboard!",
                                  type: "success",
                                  duration: 2000,
                                });
                              })
                              .catch(() => {
                                addMessage({
                                  text: "Failed to copy link",
                                  type: "error",
                                  duration: 2000,
                                });
                              });
                          }} title="Copy link">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                              <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                            </svg>
                            Copy
                          </button>
                        </div>
                      </div>
                      <div className="post-link-actions">
                        <a 
                          href={postLinkData.links[selectedPlatformIndex].url} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="view-post-btn"
                        >
                          View Post
                        </a>
                        <button className="done-btn" onClick={() => setShowPostLinkModal(false)}>
                          Done
                        </button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                // Single publish mode
                <>
                  <div className="post-link-info">
                    <div className="platform-badge">
                      {postLinkData.platform === 'Facebook' && <FaFacebook size={20} color="#4267B2" />}
                      {postLinkData.platform === 'Instagram' && <FaInstagram size={20} color="#E1306C" />}
                      {postLinkData.platform === 'Youtube' && <FaYoutube size={20} color="#FF0000" />}
                      <span>{postLinkData.platform}</span>
                    </div>
                    <div className="post-link-details">
                      <label>Post URL:</label>
                      <div className="link-container">
                        <input 
                          type="text" 
                          value={postLinkData.postUrl} 
                          readOnly 
                          className="link-input"
                        />
                        <button className="copy-btn" onClick={handleCopyLink} title="Copy link">
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                            <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                          </svg>
                          Copy
                        </button>
                      </div>
                    </div>
                  </div>
                  <div className="post-link-actions">
                    <a 
                      href={postLinkData.postUrl} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="view-post-btn"
                    >
                      View Post
                    </a>
                    <button className="done-btn" onClick={() => setShowPostLinkModal(false)}>
                      Done
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default Publish;