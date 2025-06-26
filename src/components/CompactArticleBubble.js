import React from 'react';
import '../assets/styles/CompactArticleBubble.css';
import { BookOpen, Clock, User } from 'lucide-react';

const CompactArticleBubble = ({ 
  article, 
  onClick, 
  isActive = false,
  className = '' 
}) => {
  if (!article) return null;

  // Extract metadata
  const category = article.metadata?.articleMetadata?.category || 'Reading';
  const difficulty = article.metadata?.articleMetadata?.difficulty || 'medium';
  const createdDate = new Date(article.createdAt || Date.now());
  
  // Generate preview text from article content
  const getPreviewText = () => {
    if (article.topic?.content) {
      const text = article.topic.content.replace(/\n\n/g, ' ').trim();
      return text.length > 100 ? `${text.substring(0, 100)}...` : text;
    }
    return 'Click to read this article';
  };

  // Format relative time
  const getRelativeTime = () => {
    const now = new Date();
    const diffInHours = Math.abs(now - createdDate) / (1000 * 60 * 60);
    
    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else {
      const diffInDays = Math.floor(diffInHours / 24);
      return `${diffInDays}d ago`;
    }
  };

  return (
    <div 
      className={`article-bubble ${isActive ? 'active' : ''} ${className}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Bubble Header */}
      <div className="bubble-header">
        <div className="bubble-icon">
          <BookOpen size={16} />
        </div>
        <div className="bubble-meta">
          <span className="bubble-category">{category}</span>
          <span className="bubble-time">
            <Clock size={10} />
            {getRelativeTime()}
          </span>
        </div>
      </div>

      {/* Bubble Content */}
      <div className="bubble-content">
        <h3 className="bubble-title">
          {article.title || article.topic?.title || 'Untitled Article'}
        </h3>
        <p className="bubble-preview">
          {getPreviewText()}
        </p>
      </div>

      {/* Bubble Footer */}
      <div className="bubble-footer">
        <span className={`difficulty-badge ${difficulty}`}>
          {difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}
        </span>
        <span className="expand-hint">
          Click to expand
        </span>
      </div>

      {/* Hover overlay */}
      <div className="bubble-overlay">
        <div className="overlay-content">
          <BookOpen size={24} />
          <span>Read Article</span>
        </div>
      </div>
    </div>
  );
};

export default CompactArticleBubble; 