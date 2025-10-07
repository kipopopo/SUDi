import React from 'react';
import { render, screen, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import App from './App';
import { Dashboard } from './components/Dashboard';
import { Header } from './components/Header';

// Mock child components
vi.mock('./components/Dashboard', () => ({
  Dashboard: vi.fn(() => <div data-testid="dashboard-component">Dashboard</div>),
}));
vi.mock('./components/Header', () => ({
  // Mock the header to capture its props, like toggleTheme
  Header: vi.fn(() => <div>Header</div>),
}));

describe('App Component', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();

    // Mock sessionStorage to simulate an authenticated user
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => 'true'),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  test('should not re-render memoized components on unrelated state changes', async () => {
    render(<App />);

    // Wait for the component to stabilize after initial renders
    await screen.findByTestId('dashboard-component');

    // Capture the initial render count after mounting.
    // This makes the test resilient to changes in initial render count (e.g., due to StrictMode).
    const initialRenderCount = vi.mocked(Dashboard).mock.calls.length;

    // Get the toggleTheme function passed to the Header component
    const lastHeaderCall = vi.mocked(Header).mock.calls.length - 1;
    const { toggleTheme } = vi.mocked(Header).mock.calls[lastHeaderCall][0];

    // Act to wrap the state update
    act(() => {
      toggleTheme();
    });

    // Verify that changing the theme did NOT cause the Dashboard to re-render.
    // The total number of calls should be the same as the initial render count.
    expect(vi.mocked(Dashboard).mock.calls.length).toBe(initialRenderCount);
  });
});