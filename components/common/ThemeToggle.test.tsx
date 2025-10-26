import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { ThemeToggle } from './ThemeToggle';
import { useTheme } from '../../contexts/ThemeContext';

// Mock the useTheme hook
vi.mock('../../contexts/ThemeContext', () => ({
  useTheme: vi.fn(),
}));

describe('ThemeToggle', () => {

  it('renders the button and calls toggleTheme on click', () => {
    const toggleThemeMock = vi.fn();
    // Provide the mock implementation for this specific test
    (useTheme as jest.Mock).mockReturnValue({
      theme: 'dark',
      toggleTheme: toggleThemeMock,
    });

    render(<ThemeToggle />);

    // Find the button by its accessible name (aria-label)
    const toggleButton = screen.getByRole('button', { name: /Switch to (light|dark) mode/i });
    expect(toggleButton).toBeInTheDocument();

    // Simulate a user click
    fireEvent.click(toggleButton);

    // Assert that the toggleTheme function was called
    expect(toggleThemeMock).toHaveBeenCalledTimes(1);
  });

});
