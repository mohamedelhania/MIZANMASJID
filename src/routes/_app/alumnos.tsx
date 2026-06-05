import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/_app/alumnos")({ component: AlumnosLayout });

function AlumnosLayout() {
  return <Outlet />;
}
