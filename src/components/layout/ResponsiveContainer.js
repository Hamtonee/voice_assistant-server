import React from 'react';
import PropTypes from 'prop-types';
import './ResponsiveContainer.css';

/**
 * ResponsiveContainer - Provides consistent responsive layout patterns
 */
const ResponsiveContainer = ({
  children,
  variant = 'default',
  maxWidth = 'xl',
  padding = 'default',
  className = '',
  as = 'div',
  ...props
}) => {
  const Component = as;
  
  const classNames = [
    'responsive-container',
    `responsive-container--${variant}`,
    `responsive-container--max-${maxWidth}`,
    `responsive-container--padding-${padding}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <Component className={classNames} {...props}>
      {children}
    </Component>
  );
};

ResponsiveContainer.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf(['default', 'full-width', 'narrow', 'wide', 'sidebar']),
  maxWidth: PropTypes.oneOf(['sm', 'md', 'lg', 'xl', '2xl', 'full']),
  padding: PropTypes.oneOf(['none', 'sm', 'default', 'lg', 'xl']),
  className: PropTypes.string,
  as: PropTypes.string
};

/**
 * Grid component for consistent grid layouts
 */
export const Grid = ({
  children,
  columns = 'auto',
  gap = 'md',
  className = '',
  responsive = true,
  ...props
}) => {
  const classNames = [
    'responsive-grid',
    `responsive-grid--gap-${gap}`,
    responsive ? 'responsive-grid--responsive' : '',
    className
  ].filter(Boolean).join(' ');

  const style = {
    '--grid-columns': typeof columns === 'number' ? `repeat(${columns}, 1fr)` : columns,
    ...props.style
  };

  return (
    <div className={classNames} style={style} {...props}>
      {children}
    </div>
  );
};

Grid.propTypes = {
  children: PropTypes.node.isRequired,
  columns: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  gap: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string,
  responsive: PropTypes.bool
};

/**
 * Flex component for consistent flex layouts
 */
export const Flex = ({
  children,
  direction = 'row',
  align = 'stretch',
  justify = 'flex-start',
  wrap = 'nowrap',
  gap = 'md',
  className = '',
  ...props
}) => {
  const classNames = [
    'responsive-flex',
    `responsive-flex--direction-${direction}`,
    `responsive-flex--align-${align}`,
    `responsive-flex--justify-${justify}`,
    `responsive-flex--wrap-${wrap}`,
    `responsive-flex--gap-${gap}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={classNames} {...props}>
      {children}
    </div>
  );
};

Flex.propTypes = {
  children: PropTypes.node.isRequired,
  direction: PropTypes.oneOf(['row', 'column', 'row-reverse', 'column-reverse']),
  align: PropTypes.oneOf(['stretch', 'flex-start', 'flex-end', 'center', 'baseline']),
  justify: PropTypes.oneOf(['flex-start', 'flex-end', 'center', 'space-between', 'space-around', 'space-evenly']),
  wrap: PropTypes.oneOf(['nowrap', 'wrap', 'wrap-reverse']),
  gap: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string
};

/**
 * Stack component for vertical layouts
 */
export const Stack = ({
  children,
  spacing = 'md',
  className = '',
  ...props
}) => {
  return (
    <Flex
      direction="column"
      gap={spacing}
      className={`responsive-stack ${className}`}
      {...props}
    >
      {children}
    </Flex>
  );
};

Stack.propTypes = {
  children: PropTypes.node.isRequired,
  spacing: PropTypes.oneOf(['none', 'xs', 'sm', 'md', 'lg', 'xl']),
  className: PropTypes.string
};

/**
 * Center component for centered layouts
 */
export const Center = ({
  children,
  className = '',
  ...props
}) => {
  return (
    <Flex
      align="center"
      justify="center"
      className={`responsive-center ${className}`}
      {...props}
    >
      {children}
    </Flex>
  );
};

Center.propTypes = {
  children: PropTypes.node.isRequired,
  className: PropTypes.string
};

export default ResponsiveContainer; 