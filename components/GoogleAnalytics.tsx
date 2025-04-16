'use client';

import { GoogleAnalytics } from '@next/third-parties/google';

export default function Analytics() {
  return <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_ID || ''} />;
} 