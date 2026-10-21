/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: ['class'],
  theme: {
    extend: {
      colors: {
        cream: 'var(--cream)',
        'cream-deep': 'var(--cream-deep)',
        ink: 'var(--ink)',
        'ink-soft': 'var(--ink-soft)',
        sage: 'var(--sage)',
        'sage-deep': 'var(--sage-deep)',
        peach: 'var(--peach)',
        sky: 'var(--sky)',
        butter: 'var(--butter)',
        lilac: 'var(--lilac)',
        rose: 'var(--rose)',
      },
      fontFamily: {
        head: ['Fredoka', 'Nunito', 'sans-serif'],
        body: ['Nunito', 'system-ui', 'sans-serif'],
        hand: ['Caveat', 'cursive'],
      },
      keyframes: {
        breathe: {
          '0%,100%': { transform: 'translateY(0) scale(1)' },
          '50%': { transform: 'translateY(-3%) scale(1.02)' },
        },
        blink: {
          '0%, 92%, 100%': { transform: 'scaleY(1)' },
          '96%': { transform: 'scaleY(0.1)' },
        },
        twinkle: {
          '0%, 100%': { opacity: 0, transform: 'scale(0.5) rotate(0deg)' },
          '50%': { opacity: 1, transform: 'scale(1) rotate(90deg)' },
        },
        floatleaf: {
          '0%': { transform: 'translateY(-10vh) translateX(0) rotate(0deg)', opacity: 0 },
          '10%': { opacity: 0.7 },
          '90%': { opacity: 0.7 },
          '100%': { transform: 'translateY(110vh) translateX(40px) rotate(360deg)', opacity: 0 },
        },
        firefly: {
          '0%, 100%': { opacity: 0.3, transform: 'translate(0,0)' },
          '50%': { opacity: 1, transform: 'translate(20px,-30px)' },
        },
        shimmer: {
          '100%': { transform: 'translateX(100%)' },
        },
      },
      animation: {
        breathe: 'breathe 4s ease-in-out infinite',
        blink: 'blink 5s ease-in-out infinite',
        twinkle: 'twinkle 1.6s ease-in-out infinite',
        floatleaf: 'floatleaf linear infinite',
        firefly: 'firefly 6s ease-in-out infinite',
        shimmer: 'shimmer 1.5s infinite',
      },
    },
  },
  plugins: [],
};
