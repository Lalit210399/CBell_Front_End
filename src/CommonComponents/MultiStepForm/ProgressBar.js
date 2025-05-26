import React from "react";

const ProgressBar = ({ step }) => {
  return (
    <div className="progress-bar">
      <div className={`step ${step >= 1 ? "active" : ""}`}></div>
      <div className={`step ${step >= 2 ? "active" : ""}`}></div>
    </div>
  );
};

export default ProgressBar;
