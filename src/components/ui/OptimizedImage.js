import React, { useState } from 'react';
import PropTypes from 'prop-types';

const OptimizedImage = ({
  src,
  alt,
  className,
  width,
  height,
  priority = false,
  sizes = '100vw',
  objectFit = 'cover',
  placeholder = 'blur',
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  // Generate srcSet for different viewport widths
  const generateSrcSet = (imagePath) => {
    const widths = [480, 768, 1200];
    const extension = imagePath.split('.').pop();
    const basePath = imagePath.slice(0, -(extension.length + 1));
    
    return widths
      .map(w => `${basePath}-${w}.webp ${w}w`)
      .join(', ');
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Handle image load error
  const handleError = () => {
    setError(true);
    console.error(`Failed to load image: ${src}`);
  };

  return (
    <div 
      className={`optimized-image-container ${className || ''}`}
      style={{ 
        position: 'relative',
        width: width || '100%',
        height: height || 'auto',
        overflow: 'hidden'
      }}
    >
      {!isLoaded && placeholder === 'blur' && (
        <div 
          className="image-placeholder"
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: '#f0f0f0',
            filter: 'blur(10px)',
          }}
        />
      )}
      
      <img
        src={src}
        srcSet={generateSrcSet(src)}
        sizes={sizes}
        alt={alt}
        loading={priority ? 'eager' : 'lazy'}
        onLoad={handleLoad}
        onError={handleError}
        style={{
          width: '100%',
          height: '100%',
          objectFit,
          opacity: isLoaded ? 1 : 0,
          transition: 'opacity 0.3s ease-in-out',
        }}
      />

      {error && (
        <div 
          className="error-placeholder"
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            color: '#ff4444',
          }}
        >
          Failed to load image
        </div>
      )}
    </div>
  );
};

OptimizedImage.propTypes = {
  src: PropTypes.string.isRequired,
  alt: PropTypes.string.isRequired,
  className: PropTypes.string,
  width: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  height: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  priority: PropTypes.bool,
  sizes: PropTypes.string,
  objectFit: PropTypes.oneOf(['contain', 'cover', 'fill', 'none', 'scale-down']),
  placeholder: PropTypes.oneOf(['blur', 'none']),
};

export default OptimizedImage; 