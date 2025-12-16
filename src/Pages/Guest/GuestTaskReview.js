import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import GuestService from "../../Services/GuestService";
import { resolveTaskId, resolveTaskIdFromToken } from "./guestUtils";
import TabMenu from "../../CommonComponents/TabMenu/TabMenu";
import TaskDetail from "../Task/TaskDetail/TaskDetail";
import CheckList from "../../CommonComponents/CheckList/CheckList";
import "./Guest.css";

const SESSION_ERROR_CODES = new Set([401, 403, 410, 423, 440, 498]);
const DEFAULT_SESSION_ERROR =
  "Your invite has expired or was revoked. Please request a new invite from the organizer.";

export default function GuestTaskReviewPage() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const storageKey = useMemo(() => `guest_session_${inviteId}`, [inviteId]);

  const [invite, setInvite] = useState(null);
  const [taskDetails, setTaskDetails] = useState(null);
  const [statusInfo, setStatusInfo] = useState(null);
  const [attachments, setAttachments] = useState([]);
  const [comments, setComments] = useState([]);
  const [canApprove, setCanApprove] = useState(false);
  const [canReject, setCanReject] = useState(false);
  const [isExpired, setIsExpired] = useState(false);
  const [token, setToken] = useState("");
  const [expiresAt, setExpiresAt] = useState(null);
  const [accessExpiresAt, setAccessExpiresAt] = useState(null);
  const [taskId, setTaskId] = useState(null);
  const [comment, setComment] = useState("");
  const [actionStatus, setActionStatus] = useState("");
  const [decisionSubmitted, setDecisionSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [loadingTask, setLoadingTask] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [activeTab, setActiveTab] = useState("Details");
  const [sessionInvalid, setSessionInvalid] = useState(false);
  const [selectedDocumentId, setSelectedDocumentId] = useState(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const awaitingStageRef = useRef(false);
  const noop = useCallback(() => {}, []);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const redirectToValidation = useCallback(() => {
    if (typeof sessionStorage !== "undefined")
      sessionStorage.removeItem(storageKey);
    navigate(`/guest/invite-validation/${inviteId}`, { replace: true });
  }, [navigate, inviteId, storageKey]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (!raw) return redirectToValidation();
      const parsed = JSON.parse(raw);
      if (!parsed?.token) return redirectToValidation();
      // Check accessExpiresAt (48h window), not token expiresAt (30m)
      if (
        parsed.accessExpiresAt &&
        new Date(parsed.accessExpiresAt).getTime() <= Date.now()
      ) {
        setError("Your access window has expired. Please request a new invite.");
        return;
      }
      setToken(parsed.token);
      setExpiresAt(parsed.expiresAt || null);
      setAccessExpiresAt(parsed.accessExpiresAt || null);
      const storedTaskId =
        parsed.taskId ||
        (Array.isArray(parsed.taskIds) && parsed.taskIds.length
          ? parsed.taskIds[0]
          : null) ||
        resolveTaskId(parsed) ||
        resolveTaskIdFromToken(parsed.token);
      if (storedTaskId) setTaskId(storedTaskId);
    } catch (_) {
      redirectToValidation();
    }
  }, [storageKey, redirectToValidation]);

  useEffect(() => {
    if (taskId || !token) return;
    const derived = resolveTaskIdFromToken(token);
    if (derived) setTaskId(derived);
  }, [token, taskId]);



  const handleSessionFailure = useCallback((err) => {
    if (!err || !SESSION_ERROR_CODES.has(err.status)) return false;
    setSessionInvalid(true);
    setDecisionSubmitted(false);
    setActionStatus("");
    setComment("");
    setError(
      err.message || DEFAULT_SESSION_ERROR
    );
    return true;
  }, []);

  useEffect(() => {
    if (!token || !taskId) return;
    let cancelled = false;
    const fetchTask = async () => {
      setLoadingTask(true);
      try {
        const data = await GuestService.getGuestTask(taskId, token, inviteId);
        if (!cancelled) {
          setTaskDetails(data?.task || null);
          setInvite(data?.invite || null);
          setStatusInfo(data?.status || null);
          setAttachments(data?.attachments || []);
          setComments(data?.commentsPreview || []);
          setCanApprove(data?.canApprove ?? false);
          setCanReject(data?.canReject ?? false);
          setIsExpired(data?.isExpired ?? false);
          setSessionInvalid(false);
        }
      } catch (e) {
        if (!cancelled) {
          if (handleSessionFailure(e)) return;
          setError(e.message || "Failed to load task details");
        }
      } finally {
        if (!cancelled) setLoadingTask(false);
      }
    };
    fetchTask();
    return () => {
      cancelled = true;
    };
  }, [taskId, token, handleSessionFailure]);

  // Token auto-refreshes on 401, so we don't need to redirect on token expiry
  // Only check if access window (48h) has expired
  useEffect(() => {
    if (!accessExpiresAt) return;
    if (new Date(accessExpiresAt).getTime() > now) return;
    setError("Your access window has expired. Please request a new invite from the organizer.");
    setSessionInvalid(true);
  }, [accessExpiresAt, now]);



  const sessionCountdown = useMemo(() => {
    if (!expiresAt) return null;
    const diff = new Date(expiresAt).getTime() - now;
    if (diff <= 0) return "Expired";
    const mm = Math.floor(diff / 60000);
    const ss = Math.floor((diff % 60000) / 1000);
    return `${mm}m ${ss}s`;
  }, [expiresAt, now]);

  const accessWindow = useMemo(() => {
    if (!accessExpiresAt) return null;
    const diff = new Date(accessExpiresAt).getTime() - now;
    if (diff <= 0) return "Access expired";
    const hh = Math.floor(diff / 3600000);
    const mm = Math.floor((diff % 3600000) / 60000);
    return `${hh}h ${mm}m`;
  }, [accessExpiresAt, now]);

  const statusLabel = useMemo(() => {
    return statusInfo?.name || taskDetails?.taskStatus || taskDetails?.status || invite?.status || "—";
  }, [statusInfo, taskDetails, invite]);

  const statusColor = useMemo(() => {
    // Use official status color codes
    const statusLower = statusLabel?.toLowerCase() || "";
    const colorMap = {
      "new": "#f3f4f6",           // Gray
      "active": "#dbeafe",        // Blue
      "under approval": "#fed7aa", // Orange
      "approved": "#dcfce7",      // Green
      "published": "#e0e7ff",     // Purple
      "cancelled": "#fee2e2"      // Red
    };
    return colorMap[statusLower] || statusInfo?.color || "#f3f4f6";
  }, [statusInfo, statusLabel]);

  const statusTextColor = useMemo(() => {
    const statusLower = statusLabel?.toLowerCase() || "";
    const textColorMap = {
      "new": "#6b7280",
      "active": "#1d4ed8",
      "under approval": "#ea580c",
      "approved": "#16a34a",
      "published": "#3730a3",
      "cancelled": "#dc2626"
    };
    return textColorMap[statusLower] || "#6b7280";
  }, [statusLabel]);

  const normalizedStatus = statusLabel?.toLowerCase?.() || "";
  const isUnderApproval = normalizedStatus.includes("under approval") || normalizedStatus.includes("pending approval");
  const awaitingApproval = canApprove || canReject;
  
  // Block actions if task is not in Under Approval status
  const canActuallyApprove = canApprove && isUnderApproval;
  const canActuallyReject = canReject && isUnderApproval;
  
  useEffect(() => {
    if (!awaitingStageRef.current && awaitingApproval) {
      setDecisionSubmitted(false);
      setActionStatus("");
    }
    awaitingStageRef.current = awaitingApproval;
  }, [awaitingApproval, canApprove, canReject]);
  const dueDateValue = taskDetails?.dueDate || taskDetails?.date || null;
  const checklistItems = useMemo(() => {
    if (!taskDetails) return [];
    const raw = Array.isArray(taskDetails.checklistDetails)
      ? taskDetails.checklistDetails
      : Array.isArray(taskDetails.checklist)
      ? taskDetails.checklist
      : [];
    return raw
      .map((item) => ({
        text:
          item?.text ||
          item?.specification ||
          item?.description ||
          item?.title ||
          "",
        checked: Boolean(
          item?.checked ?? item?.isCompleted ?? item?.done ?? item?.status === "DONE"
        ),
        isPlaceholder: false,
      }))
      .filter((entry) => entry.text?.trim());
  }, [taskDetails]);
  const completedChecklist = checklistItems.filter((item) => item.checked).length;
  const detailTaskData = useMemo(() => {
    if (!taskDetails) return null;
    return {
      id: taskDetails.id || "",
      taskTitle: taskDetails.taskTitle || taskDetails.title || invite?.taskTitle || "",
      type: taskDetails.creativeType || taskDetails.type || "",
      date: dueDateValue,
      quantity: taskDetails.creativeNumbers || taskDetails.quantity || 1,
      description: taskDetails.description || "",
      checklist: checklistItems,
    };
  }, [taskDetails, checklistItems, dueDateValue, invite]);

  const tabs = useMemo(() => {
    if (!taskDetails) return [];
    const detailsContent = detailTaskData ? (
      <div className="guest-details-tab">
        <TaskDetail
          taskData={detailTaskData}
          formData={{}}
          onUpdate={noop}
          mode="view"
          eventDate={taskDetails?.eventDate || invite?.eventDate || null}
          errors={{}}
          onClearError={noop}
          onChecklistUpdate={null}
          taskId={taskId}
        />
      </div>
    ) : (
      <div className="empty-state">Task details are unavailable.</div>
    );

    const checklistContent = checklistItems.length ? (
      <div className="guest-checklist-tab">
        <CheckList
          initialItems={checklistItems}
          mode="view"
          canEdit={false}
          onChecklistChange={null}
        />
      </div>
    ) : (
      <div className="empty-state">No checklist items have been provided.</div>
    );

    const attachmentsContent = attachments.length ? (
      <div className="guest-attachments-panel">
        <p className="attachment-instruction">Select the document you're approving:</p>
        {attachments.map((file, idx) => {
          const label = file.filename || file.name || `Attachment ${idx + 1}`;
          const href = file.downloadUrl || file.url || "";
          const author = file.uploaderName || "Unknown";
          const timestamp = file.uploadDate || file.createdAt;
          const docId = file.documentId || file.id;
          const metaParts = [
            author ? `Uploaded by ${author}` : null,
            timestamp ? new Date(timestamp).toLocaleString() : null,
            file.status ? `Status: ${file.status}` : null,
          ].filter(Boolean);
          return (
            <div 
              className={`guest-attachment-card selectable ${selectedDocumentId === docId ? 'selected' : ''}`}
              key={docId || `attachment-${idx}`}
              onClick={() => setSelectedDocumentId(docId)}
            >
              <div className="attachment-selection">
                <input
                  type="radio"
                  name="document-selection"
                  checked={selectedDocumentId === docId}
                  onChange={() => setSelectedDocumentId(docId)}
                  disabled={!canApprove}
                />
                <div className="attachment-meta">
                  <strong>{label}</strong>
                  {metaParts.length > 0 && (
                    <p className="muted">{metaParts.join(" • ")}</p>
                  )}
                </div>
              </div>
              {href ? (
                <a href={href} target="_blank" rel="noreferrer" onClick={(e) => e.stopPropagation()}>
                  View
                </a>
              ) : (
                <span className="muted">Link not available</span>
              )}
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">No attachments have been uploaded yet.</div>
    );

    const commentsContent = comments.length ? (
      <div className="guest-comments-panel">
        {comments.map((entry, idx) => {
          const content = entry.message || entry.comment || entry.text || "—";
          const author = entry.userName || entry.authorName || "Reviewer";
          const timestamp = entry.timestamp || entry.createdAt;
          return (
            <div className="guest-comment-bubble" key={entry.id || `comment-${idx}`}>
              <div className="comment-meta">
                <strong>{author}</strong>
                {timestamp && (
                  <span>{new Date(timestamp).toLocaleString()}</span>
                )}
              </div>
              <p dangerouslySetInnerHTML={{ __html: content }} />
            </div>
          );
        })}
      </div>
    ) : (
      <div className="empty-state">No comments yet.</div>
    );

    return [
      { label: "Details", component: detailsContent },
      {
        label: checklistItems.length
          ? `Checklist (${completedChecklist}/${checklistItems.length})`
          : "Checklist",
        component: checklistContent,
      },
      {
        label: attachments.length
          ? `Attachments (${attachments.length})`
          : "Attachments",
        component: attachmentsContent,
      },
      {
        label: comments.length
          ? `Comments (${comments.length})`
          : "Comments",
        component: commentsContent,
      },
    ];
  }, [
    taskDetails,
    detailTaskData,
    checklistItems,
    completedChecklist,
    attachments,
    comments,
    noop,
    invite,
    taskId,
  ]);

  const handleApprove = async () => {
    if (!token || !taskId || sessionInvalid || decisionSubmitted) return;
    
    if (!isUnderApproval) {
      setError(`Cannot approve task. Task must be in 'Under Approval' status. Current status: ${statusLabel}`);
      return;
    }
    
    if (!selectedDocumentId) {
      setError("Please select a document from the Attachments tab before approving");
      setActiveTab("Attachments");
      return;
    }
    
    setActionStatus("");
    setError("");
    try {
      const result = await GuestService.approveTask(taskId, token, "", selectedDocumentId, inviteId);
      setActionStatus("Task approved successfully");
      
      if (result) {
        setTaskDetails(result.task || null);
        setInvite(result.invite || null);
        setStatusInfo(result.status || null);
        setAttachments(result.attachments || []);
        setComments(result.commentsPreview || []);
        setCanApprove(result.canApprove ?? false);
        setCanReject(result.canReject ?? false);
        setIsExpired(result.isExpired ?? false);
      }
      
      setDecisionSubmitted(true);
    } catch (e) {
      if (handleSessionFailure(e)) return;
      setError(e.message || "Approval failed");
    }
  };

  const handleRejectSubmit = async () => {
    if (!token || !taskId || sessionInvalid || decisionSubmitted) return;
    
    if (!isUnderApproval) {
      setError(`Cannot reject task. Task must be in 'Under Approval' status. Current status: ${statusLabel}`);
      return;
    }
    
    if (!rejectReason.trim()) {
      setError("Please provide a reason for requesting changes");
      return;
    }
    
    setActionStatus("");
    setError("");
    try {
      const result = await GuestService.rejectTask(taskId, token, rejectReason, inviteId);
      setActionStatus("Changes requested successfully");
      
      if (result) {
        setTaskDetails(result.task || null);
        setInvite(result.invite || null);
        setStatusInfo(result.status || null);
        setAttachments(result.attachments || []);
        setComments(result.commentsPreview || []);
        setCanApprove(result.canApprove ?? false);
        setCanReject(result.canReject ?? false);
        setIsExpired(result.isExpired ?? false);
      }
      
      setRejectReason("");
      setShowRejectModal(false);
      setDecisionSubmitted(true);
    } catch (e) {
      if (handleSessionFailure(e)) return;
      setError(e.message || "Request changes failed");
    }
  };

  // Show completion screen after successful decision
  if (decisionSubmitted && actionStatus) {
    return (
      <div className="guest-wrap">
        <div className="guest-card task-review-card">
          <div className="completion-screen">
            <div className="completion-icon-wrapper">
              <div className="completion-icon">
                {actionStatus.includes("approved") ? "✓" : "📝"}
              </div>
            </div>
            <h2 className="completion-title">
              {actionStatus.includes("approved") ? "Task Approved Successfully" : "Changes Requested Successfully"}
            </h2>
            <p className="completion-message">
              {actionStatus.includes("approved") 
                ? "Thank you for your approval! The task owner has been notified and will proceed accordingly."
                : "Your feedback has been submitted. The task owner has been notified about the requested changes."}
            </p>
            <div className="completion-details">
              <div className="completion-detail-item">
                <span className="detail-icon">📋</span>
                <div>
                  <strong>Task:</strong>
                  <p>{invite?.taskTitle || taskDetails?.taskTitle || "—"}</p>
                </div>
              </div>
              <div className="completion-detail-item">
                <span className="detail-icon">🏢</span>
                <div>
                  <strong>Organization:</strong>
                  <p>{invite?.orgName || "—"}</p>
                </div>
              </div>
            </div>
            <div className="completion-footer">
              <div className="completion-note">
                <span className="note-icon">ℹ️</span>
                <p>Your temporary guest access has been completed. This link is no longer active.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="guest-wrap">
      <div className="guest-card task-review-card">
        {error && (
          <div className="error-banner">
            <span className="error-icon">⚠</span>
            <div>
              <strong>Error</strong>
              <p>{error}</p>
            </div>
          </div>
        )}

        {invite && (
          <div className="compact-header">
            <div className="header-main">
              <div>
                <h2>{invite.taskTitle}</h2>
                <p className="from-org">From: <strong>{invite.orgName}</strong></p>
              </div>
              <div className="timer-badges">
                {sessionCountdown && sessionCountdown !== "Expired" && (
                  <div className="session-badge">
                    <span className="badge-icon">⏱</span>
                    <span className="badge-label">Token:</span>
                    <span className="badge-value">{sessionCountdown}</span>
                  </div>
                )}
                {accessWindow && accessWindow !== "Access expired" && (
                  <div className="access-badge">
                    <span className="badge-icon">⏰</span>
                    <span className="badge-label">Access:</span>
                    <span className="badge-value">{accessWindow}</span>
                  </div>
                )}
              </div>
            </div>
            {invite.message && (
              <div className="invite-message">
                <span className="message-icon">💬</span>
                <p>{invite.message}</p>
              </div>
            )}
          </div>
        )}

        {loadingTask && <div className="loading">Loading task details…</div>}
        {!loadingTask && taskDetails && (
          <div className="guest-task-shell">
            <div className="task-header-card">
              <div className="task-title-section">
                {(invite?.eventName || invite?.eventId) && (
                  <span className="task-eyebrow">Task for Review</span>
                )}
                <h3>{taskDetails.taskTitle || taskDetails.title}</h3>
                {dueDateValue && (
                  <p className="due-date">Due: {new Date(dueDateValue).toLocaleDateString()}</p>
                )}
              </div>
              <div className="header-actions">
                <span className="status-chip-modern" style={{ backgroundColor: statusColor, color: statusTextColor }}>
                  {statusLabel}
                </span>
                {!decisionSubmitted && isUnderApproval && (canActuallyApprove || canActuallyReject) && !isExpired && !sessionInvalid && (
                  <div className="header-buttons">
                    {canActuallyApprove && (
                      <button
                        className="btn-approve-sm"
                        onClick={handleApprove}
                        disabled={!token || !selectedDocumentId}
                        title={!selectedDocumentId ? "Select a document from Attachments tab" : ""}
                      >
                        <span className="btn-icon">✓</span>
                        Approve
                      </button>
                    )}
                    {canActuallyReject && (
                      <button
                        className="btn-reject-sm"
                        onClick={() => setShowRejectModal(true)}
                        disabled={!token}
                      >
                        <span className="btn-icon">✕</span>
                        Request Changes
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>

            {(isExpired || !isUnderApproval || (decisionSubmitted && actionStatus)) && (
              <div className="status-alerts">
                {isExpired && (
                  <div className="info-alert expired">
                    <span className="alert-icon">⏰</span>
                    <div>
                      <strong>Access Expired</strong>
                      <p>Your access has expired. Please request a new invite from the task owner.</p>
                    </div>
                  </div>
                )}
                {!isUnderApproval && !sessionInvalid && !isExpired && (
                  <div className="info-alert">
                    <span className="alert-icon">ℹ️</span>
                    <div>
                      <strong>Action Not Available</strong>
                      <p>This task is currently in <strong>{statusLabel}</strong> status. Approvals are only available when the task is in 'Under Approval' status.</p>
                    </div>
                  </div>
                )}
                {decisionSubmitted && actionStatus && (
                  <div className="success-alert">
                    <span className="alert-icon">✓</span>
                    <div>
                      <strong>Success</strong>
                      <p>{actionStatus}</p>
                    </div>
                  </div>
                )}
              </div>
            )}

            <TabMenu
              tabs={tabs}
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              showEditButton={false}
            />
          </div>
        )}

        {showRejectModal && (
          <div className="reject-modal-backdrop" onClick={() => setShowRejectModal(false)}>
            <div className="reject-modal" onClick={(e) => e.stopPropagation()}>
              <div className="reject-modal-header">
                <h3>Request Changes</h3>
                <button className="modal-close" onClick={() => setShowRejectModal(false)}>×</button>
              </div>
              <div className="reject-modal-body">
                <label>Please explain what changes are needed:</label>
                <textarea
                  rows={5}
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Describe the issues or changes required..."
                  autoFocus
                />
              </div>
              <div className="reject-modal-footer">
                <button className="btn-cancel" onClick={() => { setShowRejectModal(false); setRejectReason(""); }}>
                  Cancel
                </button>
                <button 
                  className="btn-submit-reject" 
                  onClick={handleRejectSubmit}
                  disabled={!rejectReason.trim()}
                >
                  Submit Changes Request
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
