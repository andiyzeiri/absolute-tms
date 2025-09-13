import { createTheme } from '@mui/material/styles';

// Apple's color palette
const appleColors = {
  // Primary colors
  systemBlue: '#007AFF',
  systemIndigo: '#5856D6',
  systemPurple: '#AF52DE',
  systemTeal: '#5AC8FA',
  systemGreen: '#34C759',
  systemYellow: '#FFCC02',
  systemOrange: '#FF9500',
  systemPink: '#FF2D92',
  systemRed: '#FF3B30',
  
  // Grayscale
  systemGray: '#8E8E93',
  systemGray2: '#AEAEB2',
  systemGray3: '#C7C7CC',
  systemGray4: '#D1D1D6',
  systemGray5: '#E5E5EA',
  systemGray6: '#F2F2F7',
  
  // Text colors (Light mode)
  label: '#000000',
  secondaryLabel: '#3C3C43',
  tertiaryLabel: '#3C3C43',
  quaternaryLabel: '#2C2C2E',
  
  // Background colors (Light mode)
  systemBackground: '#FFFFFF',
  secondarySystemBackground: '#F2F2F7',
  tertiarySystemBackground: '#FFFFFF',
  systemGroupedBackground: '#F2F2F7',
  secondarySystemGroupedBackground: '#FFFFFF',
  tertiarySystemGroupedBackground: '#F2F2F7',
  
  // Separator colors
  separator: '#3C3C43',
  opaqueSeparator: '#C6C6C8',
  
  // Fill colors
  systemFill: '#787880',
  secondarySystemFill: '#787880',
  tertiarySystemFill: '#767680',
  quaternarySystemFill: '#747480'
};

// Apple's SF Pro font family
const appleFontFamily = [
  '-apple-system',
  'BlinkMacSystemFont',
  'SF Pro Display',
  'SF Pro Icons',
  'Helvetica Neue',
  'Helvetica',
  'Arial',
  'sans-serif'
].join(',');

const appleTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: appleColors.systemBlue,
      light: '#4DC3FF',
      dark: '#0051D5',
      contrastText: '#FFFFFF',
    },
    secondary: {
      main: appleColors.systemGray,
      light: appleColors.systemGray2,
      dark: appleColors.systemGray,
      contrastText: '#FFFFFF',
    },
    error: {
      main: appleColors.systemRed,
      light: '#FF6961',
      dark: '#C70025',
    },
    warning: {
      main: appleColors.systemOrange,
      light: '#FFB74D',
      dark: '#F57C00',
    },
    info: {
      main: appleColors.systemTeal,
      light: '#81C4E8',
      dark: '#2E8B96',
    },
    success: {
      main: appleColors.systemGreen,
      light: '#81C784',
      dark: '#2E7D2E',
    },
    background: {
      default: appleColors.systemBackground,
      paper: appleColors.secondarySystemBackground,
    },
    text: {
      primary: appleColors.label,
      secondary: appleColors.secondaryLabel,
      disabled: appleColors.tertiaryLabel,
    },
    divider: appleColors.separator,
    grey: {
      50: appleColors.systemGray6,
      100: appleColors.systemGray5,
      200: appleColors.systemGray4,
      300: appleColors.systemGray3,
      400: appleColors.systemGray2,
      500: appleColors.systemGray,
      600: '#6D6D70',
      700: '#48484A',
      800: '#3A3A3C',
      900: '#2C2C2E',
    },
  },
  typography: {
    fontFamily: appleFontFamily,
    // Large Title
    h1: {
      fontFamily: appleFontFamily,
      fontSize: '34px',
      fontWeight: 700,
      lineHeight: 1.2,
      letterSpacing: '-0.5px',
      color: appleColors.label,
    },
    // Title 1
    h2: {
      fontFamily: appleFontFamily,
      fontSize: '28px',
      fontWeight: 700,
      lineHeight: 1.3,
      letterSpacing: '-0.3px',
      color: appleColors.label,
    },
    // Title 2
    h3: {
      fontFamily: appleFontFamily,
      fontSize: '22px',
      fontWeight: 700,
      lineHeight: 1.4,
      letterSpacing: '-0.2px',
      color: appleColors.label,
    },
    // Title 3
    h4: {
      fontFamily: appleFontFamily,
      fontSize: '20px',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '-0.1px',
      color: appleColors.label,
    },
    // Headline
    h5: {
      fontFamily: appleFontFamily,
      fontSize: '17px',
      fontWeight: 600,
      lineHeight: 1.4,
      letterSpacing: '0px',
      color: appleColors.label,
    },
    // Body
    h6: {
      fontFamily: appleFontFamily,
      fontSize: '17px',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0px',
      color: appleColors.label,
    },
    // Body
    body1: {
      fontFamily: appleFontFamily,
      fontSize: '17px',
      fontWeight: 400,
      lineHeight: 1.4,
      letterSpacing: '0px',
      color: appleColors.label,
    },
    // Callout
    body2: {
      fontFamily: appleFontFamily,
      fontSize: '16px',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0px',
      color: appleColors.secondaryLabel,
    },
    // Subhead
    subtitle1: {
      fontFamily: appleFontFamily,
      fontSize: '15px',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0px',
      color: appleColors.secondaryLabel,
    },
    // Footnote
    subtitle2: {
      fontFamily: appleFontFamily,
      fontSize: '13px',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0px',
      color: appleColors.secondaryLabel,
    },
    // Caption 1
    caption: {
      fontFamily: appleFontFamily,
      fontSize: '12px',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0px',
      color: appleColors.tertiaryLabel,
    },
    // Caption 2
    overline: {
      fontFamily: appleFontFamily,
      fontSize: '11px',
      fontWeight: 400,
      lineHeight: 1.3,
      letterSpacing: '0.5px',
      textTransform: 'uppercase',
      color: appleColors.tertiaryLabel,
    },
    button: {
      fontFamily: appleFontFamily,
      fontSize: '17px',
      fontWeight: 600,
      lineHeight: 1.2,
      letterSpacing: '0px',
      textTransform: 'none',
    },
  },
  shape: {
    borderRadius: 12, // Apple's modern border radius
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          textTransform: 'none',
          fontWeight: 600,
          fontSize: '17px',
          padding: '12px 24px',
          boxShadow: 'none',
          '&:hover': {
            boxShadow: 'none',
          },
          '&.MuiButton-containedPrimary': {
            backgroundColor: appleColors.systemBlue,
            '&:hover': {
              backgroundColor: '#0051D5',
            },
          },
        },
        sizeLarge: {
          padding: '16px 32px',
          fontSize: '18px',
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 12,
            backgroundColor: appleColors.systemGray6,
            border: 'none',
            '& fieldset': {
              border: 'none',
            },
            '&:hover fieldset': {
              border: 'none',
            },
            '&.Mui-focused fieldset': {
              border: `2px solid ${appleColors.systemBlue}`,
            },
          },
          '& .MuiInputLabel-root': {
            color: appleColors.secondaryLabel,
            fontSize: '17px',
          },
          '& .MuiInputBase-input': {
            fontSize: '17px',
            fontFamily: appleFontFamily,
            padding: '16px 14px',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 20,
          border: 'none',
          backgroundColor: appleColors.secondarySystemBackground,
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: appleColors.secondarySystemBackground,
          border: 'none',
        },
        elevation1: {
          boxShadow: '0 1px 10px rgba(0, 0, 0, 0.05)',
        },
        elevation2: {
          boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
        },
        elevation3: {
          boxShadow: '0 8px 30px rgba(0, 0, 0, 0.12)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: appleColors.systemBackground,
          color: appleColors.label,
          boxShadow: `0 1px 0 ${appleColors.separator}20`,
          borderBottom: `1px solid ${appleColors.separator}20`,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: appleColors.systemGroupedBackground,
          borderRight: `1px solid ${appleColors.separator}20`,
        },
      },
    },
    MuiListItem: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: appleColors.systemBlue,
            color: '#FFFFFF',
            '& .MuiListItemIcon-root': {
              color: '#FFFFFF',
            },
            '& .MuiListItemText-primary': {
              color: '#FFFFFF',
            },
            '&:hover': {
              backgroundColor: '#0051D5',
            },
          },
          '&:hover': {
            backgroundColor: appleColors.systemGray6,
          },
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          fontFamily: appleFontFamily,
          fontWeight: 500,
        },
      },
    },
    MuiAlert: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          fontFamily: appleFontFamily,
        },
      },
    },
  },
});

export default appleTheme;
export { appleColors };