import { useState } from 'react';

function App() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();

    if (!username || !password) {
      setMessage('Please fill in all fields');
      return;
    }

    try {
      const response = await fetch('http://localhost:3001/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setMessage(`Success! Token: ${data.token.substring(0, 15)}...`);
        localStorage.setItem('auth_token', data.token);
        setIsLoggedIn(true); 
      } else {
        setMessage(data.error || 'Login failed');
      }
    } catch (err) {
      setMessage('Network error occurred');
    }
  };


  const testAuth = async () => {
    const token = localStorage.getItem('auth_token');
    try {
      const response = await fetch('http://localhost:3001/api/protected', {
        headers: {
          'Authorization': `Bearer ${token}` 
        }
      });
      const data = await response.json();
      if (response.ok) {
        setMessage(`Auth Test Success: ${data.message}`);
      } else {
        setMessage(`Auth Test Failed: ${data.error}`);
      }
    } catch (err) {
      setMessage('Network error during auth test');
    }
  };

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '100px', fontFamily: 'sans-serif' }}>
      <div style={{ width: '300px', padding: '20px', border: '1px solid #ccc', borderRadius: '5px' }}>
        <h2 style={{ textAlign: 'center' }}>System Login</h2>
        
        {!isLoggedIn ? (
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
            <input
              type="text"
              placeholder="Username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              style={{ padding: '8px' }}
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ padding: '8px' }}
            />
            <button type="submit" style={{ padding: '10px', backgroundColor: '#007bff', color: 'white', border: 'none', cursor: 'pointer' }}>
              Login
            </button>
          </form>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
             <p style={{ textAlign: 'center', color: 'green', margin: '0' }}>You are logged in.</p>
             <button onClick={testAuth} style={{ padding: '10px', backgroundColor: '#28a745', color: 'white', border: 'none', cursor: 'pointer' }}>
                Test Authenticated Request
             </button>
          </div>
        )}

        {message && <p style={{ marginTop: '15px', textAlign: 'center', color: message.includes('Success') ? 'green' : 'red' }}>{message}</p>}
      </div>
    </div>
  );
}

export default App;