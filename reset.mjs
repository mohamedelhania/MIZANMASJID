import { createClient } from '@supabase/supabase-js';
const supabase = createClient('https://wwyivwxdecktnuyffvxa.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Ind3eWl2d3hkZWNrdG51eWZmdnhhIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3OTEyMDYwNSwiZXhwIjoyMDk0Njk2NjA1fQ.Y7qnHZC85dlxB0tKsHRVt61b4iA06Rat9RV3T2HxaKQ', { auth: { autoRefreshToken: false, persistSession: false } });

async function run() {
  const users = await supabase.auth.admin.listUsers();
  const user = users.data.users.find(u => u.email === 'mizanmasjid@gmail.com');
  if (!user) {
    console.log('User not found!');
    return;
  }
  const { data, error } = await supabase.auth.admin.updateUserById(
    user.id,
    { password: 'admin12345' }
  );
  if (error) console.error(error);
  else console.log('Password reset successfully to admin12345');
}
run();
