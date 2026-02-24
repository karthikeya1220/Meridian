module.exports = {
  // Use the explicit require form which is more resilient with some bundlers
  // and Turbopack evaluation environments.
  plugins: [
    require('tailwindcss'),
    require('autoprefixer')
  ]
}
