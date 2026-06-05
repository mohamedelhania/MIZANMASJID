import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";

export const createUserOnServer = createServerFn({ method: "POST" })
  .handler(async ({ data }: { data: { email: string; full_name: string; role: string; mosque_id: string; caller_token: string } }) => {
    // Access env vars - try multiple sources for compatibility
    const supabaseUrl =
      (typeof process !== "undefined" && process.env?.VITE_SUPABASE_URL) ||
      (typeof process !== "undefined" && process.env?.SUPABASE_URL) ||
      "";
    const serviceKey =
      (typeof process !== "undefined" && process.env?.SUPABASE_SERVICE_ROLE_KEY) ||
      "";

    if (!supabaseUrl || !serviceKey) {
      throw new Error("Missing server environment variables (SUPABASE_SERVICE_ROLE_KEY)");
    }

    // Verify caller identity using their JWT
    const callerClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: `Bearer ${data.caller_token}` } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const {
      data: { user: caller },
    } = await callerClient.auth.getUser();
    if (!caller) throw new Error("No autorizado");

    // Admin client with service role
    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check caller permissions
    const { data: callerRoles } = await adminClient
      .from("user_roles")
      .select("role, mosque_id")
      .eq("user_id", caller.id);
    const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin");
    const gerenteOf =
      callerRoles
        ?.filter((r: any) => r.role === "gerente")
        .map((r: any) => r.mosque_id) ?? [];

    if (!isSuperAdmin && gerenteOf.length === 0) {
      throw new Error("Permisos insuficientes");
    }
    if (!isSuperAdmin && !gerenteOf.includes(data.mosque_id)) {
      throw new Error("No puedes crear usuarios para esta mezquita");
    }

    if (!data.email || !data.role || !data.mosque_id) {
      throw new Error("Faltan campos: email, rol, mosque_id");
    }

    // Generate random password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    let password = "";
    for (let i = 0; i < 12; i++)
      password += chars[Math.floor(Math.random() * chars.length)];

    // Create auth user
    const { data: newUser, error: createErr } =
      await adminClient.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: data.full_name || data.email,
          must_change_password: true,
        },
      });
    if (createErr) throw new Error(createErr.message);

    // Create profile
    await adminClient.from("profiles").upsert({
      id: newUser.user!.id,
      full_name: data.full_name || data.email,
      must_change_password: true,
    });

    // Assign role
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: newUser.user!.id,
      mosque_id: data.mosque_id,
      role: data.role,
    });
    if (roleErr) throw new Error(roleErr.message);

    return {
      success: true,
      user_id: newUser.user!.id,
      email: data.email,
      password,
      role: data.role,
    };
  });
