export type ThemeId = 'light' | 'dark';

export type ThemeColors = {
  background: string;
  backgroundAlt: string;
  surface: string;
  surfaceGlass: string;
  primary: string;
  primaryMid: string;
  accent: string;
  primaryBright: string;
  textPrimary: string;
  textSecondary: string;
  textMuted: string;
  textOnDark: string;
  textOnDarkSub: string;
  textOnDarkMute: string;
  border: string;
  borderDark: string;
  glass: string;
  glassMid: string;
  glassBorder: string;
  gradientDark: string;
  gradientMid: string;
  gradientLight: string;
  success: string;
  warning: string;
  error: string;
  accentColors: string[];
};

const ACCENT_COLORS = [
  '#5CE8A6', '#7CB4FF', '#FF7BAC', '#FFB952',
  '#B39DFB', '#5CD8F0', '#FFD166', '#FF9E77',
];

export const themes: Record<ThemeId, ThemeColors> = {
  light: {
    background:    '#F5F5F7',
    backgroundAlt: '#FFFFFF',
    surface:       '#FFFFFF',
    surfaceGlass:  'rgba(255,255,255,0.88)',
    primary:       '#6B3A8E',
    primaryMid:    '#8B52B8',
    accent:        '#A870CC',
    primaryBright: '#7B45A8',
    textPrimary:   '#1A1A2E',
    textSecondary: '#4A4060',
    textMuted:     '#9090B0',
    textOnDark:    '#1A1A2E',
    textOnDarkSub: '#4A4060',
    textOnDarkMute:'#9090B0',
    border:        'rgba(0,0,0,0.09)',
    borderDark:    'rgba(0,0,0,0.09)',
    glass:         'rgba(255,255,255,0.88)',
    glassMid:      'rgba(255,255,255,0.65)',
    glassBorder:   'rgba(0,0,0,0.07)',
    gradientDark:  '#EBE8F5',
    gradientMid:   '#F3F1FA',
    gradientLight: '#FAFAFF',
    success: '#3DAF72', warning: '#F5A623', error: '#E05C6E',
    accentColors: ACCENT_COLORS,
  },

  dark: {
    background:    '#0D0D1A',
    backgroundAlt: '#13131F',
    surface:       '#1A1A2C',
    surfaceGlass:  'rgba(255,255,255,0.06)',
    primary:       '#A870CC',
    primaryMid:    '#B880DC',
    accent:        '#C890EE',
    primaryBright: '#B070D8',
    textPrimary:   '#EDE8FF',
    textSecondary: '#B0A8D8',
    textMuted:     '#6860A0',
    textOnDark:    '#EDE8FF',
    textOnDarkSub: '#B0A8D8',
    textOnDarkMute:'#6860A0',
    border:        'rgba(255,255,255,0.09)',
    borderDark:    'rgba(255,255,255,0.09)',
    glass:         'rgba(255,255,255,0.05)',
    glassMid:      'rgba(255,255,255,0.03)',
    glassBorder:   'rgba(255,255,255,0.12)',
    gradientDark:  '#070710',
    gradientMid:   '#0D0D1A',
    gradientLight: '#13131F',
    success: '#3DAF72', warning: '#F5A623', error: '#E05C6E',
    accentColors: ACCENT_COLORS,
  },

};
