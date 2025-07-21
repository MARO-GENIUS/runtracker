
import React, { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const ToasterWrapper = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // Ensure React is fully initialized before mounting toast components
    const timer = setTimeout(() => {
      setIsMounted(true);
    }, 0);

    return () => clearTimeout(timer);
  }, []);

  // Don't render anything until React is fully mounted
  if (!isMounted) {
    return null;
  }

  return (
    <>
      <Toaster />
      <Sonner />
    </>
  );
};
