    // MessageContext.js
import React, { createContext, useState, useContext } from "react";
import MessageStrip from "../CommonComponents/MessageStrip/MessageStrip";

const MessageContext = createContext();

export const MessageProvider = ({ children }) => {
  const [messages, setMessages] = useState([]);

  const addMessage = (message) => {
    setMessages((prev) => [...prev, message]);
  };

  const removeMessage = (id) => {
    setMessages((prev) => prev.filter((msg) => msg.id !== id));
  };

  return (
    <MessageContext.Provider value={{ messages, addMessage, removeMessage }}>
      {children}
      {/* Global Message Container */}
      <div className="global-messages">
        {messages.map((msg) => (
          <MessageStrip
            key={msg.id}
            text={msg.text}
            type={msg.type}
            duration={msg.duration || 5000}
            onClose={() => removeMessage(msg.id)}
          />
        ))}
      </div>
    </MessageContext.Provider>
  );
};

export const useMessages = () => useContext(MessageContext);