
import React from 'react';
import { Toaster as ShadcnToaster } from "@/components/ui/toaster";
import { Toaster as SonnerToaster } from "@/components/ui/sonner";

export const ToasterWrapper = React.memo(() => {
  return (
    <div>
      <ShadcnToaster />
      <SonnerToaster />
    </div>
  );
});

ToasterWrapper.displayName = 'ToasterWrapper';
