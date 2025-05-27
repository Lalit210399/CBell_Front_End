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
      console.log('Login API Response:', response); // Debug log

      if (response.message === "Login successful") {
        const loggedInUser = {
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          organizationId: response.organizationId,
          userID: response.userId,
          roleIds: response.roleids // Added roleIds from response
        };

        // Store user data
        localStorage.setItem("user", JSON.stringify(loggedInUser));
        setUser(loggedInUser);

        // Fetch and store permissions
        try {
          const permissionResponse = await getPermissions();
          localStorage.setItem("permissions", JSON.stringify(permissionResponse));
          setPermissions(permissionResponse);

          // Navigate only after all data is loaded
          navigate("/dashboard");
        } catch (permissionError) {
          console.error("Permission fetch failed:", permissionError);
          setMessage("Login successful, but couldn't load permissions");
          navigate("/dashboard"); // Still navigate but show message
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

          <Button className="google-button">
            <img src="/Google_Logo.svg" alt="Google" />
            Login with Google
          </Button>

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
