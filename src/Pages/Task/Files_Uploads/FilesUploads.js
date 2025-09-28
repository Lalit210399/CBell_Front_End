import React, { useEffect, useState, useRef, useCallback } from 'react';
import Accordion from '../../../CommonComponents/Accordian/Accordian';
import FilesandUploads from '../../../CommonComponents/FileandUpload/FilesAndUploads';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import "../Tasks.css";

const FilesUploads = ({ filesFromTasks, eventId, organizationId }) => {
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
    
    console.log("Executing fetchEventDocuments for FilesUploads with:", { eventId });
    
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
            console.log(`Created blob URL for ${doc.filename}:`, src);
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

      console.log("Files with preview created:", filesWithPreview);
      setFetchedEventFiles(filesWithPreview);
      filesRef.current = filesWithPreview;
    } catch (error) {
      console.error("Error fetching event documents:", error);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [eventId]);

  useEffect(() => {
    console.log("useEffect running for fetchEventDocuments with eventId:", eventId);
    if (eventId) {
      fetchEventDocuments();
    }
  }, [eventId]); // Only depend on eventId, not the function

  // Temporarily disable cleanup to test if it's causing the issue
  // useEffect(() => {
  //   isMountedRef.current = true;
  //   return () => {
  //     isMountedRef.current = false;
  //     console.log("Component unmounting - cleaning up blob URLs");
  //     // Only clean up if component is actually unmounting
  //     setTimeout(() => {
  //       if (!isMountedRef.current) {
  //         filesRef.current.forEach(file => {
  //           if (file.src && file.src.startsWith('blob:')) {
  //             console.log(`Revoking blob URL: ${file.src}`);
  //             URL.revokeObjectURL(file.src);
  //           }
  //         });
  //       }
  //     }, 1000); // Delay cleanup to prevent race conditions
  //   };
  // }, []); // Empty dependency array - only run on unmount

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
            : <FilesandUploads files={fetchedEventFiles}  enableSelectionCheckbox={false}  eventId={eventId} organizationId={organizationId} />
        } 
      />
      <Accordion 
        title="Tasks File" 
        content={<FilesandUploads files={filesFromTasks}  enableSelectionCheckbox={false}  eventId={eventId} organizationId={organizationId} />} 
      />
    </div>
  );
};

export default FilesUploads;
