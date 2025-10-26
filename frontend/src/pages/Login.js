import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { ShoppingCart } from 'lucide-react';
import { authAPI } from '../services/api';
import { setAuthToken, setCurrentUser } from '../utils/auth';

const Login = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await authAPI.login(formData);
      const { token, user } = response.data;

      setAuthToken(token);
      setCurrentUser(user);

      toast.success('Login successful!');
      navigate('/');
    } catch (error) {
      toast.error(error.response?.data?.error || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl p-8 md:p-10 w-full max-w-md border-4 border-shoprite-red">
        {/* Logo Section - Phase 2A */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-shoprite-red rounded-full mb-4 shadow-lg animate-scale-in">
            <ShoppingCart size={40} className="text-white" strokeWidth={2.5} />
          </div>
          <h1 className="text-4xl font-bold text-grey-900 mb-2">CartSaver</h1>
          <p className="text-grey-600 font-medium">Smart Trolley Management</p>
          <div className="mt-2 inline-block px-3 py-1 bg-shoprite-red/10 rounded-full">
            <p className="text-xs text-shoprite-red font-semibold">Powered by Shoprite</p>
          </div>
        </div>

        {/* Login Form - Phase 2A */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="email" className="label">
              Email Address
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              className="input"
              placeholder="your.email@shoprite.com"
            />
          </div>

          <div>
            <label htmlFor="password" className="label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              className="input"
              placeholder="••••••••"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full btn btn-primary py-3 text-lg font-semibold"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <div className="spinner mr-3"></div>
                Logging in...
              </span>
            ) : (
              'Login to Dashboard'
            )}
          </button>
        </form>

        {/* Demo Credentials - Phase 2A */}
        <div className="mt-6 p-4 bg-grey-50 rounded-lg border-l-4 border-shoprite-red">
          <p className="text-xs text-grey-700 font-bold mb-2">Demo Credentials:</p>
          <div className="space-y-1">
            <p className="text-xs text-grey-600"><span className="font-semibold">Admin:</span> admin@cartsaver.com / admin123</p>
            <p className="text-xs text-grey-600"><span className="font-semibold">Staff:</span> john@cartsaver.com / staff123</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
