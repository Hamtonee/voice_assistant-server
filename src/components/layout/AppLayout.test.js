import React from 'react';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import AppLayout from './AppLayout';

// Mock the hooks
jest.mock('../hooks/useResponsiveLayout', () => ({
  useResponsiveLayout: () => ({
    viewport: { isMobile: false, isTablet: false, isDesktop: true },
    sidebarOpen: true,
    toggleSidebar: jest.fn(),
    closeSidebarOnMobile: jest.fn(),
    gridColumns: 4,
  }),
}));

const TestComponent = () => <div>Test Content</div>;

describe('AppLayout', () => {
  it('renders without crashing', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <TestComponent />
        </AppLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('SemaNami')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('renders navigation buttons', () => {
    render(
      <BrowserRouter>
        <AppLayout>
          <TestComponent />
        </AppLayout>
      </BrowserRouter>
    );
    
    expect(screen.getByText('Chat')).toBeInTheDocument();
    expect(screen.getByText('Sema')).toBeInTheDocument();
    expect(screen.getByText('Tusome')).toBeInTheDocument();
  });
}); 