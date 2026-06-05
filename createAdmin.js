import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createSuperAdmin() {
  try {
    // 1. Create or get the user
    console.log("Creating/updating user mizanmasjid@gmail.com...");
    const { data: userData, error: userError } = await supabase.auth.admin.createUser({
      email: 'mizanmasjid@gmail.com',
      password: 'mohamedeha.',
      email_confirm: true,
      user_metadata: { full_name: 'MizanMasjid Admin', must_change_password: false }
    });
    
    let userId;
    if (userError && userError.message.includes('already exists')) {
      console.log("User already exists, fetching user ID...");
      // Let's list users to find the ID
      const { data: listData, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) throw listError;
      const user = listData.users.find(u => u.email === 'mizanmasjid@gmail.com');
      if (!user) throw new Error("Could not find user after already exists error");
      userId = user.id;
      
      // Update password just in case
      await supabase.auth.admin.updateUserById(userId, { password: 'mohamedeha.' });
      console.log("Password updated for existing user.");
    } else if (userError) {
      throw userError;
    } else {
      userId = userData.user.id;
      console.log("User created successfully.");
    }

    // 2. Assign super_admin role
    console.log("Assigning super_admin role to user ID:", userId);
    const { error: roleError } = await supabase
      .from('user_roles')
      .upsert({ user_id: userId, role: 'super_admin', mosque_id: null }, { onConflict: 'user_id,mosque_id,role' });

    if (roleError) throw roleError;
    
    // 3. (Optional) delete admin@gmail.com if needed
    console.log("Looking for old admin@gmail.com...");
    const { data: listData } = await supabase.auth.admin.listUsers();
    const oldAdmin = listData.users.find(u => u.email === 'admin@gmail.com');
    if (oldAdmin) {
      console.log("Deleting old admin@gmail.com...");
      await supabase.auth.admin.deleteUser(oldAdmin.id);
    }

    console.log("Super Admin setup complete!");
  } catch (err) {
    console.error("Error setting up super admin:", err);
  }
}

createSuperAdmin();
