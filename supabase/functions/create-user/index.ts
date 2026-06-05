import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) throw new Error("No authorization header");

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify caller identity
    const callerClient = createClient(supabaseUrl, serviceKey, {
      global: { headers: { Authorization: authHeader } },
      auth: { autoRefreshToken: false, persistSession: false },
    });
    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) throw new Error("Unauthorized");

    const adminClient = createClient(supabaseUrl, serviceKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Check caller role
    const { data: callerRoles } = await adminClient.from("user_roles").select("role, mosque_id").eq("user_id", caller.id);
    const isSuperAdmin = callerRoles?.some((r: any) => r.role === "super_admin");
    const gerenteOf = callerRoles?.filter((r: any) => r.role === "gerente").map((r: any) => r.mosque_id) ?? [];

    if (!isSuperAdmin && gerenteOf.length === 0) throw new Error("Insufficient permissions");

    const { email, full_name, role, mosque_id } = await req.json();
    if (!email || !role || !mosque_id) throw new Error("Missing fields: email, role, mosque_id");

    // Gerente can only create users for their own mosque
    if (!isSuperAdmin && !gerenteOf.includes(mosque_id)) throw new Error("Cannot create users for this mosque");

    // Generate random password
    const chars = "ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz23456789!@#$";
    let password = "";
    for (let i = 0; i < 12; i++) password += chars[Math.floor(Math.random() * chars.length)];

    // Create auth user
    const { data: newUser, error: createErr } = await adminClient.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: full_name || email, must_change_password: true },
    });
    if (createErr) throw createErr;

    // Assign role
    const { error: roleErr } = await adminClient.from("user_roles").insert({
      user_id: newUser.user!.id,
      mosque_id,
      role,
    });
    if (roleErr) throw roleErr;

    return new Response(JSON.stringify({
      success: true,
      user_id: newUser.user!.id,
      email,
      password,
      role,
    }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
