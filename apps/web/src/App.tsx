import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { GameProvider } from "./context/GameContext";
import Layout from "./components/Layout";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Dashboard from "./pages/Dashboard";
import Nation from "./pages/Nation";
import Military from "./pages/Military";
import Cyber from "./pages/Cyber";
import Market from "./pages/Market";
import Alliance from "./pages/Alliance";
import Rankings from "./pages/Rankings";
import Profile from "./pages/Profile";
import CreateNation from "./pages/CreateNation";
import type { ReactNode } from "react";

function ProtectedRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicOnlyRoute({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-950 flex items-center justify-center">
        <div className="text-gray-400 text-sm">Loading...</div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/game" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public routes - no layout */}
      <Route path="/" element={<Landing />} />
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <Login />
          </PublicOnlyRoute>
        }
      />
      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <Register />
          </PublicOnlyRoute>
        }
      />

      {/* Create nation page - requires auth but not game layout */}
      <Route
        path="/game/create-nation"
        element={
          <ProtectedRoute>
            <CreateNation />
          </ProtectedRoute>
        }
      />

      {/* Game routes - wrapped in Layout */}
      <Route
        path="/game"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Dashboard />} />
        <Route path="nation" element={<Nation />} />
        <Route path="military" element={<Military />} />
        <Route path="cyber" element={<Cyber />} />
        <Route path="market" element={<Market />} />
        <Route path="alliance" element={<Alliance />} />
        <Route path="rankings" element={<Rankings />} />
        <Route path="profile" element={<Profile />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <AppRoutes />
      </GameProvider>
    </AuthProvider>
  );
}
