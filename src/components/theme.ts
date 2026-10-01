import { Platform } from 'react-native';

export const colors = {
  ivory: '#F8F1E7',
  paper: '#FFFDF8',
  card: '#FFFFFF',
  ink: '#2E251F',
  muted: '#7A6D64',
  line: '#E4D8CC',
  terracotta: '#A64F3C',
  terracottaDark: '#803728',
  sage: '#6F7F62',
  gold: '#B58A44',
  danger: '#B44135',
};

export const typography = {
  heading: Platform.select({ ios: 'Georgia', android: 'serif', default: 'Georgia' }),
};

export const spacing = {
  screen: 18,
};
