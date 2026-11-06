// ----------------------------------------------------------------------

export default function CssBaseline() {
  return {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          '--rn-bg': '#F8FAFC',
          '--rn-surface': '#FFFFFF',
          '--rn-surface-subtle': '#F1F5F9',
          '--rn-text-primary': '#0F172A',
          '--rn-text-secondary': '#475569',
          '--rn-primary': '#D91B42',
          '--rn-primary-hover': '#B81436',
          '--rn-primary-soft': '#FFE4E8',
          '--rn-teal': '#0F766E',
          '--rn-teal-soft': '#CCFBF1',
          '--rn-border': '#E2E8F0',
          '--rn-border-strong': '#CBD5E1',
          '--rn-focus-ring': '#0284C7',
          '--rn-radius-card': '16px',
          '--rn-radius-pill': '999px',
          '--rn-shadow-sm': '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
          '--rn-shadow-md': '0 10px 24px -6px rgba(15, 23, 42, 0.10), 0 4px 10px -4px rgba(15, 23, 42, 0.06)',
          '--rn-shadow-lg': '0 18px 36px -8px rgba(15, 23, 42, 0.14), 0 6px 14px -4px rgba(15, 23, 42, 0.08)',
        },
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          WebkitOverflowScrolling: 'touch',
          overflowX: 'clip',
          scrollBehavior: 'smooth',
          '@media (prefers-reduced-motion: reduce)': {
            scrollBehavior: 'auto',
          },
        },
        body: {
          width: '100%',
          minHeight: '100%',
          overflowX: 'clip',
          backgroundColor: '#F8FAFC',
          color: '#0F172A',
        },
        '#root': {
          width: '100%',
          minHeight: '100%',
        },
        'a:focus-visible, button:focus-visible, [role="button"]:focus-visible, [role="tab"]:focus-visible, input:focus-visible, select:focus-visible, textarea:focus-visible': {
          outline: '3px solid #0284C7 !important',
          outlineOffset: '2px !important',
        },
        input: {
          '&[type=number]': {
            MozAppearance: 'textfield',
            '&::-webkit-outer-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
            '&::-webkit-inner-spin-button': {
              margin: 0,
              WebkitAppearance: 'none',
            },
          },
        },
        img: {
          display: 'block',
          maxWidth: '100%',
        },
      },
    },
  };
}
