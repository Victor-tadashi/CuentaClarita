import nextConfig from "eslint-config-next"

const config = [
  ...nextConfig,
  {
    ignores: [".next/**", "node_modules/**", "public/**"],
    rules: {
      "react-hooks/set-state-in-effect": "off",
    },
  },
]

export default config
