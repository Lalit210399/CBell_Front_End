import React, { useState } from "react";
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");

  // Dummy credentials
  const dummyUser = {
    email: "test@gmail.com",
    password: "pass123",
  };

  const handleLogin = (e) => {
    e.preventDefault();
    if (email === dummyUser.email && password === dummyUser.password) {
      // Navigate to home or dashboard
      window.location.href = "/home";
    } else {
      setError("Invalid email or password. Please try again.");
    }
  };

  return (
    <div className="page-container">
      <div className="auth-container">
        <h2>Login</h2>
        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button type="submit" className="login-btn">
            Login
          </button>
        </form>
        {error && <p className="error">{error}</p>}
        <div className="or-separator">or</div>
        <button className="google-btn">
          <img
            src="https://img.icons8.com/color/48/000000/google-logo.png"
            alt="Google Icon"
          />
          Sign In with Google
        </button>
        <p>
          Don't have an account?{" "}
          <span className="toggle-link">Sign up</span>
        </p>
      </div>
    </div>
  );
};

export default Login;
