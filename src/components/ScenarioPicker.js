// src/components/ScenarioPicker.js - MODERN IMAGE LOADING WITHOUT BLINK EFFECT
import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Search, X, Clock, TrendingUp, Filter } from 'lucide-react';
import '../assets/styles/ScenarioPicker.css';
import LottieLoader from './LottieLoader';
import { useThemeChange } from '../hooks';

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

// Debounce utility
const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Enhanced Search Bar Component
const EnhancedSearchBar = ({ 
  search, 
  onSearchChange, 
  onClearSearch, 
  scenarios, 
  disabled,
  onSuggestionSelect
}) => {
  const [isFocused, setIsFocused] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [recentSearches, setRecentSearches] = useState([]);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef(null);
  const suggestionsRef = useRef(null);

  // Load recent searches from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('scenarioSearchHistory');
    if (stored) {
      try {
        setRecentSearches(JSON.parse(stored));
      } catch (e) {
        // Failed to parse search history, ignore
      }
    }
  }, []);

  // Generate search suggestions
  const suggestions = useMemo(() => {
    if (!search || search.length < 2) return [];
    
    const searchLower = search.toLowerCase();
    const allSuggestions = new Set();
    
    // Add matching scenario names
    scenarios.forEach(scenario => {
      if (scenario.label.toLowerCase().includes(searchLower)) {
        allSuggestions.add(scenario.label);
      }
      // Add matching categories
      if (scenario.category.toLowerCase().includes(searchLower)) {
        allSuggestions.add(scenario.category);
      }
      // Add matching keywords from subtitles
      if (scenario.subtitle && scenario.subtitle.toLowerCase().includes(searchLower)) {
        const words = scenario.subtitle.split(' ').filter(word => 
          word.toLowerCase().includes(searchLower) && word.length > 2
        );
        words.forEach(word => allSuggestions.add(word));
      }
    });
    
    return Array.from(allSuggestions).slice(0, 5);
  }, [search, scenarios]);

  // Popular categories
  const popularCategories = useMemo(() => {
    const categoryCount = {};
    scenarios.forEach(scenario => {
      categoryCount[scenario.category] = (categoryCount[scenario.category] || 0) + 1;
    });
    return Object.entries(categoryCount)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([category]) => category);
  }, [scenarios]);

  // Handle input focus
  const handleFocus = () => {
    setIsFocused(true);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  // Handle input blur
  const handleBlur = () => {
    // Delay hiding suggestions to allow for clicks
    setTimeout(() => {
      setIsFocused(false);
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    }, 200);
  };

  // Handle search change
  const handleSearchChange = (e) => {
    const value = e.target.value;
    onSearchChange(value);
    setShowSuggestions(true);
    setSelectedSuggestionIndex(-1);
  };

  // Handle suggestion selection
  const handleSuggestionClick = (suggestion) => {
    onSearchChange(suggestion);
    setShowSuggestions(false);
    
    // Add to recent searches
    const newRecentSearches = [
      suggestion,
      ...recentSearches.filter(item => item !== suggestion)
    ].slice(0, 5);
    
    setRecentSearches(newRecentSearches);
    localStorage.setItem('scenarioSearchHistory', JSON.stringify(newRecentSearches));
    
    if (onSuggestionSelect) {
      onSuggestionSelect(suggestion);
    }
  };

  // Handle keyboard navigation
  const handleKeyDown = (e) => {
    if (!showSuggestions) return;
    
    const allSuggestions = [
      ...suggestions,
      ...recentSearches.filter(item => !suggestions.includes(item)),
      ...popularCategories.filter(cat => !suggestions.includes(cat))
    ];
    
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev < allSuggestions.length - 1 ? prev + 1 : 0
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : allSuggestions.length - 1
        );
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedSuggestionIndex >= 0) {
          handleSuggestionClick(allSuggestions[selectedSuggestionIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        setSelectedSuggestionIndex(-1);
        inputRef.current?.blur();
        break;
    }
  };

  // Clear search
  const handleClearSearch = () => {
    onClearSearch();
    setShowSuggestions(false);
    setSelectedSuggestionIndex(-1);
    inputRef.current?.focus();
  };

  return (
    <div className="enhanced-search-container">
      <div className={`enhanced-search-wrapper ${isFocused ? 'focused' : ''}`}>
        <Search size={20} className="enhanced-search-icon" />
        <input
          ref={inputRef}
          type="text"
          className="enhanced-search-input"
          placeholder="Search scenarios, categories, or keywords..."
          value={search}
          onChange={handleSearchChange}
          onFocus={handleFocus}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          autoComplete="off"
          spellCheck="false"
        />
        {search && (
          <button
            className="enhanced-clear-search"
            onClick={handleClearSearch}
            disabled={disabled}
            aria-label="Clear search"
          >
            <X size={16} />
          </button>
        )}
        <div className="search-actions">
          <button
            className="search-filter-btn"
            disabled={disabled}
            aria-label="Filter options"
          >
            <Filter size={16} />
          </button>
        </div>
      </div>

      {/* Search Suggestions Dropdown */}
      {showSuggestions && (isFocused || search) && (
        <div 
          ref={suggestionsRef}
          className="search-suggestions-dropdown"
          role="listbox"
          aria-label="Search suggestions"
        >
          {/* Current Search Suggestions */}
          {suggestions.length > 0 && (
            <div className="suggestion-group">
              <div className="suggestion-group-header">
                <Search size={14} />
                <span>Suggestions</span>
              </div>
              {suggestions.map((suggestion, index) => (
                <button
                  key={`suggestion-${index}`}
                  className={`suggestion-item ${
                    selectedSuggestionIndex === index ? 'selected' : ''
                  }`}
                  onClick={() => handleSuggestionClick(suggestion)}
                  role="option"
                  aria-selected={selectedSuggestionIndex === index}
                >
                  <Search size={14} />
                  <span>{suggestion}</span>
                </button>
              ))}
            </div>
          )}

          {/* Recent Searches */}
          {recentSearches.length > 0 && !search && (
            <div className="suggestion-group">
              <div className="suggestion-group-header">
                <Clock size={14} />
                <span>Recent</span>
              </div>
              {recentSearches.slice(0, 3).map((item, index) => (
                <button
                  key={`recent-${index}`}
                  className={`suggestion-item ${
                    selectedSuggestionIndex === suggestions.length + index ? 'selected' : ''
                  }`}
                  onClick={() => handleSuggestionClick(item)}
                  role="option"
                  aria-selected={selectedSuggestionIndex === suggestions.length + index}
                >
                  <Clock size={14} />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}

          {/* Popular Categories */}
          {popularCategories.length > 0 && !search && (
            <div className="suggestion-group">
              <div className="suggestion-group-header">
                <TrendingUp size={14} />
                <span>Popular</span>
              </div>
              {popularCategories.map((category, index) => (
                <button
                  key={`popular-${index}`}
                  className={`suggestion-item ${
                    selectedSuggestionIndex === suggestions.length + recentSearches.length + index ? 'selected' : ''
                  }`}
                  onClick={() => handleSuggestionClick(category)}
                  role="option"
                  aria-selected={selectedSuggestionIndex === suggestions.length + recentSearches.length + index}
                >
                  <TrendingUp size={14} />
                  <span>{category}</span>
                </button>
              ))}
            </div>
          )}

          {/* No suggestions message */}
          {suggestions.length === 0 && search && search.length >= 2 && (
            <div className="no-suggestions">
              <Search size={14} />
              <span>No suggestions found for &quot;{search}&quot;</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Modern Image Component with Intersection Observer and Progressive Loading
const ModernScenarioImage = React.memo(({ scenario, index }) => {
  const [imageState, setImageState] = useState('loading'); // loading, loaded, error
  const [isVisible, setIsVisible] = useState(false);
  const imageRef = useRef(null);
  const observerRef = useRef(null);

  // Force re-render on theme change
  useThemeChange();

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

  // Debounced search for better performance
  const debouncedSearch = useDebounce(search, 300);

  // Force re-render on theme change to ensure proper styling
  useThemeChange();

  // Initialize WebP support detection
  useEffect(() => {
    initializeWebPSupport();
  }, []);

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

  // Filter by search term using debounced search
  const filtered = Array.isArray(scenarios) ? scenarios.filter(s => {
    const term = debouncedSearch.toLowerCase();
    return (
      s.label.toLowerCase().includes(term) ||
      (s.subtitle || '').toLowerCase().includes(term) ||
      s.category.toLowerCase().includes(term)
    );
  }) : [];

  // FIXED: Scenario selection handler
  const handleScenarioSelect = async (scenario) => {
    if (loadingScenario) return; // Prevent double-clicks
    
    // Show loading for this specific scenario
    setLoadingScenario(scenario.key);
    
    try {
      // Add a small delay to show the loading state
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Call the onSelect callback with the full scenario object
      if (typeof onSelect === 'function') {
        onSelect(scenario);
      }
    } catch (error) {
      // Reset loading state on error
      setLoadingScenario(null);
    }
  };

  // Handle search changes
  const handleSearchChange = (value) => {
    setSearch(value);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setSearch('');
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

        {/* Enhanced Search Section */}
        <EnhancedSearchBar
          search={search}
          onSearchChange={handleSearchChange}
          onClearSearch={handleClearSearch}
          scenarios={scenarios}
          disabled={!!loadingScenario}
        />

        {/* Results count */}
        {debouncedSearch && (
          <div className="search-results-info">
            {filtered.length === 0 ? (
              <span>No scenarios found for &quot;{debouncedSearch}&quot;</span>
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
            <p>Your search for &quot;{debouncedSearch}&quot; did not match any scenarios.</p>
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