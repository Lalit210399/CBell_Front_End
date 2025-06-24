import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
// import ProgressBar from "./ProgressBar";

const MultiStepForm = () => {
  const location = useLocation();
  const selectedDate = location.state?.selectedDate;
  if (selectedDate) {
    //console.log("Received selectedDate from calendar:", selectedDate);
  }
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    eventType: "",
    eventName: "",
    eventDate: selectedDate || "",
    eventDescription: "",
    location: "", 
    guests: "",
    coordinators: "",
  });
  //console.log("Form Datas",formData);

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
