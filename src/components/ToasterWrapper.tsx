
import React from 'react';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const ToasterWrapper = React.memo(() => {
  // Add error boundary for toaster components
  try {
    return (
      <div>
        <ShadcnToaster />
        <SonnerToaster />
      </div>
    );
  } catch (error) {
    console.error('Error in ToasterWrapper:', error);
    return null;
  }
});

ToasterWrapper.displayName = 'ToasterWrapper';
