// src/components/ScenarioPicker.js - OPTIMIZED VERSION WITH FAST IMAGE LOADING
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import '../assets/styles/ScenarioPicker.css';
import LottieLoader from './LottieLoader';

export default function ScenarioPicker({ scenarios, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [loadingScenario, setLoadingScenario] = useState(null);
  const [imageLoadingStates, setImageLoadingStates] = useState({});
  const [imageErrors, setImageErrors] = useState({});
  const [preloadedImages, setPreloadedImages] = useState(new Set());
  const observerRef = useRef(null);
  const imageCache = useRef(new Map());

  // Temporary debugging
  console.log('🎭 ScenarioPicker received scenarios:', scenarios?.length || 'UNDEFINED', Array.isArray(scenarios) ? 'IS_ARRAY' : 'NOT_ARRAY');

  // Preload images for better performance
  const preloadImage = useCallback((src, key) => {
    if (preloadedImages.has(src) || imageCache.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
      // Set loading attributes for better performance
      img.loading = 'eager';
      img.decoding = 'async';
      
      img.onload = () => {
        setPreloadedImages(prev => new Set([...prev, src]));
        imageCache.current.set(src, img);
        setImageLoadingStates(prev => ({
          ...prev,
          [key]: false
        }));
        resolve();
      };
      img.onerror = () => {
        setImageErrors(prev => ({
          ...prev,
          [key]: true
        }));
        setImageLoadingStates(prev => ({
          ...prev,
          [key]: false
        }));
        reject();
      };
      img.src = src;
    });
  }, [preloadedImages]);

  // Preload ALL images immediately for better UX
  useEffect(() => {
    if (!scenarios || scenarios.length === 0) return;

    // Preload all images immediately
    const imagesToPreload = scenarios
      .filter(s => s.image)
      .map(s => ({ src: s.image, key: s.key }));

    const preloadPromises = imagesToPreload.map(({ src, key }) => {
      setImageLoadingStates(prev => ({
        ...prev,
        [key]: true
      }));
      return preloadImage(src, key).catch(() => {
        console.warn(`Failed to preload image for ${key}`);
      });
    });

    Promise.allSettled(preloadPromises);
  }, [scenarios, preloadImage]);

  // Optimized image loading handlers (moved before early return)
  const handleImageLoad = useCallback((scenarioKey) => {
    setImageLoadingStates(prev => ({
      ...prev,
      [scenarioKey]: false
    }));
  }, []);

  const handleImageError = useCallback((scenarioKey) => {
    setImageErrors(prev => ({
      ...prev,
      [scenarioKey]: true
    }));
    setImageLoadingStates(prev => ({
      ...prev,
      [scenarioKey]: false
    }));
  }, []);

  // Simplified image component - no lazy loading, load all images immediately
  const ScenarioImage = ({ scenario, index }) => {
    const isPreloaded = preloadedImages.has(scenario.image);
    const isCached = imageCache.current.has(scenario.image);

    return (
      <div 
        className={`card-image-wrapper auto-height ${imageLoadingStates[scenario.key] ? 'loading' : ''} gradient-bg`}
      >
        {imageErrors[scenario.key] ? (
          <div className="image-error">
            <span>Image unavailable</span>
          </div>
        ) : (
          <>
            <img
              src={scenario.image}
              alt={scenario.label}
              className={`card-image high-visibility ${
                imageLoadingStates[scenario.key] ? 'loading' : 'loaded'
              }`}
              onLoad={() => handleImageLoad(scenario.key)}
              onError={() => handleImageError(scenario.key)}
              loading="eager"
              decoding="async"
              style={{
                opacity: isPreloaded || isCached ? 1 : 0.7,
                transition: 'opacity 0.3s ease'
              }}
            />
            <div className="card-image-overlay"></div>
          </>
        )}
      </div>
    );
  };

  if (!scenarios || scenarios.length === 0) {
    return (
      <div 
        className={`scenario-modal ${!onClose ? 'scenario-modal-embedded' : ''}`} 
        onClick={onClose ? onClose : undefined}
      >
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
      await new Promise(resolve => setTimeout(resolve, 300));
      onSelect(scenarioKey);
    } catch (error) {
      console.error('Error selecting scenario:', error);
      setLoadingScenario(null);
    }
  };

  return (
    <div 
      className={`scenario-modal ${!onClose ? 'scenario-modal-embedded' : ''}`} 
      onClick={onClose ? onClose : undefined}
    >
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
                  {items.map((s, index) => (
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
                        <ScenarioImage scenario={s} index={index} />
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