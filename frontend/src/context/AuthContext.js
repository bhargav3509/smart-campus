import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { jwtDecode } from 'jwt-decode';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [darkMode, setDarkMode] = useState(false);

  const logout = useCallback(() => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    const savedToken = localStorage.getItem('token');
    const savedTheme = localStorage.getItem('darkMode');
    
    let timeoutId;

    if (savedUser && savedToken) {
      try {
        const decoded = jwtDecode(savedToken);
        const currentTime = Date.now() / 1000;
        
        if (decoded.exp < currentTime) {
          // Token is already expired
          logout();
        } else {
          setUser(JSON.parse(savedUser));
          setToken(savedToken);
          
          // Set timeout to log out when token expires
          const timeUntilExpiry = (decoded.exp - currentTime) * 1000;
          timeoutId = setTimeout(() => {
            logout();
            window.location.href = '/login';
          }, timeUntilExpiry);
        }
      } catch (error) {
        // Invalid token
        logout();
      }
    }

    if (savedTheme === 'true') {
      setDarkMode(true);
      document.documentElement.classList.add('dark');
    }
    setLoading(false);

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [logout]);

  const toggleDarkMode = () => {
    setDarkMode(prev => {
      const next = !prev;
      localStorage.setItem('darkMode', next);
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return next;
    });
  };

  const login = (userData, tokenData) => {
    setUser(userData);
    setToken(tokenData);
    localStorage.setItem('token', tokenData);
    localStorage.setItem('user', JSON.stringify(userData));
    
    try {
      const decoded = jwtDecode(tokenData);
      const currentTime = Date.now() / 1000;
      const timeUntilExpiry = (decoded.exp - currentTime) * 1000;
      
      setTimeout(() => {
        logout();
        window.location.href = '/login';
      }, timeUntilExpiry);
    } catch (e) {
      console.error('Invalid token during login');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <AuthContext.Provider value={{ user, token, login, logout, darkMode, toggleDarkMode }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);