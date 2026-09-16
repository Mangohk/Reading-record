/** @type {import('eslint').Linter.Config[]} */
const eslintConfig = [
  {
    ignores: [".next/**", "node_modules/**", "legacy/**", "public/**"],
  },
];

export default eslintConfig;
