/** @type {import('postcss-load-config').Config} */
const config = {
  plugins: {
    "@tailwindcss/postcss": {},  // ganti dari 'tailwindcss' ke '@tailwindcss/postcss'
    autoprefixer: {},
  },
};

export default config;