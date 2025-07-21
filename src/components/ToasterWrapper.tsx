
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const ToasterWrapper = () => {
  // Add a safety check to ensure we're in a proper React context
  if (typeof window === 'undefined') {
    return null;
  }

  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
};
