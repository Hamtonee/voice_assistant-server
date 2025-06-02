// src/components/ScenarioPicker.js - UPDATED VERSION WITH TITLE TOOLTIPS
import React, { useState } from 'react';
import { Search } from 'lucide-react';
import '../assets/styles/ScenarioPicker.css';
import placeholderImg from '../assets/images/placeholder.png';
import LottieLoader from './LottieLoader';

export default function ScenarioPicker({ scenarios, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [loadingScenario, setLoadingScenario] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});

  if (!scenarios || scenarios.length === 0) {
    return (
      <div className="scenario-modal" onClick={onClose}>
        <div className="scenario-container" onClick={e => e.stopPropagation()}>
          <div className="no-scenarios">
            <Search size={48} className="no-scenarios-icon" />
            <h3>No scenarios available</h3>
            <p>Please try again later or contact support</p>
          </div>
        </div>
      </div>
    );
  }

  // Preserve category order
  const categoryOrder = Array.from(new Set(scenarios.map(s => s.category)));

  // Filter by search term
  const filtered = scenarios.filter(s => {
    const term = search.toLowerCase();
    return (
      s.label.toLowerCase().includes(term) ||
      (s.subtitle || '').toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term)
    );
  });

  const handleScenarioSelect = async (scenarioKey) => {
    if (loadingScenario) return; // Prevent double-clicks
    
    setLoadingScenario(scenarioKey);
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      onSelect(scenarioKey);
    } catch (error) {
      console.error('Error selecting scenario:', error);
      setLoadingScenario(null);
    }
  };

  // Handle image loading states
  const handleImageLoad = (scenarioKey) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [scenarioKey]: false
    }));
  };

  const handleImageError = (scenarioKey) => {
    setImageErrors(prev => ({
      ...prev,
      [scenarioKey]: true
    }));
    setImageLoadingStates(prev => ({
      ...prev,
      [scenarioKey]: false
    }));
  };

  const handleImageLoadStart = (scenarioKey) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [scenarioKey]: true
    }));
  };

  return (
    <div className="scenario-modal" onClick={onClose}>
      <div className="scenario-container" onClick={e => e.stopPropagation()}>
        {/* Loading Overlay */}
        {loadingScenario && (
          <div className="scenario-loading-overlay">
            <div className="scenario-loading-content">
              <LottieLoader 
                size={120} 
                message="Starting your role-play session..." 
              />
              <div className="loading-progress">
                <div className="loading-bar"></div>
              </div>
            </div>
          </div>
        )}

        {/* Search Section */}
        <div className="scenario-search-wrapper">
          <Search size={20} className="search-icon" />
          <input
            type="text"
            className="scenario-search"
            placeholder="Search scenarios by name, description, or category..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            disabled={!!loadingScenario}
          />
          {search && (
            <button
              className="clear-search"
              onClick={() => setSearch('')}
              disabled={!!loadingScenario}
            >
              ×
            </button>
          )}
        </div>

        {/* Results count */}
        {search && (
          <div className="search-results-info">
            {filtered.length === 0 ? (
              <span>No scenarios found for "{search}"</span>
            ) : (
              <span>{filtered.length} scenario{filtered.length !== 1 ? 's' : ''} found</span>
            )}
          </div>
        )}

        {/* Grid of scenarios */}
        <div className="scenario-grid-wrapper">
          {categoryOrder.map(category => {
            const items = filtered.filter(s => s.category === category);
            if (!items.length) return null;

            return (
              <div key={category} className="scenario-category-block">
                <h4 className="category-heading">
                  {category}
                  <span className="category-count">({items.length})</span>
                </h4>
                <div className="scenario-grid">
                  {items.map(s => (
                    <div
                      key={s.key}
                      className={`scenario-card ${loadingScenario === s.key ? 'loading' : ''} ${loadingScenario && loadingScenario !== s.key ? 'disabled' : ''}`}
                      onClick={() => !loadingScenario && handleScenarioSelect(s.key)}
                      role="button"
                      tabIndex={loadingScenario ? -1 : 0}
                      onKeyDown={(e) => {
                        if (!loadingScenario && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleScenarioSelect(s.key);
                        }
                      }}
                    >
                      {loadingScenario === s.key && (
                        <div className="card-loading-overlay">
                          <LottieLoader 
                            size={60} 
                            message="Loading..." 
                          />
                        </div>
                      )}
                      
                      {s.image && (
                        <div 
                          className={`card-image-wrapper auto-height ${imageLoadingStates[s.key] ? 'loading' : ''} gradient-bg`}
                        >
                          {imageErrors[s.key] ? (
                            <div className="image-error">
                              <span>Image unavailable</span>
                            </div>
                          ) : (
                            <>
                              <img
                                src={s.image}
                                alt={s.label}
                                className={`card-image high-visibility ${imageLoadingStates[s.key] ? 'loading' : 'loaded'}`}
                                onLoadStart={() => handleImageLoadStart(s.key)}
                                onLoad={() => handleImageLoad(s.key)}
                                onError={() => handleImageError(s.key)}
                              />
                              <div className="card-image-overlay"></div>
                            </>
                          )}
                        </div>
                      )}
                      
                      <div className="card-content">
                        {/* Add title attribute for tooltip functionality */}
                        <div 
                          className="card-label"
                          title={s.label.length > 25 ? s.label : ''}
                        >
                          {s.label}
                        </div>
                        {s.subtitle && (
                          <div 
                            className="card-subtitle"
                            title={s.subtitle.length > 50 ? s.subtitle : ''}
                          >
                            {s.subtitle}
                          </div>
                        )}
                        {s.difficulty && (
                          <div className={`card-difficulty ${s.difficulty.toLowerCase()}`}>
                            {s.difficulty}
                          </div>
                        )}
                      </div>
                      
                      <div className="card-hover-overlay">
                        <span>Start Session</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
          
          {filtered.length === 0 && (
            <div className="no-scenarios">
              <Search size={48} className="no-scenarios-icon" />
              <h3>No scenarios match your search</h3>
              <p>Try adjusting your search terms or browse all categories</p>
              <button 
                className="clear-search-btn"
                onClick={() => setSearch('')}
                disabled={!!loadingScenario}
              >
                Clear Search
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="scenario-footer">
          <p className="scenario-footer-text">
            Select a scenario that matches your learning goals and interests
          </p>
        </div>
      </div>
    </div>
  );
}