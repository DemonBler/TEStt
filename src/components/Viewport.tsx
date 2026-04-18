import React from 'react';
import { VRMViewer } from './VRMViewer';

export const Viewport = () => {
  return (
    <div className="h-full w-full bg-black/40 relative">
      <VRMViewer />
    </div>
  );
};
