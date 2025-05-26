import React, { useState } from "react";
import "./Accordian.css"; 
import { ChevronDown } from "lucide-react";

const Accordion = ({ title, content }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="accordion">
      <div className="accordion-header" onClick={() => setIsOpen(!isOpen)}>
        <h3>{title}</h3>
        <span className={`accordion-icon ${isOpen ? "open" : ""}`}>
          <ChevronDown />
        </span>
      </div>
      <div className={`accordion-content ${isOpen ? "open" : ""}`}>
        {content}
      </div>
    </div>
  );
};

export default Accordion;
