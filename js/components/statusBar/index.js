/**
 * @flow
 */
import React from 'react';
import { Platform, StatusBar as OriginStatusBar } from 'react-native';

export const BAR_STYLE = {
  light: 'light',
  dark: 'dark',
};

export const lightProps = {
  barStyle: 'light-content',
  ...Platform.select({
    ios: {},
    android: {
      translucent: true,
      backgroundColor: 'transparent',
    },
  }),
};

export const darkProps = {
  barStyle: 'dark-content',
  ...Platform.select({
    ios: {},
    android: {
      translucent: true,
      backgroundColor: 'transparent',
    },
  }),
};

export default (props: { style: 'light' | 'dark' } = { style: 'light' }) => (
  <OriginStatusBar {...(props.style === BAR_STYLE.light ? lightProps : darkProps)} />
);
