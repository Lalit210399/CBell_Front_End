import React, { useEffect, useState } from "react";
import FilesandUploads from "../../../CommonComponents/FileandUpload/FilesAndUploads";

const TasksFiles = ({ 
  files, 
  onFilesChange, 
  taskId, 
  eventId, 
  organizationId, 
  mode = "view",
  selectedFiles,
  onFileSelect,
  taskStatus
}) => {
  const [fetchedFiles, setFetchedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasApprovedFile, setHasApprovedFile] = useState(false);

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

        // Check if any file is already approved
        const approvedExists = data.some(doc => doc.status === 'Approved');
        setHasApprovedFile(approvedExists);

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
              src,
              status: doc.status || 'Pending', // Add status field
              publishedTo: doc.publishedTo || [], // Add publishedTo field
              isApproved: doc.status === 'Approved' // Calculate isApproved
            };
          })
        );

        // Automatically select approved files
        const approvedFiles = filesWithPreview.filter(file => file.isApproved);
        if (approvedFiles.length > 0 && onFileSelect) {
          approvedFiles.forEach(file => {
            onFileSelect(file, true);
          });
        }

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

  const handleFileSelect = (fileId, isSelected) => {
    if (hasApprovedFile) {
      // Don't allow selection changes if there's an approved file
      return;
    }

    const selectedFile = fetchedFiles.find(f => f.documentId === fileId);
    if (selectedFile) {
      // For radio buttons, always pass true (single selection)
      // The parent component should handle clearing previous selections
      onFileSelect(selectedFile, true);
    }
  };

  return (
    <div>
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: '20px' }}>
          <p>Loading files...</p>
        </div>
      ) : (
        <FilesandUploads
          files={fetchedFiles}
          onDataChange={onFilesChange}
          taskId={taskId}
          eventId={eventId}
          organizationId={organizationId}
          readOnly={hasApprovedFile} // Only disable if approved file exists, not for view mode
          mode={mode}
          selectedFiles={selectedFiles.map(f => f.documentId)}
          onFileSelect={handleFileSelect}
          hasApprovedFile={hasApprovedFile} // Pass this prop to child
          enableSelectionRadio={taskStatus?.value === "Under Approval" || taskStatus?.value === "Under Review"}
        />
      )}
    </div>
  );
};

export default TasksFiles;