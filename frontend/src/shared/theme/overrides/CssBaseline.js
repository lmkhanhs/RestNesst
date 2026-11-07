// ----------------------------------------------------------------------

export default function CssBaseline(theme) {
  const isDark = theme?.palette?.mode === 'dark';

  return {
    MuiCssBaseline: {
      styleOverrides: {
        ':root': {
          colorScheme: isDark ? 'dark' : 'light',
          '--rn-bg': isDark ? '#0F172A' : '#F8FAFC',
          '--rn-surface': isDark ? '#1E293B' : '#FFFFFF',
          '--rn-surface-subtle': isDark ? '#334155' : '#F1F5F9',
          '--rn-header-bg': isDark ? 'rgba(15, 23, 42, 0.90)' : 'rgba(255, 255, 255, 0.94)',
          '--rn-hero-gradient': isDark
            ? 'linear-gradient(135deg, #1E293B 0%, #2D1628 52%, #0F172A 100%)'
            : 'linear-gradient(135deg, #FFFFFF 0%, #FFF5F7 52%, #F8FAFC 100%)',
          '--rn-hero-preview-gradient': isDark
            ? 'linear-gradient(135deg, #0F172A 0%, #3B1829 100%)'
            : 'linear-gradient(135deg, #F1F5F9 0%, #FFE4E8 100%)',
          '--rn-text-primary': isDark ? '#F8FAFC' : '#0F172A',
          '--rn-text-secondary': isDark ? '#CBD5E1' : '#475569',
          '--rn-primary': '#D91B42',
          '--rn-primary-hover': '#B81436',
          '--rn-primary-soft': isDark ? 'rgba(217, 27, 66, 0.22)' : '#FFE4E8',
          '--rn-teal': isDark ? '#2DD4BF' : '#0F766E',
          '--rn-teal-soft': isDark ? 'rgba(20, 184, 166, 0.18)' : '#CCFBF1',
          '--rn-border': isDark ? '#334155' : '#E2E8F0',
          '--rn-border-strong': isDark ? '#475569' : '#CBD5E1',
          // Existing listing components use these semantic aliases.
          '--rn-bg-primary': 'var(--rn-bg)',
          '--rn-surface-card': 'var(--rn-surface)',
          '--rn-surface-2': 'var(--rn-surface-subtle)',
          '--rn-border-subtle': 'var(--rn-border)',
          '--rn-brand-primary': 'var(--rn-primary)',
          '--rn-brand-primary-hover': 'var(--rn-primary-hover)',
          '--rn-brand-soft': 'var(--rn-primary-soft)',
          '--rn-focus-ring': '#38BDF8',
          '--rn-radius-card': '16px',
          '--rn-radius-pill': '999px',
          '--rn-shadow-sm': isDark
            ? '0 1px 3px rgba(0, 0, 0, 0.35), 0 1px 2px rgba(0, 0, 0, 0.25)'
            : '0 1px 3px rgba(15, 23, 42, 0.06), 0 1px 2px rgba(15, 23, 42, 0.04)',
          '--rn-shadow-md': isDark
            ? '0 10px 24px -6px rgba(0, 0, 0, 0.45), 0 4px 10px -4px rgba(0, 0, 0, 0.30)'
            : '0 10px 24px -6px rgba(15, 23, 42, 0.10), 0 4px 10px -4px rgba(15, 23, 42, 0.06)',
          '--rn-shadow-lg': isDark
            ? '0 18px 36px -8px rgba(0, 0, 0, 0.55), 0 6px 14px -4px rgba(0, 0, 0, 0.35)'
            : '0 18px 36px -8px rgba(15, 23, 42, 0.14), 0 6px 14px -4px rgba(15, 23, 42, 0.08)',
        },
        '*': {
          margin: 0,
          padding: 0,
          boxSizing: 'border-box',
        },
        html: {
          width: '100%',
          height: '100%',
          colorScheme: isDark ? 'dark' : 'light',
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
          backgroundColor: isDark ? '#0F172A' : '#F8FAFC',
          color: isDark ? '#F8FAFC' : '#0F172A',
          transition: 'background-color 0.2s ease, color 0.2s ease',
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
