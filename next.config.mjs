/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  // pdfkit(@react-pdf/renderer가 내부적으로 사용)의 폰트 관련 파일(.afm 데이터 +
  // standard-fonts/*.cjs 로더)은 코드에서 정적으로 import되지 않아 Vercel의 자동
  // 파일 추적에서 누락된다 — pdfkit js 디렉터리 전체를 배포 함수 번들에 포함시켜야
  // 런타임에 "Cannot find module" 에러가 안 난다.
  // (Next.js 14.2.15 기준 이 옵션은 experimental 아래에 있음 — 15부터 최상위로 이동)
  experimental: {
    outputFileTracingIncludes: {
      '/api/chatbot/lead': ['./node_modules/pdfkit/js/**/*'],
    },
  },
};

export default nextConfig;
