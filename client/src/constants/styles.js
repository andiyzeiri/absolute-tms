// Common style constants to reduce repetitive styling code

// Color palette
export const colors = {
  primary: '#4F46E5',
  primaryHover: '#3730A3',
  primaryGradient: 'linear-gradient(135deg, #4F46E5 0%, #6366F1 100%)',

  // Grays and backgrounds
  lightGray: '#F9FAFB',
  mediumGray: '#F3F4F6',
  borderGray: '#E5E7EB',
  textGray: '#6B7280',
  darkTextGray: '#374151',
  buttonGray: '#6B7280',
  buttonGrayHover: '#4B5563',

  // Status colors
  successLight: '#F0FDF4',
  success: '#059669',
  successDark: '#047857',

  // Selection colors
  selectionLight: '#EEF2FF',
  borderLight: '#D1D5DB',

  // White
  white: 'white'
};

// Common button styles
export const buttonStyles = {
  primary: {
    bgcolor: colors.primary,
    '&:hover': { bgcolor: colors.primaryHover }
  },

  secondary: {
    bgcolor: colors.buttonGray,
    '&:hover': { bgcolor: colors.buttonGrayHover }
  },

  outlined: {
    borderColor: colors.primary,
    color: colors.primary,
    '&:hover': {
      borderColor: colors.primaryHover
    }
  },

  outlinedSecondary: {
    borderColor: colors.buttonGray,
    color: colors.buttonGray
  }
};

// Common border styles
export const borderStyles = {
  light: `1px solid ${colors.borderGray}`,
  primary: `2px solid ${colors.primary}`,
  focused: {
    borderColor: colors.primary
  }
};

// Common background styles
export const backgroundStyles = {
  light: {
    bgcolor: colors.lightGray
  },

  medium: {
    bgcolor: colors.mediumGray
  },

  conditional: (condition, trueColor = colors.lightGray, falseColor = colors.white) => ({
    bgcolor: condition ? trueColor : falseColor
  }),

  selectedFile: (isSelected) => ({
    bgcolor: isSelected ? colors.successLight : colors.lightGray,
    color: isSelected ? colors.success : colors.textGray
  }),

  selectedBorder: (isSelected) => ({
    borderColor: isSelected ? colors.primary : colors.borderLight,
    color: isSelected ? colors.primary : colors.textGray
  }),

  selectedFileWithBorder: (isSelected) => ({
    borderColor: isSelected ? colors.success : colors.borderLight,
    bgcolor: isSelected ? colors.successLight : colors.lightGray,
    color: isSelected ? colors.success : colors.textGray
  }),

  selectedFileWithPrimaryBorder: (isSelected) => ({
    borderColor: isSelected ? colors.primary : colors.borderLight,
    bgcolor: isSelected ? colors.selectionLight : colors.lightGray,
    color: isSelected ? colors.primary : colors.textGray
  }),

  primaryGradient: {
    background: colors.primaryGradient
  }
};

// Common dialog styles
export const dialogStyles = {
  actions: {
    p: 3,
    borderTop: borderStyles.light,
    bgcolor: colors.lightGray
  }
};

// Common card styles
export const cardStyles = {
  bordered: {
    border: borderStyles.light,
    boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)'
  },

  content: {
    p: 3
  }
};

// Common text styles
export const textStyles = {
  caption: {
    color: colors.textGray,
    fontSize: '0.75rem'
  },

  body: {
    color: colors.darkTextGray,
    fontSize: '0.8125rem'
  },

  secondary: {
    color: colors.textGray
  },

  muted: {
    color: colors.textGray,
    mb: 1,
    fontSize: '1.125rem'
  }
};

// Common container styles
export const containerStyles = {
  section: {
    borderTop: borderStyles.light,
    bgcolor: colors.lightGray
  },

  divider: {
    borderBottom: borderStyles.light
  }
};

// Common input styles
export const inputStyles = {
  readOnly: (isReadOnly) => ({
    bgcolor: isReadOnly ? colors.lightGray : colors.white
  })
};