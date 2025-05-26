import React, { useEffect, useState } from 'react';
import Accordion from '../../../CommonComponents/Accordian/Accordian';
import FilesandUploads from '../../../CommonComponents/FileandUpload/FilesAndUploads';
import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css';
import "../Tasks.css";

const FilesUploads = ({ filesFromTasks, eventId, organizationId }) => {
  const [fetchedEventFiles, setFetchedEventFiles] = useState([]);
  const [loading, setLoading] = useState(true); // <-- Added loading state

  useEffect(() => {
    const getFileTypeFromMime = (mime) => {
      if (!mime) return 'file';
      if (mime.startsWith('image')) return 'image';
      if (mime.startsWith('video')) return 'video';
      if (mime.startsWith('audio')) return 'audio';
      if (mime === 'application/pdf') return 'pdf';
      return 'file';
    };

    const fetchEventDocuments = async () => {
      setLoading(true); // Start loading
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
              src
            };
          })
        );

        setFetchedEventFiles(filesWithPreview);
      } catch (error) {
        console.error("Error fetching event documents:", error);
      } finally {
        setLoading(false); // Done loading
      }
    };

    if (eventId) {
      fetchEventDocuments();
    }

    return () => {
      fetchedEventFiles.forEach(file => {
        if (file.src && file.src.startsWith('blob:')) {
          URL.revokeObjectURL(file.src);
        }
      });
    };
  }, [eventId]);

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
            : <FilesandUploads files={fetchedEventFiles} eventId={eventId} organizationId={organizationId} />
        } 
      />
      <Accordion 
        title="Tasks File" 
        content={<FilesandUploads files={filesFromTasks} eventId={eventId} organizationId={organizationId} />} 
      />
    </div>
  );
};

export default FilesUploads;
