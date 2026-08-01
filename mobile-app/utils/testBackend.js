import api from '../services/api';

export const testBackendConnection = async () => {
  console.log('Testing backend connection...');
  console.log('API Base URL:', api.defaults.baseURL);
  
  try {
    
    console.log('\nTest 1: Health Check');
    const healthResponse = await api.get('/health');
    console.log('Health check passed:', healthResponse.data);

console.log('\nTest 2: Protected Route (should fail with 401)');
    try {
      await api.get('/api/appliances');
    } catch (error) {
      if (error.message.includes('401') || error.message.includes('Not authorized')) {
        console.log('Protected route working (401 as expected)');
      } else {
        console.log('Unexpected error:', error.message);
      }
    }
    
    console.log('\nBackend connection test PASSED!');
    return true;
    
  } catch (error) {
    console.error('\nBackend connection test FAILED!');
    console.error('Error:', error.message);
    console.error('\nTroubleshooting:');
    console.error('1. Check if backend is running');
    console.error('2. Verify EXPO_PUBLIC_API_URL in .env');
    console.error('3. Restart Expo app (r in terminal)');
    console.error('4. Clear cache: expo start -c');
    return false;
  }
};

export const testRegistration = async (testEmail = 'test@example.com', testPassword = 'Test123456') => {
  console.log('Testing registration endpoint...');
  
  try {
    const response = await api.post('/api/auth/register', {
      name: 'Test User',
      email: testEmail,
      password: testPassword
    });
    
    console.log('Registration test passed:', response.data);
    return response.data;
    
  } catch (error) {
    if (error.message.includes('already exists')) {
      console.log('Registration endpoint working (user already exists)');
      return true;
    }
    console.error('Registration test failed:', error.message);
    return false;
  }
};

export default { testBackendConnection, testRegistration };
