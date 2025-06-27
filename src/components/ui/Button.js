import React, { forwardRef } from 'react';
import PropTypes from 'prop-types';
import { Spinner } from './LoadingStates';
import './Button.css';

/**
 * Button component with consistent styling and behavior
 */
const Button = forwardRef(({
  children,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  icon = null,
  iconPosition = 'left',
  fullWidth = false,
  className = '',
  loadingText,
  type = 'button',
  ...props
}, ref) => {
  const isDisabled = disabled || loading;
  
  const classNames = [
    'btn',
    `btn--${variant}`,
    `btn--${size}`,
    fullWidth ? 'btn--full-width' : '',
    loading ? 'btn--loading' : '',
    isDisabled ? 'btn--disabled' : '',
    className
  ].filter(Boolean).join(' ');

  const renderContent = () => {
    if (loading) {
      return (
        <>
          <Spinner size="small" color="white" />
          <span>{loadingText || 'Loading...'}</span>
        </>
      );
    }

    if (!icon) {
      return children;
    }

    return iconPosition === 'left' ? (
      <>
        {icon}
        <span>{children}</span>
      </>
    ) : (
      <>
        <span>{children}</span>
        {icon}
      </>
    );
  };

  return (
    <button
      ref={ref}
      type={type}
      className={classNames}
      disabled={isDisabled}
      {...props}
    >
      {renderContent()}
    </button>
  );
});

Button.displayName = 'Button';

Button.propTypes = {
  children: PropTypes.node.isRequired,
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'
  ]),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  loading: PropTypes.bool,
  disabled: PropTypes.bool,
  icon: PropTypes.node,
  iconPosition: PropTypes.oneOf(['left', 'right']),
  fullWidth: PropTypes.bool,
  className: PropTypes.string,
  loadingText: PropTypes.string,
  type: PropTypes.oneOf(['button', 'submit', 'reset'])
};

/**
 * IconButton - Button with only an icon
 */
export const IconButton = forwardRef(({
  children,
  'aria-label': ariaLabel,
  size = 'medium',
  variant = 'ghost',
  className = '',
  ...props
}, ref) => {
  return (
    <Button
      ref={ref}
      variant={variant}
      size={size}
      className={`btn--icon-only ${className}`}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </Button>
  );
});

IconButton.displayName = 'IconButton';

IconButton.propTypes = {
  children: PropTypes.node.isRequired,
  'aria-label': PropTypes.string.isRequired,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'
  ]),
  className: PropTypes.string
};

/**
 * ButtonGroup - Group related buttons
 */
export const ButtonGroup = ({
  children,
  orientation = 'horizontal',
  size = 'medium',
  variant = 'outline',
  className = '',
  ...props
}) => {
  const classNames = [
    'btn-group',
    `btn-group--${orientation}`,
    `btn-group--${size}`,
    `btn-group--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div
      className={classNames}
      role="group"
      {...props}
    >
      {children}
    </div>
  );
};

ButtonGroup.propTypes = {
  children: PropTypes.node.isRequired,
  orientation: PropTypes.oneOf(['horizontal', 'vertical']),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  variant: PropTypes.oneOf([
    'primary', 'secondary', 'outline', 'ghost', 'danger', 'success', 'warning'
  ]),
  className: PropTypes.string
};

/**
 * ToggleButton - Button that can be toggled on/off
 */
export const ToggleButton = forwardRef(({
  children,
  pressed = false,
  onToggle,
  className = '',
  ...props
}, ref) => {
  const handleClick = (e) => {
    onToggle?.(!pressed, e);
    props.onClick?.(e);
  };

  return (
    <Button
      ref={ref}
      variant={pressed ? 'primary' : 'outline'}
      className={`btn--toggle ${pressed ? 'btn--toggle-pressed' : ''} ${className}`}
      aria-pressed={pressed}
      onClick={handleClick}
      {...props}
    >
      {children}
    </Button>
  );
});

ToggleButton.displayName = 'ToggleButton';

ToggleButton.propTypes = {
  children: PropTypes.node.isRequired,
  pressed: PropTypes.bool,
  onToggle: PropTypes.func,
  className: PropTypes.string,
  onClick: PropTypes.func
};

export default Button; 