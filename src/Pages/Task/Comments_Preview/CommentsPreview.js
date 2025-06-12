import React, { useState, useEffect } from "react";
import Conversation from "../../../CommonComponents/ConversationModule/ConversationModule";
import FileUpload from "../../../CommonComponents/FileUpload/FileUpload";
import { useUser } from "../../../Context/UserContext";
import "./CommentsPreview.css";

const CommentsPreview = ({ onFilesChange, taskId, eventId, isActive, organizationId }) => {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldLoadConversation, setShouldLoadConversation] = useState(false);
  const [latestFile, setLatestFile] = useState(null);
  const [fileLoading, setFileLoading] = useState(false); // New state for loading

  const getInitials = (firstName, lastName) => {
    const first = firstName?.[0] || "";
    const last = lastName?.[0] || "";
    return (first + last).toUpperCase();
  };

  const currentUser = {
    id: user?.userID,
    firstName: user?.firstName,
    lastName: user?.lastName,
    avatar: getInitials(user?.firstName, user?.lastName),
    organizationId: user?.organizationId,
  };

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'application/octet-stream';
    if (mime.startsWith('image')) return mime;
    if (mime.startsWith('video')) return mime;
    if (mime.startsWith('audio')) return mime;
    if (mime === 'application/pdf') return mime;
    if (mime.includes('word')) return 'application/msword';
    if (mime.includes('excel')) return 'application/vnd.ms-excel';
    if (mime.includes('powerpoint')) return 'application/vnd.ms-powerpoint';
    return mime;
  };

  useEffect(() => {
    if (isActive && !shouldLoadConversation) {
      setShouldLoadConversation(true);
    }
  }, [isActive, shouldLoadConversation]);

// ...existing code...
useEffect(() => {
  const fetchLatestDocument = async () => {
    if (!taskId) return;
    setFileLoading(true); // Start loading

    try {
      const res = await fetch(`/apis/document-details/task/${taskId}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      const data = await res.json();
      if (!data?.length) return;

      // Always reverse so newest files are first everywhere
      const reversedData = [...data].reverse();

      // Prepare all files for preview strip and main viewer
      const files = await Promise.all(
        reversedData.map(async (doc) => {
          const type = getFileTypeFromMime(doc.contentType);
          const fileData = {
            name: doc.filename,
            type: type,
            documentId: doc.documentId,
            description: doc.description,
            url: `/apis/document/view/${doc.documentId}`,
          };
          if (type.startsWith('image/')) {
            try {
              const imageRes = await fetch(fileData.url, {
                headers: { 'ngrok-skip-browser-warning': '1' }
              });
              const blob = await imageRes.blob();
              fileData.previewUrl = URL.createObjectURL(blob);
            } catch (err) {
              console.error("Error creating image preview:", err);
            }
          }
          return fileData;
        })
      );

      setLatestFile(files); // All files, newest first
      onFilesChange({
        files: files,
        description: `${files[0]?.filename || ""} (${files[0]?.type || ""})`,
      });
    } catch (err) {
      console.error("Error fetching latest document:", err);
    } finally {
      setFileLoading(false); // End loading
    }
  };

  fetchLatestDocument();
}, [taskId, onFilesChange]);
// ...existing code...

  const handleToggleCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  return (
    <div className="CommentsPreview_Container">
      <div className={`Right_Section section ${isCollapsed ? "expanded" : ""}`}>
        {shouldLoadConversation && (
          <Conversation
            currentUser={currentUser}
            taskId={taskId}
            eventId={eventId}
            isActive={isActive}
          />
        )}
      </div>
      <div className={`Left_Section section ${isCollapsed ? "collapsed" : ""}`}>
        <FileUpload
          onToggleCollapse={handleToggleCollapse}
          onFilesChange={onFilesChange}
          taskId={taskId}
          eventId={eventId}
          organizationId={organizationId}
          initialFiles={latestFile}
          externalLoading={fileLoading} // <-- NEW PROP
        />
      </div>
    </div>
  );
};

export default React.memo(CommentsPreview);
