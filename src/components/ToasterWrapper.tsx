
import React from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const ToasterWrapper = () => {
  // Vérification de base pour s'assurer qu'on est côté client
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
