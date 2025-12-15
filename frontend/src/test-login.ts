// Test login functionality
import axios from 'axios';

const testLogin = async () => {
  try {
    
    const response = await axios.post(
      `${import.meta.env.VITE_API_URL || 'http://localhost:5000/api'}/auth/login`,
      {
        email: 'admin@signworld.com',
        password: 'admin123'
      }
    );
    
    return response.data;
  } catch (error: any) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
};

// Export for browser console testing
(window as any).testLogin = testLogin;

export default testLogin;