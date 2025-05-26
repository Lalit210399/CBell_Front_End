const ERROR_MESSAGES = {
  required: {
    firstName: "First name is required *",
    lastName: "Last name is required *",
    email: "Email is required *",
    password: "Password is required *",
    confirmPassword: "Confirm Password is required *",
  },
  format: {
    email: "Invalid email format.",
  },
  auth: {
    loginSuccess: "Login successful!",
    loginFailed: "Login failed. Please try again.",
    signupSuccess: "Signup successful! Please log in.",
    signupFailed: "Signup failed. Please try again.",
  },
  validation: {
    passwordLength: "Password must be at least 6 characters.",
    passwordMismatch: "Passwords do not match.",
  },
};

export default ERROR_MESSAGES;

