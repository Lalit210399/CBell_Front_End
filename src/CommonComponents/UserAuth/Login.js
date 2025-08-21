// Pages/Auth/Login.js

import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AlertCircle } from "lucide-react";
import "./Auth.css";
import Button from "../Button/Button";
import { signin, getPermissions } from "../../Services/AuthN";
import { useUser } from "../../Context/UserContext";
import ERROR_MESSAGES from "../../Resources/ResourceFiles/ResourceFiles";

const Login = () => {
  const { user, setUser, setPermissions } = useUser();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  useEffect(() => {
    if (user) {
      // Redirect to first allowed page based on permissions
      try {
        const stored = localStorage.getItem("permissions");
        const perms = stored ? JSON.parse(stored) : null;
        const p = perms?.permissions || {};
        const canDashboard = Array.isArray(p?.Dashboard?.["Dashboard Management"]) && p.Dashboard["Dashboard Management"].includes("Read");
        const canEvents = Array.isArray(p?.Events?.["Event Management"]) && p.Events["Event Management"].includes("Read");
        const target = canDashboard ? "/dashboard" : canEvents ? "/events" : "/login";
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
    } else if (password.length < 4) {
      validationErrors.password = ERROR_MESSAGES.validation.passwordLength;
    }

    setErrors(validationErrors);
    return Object.keys(validationErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    setErrors({});

    if (!validate()) {
      setLoading(false);
      return;
    }

    try {
      const response = await signin(formData);
      //console.log('Login API Response:', response); // Debug log

      if (response.message === "Login successful") {
        // Store all relevant user data from the response
        const loggedInUser = {
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          organization: response.organization, // full organization object
          organizationId: response.organizationId,
          userID: response.userId,
          roleIds: response.roleids,
          message: response.message,
          // add any other fields you want to persist
        };

        // Store user data
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);

        // Fetch and store permissions
        try {
          const permissionResponse = await getPermissions();
          localStorage.setItem("permissions", JSON.stringify(permissionResponse));
          setPermissions(permissionResponse);

          // Navigate only after all data is loaded → route to first allowed page
          const p = permissionResponse?.permissions || {};
          const canDashboard = Array.isArray(p?.Dashboard?.["Dashboard Management"]) && p.Dashboard["Dashboard Management"].includes("Read");
          const canEvents = Array.isArray(p?.Events?.["Event Management"]) && p.Events["Event Management"].includes("Read");
          const target = canDashboard ? "/dashboard" : canEvents ? "/events" : "/login";
          navigate(target);
        } catch (permissionError) {
          console.error("Permission fetch failed:", permissionError);
          setMessage("Login successful, but couldn't load permissions");
          // Fallback to dashboard, but will be re-guarded by route protection if not allowed
          navigate("/dashboard");
        }
      } else {
        throw new Error(response.message || "Unexpected response from server");
      }
    } catch (error) {
      console.error("Login failed:", error);
      setMessage(error.message || ERROR_MESSAGES.auth.loginFailed);
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
            <div className={`input-group ${errors.password ? "error" : ""}`}>
              <input
                type="password"
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleChange}
              />
              {errors.password && (
                <div className="signup-error-icon-wrapper">
                  <AlertCircle size={18} />
                  <div className="signup-error-tooltip">{errors.password}</div>
                </div>
              )}
            </div>

            <div>
              <Button type="submit" className="signup-button" disabled={loading}>
                {loading ? "Logging in..." : "Login"}
              </Button>
            </div>
          </form>

          {/* <Button className="google-button">
            <img src="/Google_Logo.svg" alt="Google" />
            Login with Google
          </Button> */}
          <div className="forgot-password-link">
            <Link to="/forgot-password" className="forgot-password-text">
              Forgot Password?
            </Link>
          </div>

          {message && <p className="auth-message">{message}</p>}

          <p className="switch-text">
            Don’t have an account?
            <Link to="/signup" className="login-text"> Register </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
