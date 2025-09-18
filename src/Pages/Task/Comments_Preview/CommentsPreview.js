import React, { useState, useEffect } from "react";
import Conversation from "../../../CommonComponents/ConversationModule/ConversationModule";
import FileUpload from "../../../CommonComponents/FileUpload/FileUpload";
import { useUser } from "../../../Context/UserContext";
import SpecialGuests from "../../../CommonComponents/List/List";
import "./CommentsPreview.css";

const CommentsPreview = ({ onFilesChange = () => {}, taskId, eventId, isActive, organizationId }) => {
  const { user } = useUser();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [shouldLoadConversation, setShouldLoadConversation] = useState(false);
  const [allFiles, setAllFiles] = useState([]);
  const [loadingFiles, setLoadingFiles] = useState(false);

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

  useEffect(() => {
    const fetchAllDocuments = async () => {
      if (!taskId) return;
      setLoadingFiles(true);

      try {
        const res = await fetch(`/apis/document-details/task/${taskId}`, {
          headers: { "ngrok-skip-browser-warning": "1" },
        });
        const data = await res.json();
        if (!Array.isArray(data)) return;

        const files = data.map((doc) => ({
          name: doc.filename,
          type: doc.contentType || "application/octet-stream",
          documentId: doc.documentId,
          description: doc.description,
          url: `/apis/document/view/${doc.documentId}`,
        }));

        setAllFiles(files);

        const description = files.map((f) => `${f.name} (${f.type})`).join(", ");
        onFilesChange({ files, description });
      } catch (err) {
        console.error("Error fetching documents:", err);
      } finally {
        setLoadingFiles(false);
      }
    };

    fetchAllDocuments();
  }, [taskId]);

  const handleToggleCollapse = (collapsed) => {
    setIsCollapsed(collapsed);
  };

  const handleFilesChange = ({ files, description }) => {
    setAllFiles(files);
    onFilesChange({ files, description });
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
          onFilesChange={handleFilesChange}
          taskId={taskId}
          eventId={eventId}
          organizationId={organizationId}
          initialFiles={allFiles}
          externalLoading={loadingFiles}
        />
        <SpecialGuests />
      </div>
    </div>
  );
};

export default React.memo(CommentsPreview);
