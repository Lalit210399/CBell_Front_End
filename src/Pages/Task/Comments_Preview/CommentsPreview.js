// import React, { useState, useEffect } from "react";
// import Conversation from "../../../CommonComponents/ConversationModule/ConversationModule";
// import FileUpload from "../../../CommonComponents/FileUpload/FileUpload";
// import { useUser } from "../../../Context/UserContext";
// import "./CommentsPreview.css";

// const CommentsPreview = ({ onFilesChange, taskId, eventId, isActive, organizationId }) => {
//   const { user } = useUser();
//   const [isCollapsed, setIsCollapsed] = useState(false);
//   const [shouldLoadConversation, setShouldLoadConversation] = useState(false);
//   const [latestFile, setLatestFile] = useState(null);
//   const [fileLoading, setFileLoading] = useState(false); // New state for loading

//   const getInitials = (firstName, lastName) => {
//     const first = firstName?.[0] || "";
//     const last = lastName?.[0] || "";
//     return (first + last).toUpperCase();
//   };

//   const currentUser = {
//     id: user?.userID,
//     firstName: user?.firstName,
//     lastName: user?.lastName,
//     avatar: getInitials(user?.firstName, user?.lastName),
//     organizationId: user?.organizationId,
//   };

//   const getFileTypeFromMime = (mime) => {
//     if (!mime) return 'application/octet-stream';
//     if (mime.startsWith('image')) return mime;
//     if (mime.startsWith('video')) return mime;
//     if (mime.startsWith('audio')) return mime;
//     if (mime === 'application/pdf') return mime;
//     if (mime.includes('word')) return 'application/msword';
//     if (mime.includes('excel')) return 'application/vnd.ms-excel';
//     if (mime.includes('powerpoint')) return 'application/vnd.ms-powerpoint';
//     return mime;
//   };

//   useEffect(() => {
//     if (isActive && !shouldLoadConversation) {
//       setShouldLoadConversation(true);
//     }
//   }, [isActive]);

//   useEffect(() => {
//     const fetchLatestDocument = async () => {
//       if (!taskId) return;
//       setFileLoading(true);

//       try {
//         const res = await fetch(`/apis/document-details/task/${taskId}`, {
//           headers: { 'ngrok-skip-browser-warning': '1' }
//         });
//         const data = await res.json();
//         if (!data?.length) return;

//         const lastDoc = data[data.length - 1];
//         const type = getFileTypeFromMime(lastDoc.contentType);

//         const fileData = {
//           name: lastDoc.filename,
//           type: type,
//           documentId: lastDoc.documentId,
//           description: lastDoc.description,
//           url: `/apis/document/view/${lastDoc.documentId}`,
//         };

//         if (type.startsWith('image/')) {
//           try {
//             const imageRes = await fetch(fileData.url, {
//               headers: { 'ngrok-skip-browser-warning': '1' }
//             });
//             const blob = await imageRes.blob();
//             fileData.previewUrl = URL.createObjectURL(blob);
//           } catch (err) {
//             console.error("Error creating image preview:", err);
//           }
//         }

//         setLatestFile([fileData]);
//         onFilesChange({
//           files: [fileData],
//           description: `${lastDoc.filename} (${type})`,
//         });
//       } catch (err) {
//         console.error("Error fetching latest document:", err);
//       } finally {
//         setFileLoading(false);
//       }
//     };

//     fetchLatestDocument();
//   }, [taskId]);

//   const handleToggleCollapse = (collapsed) => {
//     setIsCollapsed(collapsed);
//   };

//   return (
//     <div className="CommentsPreview_Container">
//       <div className={`Right_Section section ${isCollapsed ? "expanded" : ""}`}>
//         {shouldLoadConversation && (
//           <Conversation
//             currentUser={currentUser}
//             taskId={taskId}
//             eventId={eventId}
//             isActive={isActive}
//           />
//         )}
//       </div>
//       <div className={`Left_Section section ${isCollapsed ? "collapsed" : ""}`}>
//         <FileUpload
//           onToggleCollapse={handleToggleCollapse}
//           onFilesChange={onFilesChange}
//           taskId={taskId}
//           eventId={eventId}
//           organizationId={organizationId}
//           initialFiles={latestFile}
//           externalLoading={fileLoading}
//         />
//       </div>
//     </div>
//   );
// };

// export default React.memo(CommentsPreview);




import React, { useState, useEffect } from "react";
import Conversation from "../../../CommonComponents/ConversationModule/ConversationModule";
import FileUpload from "../../../CommonComponents/FileUpload/FileUpload";
import { useUser } from "../../../Context/UserContext";
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
    id: user?.userId,
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
  }, [isActive]);

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
      </div>
    </div>
  );
};

export default React.memo(CommentsPreview);