/**
 * Tests for useFeatureFlag Hook
 * Validates React hook functionality for feature flags
 */

import { renderHook, act } from '@testing-library/react';
import { useFeatureFlag, useFeatureFlags, withFeatureFlag } from '../useFeatureFlag';
import { featureFlagService } from '../../services/FeatureFlagService';
import React from 'react';

// Mock the feature flag service
jest.mock('../../services/FeatureFlagService', () => ({
  featureFlagService: {
    isEnabled: jest.fn(),
    getFlag: jest.fn(),
  }
}));

const mockFeatureFlagService = featureFlagService as jest.Mocked<typeof featureFlagService>;

describe('useFeatureFlag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return initial loading state', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result } = renderHook(() => useFeatureFlag('test-flag'));

    expect(result.current.loading).toBe(true);
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.flag).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should return enabled state for enabled flag', async () => {
    const mockFlag = {
      name: 'test-flag',
      enabled: true,
      rolloutPercentage: 100,
      metadata: {
        description: 'Test flag',
        owner: 'test',
        createdAt: new Date(),
        lastModified: new Date()
      }
    };

    mockFeatureFlagService.isEnabled.mockReturnValue(true);
    mockFeatureFlagService.getFlag.mockReturnValue(mockFlag);

    const { result, waitForNextUpdate } = renderHook(() => useFeatureFlag('test-flag'));

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isEnabled).toBe(true);
    expect(result.current.flag).toEqual(mockFlag);
    expect(result.current.error).toBe(null);
  });

  it('should return disabled state for disabled flag', async () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result, waitForNextUpdate } = renderHook(() => useFeatureFlag('test-flag'));

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.flag).toBe(null);
    expect(result.current.error).toBe(null);
  });

  it('should handle errors gracefully', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation(() => {
      throw new Error('Service error');
    });

    const { result, waitForNextUpdate } = renderHook(() => useFeatureFlag('test-flag'));

    await waitForNextUpdate();

    expect(result.current.loading).toBe(false);
    expect(result.current.isEnabled).toBe(false);
    expect(result.current.flag).toBe(null);
    expect(result.current.error).toBeInstanceOf(Error);
    expect(result.current.error?.message).toBe('Service error');
  });

  it('should refresh flag state when refresh is called', async () => {
    mockFeatureFlagService.isEnabled.mockReturnValueOnce(false).mockReturnValueOnce(true);
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result, waitForNextUpdate } = renderHook(() => useFeatureFlag('test-flag'));

    await waitForNextUpdate();
    expect(result.current.isEnabled).toBe(false);

    act(() => {
      result.current.refresh();
    });

    await waitForNextUpdate();
    expect(result.current.isEnabled).toBe(true);
  });

  it('should update when flag name changes', async () => {
    mockFeatureFlagService.isEnabled.mockImplementation((flagName) => flagName === 'flag2');
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result, rerender, waitForNextUpdate } = renderHook(
      ({ flagName }) => useFeatureFlag(flagName),
      { initialProps: { flagName: 'flag1' } }
    );

    await waitForNextUpdate();
    expect(result.current.isEnabled).toBe(false);

    rerender({ flagName: 'flag2' });
    await waitForNextUpdate();
    expect(result.current.isEnabled).toBe(true);
  });
});

describe('useFeatureFlags', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should return status for multiple flags', () => {
    mockFeatureFlagService.isEnabled.mockImplementation((flagName) => {
      return flagName === 'flag1';
    });
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result } = renderHook(() => useFeatureFlags(['flag1', 'flag2']));

    expect(result.current.flag1.isEnabled).toBe(true);
    expect(result.current.flag2.isEnabled).toBe(false);
    expect(result.current.flag1.loading).toBe(false);
    expect(result.current.flag2.loading).toBe(false);
  });

  it('should handle errors for individual flags', () => {
    mockFeatureFlagService.isEnabled.mockImplementation((flagName) => {
      if (flagName === 'error-flag') {
        throw new Error('Flag error');
      }
      return false;
    });
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result } = renderHook(() => useFeatureFlags(['good-flag', 'error-flag']));

    expect(result.current['good-flag'].isEnabled).toBe(false);
    expect(result.current['good-flag'].error).toBe(null);
    expect(result.current['error-flag'].isEnabled).toBe(false);
    expect(result.current['error-flag'].error).toBeInstanceOf(Error);
  });

  it('should update when flag names change', () => {
    mockFeatureFlagService.isEnabled.mockImplementation((flagName) => flagName === 'flag3');
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const { result, rerender } = renderHook(
      ({ flagNames }) => useFeatureFlags(flagNames),
      { initialProps: { flagNames: ['flag1', 'flag2'] } }
    );

    expect(result.current.flag1.isEnabled).toBe(false);
    expect(result.current.flag2.isEnabled).toBe(false);
    expect(result.current.flag3).toBeUndefined();

    rerender({ flagNames: ['flag2', 'flag3'] });

    expect(result.current.flag1).toBeUndefined();
    expect(result.current.flag2.isEnabled).toBe(false);
    expect(result.current.flag3.isEnabled).toBe(true);
  });
});

describe('withFeatureFlag', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render component when flag is enabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(true);
    mockFeatureFlagService.getFlag.mockReturnValue({
      name: 'test-flag',
      enabled: true,
      rolloutPercentage: 100,
      metadata: {
        description: 'Test flag',
        owner: 'test',
        createdAt: new Date(),
        lastModified: new Date()
      }
    });

    const TestComponent = () => React.createElement('div', null, 'Test Component');
    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    const { container } = require('@testing-library/react').render(
      React.createElement(WrappedComponent)
    );

    expect(container.textContent).toBe('Test Component');
  });

  it('should not render component when flag is disabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const TestComponent = () => React.createElement('div', null, 'Test Component');
    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    const { container } = require('@testing-library/react').render(
      React.createElement(WrappedComponent)
    );

    expect(container.textContent).toBe('');
  });

  it('should render fallback component when flag is disabled', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(false);
    mockFeatureFlagService.getFlag.mockReturnValue(null);

    const TestComponent = () => React.createElement('div', null, 'Test Component');
    const FallbackComponent = () => React.createElement('div', null, 'Fallback Component');
    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag', FallbackComponent);

    const { container } = require('@testing-library/react').render(
      React.createElement(WrappedComponent)
    );

    expect(container.textContent).toBe('Fallback Component');
  });

  it('should pass props to wrapped component', () => {
    mockFeatureFlagService.isEnabled.mockReturnValue(true);
    mockFeatureFlagService.getFlag.mockReturnValue({
      name: 'test-flag',
      enabled: true,
      rolloutPercentage: 100,
      metadata: {
        description: 'Test flag',
        owner: 'test',
        createdAt: new Date(),
        lastModified: new Date()
      }
    });

    const TestComponent = ({ message }: { message: string }) => 
      React.createElement('div', null, message);
    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    const { container } = require('@testing-library/react').render(
      React.createElement(WrappedComponent, { message: 'Hello World' })
    );

    expect(container.textContent).toBe('Hello World');
  });

  it('should show nothing during loading', () => {
    mockFeatureFlagService.isEnabled.mockImplementation(() => {
      // Simulate loading state by throwing and then resolving
      throw new Error('Loading');
    });

    const TestComponent = () => React.createElement('div', null, 'Test Component');
    const WrappedComponent = withFeatureFlag(TestComponent, 'test-flag');

    const { container } = require('@testing-library/react').render(
      React.createElement(WrappedComponent)
    );

    expect(container.textContent).toBe('');
  });
});