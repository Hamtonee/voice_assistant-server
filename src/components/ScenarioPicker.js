// src/components/ScenarioPicker.js - MODERN IMAGE LOADING WITHOUT BLINK EFFECT
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Search } from 'lucide-react';
import '../assets/styles/ScenarioPicker.css';
import LottieLoader from './LottieLoader';

// WebP Support Detection Utility
const detectWebPSupport = () => {
  return new Promise((resolve) => {
    const webP = new Image();
    webP.onload = webP.onerror = () => {
      resolve(webP.height === 2);
    };
    webP.src = 'data:image/webp;base64,UklGRjoAAABXRUJQVlA4IC4AAACyAgCdASoCAAIALmk0mk0iIiIiIgBoSygABc6WWgAA/veff/0PP8bA//LwYAAA';
  });
};

// Add WebP support class to document
const initializeWebPSupport = async () => {
  const supportsWebP = await detectWebPSupport();
  if (supportsWebP) {
    document.documentElement.classList.add('webp-supported');
  }
};

// Modern Image Component with Intersection Observer and Progressive Loading
const ModernScenarioImage = React.memo(({ scenario, index }) => {
  const [imageState, setImageState] = useState('loading'); // loading, loaded, error
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef(null);
  const observerRef = useRef(null);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const imageElement = imageRef.current;
    if (!imageElement) return;

    // Create Intersection Observer
    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsVisible(true);
            observerRef.current?.unobserve(entry.target);
          }
        });
      },
      {
        root: null,
        rootMargin: '50px', // Start loading 50px before image comes into view
        threshold: 0.1
      }
    );

    observerRef.current.observe(imageElement);

    return () => {
      if (observerRef.current && imageElement) {
        observerRef.current.unobserve(imageElement);
      }
    };
  }, []);

  // Modern image loading with WebP support and fallback
  const handleImageLoad = useCallback(() => {
    setImageState('loaded');
  }, []);

  const handleImageError = useCallback(() => {
    setImageState('error');
  }, []);

  // Get optimized image URL with format detection
  const getOptimizedImageUrl = useCallback((originalUrl) => {
    if (!originalUrl) return null;
    
    // Check if WebP is supported (from document class)
    const supportsWebP = document.documentElement.classList.contains('webp-supported');

    // If the original URL already has format parameters, use it as-is
    if (originalUrl.includes('?') || originalUrl.includes('format=')) {
      return originalUrl;
    }

    // Add optimization parameters based on screen size
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth * devicePixelRatio;
    
    let targetWidth;
    if (screenWidth <= 768) {
      targetWidth = 400; // Mobile
    } else if (screenWidth <= 1024) {
      targetWidth = 500; // Tablet
    } else {
      targetWidth = 600; // Desktop
    }

    // Try to add optimization parameters (works with many CDNs)
    const separator = originalUrl.includes('?') ? '&' : '?';
    const format = supportsWebP ? 'webp' : 'jpg';
    
    return `${originalUrl}${separator}w=${targetWidth}&f=${format}&q=85`;
  }, []);

  const optimizedImageUrl = getOptimizedImageUrl(scenario.image);

  return (
    <div 
      ref={imageRef}
      className={`card-image-wrapper modern-loading ${imageState}`}
    >
      {imageState === 'error' ? (
        <div className="image-error-modern">
          <div className="error-icon">🖼️</div>
          <span>Image unavailable</span>
        </div>
      ) : (
        <>
          {/* Skeleton loader */}
          {imageState === 'loading' && (
            <div className="image-skeleton">
              <div className="skeleton-shimmer"></div>
            </div>
          )}
          
          {/* Modern progressive image loading */}
          {isVisible && optimizedImageUrl && (
            <picture>
              {/* WebP version for modern browsers */}
              <source 
                srcSet={getOptimizedImageUrl(scenario.image)}
                type="image/webp"
              />
              {/* Fallback for older browsers */}
              <img
                src={optimizedImageUrl}
                alt={scenario.label}
                className={`card-image modern-image ${imageState}`}
                onLoad={handleImageLoad}
                onError={handleImageError}
                loading="lazy"
                decoding="async"
                fetchPriority={index < 4 ? "high" : "low"}
                style={{
                  opacity: imageState === 'loaded' ? 1 : 0,
                  transform: imageState === 'loaded' ? 'scale(1)' : 'scale(1.05)',
                  transition: 'opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1), transform 0.4s cubic-bezier(0.4, 0, 0.2, 1)'
                }}
              />
            </picture>
          )}
          
          {/* Gradient overlay */}
          <div className="card-image-overlay modern-overlay"></div>
        </>
      )}
    </div>
  );
});

ModernScenarioImage.displayName = 'ModernScenarioImage';

export default function ScenarioPicker({ scenarios, onSelect, onClose }) {
  const [search, setSearch] = useState('');
  const [loadingScenario, setLoadingScenario] = useState(null);

  // Initialize WebP support detection
  useEffect(() => {
    initializeWebPSupport();
  }, []);

  // Debug logging
  useEffect(() => {
    console.log('🎨 ScenarioPicker mounted:', {
      scenarios: scenarios?.length || 0,
      onSelect: typeof onSelect,
      onClose: typeof onClose,
      isEmbedded: !onClose
    });
  }, [scenarios, onSelect, onClose]);

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
              <span>No scenarios found for &quot;{search}&quot;</span>
            ) : (
              <span>{filtered.length} scenario{filtered.length !== 1 ? 's' : ''} found</span>
            )}
          </div>
        )}

        {/* Category Sections */}
        {filtered.length > 0 ? (
          categoryOrder
            .map(category => ({
              category,
              items: filtered.filter(s => s.category === category)
            }))
            .filter(g => g.items.length > 0)
            .map(({ category, items }) => (
              <div key={category} className="category-section">
                <h2 className="category-title">{category}</h2>
                <div className="scenario-grid">
                  {items.map((s, index) => (
                    <div 
                      key={s.key} 
                      className={`scenario-card modern-card ${loadingScenario === s.key ? 'loading-active' : ''}`}
                      onClick={() => handleScenarioSelect(s)}
                    >
                      <ModernScenarioImage scenario={s} index={index} />
                      <div className="card-content">
                        <h3 className="card-title">{s.label}</h3>
                        <p className="card-subtitle">{s.subtitle}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
        ) : (
          <div className="no-results">
            <Search size={48} className="no-results-icon" />
            <h3>No Scenarios Found</h3>
            <p>Your search for &quot;{search}&quot; did not match any scenarios.</p>
          </div>
        )}

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