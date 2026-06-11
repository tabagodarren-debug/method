// __tests__/modules/LiveActivity.test.ts

// Mocks will be created by the factory function
let mockStart: jest.Mock;
let mockUpdate: jest.Mock;
let mockEnd: jest.Mock;

jest.mock('react-native', () => ({
  Platform: { OS: 'ios' }
}));

jest.mock('expo-modules-core', () => {
  // Create mocks in the factory so they exist when referenced
  mockStart = jest.fn().mockResolvedValue(undefined);
  mockUpdate = jest.fn().mockResolvedValue(undefined);
  mockEnd = jest.fn().mockResolvedValue(undefined);

  return {
    requireNativeModule: () => ({
      start: mockStart,
      update: mockUpdate,
      end: mockEnd,
    }),
  };
});

import { startLiveActivity, updateLiveActivity, endLiveActivity } from '../../src/modules/LiveActivity';

beforeEach(() => {
  mockStart.mockClear();
  mockUpdate.mockClear();
  mockEnd.mockClear();
});

it('startLiveActivity calls native start with params', async () => {
  await startLiveActivity({ personaName: 'Darren', rankTitle: 'The Builder', intervalMinutes: 25, projectedMerit: 30 });
  expect(mockStart).toHaveBeenCalledWith({ personaName: 'Darren', rankTitle: 'The Builder', intervalMinutes: 25, projectedMerit: 30 });
});

it('updateLiveActivity calls native update with timeRemaining', async () => {
  await updateLiveActivity(1200);
  expect(mockUpdate).toHaveBeenCalledWith(1200);
});

it('endLiveActivity calls native end with earnedMerit', async () => {
  await endLiveActivity(42);
  expect(mockEnd).toHaveBeenCalledWith(42);
});
