import { supabase } from './integrations/supabase/client';

/**
 * Test Supabase connection
 * Run this to verify your database connection is working
 */
async function testConnection() {
  console.log('🔍 Testing Supabase connection...');
  console.log('URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('Key configured:', !!import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
  
  try {
    // Test 1: Check if we can query the games table
    const { data: games, error: gamesError } = await supabase
      .from('games')
      .select('*')
      .limit(1);
    
    if (gamesError) {
      console.error('❌ Error querying games table:', gamesError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to games table');
    console.log('   Games found:', games?.length || 0);
    
    // Test 2: Check if we can query the teams table
    const { data: teams, error: teamsError } = await supabase
      .from('teams')
      .select('*')
      .limit(1);
    
    if (teamsError) {
      console.error('❌ Error querying teams table:', teamsError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to teams table');
    console.log('   Teams found:', teams?.length || 0);
    
    // Test 3: Check city_data table
    const { data: cities, error: citiesError } = await supabase
      .from('city_data')
      .select('*')
      .limit(1);
    
    if (citiesError) {
      console.error('❌ Error querying city_data table:', citiesError.message);
      return false;
    }
    
    console.log('✅ Successfully connected to city_data table');
    console.log('   Cities found:', cities?.length || 0);
    
    console.log('\n🎉 All connection tests passed!');
    return true;
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return false;
  }
}

// Export for use in other files
export { testConnection };

// Auto-run if this file is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  testConnection();
}
