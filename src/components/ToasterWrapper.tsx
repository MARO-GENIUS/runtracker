
import { useState, useEffect } from 'react';
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";

export const ToasterWrapper = () => {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    // S'assurer que le composant est monté et que React est complètement initialisé
    setIsMounted(true);
  }, []);

  // Ne rendre les toasters qu'une fois que le composant est monté
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
