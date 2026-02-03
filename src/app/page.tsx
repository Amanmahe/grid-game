'use client';

import dynamic from 'next/dynamic';

const EEGWhiteboard = dynamic(() => import('@/app/components/EEGWhiteboard'), {
  ssr: false,
});

export default function Home() {
  return (
    <main className="min-h-screen p-5 md:p-10">
      <EEGWhiteboard />
    </main>
  );
}