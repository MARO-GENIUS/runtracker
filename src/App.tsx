
import React from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { ThemeProvider } from "next-themes";
import Dashboard from "./pages/Dashboard";
import Activities from "./pages/Activities";
import Records from "./pages/Records";
import Coach from "./pages/Coach";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import Layout from "./components/Layout";
import { AuthProvider } from "./hooks/useAuth";
import { ToasterWrapper } from "./components/ToasterWrapper";

const queryClient = new QueryClient();

const App = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem
          disableTransitionOnChange
        >
          <AuthProvider>
            <Routes>
              <Route path="/auth" element={<Auth />} />
              <Route path="/" element={<Layout><Dashboard /></Layout>} />
              <Route path="/activities" element={<Layout><Activities /></Layout>} />
              <Route path="/records" element={<Layout><Records /></Layout>} />
              <Route path="/coach" element={<Layout><Coach /></Layout>} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <ToasterWrapper />
          </AuthProvider>
        </ThemeProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
};

export default App;
