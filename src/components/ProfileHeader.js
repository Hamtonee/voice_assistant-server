import React, { useState, useRef, useEffect } from 'react';
import { FiMenu, FiX, FiLogOut } from 'react-icons/fi';
import Avatar from './Avatar';
// import '../assets/styles//ProfileHeader.css';

export default function ProfileHeader({
  sidebarOpen,
  onToggleSidebar,
  userName = 'User',
  onLogout,
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef();

  // Close dropdown when clicking outside
  useEffect(() => {
    function onClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  return (
    <header className="profile-header">
      <div className="profile-header__left">
        <button
          className="profile-header__btn"
          onClick={() => onToggleSidebar(!sidebarOpen)}
          aria-label="Toggle sidebar"
        >
          {sidebarOpen ? <FiX /> : <FiMenu />}
        </button>

        <div className="profile-header__avatar">
          <Avatar userName={userName} />
        </div>

        <h2 className="profile-header__title">Profile</h2>
      </div>

      <div className="profile-header__right" ref={menuRef}>
        <button
          className="profile-header__btn"
          onClick={() => setMenuOpen(o => !o)}
          aria-label="Open profile menu"
        >
          ▾
        </button>

        {menuOpen && (
          <ul className="profile-header__menu">
            <li
              className="profile-header__menu-item"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
            >
              <FiLogOut />
              Logout
            </li>
          </ul>
        )}
      </div>
    </header>
  );
}
