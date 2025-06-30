import { useState, useEffect } from 'react';

/**
 * Custom hook for responsive design using CSS media queries
 * @param {string} query - CSS media query string (e.g., '(max-width: 768px)')
 * @returns {boolean} - Whether the media query matches
 */
export const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    // Check if we're in a browser environment
    if (typeof window === 'undefined') {
      return;
    }

    const mediaQuery = window.matchMedia(query);
    
    // Set initial value
    setMatches(mediaQuery.matches);

    // Define the listener function
    const handleChange = (event) => {
      setMatches(event.matches);
    };

    // Add listener
    mediaQuery.addListener(handleChange);

    // Cleanup function
    return () => {
      mediaQuery.removeListener(handleChange);
    };
  }, [query]);

  return matches;
}; 