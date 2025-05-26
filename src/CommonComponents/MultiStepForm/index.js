import React from "react";
import MultiStepForm from "./MultiStepForm";
import "./Form.css";

const StepForm = () => {
    return (
        <div className="Form_Container">
            <div className="Design_circle top_left" />
            <div className="Design_circle bottom_left" />
            <div className="Design_circle right_center" />
            <div className="Design_circle top_right" />
            <div className="Design_circle bottom_right" />
            <MultiStepForm />
        </div>
        
    );
};
export default StepForm;