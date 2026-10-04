import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(supabaseUrl, supabaseKey);

async function run() {
  console.log("Adding photo_url column to students...");
  
  // Create bucket
  console.log("Creating student_photos bucket...");
  const { data: bData, error: bError } = await supabase.storage.createBucket('student_photos', { public: true });
  if (bError && !bError.message.includes('already exists')) console.error("Bucket Error:", bError);
  else console.log("Bucket created or exists.");
}

run();
