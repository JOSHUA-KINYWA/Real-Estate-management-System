/**
 * Script to set admin password
 * Usage: node scripts/set-admin-password.js <email> <password>
 */

const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://tzmpavfrxlbcjnfhryap.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InR6bXBhdmZyeGxiY2puZmhyeWFwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQzMDYxMTEsImV4cCI6MjA3OTg4MjExMX0.XLsiAyFozoHXZjl3dafxyvSPK3OckjXR6vlWcld4UHk';

async function setAdminPassword(email, password) {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);

  // Hash the password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Update the user
  const { data, error } = await supabase
    .from('User')
    .update({ password: hashedPassword })
    .eq('email', email)
    .select();

  if (error) {
    console.error('Error setting password:', error);
    return;
  }

  if (data && data.length > 0) {
    console.log('✅ Password set successfully for:', email);
    console.log('User:', data[0].firstName, data[0].lastName);
  } else {
    console.log('❌ User not found with email:', email);
  }
}

// Get arguments
const email = process.argv[2];
const password = process.argv[3];

if (!email || !password) {
  console.log('Usage: node scripts/set-admin-password.js <email> <password>');
  console.log('Example: node scripts/set-admin-password.js admin@realestatepro.ke Admin123!');
  process.exit(1);
}

setAdminPassword(email, password)
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });

