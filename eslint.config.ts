import safeql from "@ts-safeql/eslint-plugin/config";
import dotenv from "dotenv"; // dotenv をインポート
import importPlugin from "eslint-plugin-import-x";
import unusedImports from "eslint-plugin-unused-imports"; // eslint-plugin-unused-imports をインポート
import tseslint from "typescript-eslint";

dotenv.config(); // dotenv を読み込む
const enableSafeQL = process.env.DISABLE_SAFEQL !== "true";
const databaseUrl = `postgresql://${process.env.VITE_POSTGRES_USER}:${process.env.VITE_POSTGRES_PASSWORD}@localhost:5432/${process.env.VITE_POSTGRES_DB}?sslmode=disable`;

export default tseslint.config(
  ...tseslint.configs.recommended,
  {
    ignores: [
      "dist/",
      "build/",
      "out/",
      "coverage/",
      "*.min.js",
      "generated/",
      "*.generated.ts",
      "webpack.config.js",
      "babel.config.js",
      "*.test.js",
      "*.spec.js",
      "__tests__/",
      "src/legacy-code.js",
      "config/*",
      "!config/important.js",
      "*.d.ts",
    ],
    plugins: {
      import: importPlugin,
      "unused-imports": unusedImports, // unused-imports プラグインを追加
    },
    rules: {
      // 変数は小文字キャメルケース、構造体は大文字キャメルケース
      "@typescript-eslint/naming-convention": [
        "error",
        {
          selector: "variable",
          format: ["camelCase"],
        },
        {
          selector: "typeLike",
          format: ["PascalCase"],
        },
      ],

      // 型のimportであればtype importをつける
      "@typescript-eslint/consistent-type-imports": [
        "error",
        {
          prefer: "type-imports",
          disallowTypeAnnotations: false,
        },
      ],

      // importの並び替え
      "import/order": [
        "error",
        {
          groups: [
            "builtin",
            "external",
            "internal",
            "parent",
            "sibling",
            "index",
            "object",
            "type",
          ],
          "newlines-between": "always",
          alphabetize: {
            order: "asc",
            caseInsensitive: true,
          },
        },
      ],
      // 不要なimportの禁止
      // "import/no-unresolved": "error",
      "import/named": "error",
      "import/namespace": "error",
      "import/default": "error",

      // eslint-plugin-unused-imports の設定
      "no-unused-vars": "off", // 既存の no-unused-vars をオフにする
      "@typescript-eslint/no-unused-vars": "off", // TypeScript ESLint の no-unused-vars もオフにする
      "unused-imports/no-unused-imports": "error", // 未使用のインポートをエラーにする
      "unused-imports/no-unused-vars": [
        "warn", // 未使用の変数を警告にする
        {
          vars: "all", // すべての変数をチェック
          varsIgnorePattern: "^_", // _ で始まる変数は無視
          args: "after-used", // 使用された引数以降の引数をチェック
          argsIgnorePattern: "^_", // _ で始まる引数は無視
        },
      ],
    },
    settings: {
      "import/resolver": {
        typescript: {
          project: "tsconfig.json",
        },
      },
      "import/parsers": {
        "@typescript-eslint/parser": [".ts", ".tsx"],
      },
    },
  },
  // SafeQL 設定を環境変数で制御するように追加
  ...(enableSafeQL
    ? [
        safeql.configs.connections({
          databaseUrl: databaseUrl,
          targets: [{ tag: "sql", transform: "{type}[]" }],
        }),
      ]
    : [])
);
