import React, { useEffect, useState, useCallback, useRef } from "react";
import Accordion from "../../../CommonComponents/Accordian/Accordian";
import FilesandUploads from "../../../CommonComponents/FileandUpload/FilesAndUploads";
import Skeleton from "react-loading-skeleton";
import "react-loading-skeleton/dist/skeleton.css";
import { useUser } from "../../../Context/UserContext";
import { fetchWithRefresh } from "../../../Context/RefereshToken";
import "../Tasks.css";

const FilesUploads = ({ eventId, organizationId }) => {
  const { user } = useUser();
  const [eventFiles, setEventFiles] = useState([]);
  const [taskFiles, setTaskFiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFetchingRef = useRef(false);

  const getFileTypeFromMime = (mime) => {
    if (!mime) return "file";
    if (mime.startsWith("image")) return "image";
    if (mime.startsWith("video")) return "video";
    if (mime.startsWith("audio")) return "audio";
    if (mime === "application/pdf") return "pdf";
    return "file";
  };

  const fetchDocuments = useCallback(async () => {
    if (!eventId || isFetchingRef.current) return;

    isFetchingRef.current = true;
    setLoading(true);

    try {
      // Fetch event and task files in parallel
      const [eventRes, taskRes] = await Promise.all([
        fetchWithRefresh(`/apis/document-details/event/${eventId}?filter=event`, {
          headers: { "ngrok-skip-browser-warning": "1" },
        }),
        fetchWithRefresh(`/apis/document-details/event/${eventId}?filter=task`, {
          headers: { "ngrok-skip-browser-warning": "1" },
        }),
      ]);

      const [eventData, taskData] = await Promise.all([
        eventRes.json(),
        taskRes.json(),
      ]);

      const processFiles = async (data) =>
        Promise.all(
          data.map(async (doc) => {
            const type = getFileTypeFromMime(doc.contentType);
            let src = "";

            if (type === "image") {
              const response = await fetchWithRefresh(
                `/apis/document/view/${doc.documentId}`,
                {
                  headers: { "ngrok-skip-browser-warning": "1" },
                }
              );
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
              status: doc.status || "Pending",
              publishedTo: doc.publishedTo || [],
              uploadDate: doc.uploadDate,
              size: doc.fileSize || doc.size,
              userInfo: doc.userInfo,
              isApproved: doc.status === "Approved",
            };
          })
        );

      const [processedEventFiles, processedTaskFiles] = await Promise.all([
        processFiles(eventData),
        processFiles(taskData),
      ]);

      setEventFiles(processedEventFiles);
      setTaskFiles(processedTaskFiles);
    } catch (err) {
      console.error("Error fetching event/task files:", err);
    } finally {
      setLoading(false);
      isFetchingRef.current = false;
    }
  }, [eventId]);

  useEffect(() => {
    if (eventId) fetchDocuments();
  }, [eventId, fetchDocuments]);

  const SkeletonCards = () => (
    <div className="files-grid">
      {[1, 2, 3].map((_, i) => (
        <div key={i} className="file-card">
          <Skeleton height={20} width={120} style={{ marginBottom: "8px" }} />
          <Skeleton height={100} width="100%" />
        </div>
      ))}
    </div>
  );

  return (
    <div className="Publish_Section">
      <Accordion
        title="Event Files"
        content={
          loading ? (
            <SkeletonCards />
          ) : (
            <FilesandUploads
              files={eventFiles}
              eventId={eventId}
              organizationId={organizationId}
              userId={user?.userId}
              enableSelectionCheckbox={false}
              externalLoading={loading}
              loadingType="fetch"
              mode="view"
              readOnly={true}
            />
          )
        }
      />

      <Accordion
        title="Task Files"
        content={
          loading ? (
            <SkeletonCards />
          ) : (
            <FilesandUploads
              files={taskFiles}
              eventId={eventId}
              organizationId={organizationId}
              userId={user?.userId}
              enableSelectionCheckbox={false}
              externalLoading={loading}
              loadingType="fetch"
              mode="view"
              readOnly={true}
            />
          )
        }
      />
    </div>
  );
};

export default FilesUploads;
