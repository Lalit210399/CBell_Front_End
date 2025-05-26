import React, { useEffect, useState } from "react";
import FilesandUploads from "../../../CommonComponents/FileandUpload/FilesAndUploads";

const TasksFiles = ({ files, onFilesChange, taskId, eventId, organizationId }) => {
  const [fetchedFiles, setFetchedFiles] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const getFileTypeFromMime = (mime) => {
      if (!mime) return 'file';
      if (mime.startsWith('image')) return 'image';
      if (mime.startsWith('video')) return 'video';
      if (mime.startsWith('audio')) return 'audio';
      if (mime === 'application/pdf') return 'pdf';
      return 'file';
    };

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/apis/document-details/task/${taskId}`, {
          headers: { 'ngrok-skip-browser-warning': '1' }
        });
        const data = await res.json();

        const filesWithPreview = await Promise.all(
          data.map(async (doc) => {
            const type = getFileTypeFromMime(doc.contentType);
            let src = '';

            if (type === 'image') {
              const response = await fetch(`/apis/document/view/${doc.documentId}`, {
                headers: { 'ngrok-skip-browser-warning': '1' }
              });
              const blob = await response.blob();
              src = URL.createObjectURL(blob);
            } else {
              src = `/apis/document/view/${doc.documentId}`;
            }

            return {
              name: doc.filename,
              type,
              documentId: doc.documentId,
              description: doc.description,
              src
            };
          })
        );

        setFetchedFiles(filesWithPreview);
      } catch (error) {
        console.error("Error fetching task documents:", error);
      } finally {
        setLoading(false);
      }
    };

    if (taskId) {
      fetchDocuments();
    }
  }, [taskId]);

  return (
    <div>
      {loading ? (
        <p>Loading...</p>
      ) : (
        <FilesandUploads
          files={fetchedFiles}
          onDataChange={onFilesChange}
          taskId={taskId}
          eventId={eventId}
          organizationId={organizationId}
          readOnly={false}  // Will show Upload and Add Link
        />
      )}
    </div>
  );
};

export default TasksFiles;
