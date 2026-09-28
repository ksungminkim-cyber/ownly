import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  // 미정의 식별자(import 누락 등)는 런타임에서 화면 전체를 죽이므로 오류로 잡는다 — 2026-09 대시보드 크래시 재발 방지
  { files: ["src/**/*.js"], rules: { "no-undef": "error" }, languageOptions: { globals: { process: "readonly" } } },
  // Override default ignores of eslint-config-next.
  globalIgnores([
    // Default ignores of eslint-config-next:
    ".next/**",
    "out/**",
    "build/**",
    "next-env.d.ts",
  ]),
]);

export default eslintConfig;
