import React from 'react';
import PropTypes from 'prop-types';
import { useResponsiveLayout } from '../hooks/useResponsiveLayout';
import { availableScenarios } from '../data/rolePlayScenarios';
import OptimizedImage from './ui/OptimizedImage';

const RoleplayPicker = ({ onSelect }) => {
  const { viewport, gridColumns } = useResponsiveLayout();
  const scenarios = availableScenarios;

  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      padding: viewport.isMobile ? '16px' : '32px',
      boxSizing: 'border-box',
      background: '#181c2a',
      color: '#fff',
      overflow: 'auto',
    }}>
      {/* Header */}
      <div style={{
        marginBottom: viewport.isMobile ? '24px' : '32px',
        textAlign: 'center',
      }}>
        <h1 style={{
          fontSize: viewport.isMobile ? '24px' : '32px',
          fontWeight: 'bold',
          marginBottom: '16px',
        }}>
          Choose Your Scenario
        </h1>
        <p style={{
          fontSize: viewport.isMobile ? '14px' : '16px',
          color: '#94a3b8',
          maxWidth: '600px',
          margin: '0 auto',
        }}>
          Select a roleplay scenario to practice your conversation skills
        </p>
      </div>

      {/* Scenarios Grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${gridColumns}, 1fr)`,
        gap: viewport.isMobile ? '16px' : '24px',
        padding: viewport.isMobile ? '8px' : '16px',
        overflow: 'auto',
      }}>
        {scenarios.map((scenario) => (
          <button
            key={scenario.key}
            onClick={() => onSelect(scenario)}
            style={{
              display: 'flex',
              flexDirection: 'column',
              padding: viewport.isMobile ? '16px' : '24px',
              background: '#1f2437',
              border: '1px solid #23263a',
              borderRadius: '12px',
              cursor: 'pointer',
              transition: 'transform 0.2s ease, border-color 0.2s ease',
              textAlign: 'left',
              minHeight: '44px', // Accessibility touch target
            }}
            onMouseEnter={(e) => {
              e.target.style.transform = 'translateY(-4px)';
              e.target.style.borderColor = '#3b82f6';
            }}
            onMouseLeave={(e) => {
              e.target.style.transform = 'translateY(0)';
              e.target.style.borderColor = '#23263a';
            }}
          >
            <div style={{
              position: 'relative',
              width: '100%',
              paddingBottom: '56.25%', // 16:9 aspect ratio
              marginBottom: '16px',
              borderRadius: '8px',
              overflow: 'hidden',
            }}>
              <OptimizedImage
                src={scenario.image}
                alt={scenario.label}
                width={400}
                height={225}
                priority={false}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: '100%',
                  objectFit: 'cover',
                }}
              />
            </div>

            <h3 style={{
              fontSize: viewport.isMobile ? '16px' : '18px',
              fontWeight: 'bold',
              marginBottom: '8px',
              color: '#fff',
            }}>
              {scenario.label}
            </h3>

            <p style={{
              fontSize: viewport.isMobile ? '12px' : '14px',
              color: '#94a3b8',
              marginBottom: '16px',
              flex: 1,
            }}>
              {scenario.subtitle}
            </p>

            <div style={{
              display: 'flex',
              alignItems: 'center',
              fontSize: viewport.isMobile ? '12px' : '14px',
              color: '#64748b',
            }}>
              <span style={{ marginRight: '16px' }}>
                👥 {scenario.category}
              </span>
              <span>
                🎭 {scenario.userRole}
              </span>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
};

RoleplayPicker.propTypes = {
  onSelect: PropTypes.func.isRequired,
};

export default RoleplayPicker; 