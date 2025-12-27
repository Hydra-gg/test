/** @type {import('tailwindcss').Config} */
module.exports = {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
        './index.html',
    ],
    theme: {
        extend: {
            colors: {
                navy: {
                    50: '#f0f1f9',
                    100: '#d9dce8',
                    200: '#b3b9d1',
                    300: '#8d96ba',
                    400: '#6773a3',
                    500: '#41508c',
                    600: '#34406f',
                    700: '#273053',
                    800: '#1a2037',
                    900: '#0d101b',
                    950: '#0A0E27',
                },
                gold: {
                    50: '#faf8f0',
                    100: '#f5f0d9',
                    200: '#ebe1b3',
                    300: '#e1d28d',
                    400: '#d7c367',
                    500: '#D4AF37',
                    600: '#aa8c2c',
                    700: '#7f6921',
                    800: '#554616',
                    900: '#2a230b',
                },
                obsidian: '#05060c',
                platinum: '#f5f5f5',
                aurora: {
                    teal: '#4be3c2',
                    rose: '#ff4d8d',
                    gold: '#f5d67b',
                },
            },
            fontFamily: {
                sans: ['Sora', 'Inter', 'system-ui', 'sans-serif'],
                display: ['Playfair Display', 'serif'],
            },
            backgroundImage: {
                'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
                'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
                'lux-grid': 'linear-gradient(120deg, rgba(245,214,123,0.05) 0%, rgba(255,77,141,0.05) 100%)',
            },
            boxShadow: {
                'lux-soft': '0 20px 80px rgba(3, 4, 10, 0.85)',
                'lux-glow': '0 0 25px rgba(245, 214, 123, 0.35)',
                'inner-glow': 'inset 0 0 20px rgba(255,255,255,0.05)',
            },
            dropShadow: {
                'neon-gold': '0 0 12px rgba(245,214,123,0.75)',
            },
            keyframes: {
                fadeIn: {
                    '0%': { opacity: '0' },
                    '100%': { opacity: '1' },
                },
                slideUp: {
                    '0%': { transform: 'translateY(10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                slideDown: {
                    '0%': { transform: 'translateY(-10px)', opacity: '0' },
                    '100%': { transform: 'translateY(0)', opacity: '1' },
                },
                'gradient-x': {
                    '0%, 100%': {
                        backgroundSize: '200% 200%',
                        backgroundPosition: 'left center'
                    },
                    '50%': {
                        backgroundSize: '200% 200%',
                        backgroundPosition: 'right center'
                    },
                },
                float: {
                    '0%': { transform: 'translateY(0px)' },
                    '50%': { transform: 'translateY(-8px)' },
                    '100%': { transform: 'translateY(0px)' },
                },
                shimmer: {
                    '0%': { backgroundPosition: '-200% 0' },
                    '100%': { backgroundPosition: '200% 0' },
                },
            },
            animation: {
                'fade-in': 'fadeIn 0.5s ease-in-out',
                'slide-up': 'slideUp 0.5s ease-out',
                'slide-down': 'slideDown 0.5s ease-out',
                'gradient-x': 'gradient-x 3s ease infinite',
                float: 'float 4s ease-in-out infinite',
                shimmer: 'shimmer 4s linear infinite',
            },
        },
    },
    plugins: [],
}
