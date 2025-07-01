import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { useNavigate, Link } from "react-router-dom";
import { sendOTP, verifyOTP, resetPassword } from "../../Services/AuthN";
import ERROR_MESSAGES from "../../Resources/ResourceFiles/ResourceFiles";
import Button from "../Button/Button";
import "./Auth.css";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [step, setStep] = useState(1); // 1: email, 2: OTP, 3: new password
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const navigate = useNavigate();

  const validateEmail = () => {
    const newErrors = {};
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = "Please enter a valid email address";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateOTP = () => {
    const newErrors = {};
    if (!otp) {
      newErrors.otp = "OTP is required";
    } else if (otp.length !== 6) {
      newErrors.otp = "OTP must be 6 digits";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validatePasswords = () => {
    const newErrors = {};
    if (!newPassword) {
      newErrors.newPassword = "Password is required";
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "Password must be at least 6 characters";
    }
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSendOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    if (!validateEmail()) {
      setLoading(false);
      return;
    }

    try {
      const response = await sendOTP(email);
      setMessage(response.message || "OTP sent to your email");
      setStep(2);
    } catch (error) {
      setMessage(error.message || ERROR_MESSAGES.auth.otpSendFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    if (!validateOTP()) {
      setLoading(false);
      return;
    }

    try {
      const response = await verifyOTP(email, otp);
      setMessage(response.message || "OTP verified successfully");
      setStep(3);
    } catch (error) {
      setMessage(error.message || ERROR_MESSAGES.auth.otpVerificationFailed);
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    
    if (!validatePasswords()) {
      setLoading(false);
      return;
    }

    try {
      const response = await resetPassword(email, newPassword, otp);
      setMessage(response.message || "Password reset successfully");
      setTimeout(() => navigate("/"), 2000); // Redirect to login after 2 seconds
    } catch (error) {
      setMessage(error.message || ERROR_MESSAGES.auth.passwordResetFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="circle-bg circle-1"></div>
      <div className="circle-bg circle-2"></div>
      <div className="circle-bg circle-3"></div>
      <div className="circle-bg circle-4"></div>
      <div className="circle-bg circle-5"></div>
      <div className="left-right-section">
        <div className="left-section">
          <img src="/nobackgroundimage.svg" alt="Auth" className="auth-image" />
          <div className="left-section-text">Reset Password</div>
          <p className="left-down-text">Follow the steps to reset your password</p>
        </div>

        <div className="sign-up-card">
          <div className="auth-title">
            <h2>Forgot Password</h2>
          </div>
          
          {message && <p className="auth-message">{message}</p>}

          {step === 1 && (
            <form className="auth-form" onSubmit={handleSendOTP}>
              <div className={`input-group ${errors.email ? "error" : ""}`}>
                <input
                  type="email"
                  name="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
                {errors.email && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">{errors.email}</div>
                  </div>
                )}
              </div>

              <Button type="submit" className="signup-button" disabled={loading}>
                {loading ? "Sending..." : "Send OTP"}
              </Button>
            </form>
          )}

          {step === 2 && (
            <form className="auth-form" onSubmit={handleVerifyOTP}>
              <div className={`input-group ${errors.otp ? "error" : ""}`}>
                <input
                  type="text"
                  name="otp"
                  placeholder="Enter 6-digit OTP"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  maxLength="6"
                />
                {errors.otp && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">{errors.otp}</div>
                  </div>
                )}
              </div>

              <div className="otp-resend">
                Didn't receive OTP? 
                <button 
                  type="button" 
                  className="resend-link"
                  onClick={handleSendOTP}
                  disabled={loading}
                >
                  Resend OTP
                </button>
              </div>

              <Button type="submit" className="signup-button" disabled={loading}>
                {loading ? "Verifying..." : "Verify OTP"}
              </Button>
            </form>
          )}

          {step === 3 && (
            <form className="auth-form" onSubmit={handleResetPassword}>
              <div className={`input-group ${errors.newPassword ? "error" : ""}`}>
                <input
                  type="password"
                  name="newPassword"
                  placeholder="New Password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                {errors.newPassword && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">{errors.newPassword}</div>
                  </div>
                )}
              </div>

              <div className={`input-group ${errors.confirmPassword ? "error" : ""}`}>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm New Password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                />
                {errors.confirmPassword && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">{errors.confirmPassword}</div>
                  </div>
                )}
              </div>

              <Button type="submit" className="signup-button" disabled={loading}>
                {loading ? "Resetting..." : "Reset Password"}
              </Button>
            </form>
          )}

          <div className="switch-text">
            Remember your password?
            <Link to="/" className="login-text"> Login </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;