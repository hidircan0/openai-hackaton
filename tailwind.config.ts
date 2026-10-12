import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./rabii/ui/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        sarsinti: {
          zemin: "#0B0C10",
          katman: "#151518",
          ikincil: "#1F2633",
          cizgi: "#2C3444",
          metin: "#F2F0F5",
          ikincilMetin: "#A7A3B3",
          vurgu: "#9966CC",
          vurguMetin: "#B28DDB",
          basari: "#3FB27F",
          uyari: "#E0A73A",
          tehlike: "#F0676B"
        }
      },
      borderRadius: {
        panel: "8px"
      },
      fontFamily: {
        baslik: ["Space Grotesk", "sans-serif"],
        govde: ["Inter", "sans-serif"],
        kod: ["JetBrains Mono", "monospace"]
      }
    }
  },
  plugins: []
};

export default config;
