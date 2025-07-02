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

/**
 * Generates initials from a user object or name string
 */
function getInitials(user) {
  // If user is an object with name property
  if (user && typeof user === 'object' && user.name) {
    const nameParts = user.name.trim().split(/\s+/).filter(Boolean);
    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) {
      return nameParts[0].substring(0, 2).toUpperCase();
    }
    return (nameParts[0][0] + nameParts[nameParts.length - 1][0]).toUpperCase();
  }
  
  // If user is a string (backward compatibility)
  if (typeof user === 'string') {
    const parts = user.trim().split(/\s+/).filter(Boolean);
    if (parts.length === 0) return '';
    if (parts.length === 1) {
      return parts[0].substring(0, 2).toUpperCase();
    }
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }

  return '';
}

export default function Avatar({ user, size = 40, onClick }) {
  const initials = getInitials(user);
  const userName = user?.name || (typeof user === 'string' ? user : '');
  const avatarUrl = user?.avatar || (typeof user === 'string' ? '' : '');
  
  // Determine dimensions
  const dim = typeof size === 'number' ? `${size}px` : size;
  const bgColor = stringToColor(userName);

  const commonStyle = {
    width: dim,
    height: dim,
    fontSize: `calc(${dim} / 2.5)`, // Slightly smaller font for better fit
    lineHeight: dim, // Center vertically
  };

  const content = avatarUrl ? (
    <img
      className="avatar avatar--img"
      src={avatarUrl}
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
  user: PropTypes.oneOfType([
    PropTypes.string,
    PropTypes.shape({
      name: PropTypes.string,
      avatar: PropTypes.string,
    })
  ]).isRequired,
  size: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  onClick: PropTypes.func,
};

Avatar.defaultProps = {
  size: 40,
  onClick: null,
};
