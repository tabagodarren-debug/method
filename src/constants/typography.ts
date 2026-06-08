import { TextStyle } from 'react-native';

export const Typography: Record<string, TextStyle> = {
  heroNumber: {
    fontSize: 82,
    fontWeight: '800',
    letterSpacing: -2.5,
    fontVariant: ['tabular-nums'],
  },
  earnAmount: {
    fontSize: 80,
    fontWeight: '800',
    letterSpacing: -2,
  },
  largeAffirmation: {
    fontSize: 44,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: -0.5,
    lineHeight: 54,
  },
  onboardingQuestion: {
    fontSize: 38,
    fontWeight: '700',
    letterSpacing: -1.5,
    lineHeight: 46,
  },
  sectionHeadline: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1.5,
  },
  secondaryFigure: {
    fontSize: 25,
    fontWeight: '500',
    letterSpacing: -0.25,
  },
  personaLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 2.4,
    textTransform: 'uppercase',
  },
  metaLabel: {
    fontSize: 12.5,
    fontWeight: '400',
    letterSpacing: 0.75,
  },
  smallAffirmation: {
    fontSize: 13,
    fontWeight: '300',
    fontStyle: 'italic',
    letterSpacing: 0.1,
  },
  buttonLabel: {
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 1.3,
    textTransform: 'uppercase',
  },
  statRowLabel: {
    fontSize: 15,
    fontWeight: '400',
  },
  statRowValue: {
    fontSize: 15,
    fontWeight: '500',
    fontVariant: ['tabular-nums'],
  },
  breakAffirmation: {
    fontSize: 26,
    fontWeight: '300',
    lineHeight: 40,
    letterSpacing: -0.3,
  },
  musicTrackName: {
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 0.18,
  },
  musicArtist: {
    fontSize: 10,
    fontWeight: '400',
  },
  chartLabel: {
    fontSize: 10,
    fontWeight: '500',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  dayLabel: {
    fontSize: 10,
    fontWeight: '400',
  },
  stepIndicator: {
    fontSize: 12,
    fontWeight: '400',
    letterSpacing: 0.8,
  },
};
