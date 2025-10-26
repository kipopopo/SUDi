# SUDi Project Testing Documentation

This document tracks the unit and integration tests implemented in the SUDi project.

## Frontend Unit Tests

### `components/common/ThemeToggle.tsx`

*   **Test File:** `components/common/ThemeToggle.test.tsx`
*   **Status:** ✅ Passed

**Functions Tested:**

1.  **Component Renders:** Verifies that the `ThemeToggle` component renders without crashing.
2.  **`toggleTheme` Function Call:** Confirms that the `toggleTheme` function (from the `useTheme` context) is called exactly once when the user clicks the toggle button.
