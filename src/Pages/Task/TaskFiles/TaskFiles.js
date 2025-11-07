import React, { useEffect, useState, useCallback, useRef } from "react";
import FilesandUploads from "../../../CommonComponents/FileandUpload/FilesAndUploads";
import { useUser } from "../../../Context/UserContext";
import { fetchWithRefresh } from "../../../Context/RefereshToken";

const TasksFiles = ({ 
  files, 
  onFilesChange, 
  taskId, 
  eventId, 
  organizationId, 
  mode = "view",
  selectedFiles,
  onFileSelect,
  taskStatus,
  onWorkSubmissionFilesChange
}) => {
  const { user } = useUser();
  const [fetchedFiles, setFetchedFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [hasApprovedFile, setHasApprovedFile] = useState(false);
  const [hasAnyFiles, setHasAnyFiles] = useState(false);
  const [hasWorkSubmissionFiles, setHasWorkSubmissionFiles] = useState(false);
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    const getFileTypeFromMime = (mime, filename = '') => {
      // First try to determine type from mime
      if (mime && mime !== 'application/octet-stream') {
        if (mime.startsWith('image')) return 'image';
        if (mime.startsWith('video')) return 'video';
        if (mime.startsWith('audio')) return 'audio';
        if (mime === 'application/pdf') return 'pdf';
      }
      
      // If mime is not conclusive, check file extension
      const extension = filename.toLowerCase().split('.').pop();
      const imageExtensions = ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'webp'];
      const videoExtensions = ['mp4', 'avi', 'mov', 'wmv'];
      const audioExtensions = ['mp3', 'wav', 'ogg'];
      
      if (imageExtensions.includes(extension)) return 'image';
      if (videoExtensions.includes(extension)) return 'video';
      if (audioExtensions.includes(extension)) return 'audio';
      if (extension === 'pdf') return 'pdf';
      
      return 'file';
    };

    const fetchDocuments = async () => {
      try {
        setLoading(true);
        const res = await fetchWithRefresh(`/apis/document-details/task/${taskId}`, {
          method: "GET",
          headers: { 
            'ngrok-skip-browser-warning': '1',
            'Content-Type': 'application/json'
          }
        });
        const data = await res.json();

        // Check if any file is already approved or published
        const approvedOrPublishedExists = data.some(doc => 
          doc.status === 'Approved' || doc.status === 'Published' || 
          (doc.publishedTo && doc.publishedTo.length > 0 && doc.publishedTo.some(p => p.isPublished === true))
        );
        setHasApprovedFile(approvedOrPublishedExists);
        
        // Check if there are any files at all
        setHasAnyFiles(data.length > 0);

        // Check for work submission files (files uploaded by designers)
        const workSubmissionFiles = data.filter(doc => {
          // Check if the uploader is a designer based on userInfo
          if (doc.userInfo && doc.userInfo.roles) {
            return doc.userInfo.roles.some(role => 
              role.name?.toLowerCase().includes('designer') || 
              role.displayName?.toLowerCase().includes('designer') ||
              role.name?.toLowerCase().includes('creative') ||
              role.displayName?.toLowerCase().includes('creative')
            );
          }
          return false;
        });
        
        setHasWorkSubmissionFiles(workSubmissionFiles.length > 0);

        const filesWithPreview = await Promise.all(
          data.map(async (doc) => {
            const type = getFileTypeFromMime(doc.contentType, doc.filename);
            let src = '';

            if (type === 'image') {
              const response = await fetchWithRefresh(`/apis/document/view/${doc.documentId}`, {
                method: "GET",
                headers: { 
                  'ngrok-skip-browser-warning': '1',
                  'Content-Type': 'application/json'
                }
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
              uploadDate: doc.uploadDate, // Add uploadDate field
              size: doc.fileSize || doc.size, // Add file size field
              userInfo: doc.userInfo, // Add userInfo field with roles and fullName
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

    if (taskId && (!hasFetchedRef.current || files?.refreshTrigger)) {
      hasFetchedRef.current = true;
      fetchDocuments();
    }
  }, [taskId, onFileSelect, files]); // Include files to listen for refresh triggers

  // Notify parent component when work submission files change
  useEffect(() => {
    if (onWorkSubmissionFilesChange) {
      onWorkSubmissionFilesChange(hasWorkSubmissionFiles);
    }
  }, [hasWorkSubmissionFiles, onWorkSubmissionFilesChange]);

  const handleFileSelect = useCallback((fileId, isSelected) => {
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
  }, [hasApprovedFile, fetchedFiles, onFileSelect]); // Include onFileSelect in dependencies

  // Function to check if task has any files (for external validation)
  const checkIfTaskHasFiles = () => {
    return hasAnyFiles;
  };

  // Expose the check function to parent component
  React.useImperativeHandle(React.forwardRef(() => null), () => ({
    checkIfTaskHasFiles
  }));

  return (
    <div>
      <FilesandUploads
        files={fetchedFiles}
        onDataChange={onFilesChange}
        taskId={taskId}
        eventId={eventId}
        organizationId={organizationId}
        userId={user?.userId}
        readOnly={hasApprovedFile} // Only disable if approved file exists, not for view mode
        mode={mode}
        selectedFiles={selectedFiles.map(f => f.documentId)}
        onFileSelect={handleFileSelect}
        hasApprovedFile={hasApprovedFile} // Pass this prop to child
        enableSelectionRadio={taskStatus?.value === "Under Approval"}
        onWorkSubmissionFilesChange={onWorkSubmissionFilesChange}
        externalLoading={loading}
        loadingType="fetch"
        taskStatus={taskStatus} // Pass task status to control upload button visibility
      />
    </div>
  );
};

export default TasksFiles;