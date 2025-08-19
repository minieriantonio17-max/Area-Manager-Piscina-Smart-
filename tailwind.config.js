module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      borderRadius: { '2xl': '1.25rem' },
      boxShadow: { soft: '0 10px 30px -12px rgba(0,0,0,0.25)' },
      colors: { brand: { 500:"#6366f1", 600:"#4f46e5", 700:"#4338ca" } }
    }
  },
  plugins: []
};