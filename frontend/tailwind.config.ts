import type { Config } from 'tailwindcss'
 
 const config: Config = {
   content: [
     './pages/**/*.{js,ts,jsx,tsx,mdx}',
     './components/**/*.{js,ts,jsx,tsx,mdx}',
     './app/**/*.{js,ts,jsx,tsx,mdx}',
   ],
   theme: {
     extend: {
       colors: {
         // Cyber-Noir Palette
         'reflog-void': '#050505',      // Deepest background
         'reflog-raisin': '#121212',    // Card background
         'reflog-glass': 'rgba(18, 18, 18, 0.6)', // Glass effect base
         
         // Accents
         'reflog-amber': '#F59E0B',     // Warning / Attention
         'reflog-emerald': '#10B981',   // Success / Growth
         'reflog-rose': '#F43F5E',      // Danger / Critical
         'reflog-cyan': '#06B6D4',      // Information / Future
         
         // Text
         'reflog-white': '#FAFAFA',
         'reflog-muted': '#A1A1AA',
         
         background: 'var(--background)',
         foreground: 'var(--foreground)',
       },
       backgroundImage: {
         'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
         'cyber-grid': 'linear-gradient(to right, #222 1px, transparent 1px), linear-gradient(to bottom, #222 1px, transparent 1px)',
       },
       animation: {
         'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
         'glow': 'glow 2s ease-in-out infinite alternate',
       },
       keyframes: {
         glow: {
           '0%': { boxShadow: '0 0 5px rgba(245, 158, 11, 0.2)' },
           '100%': { boxShadow: '0 0 20px rgba(245, 158, 11, 0.6), 0 0 10px rgba(245, 158, 11, 0.4)' },
         }
       }
     },
   },
   plugins: [],
 }
 export default config