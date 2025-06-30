import React from 'react';
import { Search, MessageCircle, FileText, Users, Settings, Plus } from 'lucide-react';
import { Button } from './ui';
import Lottie from 'lottie-react';
import loadingAnimation from '../assets/animations/loading.json';
import '../assets/styles/LoadingStates.css';

// Generic empty state component
export const EmptyState = ({ 
  icon: Icon = FileText,
  title = "No data available",
  description = "There's nothing to show here yet.",
  action = null,
  actionText = "Get Started",
  onAction = null,
  className = ""
}) => (
  <div className={`empty-state ${className}`}>
    <div className="empty-state__content">
      <div className="empty-state__icon">
        <Icon size={64} />
      </div>
      <h3 className="empty-state__title">{title}</h3>
      <p className="empty-state__description">{description}</p>
      {(action || onAction) && (
        <div className="empty-state__actions">
          {action || (
            <button onClick={onAction} className="btn btn-primary empty-state__action">
              <Plus size={16} />
              {actionText}
            </button>
          )}
        </div>
      )}
    </div>
  </div>
);

// No search results
export const NoSearchResults = ({ 
  query = "", 
  onClear = null,
  suggestions = []
}) => (
  <EmptyState
    icon={Search}
    title="No results found"
    description={query ? `No results found for "${query}". Try adjusting your search terms.` : "Enter a search term to find content."}
    action={
      <div className="empty-state__search-actions">
        {onClear && query && (
          <button onClick={onClear} className="btn btn-secondary">
            Clear Search
          </button>
        )}
        {suggestions.length > 0 && (
          <div className="empty-state__suggestions">
            <p>Try searching for:</p>
            <div className="empty-state__suggestion-tags">
              {suggestions.map((suggestion, index) => (
                <button 
                  key={index}
                  className="empty-state__suggestion-tag"
                  onClick={() => onClear && onClear(suggestion)}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    }
  />
);

// No chat sessions
export const NoChatSessions = ({ onCreateNew = null }) => (
  <EmptyState
    icon={MessageCircle}
    title="Start your first conversation"
    description="Create a new chat session to begin practicing with AI-powered role-play scenarios."
    actionText="Start New Chat"
    onAction={onCreateNew}
    className="empty-state--chat"
  />
);

// No scenarios available
export const NoScenariosAvailable = ({ onRefresh = null }) => (
  <EmptyState
    icon={Users}
    title="No scenarios available"
    description="Scenarios are currently unavailable. Please check your connection and try again."
    action={
      <div className="empty-state__error-actions">
        {onRefresh && (
          <button onClick={onRefresh} className="btn btn-primary">
            Refresh
          </button>
        )}
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-secondary"
        >
          Reload Page
        </button>
      </div>
    }
  />
);

// No articles (for reading feature)
export const NoArticles = ({ onCreateNew = null }) => (
  <EmptyState
    icon={FileText}
    title="No articles yet"
    description="Create your first personalized reading article to start improving your comprehension skills."
    actionText="Generate Article"
    onAction={onCreateNew}
    className="empty-state--articles"
  />
);

// Connection error state
export const ConnectionError = ({ onRetry = null }) => (
  <EmptyState
    icon={Settings}
    title="Connection problem"
    description="Unable to connect to the server. Please check your internet connection and try again."
    action={
      <div className="empty-state__error-actions">
        {onRetry && (
          <button onClick={onRetry} className="btn btn-primary">
            Try Again
          </button>
        )}
        <button 
          onClick={() => window.location.reload()} 
          className="btn btn-secondary"
        >
          Reload Page
        </button>
      </div>
    }
    className="empty-state--error"
  />
);

// Feature coming soon
export const ComingSoon = ({ 
  featureName = "This feature",
  description = "We're working hard to bring you this feature. Stay tuned for updates!"
}) => (
  <EmptyState
    icon={() => (
      <div className="coming-soon-icon">
        <span>🚀</span>
      </div>
    )}
    title={`${featureName} coming soon`}
    description={description}
    className="empty-state--coming-soon"
  />
);

// Maintenance mode
export const MaintenanceMode = ({ 
  message = "We're performing scheduled maintenance to improve your experience.",
  estimatedTime = null
}) => (
  <EmptyState
    icon={() => (
      <div className="maintenance-icon">
        <span>🔧</span>
      </div>
    )}
    title="Temporarily unavailable"
    description={message}
    action={estimatedTime && (
      <p className="empty-state__eta">
        Estimated completion: {estimatedTime}
      </p>
    )}
    className="empty-state--maintenance"
  />
);

// Access denied
export const AccessDenied = ({ 
  message = "You don't have permission to access this content.",
  onLogin = null 
}) => (
  <EmptyState
    icon={() => (
      <div className="access-denied-icon">
        <span>🔒</span>
      </div>
    )}
    title="Access denied"
    description={message}
    actionText="Sign In"
    onAction={onLogin}
    className="empty-state--access-denied"
  />
);

// Quick empty state for specific use cases
export const QuickEmpty = ({ children, className = "" }) => (
  <div className={`quick-empty ${className}`}>
    <div className="quick-empty__content">
      {children}
    </div>
  </div>
);

export default {
  EmptyState,
  NoSearchResults,
  NoChatSessions,
  NoScenariosAvailable,
  NoArticles,
  ConnectionError,
  ComingSoon,
  MaintenanceMode,
  AccessDenied,
  QuickEmpty
}; 