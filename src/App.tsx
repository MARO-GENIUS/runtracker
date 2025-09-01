
import React, { Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Records from "./pages/Records";
import Coach from "./pages/Coach";
import Settings from "./pages/Settings";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ToasterWrapper } from "./components/ToasterWrapper";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const AppContent = () => {
  return (
    <Routes>
      <Route path="/auth" element={<Auth />} />
      <Route path="/" element={<Layout><Dashboard /></Layout>} />
      <Route path="/activities" element={<Layout><Activities /></Layout>} />
      <Route path="/records" element={<Layout><Records /></Layout>} />
      <Route path="/coach" element={<Layout><Coach /></Layout>} />
      <Route path="/settings" element={<Layout><Settings /></Layout>} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Suspense fallback={<div>Loading...</div>}>
          <ThemeProvider 
            attribute="class" 
            defaultTheme="system" 
            enableSystem
            disableTransitionOnChange
          >
            <AuthProvider>
              <AppContent />
              <ToasterWrapper />
            </AuthProvider>
          </ThemeProvider>
        </Suspense>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
