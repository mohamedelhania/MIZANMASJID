import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/")({
  component: Index,
});

function Index() {
  const { user, role, loading } = useAuth();
  if (loading) return <div className="min-h-screen grid place-items-center text-muted-foreground">…</div>;
  if (!user) return <Navigate to="/login" />;
  
  if (role === "profesorado") return <Navigate to="/aulas" />;
  return <Navigate to="/dashboard" />;
}
