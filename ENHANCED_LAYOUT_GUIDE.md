# Enhanced Speech Coach Layout System

## Overview
The speech coach interface has been refactored with a new flexible layout system that provides better alignment, consistent heights, and improved mobile responsiveness.

## Key Components

### 1. Speech Controls Wrapper (`.speech-controls-wrapper`)
- **Purpose**: Main container for all bottom controls and input
- **Positioning**: Fixed at bottom with sidebar-aware positioning
- **Features**: Automatic width adjustment based on sidebar state

### 2. Controls Input Container (`.controls-input-container`)
- **Purpose**: Wrapper for controls bar and input container
- **Layout**: Flexbox column with consistent gap
- **Responsive**: Auto-adjusts padding for sidebar states

### 3. Enhanced Controls Bar (`.enhanced-controls-bar`)
- **Purpose**: Replaces old `coach-controls-bar`
- **Height**: Consistent 60px (50px on mobile)
- **Layout**: Three control groups (left, center, right)
- **Features**: 
  - Hover effects with subtle animations
  - Rounded corners with modern shadow
  - Glass-morphism background

### 4. Enhanced Input Container (`.enhanced-input-container`)
- **Purpose**: Replaces old `speech-input-container`
- **Height**: Consistent 60px (matches controls bar)
- **Components**: Text field + mic button + send button
- **Features**:
  - Focus states with accent color
  - Integrated mic button with pulse animation
  - Modern input styling

## Control Groups

### Left Group (`.controls-group.left`)
- Clear button
- Future destructive actions

### Center Group (`.controls-group.center`)
- Hidden on mobile screens < 768px
- Available for additional controls

### Right Group (`.controls-group.right`)
- Progress toggle
- Future utility actions

## Action Buttons (`.action-button`)
- **Variants**: 
  - `.clear` - Red background for destructive actions
  - `.progress` - Purple background, `.active` state for toggles
- **Features**: Shimmer effect on hover, consistent sizing

## Enhanced Buttons

### Mic Button (`.enhanced-mic-button`)
- **Size**: 40px circular button
- **States**: Normal, listening (with pulse animation), disabled
- **Features**: Scale animation on hover

### Send Button (`.enhanced-send-button`)
- **Size**: 40px square button with rounded corners
- **Features**: Matches input container height, hover effects

## Mobile Optimizations

### Breakpoints
- **768px and below**: Mobile layout with adjusted padding
- **576px and below**: Stacked controls, smaller buttons
- **480px and below**: Full-width stacked layout
- **Landscape**: Optimized for low-height screens

### Mobile Features
- Automatic height adjustments for conversation area
- Repositioned progress panel and scroll button
- Simplified control groups
- Touch-friendly button sizes

## Sidebar Integration

### Sidebar Open State
- Controls positioned to right of sidebar
- Full-width utilization of remaining space
- Optimized padding for sidebar content

### Sidebar Closed State
- Centered layout with max-width constraints
- Increased padding for better readability
- Responsive breakpoints maintained

## Usage in Components

```jsx
// New layout structure
<div className="speech-controls-wrapper">
  <div className="controls-input-container">
    {/* Controls Bar */}
    <div className="enhanced-controls-bar">
      <div className="controls-group left">
        <button className="action-button clear">Clear</button>
      </div>
      <div className="controls-group center">
        {/* Future controls */}
      </div>
      <div className="controls-group right">
        <button className="action-button progress">Progress</button>
      </div>
    </div>

    {/* Input Container */}
    <div className="enhanced-input-container">
      <textarea className="enhanced-input-field" />
      <button className="enhanced-mic-button">Mic</button>
      <button className="enhanced-send-button">Send</button>
    </div>
  </div>
</div>
```

## Customization Guide

### Adjusting Heights
- Modify `height` properties in `.enhanced-controls-bar` and `.enhanced-input-container`
- Update conversation area height calculations accordingly

### Adding New Controls
- Use `.controls-group` containers for organization
- Follow `.action-button` pattern for consistency
- Add appropriate responsive behavior

### Theming
- Colors controlled by CSS custom properties
- Dark theme automatically supported
- Glass-morphism effects use backdrop-filter

## Deprecated Classes
The following classes are hidden and should not be used:
- `.coach-controls-bar`
- `.speech-input-container`
- `.input-wrapper`
- `.controls-container`
- `.integrated-mic-btn`
- `.send-btn`
- `.chat-text-field`

## Performance Notes
- Hardware acceleration enabled for smooth animations
- Efficient CSS transitions
- Minimal DOM structure
- Optimized for touch devices 