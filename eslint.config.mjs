// ESLint toàn monorepo. Ngoài lỗi thông thường, file này ÉP QUY TẮC TẦNG (dan_y.md mục 4, 5, 6):
//  - frontend/* không import backend/* hay @tram/database
//  - packages/shared không import gì từ app
//  - Domain BE không import NestJS/Prisma/hạ tầng; Application không import Prisma/SDK
//  - View/Page FE không gọi API / useQuery trực tiếp (phải qua ViewModel)
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import globals from 'globals';

const noBackendFromFrontend = {
  patterns: [
    { group: ['@tram/database', '@tram/api', '@tram/worker', '@prisma/*'], message: 'FE không được import code backend.' },
    { group: ['**/backend/**'], message: 'FE không được import code backend.' },
  ],
};

export default tseslint.config(
  { ignores: ['**/dist/**', '**/node_modules/**', '**/*.config.*', '**/global-setup.js', 'backend/database/prisma/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'off',
    },
  },

  // ---------- Frontend ----------
  {
    files: ['frontend/**/*.{ts,tsx}'],
    languageOptions: { globals: globals.browser },
    plugins: { 'react-hooks': reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      'no-restricted-imports': ['error', noBackendFromFrontend],
    },
  },
  {
    // View, Page, component hiển thị: không gọi API / TanStack Query trực tiếp.
    files: ['frontend/*/src/**/views/**/*.tsx', 'frontend/*/src/pages/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          ...noBackendFromFrontend,
          paths: [
            { name: '@tanstack/react-query', message: 'View không gọi useQuery/useMutation – chuyển vào ViewModel.' },
            { name: '@/lib/apiClient', message: 'View không gọi API – chuyển vào Model/ViewModel.' },
          ],
          patterns: [
            ...noBackendFromFrontend.patterns,
            { group: ['**/model/*'], message: 'View không import Model trực tiếp – đi qua ViewModel.' },
          ],
        },
      ],
    },
  },

  // ---------- packages/shared: "hợp đồng" FE ↔ BE, chạy mọi môi trường ----------
  {
    files: ['packages/shared/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@tram/*', '@prisma/*', 'react', 'node:*', 'fs', 'path', 'crypto'], message: 'shared chỉ chứa code thuần, không phụ thuộc app/Node.' },
          ],
        },
      ],
      'no-restricted-globals': ['error', { name: 'process', message: 'shared không đọc biến môi trường.' }],
    },
  },

  // ---------- Backend ----------
  {
    files: ['backend/**/*.ts'],
    languageOptions: { globals: globals.node },
  },
  {
    // Domain: thuần nghiệp vụ.
    files: ['backend/api/src/**/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@nestjs/*', '@tram/database', '@prisma/*', '@aws-sdk/*', 'express'], message: 'Domain không phụ thuộc framework/DB/SDK.' },
            { group: ['**/application/**', '**/infrastructure/**', '**/presentation/**'], message: 'Domain không import tầng ngoài.' },
          ],
        },
      ],
    },
  },
  {
    // Application: chỉ dùng Domain + port; không đụng SDK/HTTP.
    files: ['backend/api/src/**/application/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            { group: ['@aws-sdk/*', 'express'], message: 'Application không gọi SDK/HTTP trực tiếp – dùng port.' },
            { group: ['**/presentation/**'], message: 'Application không import Presentation.' },
          ],
        },
      ],
    },
  },
);
