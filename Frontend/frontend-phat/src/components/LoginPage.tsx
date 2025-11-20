import React, { useState } from 'react';
import axios from 'axios';
// Assume you have a simple context or state hook to manage the token globally
// import { useAuth } from './AuthContext'; 

const API_BASE_URL = 'http://localhost:3000'; // Replace with your FastAPI URL

function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
//   const { setToken } = useAuth(); // Example global state setter

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      // FastAPI's OAuth2PasswordRequestForm expects data as form-urlencoded,
      // not JSON. Axios handles this if you pass a URLSearchParams object.
      const formData = new URLSearchParams();
      formData.append('username', username);
      formData.append('password', password);

      const response = await axios.post(`${API_BASE_URL}/token`, formData, {
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
      });

      const accessToken = response.data.access_token;
      
      // Store the token (e.g., in localStorage or an HTTP-only cookie)
      localStorage.setItem('accessToken', accessToken);
      
//      setToken(accessToken); // Update global state
      console.log('Login successful. Token:', accessToken);
      // Redirect user to a protected page
      // navigate('/dashboard'); 

    } catch (err) {
      console.error('Login failed:', err.response ? err.response.data : err.message);
      setError('Login failed. Check your credentials.');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      <h2>Login</h2>
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
      />
      <button type="submit">Log In</button>
      {error && <p style={{ color: 'red' }}>{error}</p>}
    </form>
  );
}

export default LoginPage;