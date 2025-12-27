/** @type {import('tailwindcss').Config} */
export default {
    content: [
        './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
        './src/components/**/*.{js,ts,jsx,tsx,mdx}',
        './src/app/**/*.{js,ts,jsx,tsx,mdx}',
    ],
    theme: {
        extend: {
            fontFamily: {
                sans: ['Inter', 'system-ui', 'sans-serif'],
                serif: ['Playfair Display', 'serif'],
            },
            colors: {
                obsidian: {
                    DEFAULT: '#050505',
                    light: '#0a0a0a',
                    deep: '#030303'
                },
                gold: {
                    DEFAULT: '#C5A059',
                    bright: '#F2D29F',
                    dark: '#8C6F3D',
                    muted: '#5a4a2d'
                },
                platinum: {
                    DEFAULT: '#E5E5E5',
                    dim: '#A1A1A1'
                }
            },
            letterSpacing: {
                tighter: '-0.05em',
                widest: '0.3em',
            },
            borderRadius: {
                '4xl': '2rem',
                '5xl': '3rem',
            },
            animation: {
                'float': 'float 6s ease-in-out infinite',
                'reveal-fade': 'revealFade 1s ease-out forwards',
                'shimmer': 'shimmer 2s linear infinite',
            },
            keyframes: {
                float: {
                    '0%, 100%': { transform: 'translateY(0)' },
                    '50%': { transform: 'translateY(-10px)' }
                },
                shimmer: {
                    '100%': { transform: 'translateX(100%)' }
                }
            }
        },
    },
    plugins: [],
}
