
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const ToasterWrapper = () => {
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized before rendering toast components
    const timer = setTimeout(() => {
      setIsReady(true);
    }, 200); // Increased delay to ensure full initialization

    return () => clearTimeout(timer);
  }, []);

  // Add a safety check to ensure we're in a proper React context
  if (typeof window === 'undefined' || !isReady) {
    return null;
  }

  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
};
