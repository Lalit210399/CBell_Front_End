import React from "react";
import Avatar from "../Avatar/Avatar";
import "./List.css";

const List = ({ title, guests }) => {
  return (
    <div className="special-guests-container">
      <h3 className="title">{title}</h3>
      {guests && guests.length > 0 ? (
        <div className="guests-list">
          {guests.map((guest, index) => (
            <div key={index} className="guest-card">
              <Avatar src={guest.image} alt={guest.name} className="guest-image" size="24px" />
              <div className="guest-info">
                <p className="guest-name">{guest.name}</p>
                <p className="guest-title">{guest.title}</p>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="no-guests">No guests available</p>
      )}
    </div>
  );
};

export default List;
