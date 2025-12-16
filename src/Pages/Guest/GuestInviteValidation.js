import React, { useEffect, useMemo, useRef, useState } from "react";
import GuestService from "../../Services/GuestService";
import { useNavigate, useParams } from "react-router-dom";
import { decodeGuestToken, gatherTaskIds, resolveTaskId } from "./guestUtils";
import "./Guest.css";

export default function GuestInviteValidationPage() {
  const { inviteId } = useParams();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [otpAllowed, setOtpAllowed] = useState(true);

  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const inputsRef = useRef([]);
  const [verifying, setVerifying] = useState(false);
  const [autoRefreshing, setAutoRefreshing] = useState(false);
  const storageKey = useMemo(() => `guest_session_${inviteId}`, [inviteId]);

  useEffect(() => {
    if (typeof sessionStorage === "undefined") return;

    const bootstrap = async () => {
      if (!inviteId) {
        setError("Invalid invite link.");
        setOtpAllowed(false);
        return;
      }

      setAutoRefreshing(true);
      setError("");
      setOtpAllowed(true);

      try {
        // Recommended flow: attempt refresh-token before showing OTP UI
        const refreshData = await GuestService.refreshToken(inviteId);
        const nextToken = refreshData?.token;
        if (!nextToken) throw new Error("Session refresh succeeded but token was missing. Please retry.");

        const decodedToken = decodeGuestToken(nextToken);
        const derivedTaskId = resolveTaskId(refreshData) || resolveTaskId(decodedToken);
        const taskPool = gatherTaskIds(decodedToken, refreshData).filter(Boolean);

        const payload = {
          token: nextToken,
          expiresAt: refreshData?.expiresAt || null,
          accessExpiresAt: refreshData?.accessExpiresAt || null,
          taskId: derivedTaskId || taskPool[0] || null,
          taskIds: taskPool.length ? taskPool : null,
        };

        sessionStorage.setItem(storageKey, JSON.stringify(payload));
        navigate(`/guest/tasks/${inviteId}`, { replace: true });
      } catch (err) {
        // Clear any stale session and decide whether to show OTP
        try {
          sessionStorage.removeItem(storageKey);
        } catch (_) {}

        const status = err?.status;
        if (status === 400) {
          // First-time visitor: must verify OTP
          setError("");
          setOtpAllowed(true);
          return;
        }
        if (status === 410) {
          setError("Invite expired");
          setOtpAllowed(false);
          return;
        }
        if (status === 403) {
          setError("Invite revoked");
          setOtpAllowed(false);
          return;
        }

        setError(err?.message || "Unable to validate invite. Please try again.");
        setOtpAllowed(true);
      } finally {
        setAutoRefreshing(false);
      }
    };

    bootstrap();
  }, [storageKey, navigate, inviteId]);



  const otpStr = useMemo(() => otp.join("").trim(), [otp]);

  const handleOtpChange = (idx, val) => {
    const v = val.replace(/\D/g, "").slice(0, 1);
    setOtp(prev => {
      const next = [...prev];
      next[idx] = v;
      return next;
    });
    if (v && inputsRef.current[idx + 1]) inputsRef.current[idx + 1].focus();
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData('text');
    const digits = pastedData.replace(/\D/g, '').slice(0, 6);
    if (digits.length > 0) {
      const newOtp = ['', '', '', '', '', ''];
      for (let i = 0; i < digits.length && i < 6; i++) {
        newOtp[i] = digits[i];
      }
      setOtp(newOtp);
      // Focus the next empty field or the last field
      const nextEmptyIndex = digits.length < 6 ? digits.length : 5;
      inputsRef.current[nextEmptyIndex]?.focus();
    }
  };

  const verify = async () => {
    setVerifying(true);
    setError("");
    try {
      const res = await GuestService.verifyInvite(inviteId, otpStr);
      const nextToken = res?.token;
      if (!nextToken) throw new Error("Verification succeeded but token was missing. Please retry.");
      const decodedToken = decodeGuestToken(nextToken);
      let derivedTaskId = resolveTaskId(res) || resolveTaskId(decodedToken);
      let taskPool = gatherTaskIds(decodedToken, res).filter(Boolean);
      const payload = {
        token: nextToken,
        expiresAt: res?.expiresAt || null,
        accessExpiresAt: res?.accessExpiresAt || null,
        taskId: derivedTaskId || taskPool[0] || null,
        taskIds: taskPool.length ? taskPool : null,
      };
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.setItem(storageKey, JSON.stringify(payload));
      }
      navigate(`/guest/tasks/${inviteId}`);
    } catch (e) {
      setError(e.message || "Invalid or expired OTP");
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="guest-wrap">
      <div className="guest-card otp-card">
        <div className="otp-header">
          <div className="lock-icon">🔐</div>
          <h2>Verify Your Access</h2>
          <p className="otp-subtitle">Enter the 6-digit code sent to your email</p>
        </div>

        {autoRefreshing && <div className="loading">Restoring your session…</div>}
        {error && !autoRefreshing && <div className="error">{error}</div>}

        {!autoRefreshing && otpAllowed && (
          <>
            <div className="otp-section">
              <label className="otp-label">Enter verification code</label>
              <div className="otp-grid">
                {otp.map((d, i) => (
                  <input
                    key={i}
                    ref={el => inputsRef.current[i] = el}
                    className="otp-input"
                    inputMode="numeric"
                    maxLength={1}
                    value={d}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onPaste={handlePaste}
                    autoFocus={i === 0}
                    disabled={verifying}
                  />
                ))}
              </div>
              <p className="otp-hint">Check your email for the 6-digit verification code</p>
            </div>

            <button
              className="primary verify-btn"
              disabled={verifying || otpStr.length !== 6}
              onClick={verify}
            >
              {verifying ? (
                <>
                  <span className="spinner-small"></span>
                  Verifying…
                </>
              ) : (
                'Verify & Continue'
              )}
            </button>

            <div className="otp-footer">
              <p className="help-text">Didn't receive the code? Check your spam folder or contact the sender.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}