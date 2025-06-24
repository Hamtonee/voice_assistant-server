// src/components/ScenarioPicker.js - FIXED VERSION WITH WORKING SELECTION
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
  const imageCache = useRef(new Map());

  // Debug logging
  useEffect(() => {
    console.log('🎨 ScenarioPicker mounted:', {
      scenarios: scenarios?.length || 0,
      onSelect: typeof onSelect,
      onClose: typeof onClose,
      isEmbedded: !onClose
    });
  }, [scenarios, onSelect, onClose]);

  // Preload images for better performance
  const preloadImage = useCallback((src, key) => {
    if (preloadedImages.has(src) || imageCache.current.has(src)) {
      return Promise.resolve();
    }

    return new Promise((resolve, reject) => {
      const img = new Image();
      
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

  // Preload images efficiently
  useEffect(() => {
    if (!scenarios || scenarios.length === 0) return;

    const imagesToPreload = scenarios
      .filter(s => s.image)
      .slice(0, 6)
      .map(s => ({ src: s.image, key: s.key }));

    const preloadPromises = imagesToPreload.map(({ src, key }) => {
      setImageLoadingStates(prev => ({
        ...prev,
        [key]: true
      }));
      return preloadImage(src, key).catch(() => {
        // Image preload failed - continue without blocking
      });
    });

    Promise.allSettled(preloadPromises);

    if (scenarios.length > 6) {
      setTimeout(() => {
        const remainingImages = scenarios
          .filter(s => s.image)
          .slice(6)
          .map(s => ({ src: s.image, key: s.key }));

        remainingImages.forEach(({ src, key }) => {
          setImageLoadingStates(prev => ({
            ...prev,
            [key]: true
          }));
          preloadImage(src, key).catch(() => {
            // Image preload failed - continue without blocking
          });
        });
      }, 1000);
    }
  }, [scenarios, preloadImage]);

  // Image loading handlers
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

  // Simplified image component
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
  const categoryOrder = Array.from(new Set(Array.isArray(scenarios) ? scenarios.map(s => s.category) : []));

  // Filter by search term
  const filtered = Array.isArray(scenarios) ? scenarios.filter(s => {
    const term = search.toLowerCase();
    return (
      s.label.toLowerCase().includes(term) ||
      (s.subtitle || '').toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term)
    );
  }) : [];

  // FIXED: Scenario selection handler
  const handleScenarioSelect = async (scenario) => {
    if (loadingScenario) return; // Prevent double-clicks
    
    console.log('🎯 Scenario selected:', scenario);
    
    // Show loading for this specific scenario
    setLoadingScenario(scenario.key);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call the onSelect callback with the full scenario object
      if (typeof onSelect === 'function') {
        console.log('📞 Calling onSelect with scenario:', scenario);
        onSelect(scenario);
      } else {
        console.error('❌ onSelect is not a function:', typeof onSelect);
      }
    } catch (error) {
      console.error('❌ Error selecting scenario:', error);
      // Reset loading state on error
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
            if (!Array.isArray(items) || items.length === 0) return null;

            return (
              <div key={category} className="scenario-category-block">
                <h4 className="category-heading">
                  {category}
                  <span className="category-count">({items.length})</span>
                </h4>
                <div className="scenario-grid">
                  {items.map((scenario, index) => (
                    <div
                      key={scenario.key}
                      className={`scenario-card ${loadingScenario === scenario.key ? 'loading' : ''} ${loadingScenario && loadingScenario !== scenario.key ? 'disabled' : ''}`}
                      onClick={() => !loadingScenario && handleScenarioSelect(scenario)}
                      role="button"
                      tabIndex={loadingScenario ? -1 : 0}
                      onKeyDown={(e) => {
                        if (!loadingScenario && (e.key === 'Enter' || e.key === ' ')) {
                          e.preventDefault();
                          handleScenarioSelect(scenario);
                        }
                      }}
                    >
                      {loadingScenario === scenario.key && (
                        <div className="card-loading-overlay">
                          <LottieLoader 
                            size={60} 
                            message="Loading..." 
                          />
                        </div>
                      )}
                      
                      {scenario.image && (
                        <ScenarioImage scenario={scenario} index={index} />
                      )}
                      
                      <div className="card-content">
                        <div 
                          className="card-label"
                          title={scenario.label.length > 25 ? scenario.label : ''}
                        >
                          {scenario.label}
                        </div>
                        {scenario.subtitle && (
                          <div 
                            className="card-subtitle"
                            title={scenario.subtitle.length > 50 ? scenario.subtitle : ''}
                          >
                            {scenario.subtitle}
                          </div>
                        )}
                        {scenario.difficulty && (
                          <div className={`card-difficulty ${scenario.difficulty.toLowerCase()}`}>
                            {scenario.difficulty}
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