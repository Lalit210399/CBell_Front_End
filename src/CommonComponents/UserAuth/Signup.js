import React, { useState } from "react";
import { AlertCircle } from "lucide-react";
import { signup } from "../../Services/AuthN"; // Adjust the import path as necessary
import ERROR_MESSAGES from "../../Resources/ResourceFiles/ResourceFiles"; // Import error messages
import Button from "../Button/Button"; // Adjust the import path as necessary
import "./Auth.css"; // Assuming this is where your CSS is
import { Link, useNavigate } from "react-router-dom";

const Signup = () => {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
    confirmPassword: "",
    organizationCode: "",
  });
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    // Clear error for the field being edited
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = () => {
    const newErrors = {};
    const {
      firstName,
      lastName,
      email,
      password,
      confirmPassword,
      organizationCode,
    } = formData;
    if (!firstName.trim())
      newErrors.firstName =
        ERROR_MESSAGES.required.firstName || "First name is required";
    if (!lastName.trim())
      newErrors.lastName =
        ERROR_MESSAGES.required.lastName || "Last name is required";
    if (!email.trim()) {
      newErrors.email = ERROR_MESSAGES.required.email || "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = ERROR_MESSAGES.format.email || "Invalid email format";
    }
    if (!password.trim()) {
      newErrors.password =
        ERROR_MESSAGES.required.password || "Password is required";
    } else if (password.length < 6) {
      newErrors.password =
        ERROR_MESSAGES.validation.passwordLength ||
        "Password must be at least 6 characters";
    }
    if (!confirmPassword.trim()) {
      newErrors.confirmPassword =
        ERROR_MESSAGES.required.confirmPassword ||
        "Please confirm your password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword =
        ERROR_MESSAGES.validation.passwordMatch || "Passwords do not match";
    }
    if (!organizationCode.trim())
      newErrors.organizationCode =
        ERROR_MESSAGES.required.organizationCode || "Code is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    const isValid = validate();
    if (!isValid) {
      setLoading(false);
      return;
    }
    try {
      const response = await signup(formData);
      setMessage(response.message || ERROR_MESSAGES.auth.signupSuccess);
      // Optionally clear form on success
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        organizationCode: "",
      });
      setErrors({});
      setTimeout(() => navigate("/"), 1200);
    } catch (error) {
      // Prefer status code if available
      const status = error.status || error.statusCode;
      const errMsg = typeof error.message === "string" ? error.message : "";
      if (status === 409) {
        setMessage(ERROR_MESSAGES.auth.emailExists || "Email already exists.");
      } else if (status === 400) {
        setMessage(
          errMsg && errMsg.length < 120
            ? errMsg
            : ERROR_MESSAGES.auth.signupFailed ||
                "Signup failed. Please check your input."
        );
      } else if (status >= 500) {
        setMessage(
          "The service is currently unavailable. Please try again later."
        );
      } else {
        setMessage(errMsg || ERROR_MESSAGES.auth.signupFailed);
      }
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
        {/* Left Section */}
        <div className="left-section">
          <img
            src="/nobackgroundimage.svg"
            alt="Auth Illustration"
            className="auth-image"
          />
          <div className="left-section-text">Welcome!</div>
          <p className="left-down-text">Create your account to continue</p>
        </div>
        {/* Right Section (Signup Form) */}
        <div className="sign-up-card">
          <h2 className="auth-title">Sign Up</h2>
          <form className="auth-form" onSubmit={handleSubmit} noValidate>
            <div
              className="input-fields-group"
              style={{
                display: "flex",
                flexDirection: "column",
                gap: 16,
                marginBottom: 30,
              }}
            >
              {/* Name Fields */}
              <div className="name-fields" style={{ display: "flex", gap: 16 }}>
                <div
                  className={`input-group${errors.firstName ? " error" : ""}`}
                >
                  <label htmlFor="firstName" className="visually-hidden">
                    First Name
                  </label>
                  <input
                    id="firstName"
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleChange}
                    aria-invalid={!!errors.firstName}
                    aria-describedby="firstName-error"
                    autoComplete="given-name"
                  />
                  {errors.firstName && (
                    <div
                      className="error-text"
                      id="firstName-error"
                      role="alert"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <AlertCircle
                        size={16}
                        aria-hidden="true"
                        style={{ marginRight: 4 }}
                      />
                      {errors.firstName}
                    </div>
                  )}
                </div>
                <div
                  className={`input-group${errors.lastName ? " error" : ""}`}
                >
                  <label htmlFor="lastName" className="visually-hidden">
                    Last Name
                  </label>
                  <input
                    id="lastName"
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleChange}
                    aria-invalid={!!errors.lastName}
                    aria-describedby="lastName-error"
                    autoComplete="family-name"
                  />
                  {errors.lastName && (
                    <div
                      className="error-text"
                      id="lastName-error"
                      role="alert"
                      style={{
                        display: "flex",
                        alignItems: "center",
                        marginTop: 4,
                      }}
                    >
                      <AlertCircle
                        size={16}
                        aria-hidden="true"
                        style={{ marginRight: 4 }}
                      />
                      {errors.lastName}
                    </div>
                  )}
                </div>
              </div>
              {/* Email Field */}
              <div className={`input-group${errors.email ? " error" : ""}`}>
                <label htmlFor="email" className="visually-hidden">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={formData.email}
                  onChange={handleChange}
                  aria-invalid={!!errors.email}
                  aria-describedby="email-error"
                  autoComplete="email"
                />
                {errors.email && (
                  <div
                    className="error-text"
                    id="email-error"
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                      style={{ marginRight: 4 }}
                    />
                    {errors.email}
                  </div>
                )}
              </div>
              {/* Password Field */}
              <div className={`input-group${errors.password ? " error" : ""}`}>
                <label htmlFor="password" className="visually-hidden">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  name="password"
                  placeholder="Password"
                  value={formData.password}
                  onChange={handleChange}
                  aria-invalid={!!errors.password}
                  aria-describedby="password-error"
                  autoComplete="new-password"
                />
                {errors.password && (
                  <div
                    className="error-text"
                    id="password-error"
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                      style={{ marginRight: 4 }}
                    />
                    {errors.password}
                  </div>
                )}
              </div>
              {/* Confirm Password Field */}
              <div
                className={`input-group${
                  errors.confirmPassword ? " error" : ""
                }`}
              >
                <label htmlFor="confirmPassword" className="visually-hidden">
                  Confirm Password
                </label>
                <input
                  id="confirmPassword"
                  type="password"
                  name="confirmPassword"
                  placeholder="Confirm Password"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  aria-invalid={!!errors.confirmPassword}
                  aria-describedby="confirmPassword-error"
                  autoComplete="new-password"
                />
                {errors.confirmPassword && (
                  <div
                    className="error-text"
                    id="confirmPassword-error"
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                      style={{ marginRight: 4 }}
                    />
                    {errors.confirmPassword}
                  </div>
                )}
              </div>
              {/* Organization Code Field */}
              <div
                className={`input-group${
                  errors.organizationCode ? " error" : ""
                }`}
              >
                <label htmlFor="organizationCode" className="visually-hidden">
                  Organization Code
                </label>
                <input
                  id="organizationCode"
                  type="text"
                  name="organizationCode"
                  placeholder="Enter Code"
                  value={formData.organizationCode}
                  onChange={handleChange}
                  aria-invalid={!!errors.organizationCode}
                  aria-describedby="organizationCode-error"
                />
                {errors.organizationCode && (
                  <div
                    className="error-text"
                    id="organizationCode-error"
                    role="alert"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      marginTop: 4,
                    }}
                  >
                    <AlertCircle
                      size={16}
                      aria-hidden="true"
                      style={{ marginRight: 4 }}
                    />
                    {errors.organizationCode}
                  </div>
                )}
              </div>
            </div>
            <div
              className="button-group"
              style={{ display: "flex", flexDirection: "column", gap: 16 }}
            >
              <Button
                type="submit"
                className={`signup-button${loading ? " loading" : ""}`}
                disabled={loading}
                aria-busy={loading}
              >
                {loading ? "Signing up..." : "Sign Up"}
              </Button>
              <Button className="google-button">
                <img src="/Google_Logo.svg" alt="Google" />
                Sign up with Google
              </Button>
            </div>
            {message && (
              <div
                className={`auth-message ${
                  message.includes("success") ? "success" : "error"
                }`}
                role="alert"
              >
                {message}
              </div>
            )}
          </form>
          <div className="login-links-group">
            <span className="switch-text">
              Already have an account?
              <Link to="/" className="login-text">
                Log In
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
