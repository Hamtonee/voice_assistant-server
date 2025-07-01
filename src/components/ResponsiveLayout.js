import React, { createContext, useContext } from 'react';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import '../assets/styles/ResponsiveLayout.css';

// Create responsive context
const ResponsiveContext = createContext(null);

// Hook to use responsive context
export const useResponsive = () => {
  const context = useContext(ResponsiveContext);
  if (!context) {
    throw new Error('useResponsive must be used within ResponsiveProvider');
  }
  return context;
};

// Responsive provider component
export const ResponsiveProvider = ({ children }) => {
  const responsiveData = useResponsiveLayout();
  
  return (
    <ResponsiveContext.Provider value={responsiveData}>
      {children}
    </ResponsiveContext.Provider>
  );
};

// Layout container with responsive classes
export const ResponsiveContainer = ({ 
  children, 
  className = "", 
  maxWidth = "xl",
  padding = "default",
  centerContent = false
}) => {
  const { viewport } = useResponsive();
  
  const containerClasses = [
    'responsive-container',
    `responsive-container--${maxWidth}`,
    `responsive-container--padding-${padding}`,
    centerContent && 'responsive-container--centered',
    viewport.isMobile && 'responsive-container--mobile',
    viewport.isTablet && 'responsive-container--tablet',
    viewport.isDesktop && 'responsive-container--desktop',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={containerClasses}>
      {children}
    </div>
  );
};

// Grid system with responsive columns
export const ResponsiveGrid = ({ 
  children, 
  columns = { xs: 1, sm: 2, md: 3, lg: 4 },
  gap = "md",
  className = ""
}) => {
  const { viewport } = useResponsive();
  
  let currentColumns = columns.xs || 1;
  if (viewport.width >= 480) currentColumns = columns.sm || currentColumns;
  if (viewport.width >= 768) currentColumns = columns.md || currentColumns;
  if (viewport.width >= 1024) currentColumns = columns.lg || currentColumns;
  if (viewport.width >= 1200) currentColumns = columns.xl || currentColumns;

  const gridClasses = [
    'responsive-grid',
    `responsive-grid--gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={gridClasses}
      style={{
        '--grid-columns': currentColumns,
        gridTemplateColumns: `repeat(${currentColumns}, 1fr)`
      }}
    >
      {children}
    </div>
  );
};

// Responsive card component
export const ResponsiveCard = ({ 
  children, 
  padding = "default",
  shadow = "md",
  border = true,
  className = ""
}) => {
  const { viewport } = useResponsive();
  
  const cardClasses = [
    'responsive-card',
    `responsive-card--padding-${padding}`,
    `responsive-card--shadow-${shadow}`,
    border && 'responsive-card--border',
    viewport.isMobile && 'responsive-card--mobile',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
};

// Responsive flex container
export const ResponsiveFlex = ({ 
  children,
  direction = { xs: 'column', md: 'row' },
  align = 'stretch',
  justify = 'flex-start',
  wrap = 'wrap',
  gap = 'md',
  className = ""
}) => {
  const { viewport } = useResponsive();
  
  let currentDirection = direction.xs || 'column';
  if (viewport.width >= 768) currentDirection = direction.md || currentDirection;
  if (viewport.width >= 1024) currentDirection = direction.lg || currentDirection;

  const flexClasses = [
    'responsive-flex',
    `responsive-flex--gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className={flexClasses}
      style={{
        flexDirection: currentDirection,
        alignItems: align,
        justifyContent: justify,
        flexWrap: wrap
      }}
    >
      {children}
    </div>
  );
};

// Responsive text component with adaptive sizing
export const ResponsiveText = ({ 
  children,
  as = 'p',
  size = { xs: 'base', md: 'lg' },
  weight = 'normal',
  color = 'primary',
  align = 'left',
  className = ""
}) => {
  const { viewport } = useResponsive();
  const Component = as;
  
  let currentSize = size.xs || 'base';
  if (viewport.width >= 768) currentSize = size.md || currentSize;
  if (viewport.width >= 1024) currentSize = size.lg || currentSize;

  const textClasses = [
    'responsive-text',
    `responsive-text--size-${currentSize}`,
    `responsive-text--weight-${weight}`,
    `responsive-text--color-${color}`,
    `responsive-text--align-${align}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={textClasses}>
      {children}
    </Component>
  );
};

// Show/hide components based on breakpoints
export const ShowOn = ({ breakpoint, children }) => {
  const { viewport } = useResponsive();
  
  const shouldShow = {
    mobile: viewport.isMobile,
    tablet: viewport.isTablet,
    desktop: viewport.isDesktop,
    'mobile-up': viewport.width >= 320,
    'tablet-up': viewport.width >= 768,
    'desktop-up': viewport.width >= 1024
  }[breakpoint];

  return shouldShow ? children : null;
};

export const HideOn = ({ breakpoint, children }) => {
  const { viewport } = useResponsive();
  
  const shouldHide = {
    mobile: viewport.isMobile,
    tablet: viewport.isTablet,
    desktop: viewport.isDesktop,
    'mobile-up': viewport.width >= 320,
    'tablet-up': viewport.width >= 768,
    'desktop-up': viewport.width >= 1024
  }[breakpoint];

  return !shouldHide ? children : null;
};

// Responsive sidebar with mobile drawer behavior
export const ResponsiveSidebar = ({ 
  children, 
  isOpen, 
  onClose,
  width = "320px",
  className = ""
}) => {
  const { viewport } = useResponsive();
  
  const sidebarClasses = [
    'responsive-sidebar',
    isOpen && 'responsive-sidebar--open',
    viewport.isMobile && 'responsive-sidebar--mobile',
    className
  ].filter(Boolean).join(' ');

  // Handle backdrop click on mobile
  const handleBackdropClick = (e) => {
    if (viewport.isMobile && e.target === e.currentTarget) {
      onClose?.();
    }
  };

  return (
    <>
      {/* Mobile backdrop */}
      {viewport.isMobile && isOpen && (
        <div 
          className="responsive-sidebar-backdrop"
          onClick={handleBackdropClick}
        />
      )}
      
      {/* Sidebar */}
      <aside 
        className={sidebarClasses}
        style={{ '--sidebar-width': width }}
      >
        {children}
      </aside>
    </>
  );
};

const ResponsiveLayout = {
  ResponsiveProvider,
  ResponsiveContainer,
  ResponsiveGrid,
  ResponsiveCard,
  ResponsiveFlex,
  ResponsiveText,
  ShowOn,
  HideOn,
  ResponsiveSidebar,
  useResponsive
};

export default ResponsiveLayout; 