import React, { useEffect, useState, useRef, useCallback } from 'react';
import Accordion from '../../../CommonComponents/Accordian/Accordian';
import FilesandUploads from '../../../CommonComponents/FileandUpload/FilesAndUploads';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import { useUser } from '../../../Context/UserContext';
import "../Tasks.css";

const FilesUploads = ({ filesFromTasks, eventId, organizationId }) => {
  const { user } = useUser();
  const [fetchedEventFiles, setFetchedEventFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);
  const filesRef = useRef([]);
  const isMountedRef = useRef(true);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return 'file';
    if (mime.startsWith('image')) return 'image';
    if (mime.startsWith('video')) return 'video';
    if (mime.startsWith('audio')) return 'audio';
    if (mime === 'application/pdf') return 'pdf';
    return 'file';
  };

  const fetchEventDocuments = useCallback(async () => {
    if (!eventId || isFetchingRef.current) return;
    
    
    isFetchingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(`/apis/document-details/event/${eventId}`, {
        headers: { 'ngrok-skip-browser-warning': '1' }
      });
      const data = await res.json();

      const filesWithPreview = await Promise.all(
        data.map(async (doc) => {
          const type = getFileTypeFromMime(doc.contentType);
          let src = '';

          if (['image', 'video', 'audio', 'pdf'].includes(type)) {
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
            status: doc.status || 'Pending',
            publishedTo: doc.publishedTo || [],
            uploadDate: doc.uploadDate,
            userInfo: doc.userInfo
          };
        })
      );

      setFetchedEventFiles(filesWithPreview);
      filesRef.current = filesWithPreview;
    } catch (error) {
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) {
      fetchEventDocuments();
    }
  }, [eventId]); // Only depend on eventId, not the function

  // Temporarily disable cleanup to test if it's causing the issue

  // Skeleton placeholder for file cards
  const SkeletonCards = () => (
    <div className="files-grid">
      {[1, 2, 3].map((_, i) => (
        <div key={i} className="file-card">
          <Skeleton height={20} width={120} style={{ marginBottom: '8px' }} />
          <Skeleton height={100} width="100%" />
        </div>
      ))}
    </div>
  );

  return (
    <div className='Publish_Section'>
      <Accordion 
        title="Events File" 
        content={
          loading
            ? <SkeletonCards />
            : <FilesandUploads files={fetchedEventFiles}  enableSelectionCheckbox={false}  eventId={eventId} organizationId={organizationId} userId={user?.userId} />
        } 
      />
      <Accordion 
        title="Tasks File" 
        content={<FilesandUploads files={filesFromTasks}  enableSelectionCheckbox={false}  eventId={eventId} organizationId={organizationId} userId={user?.userId} />} 
      />
    </div>
  );
};

export default FilesUploads;
