import React, { useState } from "react";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
// import ProgressBar from "./ProgressBar";

const MultiStepForm = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: "",
    eventName: "",
    eventDate: "",
    eventDescription: "",
    location: "", 
    guests: "",
    coordinators: "",
  });

  const nextStep = () => setStep(step + 1);
  const prevStep = () => setStep(step - 1);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <div className="container">
      {/* <ProgressBar step={step} /> */}
      {step === 1 && <StepOne nextStep={nextStep} setFormData={setFormData} formData={formData} />}
      {step === 2 && <StepTwo prevStep={prevStep} formData={formData} handleChange={handleChange} />}
    </div>
  );
};

export default MultiStepForm;
