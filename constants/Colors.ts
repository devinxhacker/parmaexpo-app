/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#D50099';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    text: '#1E111E',
    background: '#fff',
    tint: tintColorLight,
    icon: '#786874',
    tabIconDefault: '#786874',
    tabIconSelected: tintColorLight,
    gray: '#786874',
    danger: 'red'
  },
  dark: {
    text: '#ECEDEE',
    background: '#151718',
    tint: "#D50099",
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    gray: '#9BA1A6',
  },
};
