/**
 * Design Tokens
 *
 * TypeScript exports of CSS custom properties for type-safe design system usage.
 * These reference CSS variables defined in app.css.
 */

// =============================================================================
// COLORS
// =============================================================================

export const colors = {
	// Brand colors
	brand: {
		primary: 'var(--color-brand-primary)',
		secondary: 'var(--color-brand-secondary)',
		accent: 'var(--color-brand-accent)'
	},

	// Semantic colors
	semantic: {
		success: 'var(--color-success)',
		warning: 'var(--color-warning)',
		error: 'var(--color-error)',
		info: 'var(--color-info)'
	},

	// Status colors (for run/phase/idea states)
	status: {
		running: 'hsl(200, 85%, 55%)',
		pending: 'hsl(45, 85%, 55%)',
		completed: 'hsl(145, 65%, 45%)',
		failed: 'hsl(0, 75%, 55%)',
		killed: 'hsl(0, 55%, 45%)',
		paused: 'hsl(270, 50%, 55%)',
		queued: 'hsl(220, 45%, 55%)',
		skipped: 'hsl(220, 15%, 55%)',
		cancelled: 'hsl(0, 0%, 55%)'
	},

	// Quality score colors (0-100 range)
	quality: {
		excellent: 'hsl(145, 65%, 45%)', // 80-100
		good: 'hsl(85, 60%, 50%)', // 60-79
		fair: 'hsl(45, 85%, 55%)', // 40-59
		poor: 'hsl(25, 85%, 55%)', // 20-39
		critical: 'hsl(0, 75%, 55%)' // 0-19
	},

	// Gradients
	gradients: {
		brand: 'var(--gradient-brand)',
		brandStart: 'var(--color-gradient-start)',
		brandEnd: 'var(--color-gradient-end)',
		// Pre-built gradient strings for direct use
		brandLinear: 'linear-gradient(135deg, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%)',
		brandRadial: 'radial-gradient(circle at top left, var(--color-gradient-start) 0%, var(--color-gradient-end) 100%)'
	},

	// Surface colors
	surface: {
		background: 'var(--color-bg)',
		foreground: 'var(--color-fg)',
		card: 'var(--color-card-bg)',
		cardBorder: 'var(--color-card-border)',
		elevated: 'var(--color-elevated-bg)',
		muted: 'var(--color-muted)',
		subtle: 'var(--color-subtle)'
	},

	// Text colors
	text: {
		primary: 'var(--color-text-primary)',
		secondary: 'var(--color-text-secondary)',
		muted: 'var(--color-text-muted)',
		inverted: 'var(--color-text-inverted)'
	},

	// Border colors
	border: {
		default: 'var(--color-border)',
		subtle: 'var(--color-border-subtle)',
		strong: 'var(--color-border-strong)'
	}
} as const;

// =============================================================================
// SPACING
// =============================================================================

export const spacing = {
	'0': '0',
	px: '1px',
	'0.5': '0.125rem', // 2px
	'1': '0.25rem', // 4px
	'1.5': '0.375rem', // 6px
	'2': '0.5rem', // 8px
	'2.5': '0.625rem', // 10px
	'3': '0.75rem', // 12px
	'3.5': '0.875rem', // 14px
	'4': '1rem', // 16px
	'5': '1.25rem', // 20px
	'6': '1.5rem', // 24px
	'7': '1.75rem', // 28px
	'8': '2rem', // 32px
	'9': '2.25rem', // 36px
	'10': '2.5rem', // 40px
	'11': '2.75rem', // 44px
	'12': '3rem', // 48px
	'14': '3.5rem', // 56px
	'16': '4rem', // 64px
	'20': '5rem', // 80px
	'24': '6rem', // 96px
	'28': '7rem', // 112px
	'32': '8rem', // 128px
	'36': '9rem', // 144px
	'40': '10rem', // 160px
	'44': '11rem', // 176px
	'48': '12rem', // 192px
	'52': '13rem', // 208px
	'56': '14rem', // 224px
	'60': '15rem', // 240px
	'64': '16rem', // 256px
	'72': '18rem', // 288px
	'80': '20rem', // 320px
	'96': '24rem' // 384px
} as const;

// Semantic spacing aliases
export const gap = {
	xs: spacing['1'], // 4px
	sm: spacing['2'], // 8px
	md: spacing['4'], // 16px
	lg: spacing['6'], // 24px
	xl: spacing['8'], // 32px
	'2xl': spacing['12'] // 48px
} as const;

// =============================================================================
// TYPOGRAPHY
// =============================================================================

export const typography = {
	fontFamily: {
		sans: 'var(--font-sans)',
		mono: 'var(--font-mono)'
	},

	fontSize: {
		xs: '0.75rem', // 12px
		sm: '0.875rem', // 14px
		base: '1rem', // 16px
		lg: '1.125rem', // 18px
		xl: '1.25rem', // 20px
		'2xl': '1.5rem', // 24px
		'3xl': '1.875rem', // 30px
		'4xl': '2.25rem', // 36px
		'5xl': '3rem', // 48px
		'6xl': '3.75rem' // 60px
	},

	fontWeight: {
		thin: '100',
		extralight: '200',
		light: '300',
		normal: '400',
		medium: '500',
		semibold: '600',
		bold: '700',
		extrabold: '800',
		black: '900'
	},

	lineHeight: {
		none: '1',
		tight: '1.25',
		snug: '1.375',
		normal: '1.5',
		relaxed: '1.625',
		loose: '2'
	},

	letterSpacing: {
		tighter: '-0.05em',
		tight: '-0.025em',
		normal: '0em',
		wide: '0.025em',
		wider: '0.05em',
		widest: '0.1em'
	}
} as const;

// =============================================================================
// BORDERS
// =============================================================================

export const borders = {
	radius: {
		none: '0',
		sm: '0.125rem', // 2px
		default: '0.25rem', // 4px
		md: '0.375rem', // 6px
		lg: '0.5rem', // 8px
		xl: '0.75rem', // 12px
		'2xl': '1rem', // 16px
		'3xl': '1.5rem', // 24px
		full: '9999px'
	},

	width: {
		'0': '0px',
		'1': '1px',
		'2': '2px',
		'4': '4px',
		'8': '8px'
	}
} as const;

// =============================================================================
// SHADOWS
// =============================================================================

export const shadows = {
	none: 'none',
	sm: 'var(--shadow-sm)',
	default: 'var(--shadow)',
	md: 'var(--shadow-md)',
	lg: 'var(--shadow-lg)',
	xl: 'var(--shadow-xl)',
	'2xl': 'var(--shadow-2xl)',
	inner: 'var(--shadow-inner)'
} as const;

// =============================================================================
// TRANSITIONS
// =============================================================================

export const transitions = {
	duration: {
		'75': '75ms',
		'100': '100ms',
		'150': '150ms',
		'200': '200ms',
		'300': '300ms',
		'500': '500ms',
		'700': '700ms',
		'1000': '1000ms'
	},

	timing: {
		linear: 'linear',
		in: 'cubic-bezier(0.4, 0, 1, 1)',
		out: 'cubic-bezier(0, 0, 0.2, 1)',
		inOut: 'cubic-bezier(0.4, 0, 0.2, 1)'
	},

	// Common transition presets
	presets: {
		fast: 'all 150ms cubic-bezier(0.4, 0, 0.2, 1)',
		normal: 'all 200ms cubic-bezier(0.4, 0, 0.2, 1)',
		slow: 'all 300ms cubic-bezier(0.4, 0, 0.2, 1)',
		colors: 'color 200ms, background-color 200ms, border-color 200ms',
		transform: 'transform 200ms cubic-bezier(0.4, 0, 0.2, 1)',
		opacity: 'opacity 200ms cubic-bezier(0.4, 0, 0.2, 1)'
	}
} as const;

// =============================================================================
// Z-INDEX
// =============================================================================

export const zIndex = {
	auto: 'auto',
	'0': '0',
	'10': '10',
	'20': '20',
	'30': '30',
	'40': '40',
	'50': '50',

	// Semantic z-index
	dropdown: '100',
	sticky: '200',
	overlay: '300',
	modal: '400',
	popover: '500',
	tooltip: '600',
	toast: '700',
	max: '9999'
} as const;

// =============================================================================
// BREAKPOINTS
// =============================================================================

export const breakpoints = {
	sm: '640px',
	md: '768px',
	lg: '1024px',
	xl: '1280px',
	'2xl': '1536px'
} as const;

// =============================================================================
// TYPE EXPORTS
// =============================================================================

export type Color = (typeof colors)[keyof typeof colors];
export type StatusColor = keyof typeof colors.status;
export type QualityLevel = keyof typeof colors.quality;
export type Spacing = keyof typeof spacing;
export type Gap = keyof typeof gap;
export type FontSize = keyof typeof typography.fontSize;
export type FontWeight = keyof typeof typography.fontWeight;
export type BorderRadius = keyof typeof borders.radius;
export type Shadow = keyof typeof shadows;
export type ZIndex = keyof typeof zIndex;
export type Breakpoint = keyof typeof breakpoints;
