import React, { useContext } from 'react';
import { AuthContext } from '../contexts/AuthContext';
import Avatar from './Avatar';
import '../assets/styles//ProfileDetail.css';

export default function ProfileDetail() {
  const { user, logout } = useContext(AuthContext);

  return (
    <div className="profile-detail">
      <Avatar userName={user?.name || ''} />

      <h2 className="profile-detail__name">
        {user?.name || '—'}
      </h2>

      <p className="profile-detail__email">
        {user?.email || '—'}
      </p>

      <button
        className="profile-detail__logout"
        onClick={logout}
      >
        Log out
      </button>
    </div>
  );
}
