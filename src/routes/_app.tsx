import { createFileRoute, Navigate } from "@tanstack/react-router";
import { useAuth } from "@/lib/auth";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_app")({ component: AppLayout });

function AppLayout() {
  const { user, loading, role, mustChangePassword } = useAuth();
  if (loading) return (
    <div className="min-h-screen grid place-items-center bg-background">
      <div className="text-center animate-fade-in">
        <div className="h-8 w-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
        <p className="text-muted-foreground text-sm">Cargando...</p>
      </div>
    </div>
  );
  if (!user) return <Navigate to="/login" />;
  if (mustChangePassword) return <Navigate to="/change-password" />;
  if (!role) return (
    <div className="min-h-screen grid place-items-center text-muted-foreground">
      <div className="text-center">
        <p className="text-lg font-medium">Sin rol asignado</p>
        <p className="text-sm mt-1">Contacta con el administrador</p>
      </div>
    </div>
  );
  return <AppShell />;
}
