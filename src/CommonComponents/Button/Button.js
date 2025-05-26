import React from 'react';
import PropTypes from 'prop-types';
import './Button.css'; // Import external CSS

const Button = ({ onClick, children, type, disabled, className, Icon }) => {
    return (
        <button
            onClick={onClick}
            type={type}
            disabled={disabled}
            className={`btn ${className}`}
        >
            {Icon && <Icon className="btn-icon" />} {/* Render icon if provided */}
            {children}
        </button>
    );
};

Button.propTypes = {
    onClick: PropTypes.func,
    children: PropTypes.node.isRequired,
    type: PropTypes.oneOf(['button', 'submit', 'reset']),
    disabled: PropTypes.bool,
    className: PropTypes.string,
    Icon: PropTypes.elementType, // Accept an icon component
};

Button.defaultProps = {
    onClick: () => {},
    type: 'button',
    disabled: false,
    className: 'btn-secondary',
    Icon: null, // Default to no icon
};

export default Button;
