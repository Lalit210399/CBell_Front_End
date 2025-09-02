// Pages/Auth/Login.js

import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "./Auth.css";
import Button from "../Button/Button";
import { signin, getPermissions } from "../../Services/AuthN";
import { useUser } from "../../Context/UserContext";
import ERROR_MESSAGES from "../../Resources/ResourceFiles/ResourceFiles";

const Login = () => {
  const { setUser, setPermissions } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    // Clear error for the field being edited
    if (errors[e.target.name]) {
      setErrors({ ...errors, [e.target.name]: undefined });
    }
  };

  const validate = () => {
    const validationErrors = {};
    const { email, password } = formData;

    if (!email.trim()) {
      validationErrors.email = ERROR_MESSAGES.required.email;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      validationErrors.email = ERROR_MESSAGES.format.email;
    }

    if (!password.trim()) {
      validationErrors.password = ERROR_MESSAGES.required.password;
    } else if (password.length < 6) {
      validationErrors.password = ERROR_MESSAGES.validation.passwordLength;
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate and show errors if any
    const isValid = validate();
    if (!isValid) {
      setLoading(false);
      return;
    }
    setLoading(true);
    setMessage("");

    try {
      const response = await signin(formData);
      if (response.message === "Login successful") {
        const loggedInUser = {
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          organization: response.organization,
          organizationId: response.organizationId,
          userID: response.userId,
          roleIds: response.roleids,
          message: response.message,
        };
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);
        try {
          const permissionResponse = await getPermissions();
          localStorage.setItem(
            "permissions",
            JSON.stringify(permissionResponse)
          );
          setPermissions(permissionResponse);
          navigate("/dashboard");
        } catch (permissionError) {
          console.error("Permission fetch failed:", permissionError);
          setMessage("Login successful, but couldn't load permissions");
          navigate("/dashboard");
        }
      } else {
        throw new Error(response.message || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Login failed:", error);
      // Prefer status code if available
      const status = error.status || error.statusCode;
      const errMsg = typeof error.message === "string" ? error.message : "";
      if (status === 401 || status === 403) {
        setMessage("Invalid email or password.");
      } else if (status === 400) {
        // If backend provides a short, non-HTML message, show it; else show generic
        if (
          errMsg &&
          errMsg.length < 120 &&
          !errMsg.startsWith("<!DOCTYPE html") &&
          !errMsg.startsWith("<html") &&
          !/<html|<body|<div|<span|<script|<head/i.test(errMsg)
        ) {
          setMessage(errMsg);
        } else {
          setMessage("Invalid request. Please check your input and try again.");
        }
      } else if (status >= 500) {
        setMessage(
          "The service is currently unavailable. Please try again later."
        );
      } else if (status) {
        setMessage("An error occurred. Please try again.");
      } else {
        // If error message looks like HTML or is very long, show a friendly message
        if (
          errMsg.startsWith("<!DOCTYPE html") ||
          errMsg.startsWith("<html") ||
          errMsg.length > 200 ||
          /<html|<body|<div|<span|<script|<head/i.test(errMsg)
        ) {
          setMessage(
            "The service is currently unavailable. Please try again later."
          );
        } else {
          setMessage(errMsg || ERROR_MESSAGES.auth.loginFailed);
        }
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
          <div className="left-section-text">
            Welcome to C-Bell
            <p className="left-down-text">
              Streamline your content, elevate your impact!
            </p>
          </div>
        </div>

        {/* Right Section (Login Form) */}
        <div className="sign-up-card">
          <h2 className="auth-title">Login</h2>
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
                  autoComplete="current-password"
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
                {loading ? "Logging in..." : "Login"}
              </Button>
              <Button className="google-button">
                <img src="/Google_Logo.svg" alt="Google" />
                Login with Google
              </Button>
            </div>

            {message && (
              <div
                className={`auth-message ${
                  message.includes("Invalid") ? "error" : "success"
                }`}
                role="alert"
              >
                {message}
              </div>
            )}
          </form>
          <div className="login-links-group">
            <Link to="/forgot-password" className="forgot-password-text">
              Forgot Password?
            </Link>
            <span className="switch-text">
              Don’t have an account?
              <Link to="/signup" className="login-text">
                Register
              </Link>
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
