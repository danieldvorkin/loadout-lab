import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useAuth } from '../lib/auth-context';

export default function Register() {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    passwordConfirmation: '',
    username: '',
    fullName: '',
    phoneNumber: '',
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    if (formData.password !== formData.passwordConfirmation) {
      setErrors(['Password and confirmation do not match']);
      return;
    }

    setIsLoading(true);

    const result = await register(formData);

    if (result.success) {
      navigate('/');
    } else {
      setErrors(result.errors);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-white to-sky-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h1 className="text-center text-2xl font-bold bg-gradient-to-r from-sky-600 to-indigo-600 bg-clip-text text-transparent">
            Loadout Lab
          </h1>
          <h2 className="mt-4 text-center text-3xl font-extrabold text-slate-800">
            Create your account
          </h2>
          <p className="mt-2 text-center text-sm text-slate-600">
            Already have an account?{' '}
            <Link
              to="/login"
              className="font-medium text-sky-600 hover:text-sky-700"
            >
              Sign in
            </Link>
          </p>
        </div>

        <form className="mt-8 space-y-6 bg-white rounded-2xl shadow-sm border border-slate-100 p-8" onSubmit={handleSubmit}>
          {errors.length > 0 && (
            <div className="rounded-xl bg-red-50 border border-red-100 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">
                    There were errors with your submission
                  </h3>
                  <div className="mt-2 text-sm text-red-700">
                    <ul className="list-disc pl-5 space-y-1">
                      {errors.map((error, index) => (
                        <li key={index}>{error}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-4">
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-slate-700">
                Username *
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Username"
                value={formData.username}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700">
                Email address *
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Email address"
                value={formData.email}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="fullName" className="block text-sm font-medium text-slate-700">
                Full Name
              </label>
              <input
                id="fullName"
                name="fullName"
                type="text"
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Full Name (optional)"
                value={formData.fullName}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-slate-700">
                Phone Number
              </label>
              <input
                id="phoneNumber"
                name="phoneNumber"
                type="tel"
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Phone Number (optional)"
                value={formData.phoneNumber}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password *
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Password (min 6 characters)"
                value={formData.password}
                onChange={handleChange}
              />
            </div>

            <div>
              <label htmlFor="passwordConfirmation" className="block text-sm font-medium text-slate-700">
                Confirm Password *
              </label>
              <input
                id="passwordConfirmation"
                name="passwordConfirmation"
                type="password"
                autoComplete="new-password"
                required
                className="mt-1 appearance-none relative block w-full px-4 py-3 border border-slate-200 placeholder-slate-400 text-slate-800 bg-white rounded-xl focus:outline-none focus:ring-2 focus:ring-sky-500 focus:border-transparent sm:text-sm transition-all duration-200"
                placeholder="Confirm Password"
                value={formData.passwordConfirmation}
                onChange={handleChange}
              />
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={isLoading}
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-semibold rounded-xl text-white bg-gradient-to-r from-sky-500 to-indigo-500 hover:from-sky-600 hover:to-indigo-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sky-500 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sky-500/25 transition-all duration-200"
            >
              {isLoading ? 'Creating account...' : 'Create account'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
