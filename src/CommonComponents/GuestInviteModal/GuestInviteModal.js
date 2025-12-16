import React, { useEffect, useMemo, useState } from "react";
import GuestService from "../../Services/GuestService";
import "./GuestInviteModal.css";

export default function GuestInviteModal({
  isOpen,
  onClose,
  tasks = [],
  events = [],
  orgs = [],
  onCreated,
  lockedTask = null,
}) {
  const [guestEmail, setGuestEmail] = useState("");
  const [guestName, setGuestName] = useState("");
  const [message, setMessage] = useState("");
  const [accessDurationHours, setAccessDurationHours] = useState(48);
  const [selectedTaskIds, setSelectedTaskIds] = useState([]);
  const [eventFilter, setEventFilter] = useState("");
  const [orgFilter, setOrgFilter] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!isOpen) {
      setGuestEmail("");
      setGuestName("");
      setMessage("");
      setAccessDurationHours(48);
      setSelectedTaskIds([]);
      setEventFilter("");
      setOrgFilter("");
      setError("");
      setSuccess("");
    }
  }, [isOpen]);

  useEffect(() => {
    if (isOpen && lockedTask) {
      setSelectedTaskIds([lockedTask.id]);
    }
  }, [isOpen, lockedTask]);

  const filteredTasks = useMemo(() => {
    return tasks.filter((t) => {
      const byEvent = eventFilter ? t.eventId === eventFilter : true;
      const byOrg = orgFilter ? t.orgId === orgFilter : true;
      return byEvent && byOrg;
    });
  }, [tasks, eventFilter, orgFilter]);

  const toggleTask = (id) => {
    setSelectedTaskIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const createInvite = async () => {
    setLoading(true);
    setError("");
    setSuccess("");
    try {
      const payload = {
        guestEmail,
        guestName: guestName || undefined,
        taskIds: selectedTaskIds,
        message: message || undefined,
        accessDurationHours: Number(accessDurationHours) || 48,
      };
      const res = await GuestService.createGuestInvite(payload);
      setSuccess("Guest invite created");
      onCreated && onCreated(res);
    } catch (e) {
      setError(e.message || "Failed to create invite");
    } finally {
      setLoading(false);
    }
  };

  const canSelectTasks = !lockedTask;

  if (!isOpen) return null;

  return (
    <div className="guest-modal-backdrop" onClick={onClose}>
      <div className="guest-modal" onClick={(e) => e.stopPropagation()}>
        <div className="guest-modal-header">
          <h3>Create Guest Invite</h3>
          <button className="close-btn" onClick={onClose}>
            ×
          </button>
        </div>
        <div className="guest-modal-body">
          <div className="guest-modal-subtitle">
            <div>
              <p className="title">
                Share curated event tasks with external guests.
              </p>
              <p className="muted">
                Invites are OTP protected and mirror CBELL permissions.
              </p>
            </div>
            <span className="pill">{accessDurationHours || 48}h window</span>
          </div>

          <div className="guest-modal-content">
            <section className="guest-modal-section">
              <div className="field">
                <label>Guest Email</label>
                <input
                  type="email"
                  value={guestEmail}
                  onChange={(e) => setGuestEmail(e.target.value)}
                  placeholder="guest@example.com"
                />
              </div>
              <div className="field">
                <label>Guest Name (optional)</label>
                <input
                  value={guestName}
                  onChange={(e) => setGuestName(e.target.value)}
                  placeholder="Guest Name"
                />
              </div>
              <div className="field">
                <label>Message (optional)</label>
                <textarea
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Add context or instructions"
                />
                <p className="hint">
                  Guests receive this copy beneath the invite email.
                </p>
              </div>
            </section>

            <section className="guest-modal-section">
              {canSelectTasks ? (
                <>
                  <div className="grid two tight">
                    <div className="field">
                      <label>Filter by Event</label>
                      <select
                        value={eventFilter}
                        onChange={(e) => setEventFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        {events.map((ev) => (
                          <option key={ev.id} value={ev.id}>
                            {ev.name}
                          </option>
                        ))}
                      </select>
                    </div>
                    <div className="field">
                      <label>Filter by Org</label>
                      <select
                        value={orgFilter}
                        onChange={(e) => setOrgFilter(e.target.value)}
                      >
                        <option value="">All</option>
                        {orgs.map((o) => (
                          <option key={o.id} value={o.id}>
                            {o.name}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="field">
                    <label>Select Tasks</label>
                    <div className="task-list">
                      {filteredTasks.map((t) => (
                        <label
                          key={t.id}
                          className={`task-item ${
                            selectedTaskIds.includes(t.id) ? "selected" : ""
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={selectedTaskIds.includes(t.id)}
                            onChange={() => toggleTask(t.id)}
                          />
                          <div>
                            <p className="task-title">{t.title}</p>
                            <p className="task-meta">
                              Event {t.eventId || "—"}
                            </p>
                          </div>
                        </label>
                      ))}
                      {filteredTasks.length === 0 && (
                        <div className="empty">No tasks match filters</div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <div className="field">
                  <label>Task</label>
                  <div className="locked-task-card">
                    <p className="task-title">
                      {lockedTask?.title || "Selected Task"}
                    </p>
                    <p className="locked-meta">
                      Event:{" "}
                      {lockedTask?.eventName || lockedTask?.eventId || "—"}
                    </p>
                    <p className="locked-meta">
                      Organization:{" "}
                      {lockedTask?.orgName || lockedTask?.orgId || "—"}
                    </p>
                    <p className="locked-hint">
                      Guests will only see this task.
                    </p>
                  </div>
                </div>
              )}

              <div className="field">
                <label>Access Duration</label>
                <div className="duration">
                  <input
                    type="number"
                    min={1}
                    max={168}
                    value={accessDurationHours}
                    onChange={(e) => setAccessDurationHours(e.target.value)}
                  />
                  <span>hours before the link auto-expires</span>
                </div>
              </div>
            </section>
          </div>

          {error && <div className="error">{error}</div>}
          {success && <div className="success">{success}</div>}
        </div>
        <div className="guest-modal-footer">
          <button className="secondary" onClick={onClose}>
            Cancel
          </button>
          <button
            className="primary"
            disabled={loading || !guestEmail || selectedTaskIds.length === 0}
            onClick={createInvite}
          >
            {loading ? "Creating…" : "Create Invite"}
          </button>
        </div>
      </div>
    </div>
  );
}
