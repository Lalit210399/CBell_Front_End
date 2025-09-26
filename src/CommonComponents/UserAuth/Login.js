// Pages/Auth/Login.js

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle, Eye, EyeOff } from "lucide-react";
import "./Auth.css";
import Button from "../Button/Button";
import { signin, getPermissions, getAccessibleOrganizations } from "../../Services/AuthN";
import { useUser } from "../../Context/UserContext";
import ERROR_MESSAGES from "../../Resources/ResourceFiles/ResourceFiles";

const Login = () => {
  const { user, setUser, setPermissions, setScope } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (user) {
      try {
        const stored = localStorage.getItem("permissions");
        const perms = stored ? JSON.parse(stored) : null;
        const p = perms?.permissions || {};
        const canDashboard =
          Array.isArray(p?.Dashboard?.["Dashboard Management"]) &&
          p.Dashboard["Dashboard Management"].includes("Read");
        const canEvents =
          Array.isArray(p?.Events?.["Event Management"]) &&
          p.Events["Event Management"].includes("Read");
        const target = canDashboard
          ? "/dashboard"
          : canEvents
          ? "/events"
          : "/login";
        navigate(target, { replace: true });
      } catch {
        navigate("/dashboard", { replace: true });
      }
    }
  }, [user, navigate]);

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
        // ✅ Store full login response
        localStorage.setItem("user", JSON.stringify(response));
        setUser(response);

        // ✅ Fetch and store permissions
        try {
          const permissionResponse = await getPermissions();
          localStorage.setItem(
            "permissions",
            JSON.stringify(permissionResponse)
          );
          setPermissions(permissionResponse);

          // ✅ Fetch and store accessible organizations (Scope)
          try {
            const scopeResponse = await getAccessibleOrganizations();
            localStorage.setItem("scope", JSON.stringify(scopeResponse));
            setScope(scopeResponse);
          } catch (scopeError) {
            console.error("Scope fetch failed:", scopeError);
            setMessage("Login successful, but couldn't load accessible organizations");
          }

          // Redirect to first allowed page
          const p = permissionResponse?.permissions || {};
          const canDashboard =
            Array.isArray(p?.Dashboard?.["Dashboard Management"]) &&
            p.Dashboard["Dashboard Management"].includes("Read");
          const canEvents =
            Array.isArray(p?.Events?.["Event Management"]) &&
            p.Events["Event Management"].includes("Read");
          const target = canDashboard
            ? "/dashboard"
            : canEvents
            ? "/events"
            : "/login";
          navigate(target);
        } catch (permissionError) {
          console.error("Permission fetch failed:", permissionError);
          setMessage("Login successful, but couldn't load permissions");
          navigate("/dashboard"); // fallback
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
          <form className="auth-form" onSubmit={handleSubmit}>
            {/* Email Field */}
            <div className={`input-group ${errors.email ? "error" : ""}`}>
              <input
                type="text"
                name="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
              />
              {errors.email && (
                <div className="signup-error-icon-wrapper">
                  <AlertCircle size={18} />
                  <div className="signup-error-tooltip">{errors.email}</div>
                </div>
              )}
            </div>

            {/* Password Field */}
            <div
              className={`input-group with-toggle ${
                errors.password ? "error" : ""
              }`}
            >
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              <button
                type="button"
                className="password-toggle"
                aria-label="Show password"
                onMouseDown={() => setShowPassword(true)}
                onMouseUp={() => setShowPassword(false)}
                onMouseLeave={() => setShowPassword(false)}
                onTouchStart={() => setShowPassword(true)}
                onTouchEnd={() => setShowPassword(false)}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <div className="signup-error-icon-wrapper">
                  <AlertCircle size={18} />
                  <div className="signup-error-tooltip">{errors.password}</div>
                </div>
              )}
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
            </div>
          </form>

          <div className="forgot-password-link">
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

          {message && <p className="auth-message">{message}</p>}

          <p className="switch-text">
            Don’t have an account?
            <Link to="/signup" className="login-text">
              {" "}
              Register{" "}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
