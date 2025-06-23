// src/components/Avatar.jsx
import React from 'react';
import PropTypes from 'prop-types';
import '../assets/styles/Avatar.css';

/**
 * Generates a consistent pastel background color based on a string.
 */
function stringToColor(str) {
  if (!str || typeof str !== 'string') return 'hsl(200, 70%, 60%)'; // Default color for undefined/empty strings
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  const h = (hash % 360 + 360) % 360;
  return `hsl(${h}, 70%, 60%)`;
}

export default function Avatar({ userName, src, size, onClick }) {
  // Split the name into words for initials
  const parts = (userName || '').trim().split(/\s+/).filter(Boolean);
  let initials = '';
  if (parts.length === 1) {
    initials = parts[0].substring(0, 2).toUpperCase();
  } else if (parts.length > 1) {
    initials =
      parts[0].charAt(0).toUpperCase() +
      parts[1].charAt(0).toUpperCase();
  }

  // Determine dimensions
  const dim = typeof size === 'number' ? `${size}px` : size;
  const bgColor = stringToColor(userName);

  const commonStyle = {
    width: dim,
    height: dim,
    fontSize: `calc(${dim} / 2)`,
  };

  const content = src ? (
    <img
      className="avatar avatar--img"
      src={src}
      alt={userName}
      style={commonStyle}
    />
  ) : (
    <div
      className="avatar"
      style={{
        ...commonStyle,
        backgroundColor: bgColor,
      }}
    >
      {initials}
    </div>
  );

  // If onClick is provided, wrap in a button for accessibility
  if (typeof onClick === 'function') {
    return (
      <button
        className="avatar avatar--button"
        onClick={onClick}
        aria-label="Open user menu"
        style={{ ...commonStyle, padding: 0, border: 'none', background: 'none' }}
      >
        {content}
      </button>
    );
  }

  return content;
}

Avatar.propTypes = {
  userName: PropTypes.string.isRequired,
  src:      PropTypes.string,
  size:     PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClick:  PropTypes.func,
};

Avatar.defaultProps = {
  src:    '',
  size:   40,
  onClick: null,
};
