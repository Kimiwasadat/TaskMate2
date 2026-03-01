/** @type {import('tailwindcss').Config} */
module.exports = {
    content: ["./App.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
    presets: [require("nativewind/preset")],
    theme: {
        extend: {
            colors: {
                primary: '#14B8B8',
                'primary-dark': '#0E7C7C',
                accent: '#38D07A',
                'accent-dark': '#1FA85C',
                background: '#FFFFFF',
                surface: '#F6F9FB',
                'text-primary': '#0B1220',
                'text-muted': '#5B667A',
                border: '#E4ECF2',
                danger: '#EF4444',
            }
        },
    },
    plugins: [],
};
