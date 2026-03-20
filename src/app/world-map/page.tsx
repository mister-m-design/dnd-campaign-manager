'use client';

import WorldMap from '@/components/WorldMap';

export default function WorldMapPage() {
  return (
    <div className="flex-1 flex flex-col overflow-hidden" style={{ height: 'calc(100vh - 56px)' }}>
      <WorldMap />
    </div>
  );
}
