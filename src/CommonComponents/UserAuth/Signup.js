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
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.firstName) newErrors.firstName = "First name is required";
    if (!formData.lastName) newErrors.lastName = "Last name is required";
    if (!formData.email) newErrors.email = "Email is required";
    if (!formData.password) newErrors.password = "Password is required";
    if (!formData.organizationCode) newErrors.code = "Code is required";
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setMessage("");
    if (validate()) {
      console.log("Form submitted successfully:", formData);

      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        confirmPassword: "",
        organizationCode: "",
      });
      setErrors({});
    }
    if (!validate()) {
      setLoading(false);
      return;
    }
    try {
      const response = await signup(formData);
      setMessage(response.message || ERROR_MESSAGES.auth.signupSuccess);
      navigate("/");
    } catch (error) {
      setMessage(ERROR_MESSAGES.auth.signupFailed);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-container">
      <div className="left-right-section">
        <div className="left-section">
          <img src="/nobackgroundimage.svg" alt="Auth" className="auth-image" />
          <div className="left-section-text">Welcome!</div>
          <p className="left-down-text">Create your account to continue</p>
        </div>

        <div className="sign-up-card">
          <div className="auth-title">
            <h2>Sign Up</h2>
          </div>
          
          <form className="auth-form" onSubmit={handleSubmit}>
            <div className="name-fields">
              <div className={`input-group ${errors.firstName ? "error" : ""}`}>
                <input
                  type="text"
                  name="firstName"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                />
                {errors.firstName && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">
                      {errors.firstName}
                    </div>
                  </div>
                )}
              </div>

              <div className={`input-group ${errors.lastName ? "error" : ""}`}>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                />
                {errors.lastName && (
                  <div className="signup-error-icon-wrapper">
                    <AlertCircle size={18} />
                    <div className="signup-error-tooltip">
                      {errors.lastName}
                    </div>
                  </div>
                )}
              </div>
            </div>

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

            <div
              className={`input-group ${errors.confirmPassword ? "error" : ""}`}
            >
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm Password"
                value={formData.confirmPassword}
                onChange={handleChange}
              />
              {errors.confirmPassword && (
                <div className="signup-error-icon-wrapper">
                  <AlertCircle size={18} />
                  <div className="signup-error-tooltip">
                    {errors.confirmPassword}
                  </div>
                </div>
              )}
            </div>

            {/* New input field for the code */}
            <div className={`input-group ${errors.organizationCode ? "error" : ""}`}>
              <input
                type="text"
                name="organizationCode"
                placeholder="Enter Code"
                value={formData.organizationCode || ""}
                onChange={handleChange}
              />
              {errors.organizationCode && (
                <div className="signup-error-icon-wrapper">
                  <AlertCircle size={18} />
                  <div className="signup-error-tooltip">{errors.organizationCode}</div>
                </div>
              )}
            </div>

            <Button type="submit" className="signup-button" disabled={loading}>
              {loading ? "Signing up..." : "Sign Up"}
              Sign Up
            </Button>
          </form>
          
          <Button className="google-button">
            <img src="/Google_Logo.svg" alt="Google" />
            Sign up with Google
          </Button>

          {message && <p className="auth-message">{message}</p>}

          <div className="switch-text">
            Already have an account?
            <Link to="/" className="login-text">
              {" "}
              Log In{" "}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Signup;
