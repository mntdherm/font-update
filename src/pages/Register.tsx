import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { createVendor } from '../lib/db';
import { UserPlus, Mail, Lock, Building2, MapPin, Phone, AlertCircle, Loader2, Store, User, Check, X } from 'lucide-react';

const Register = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isVendor, setIsVendor] = useState(false);
  const [passwordsMatch, setPasswordsMatch] = useState(true);
  const [businessName, setBusinessName] = useState('');
  const [businessId, setBusinessId] = useState('');
  const [address, setAddress] = useState('');
  const [phone, setPhone] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [passwordStrength, setPasswordStrength] = useState({
    score: 0,
    hasMinLength: false,
    hasUpperCase: false,
    hasLowerCase: false,
    hasNumber: false,
    hasSpecialChar: false
  });
  const navigate = useNavigate();
  const { signup } = useAuth();

  const checkPasswordStrength = (password: string) => {
    const hasMinLength = password.length >= 6;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecialChar = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    let score = 0;
    if (hasMinLength) score++;
    if (hasUpperCase) score++;
    if (hasLowerCase) score++;
    if (hasNumber) score++;
    if (hasSpecialChar) score++;

    setPasswordStrength({
      score,
      hasMinLength,
      hasUpperCase,
      hasLowerCase,
      hasNumber,
      hasSpecialChar
    });
  };

  const validateForm = () => {
    const errors: Record<string, string> = {};

    // Email validation
    if (!email) {
      errors.email = 'Sähköposti on pakollinen';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.email = 'Virheellinen sähköpostiosoite';
    }

    // Password validation
    if (!password) {
      errors.password = 'Salasana on pakollinen';
    } else if (password.length < 6) {
      errors.password = 'Salasanan tulee olla vähintään 6 merkkiä';
    }

    // Confirm password validation
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Salasanat eivät täsmää';
    }

    // Vendor specific validations
    if (isVendor) {
      if (!businessName.trim()) {
        errors.businessName = 'Yrityksen nimi on pakollinen';
      }

      if (!businessId.trim()) {
        errors.businessId = 'Y-tunnus on pakollinen';
      } else if (!/^[0-9]{7}-[0-9]$/.test(businessId)) {
        errors.businessId = 'Virheellinen Y-tunnus (muoto: 1234567-8)';
      }

      if (!address.trim()) {
        errors.address = 'Osoite on pakollinen';
      }

      if (!phone.trim()) {
        errors.phone = 'Puhelinnumero on pakollinen';
      } else if (!/^(\+358|0)[0-9]{6,9}$/.test(phone.replace(/\s/g, ''))) {
        errors.phone = 'Virheellinen puhelinnumero';
      }
    }

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      setError('');
      setLoading(true);
      const userCredential = await signup(email, password, isVendor); // Pass isVendor to signup
      
      if (isVendor && userCredential) {
        await createVendor({
          userId: userCredential.user.uid,
          businessName,
          businessId,
          address,
          phone,
          services: [],
          operatingHours: {
            monday: { open: '09:00', close: '17:00' },
            tuesday: { open: '09:00', close: '17:00' },
            wednesday: { open: '09:00', close: '17:00' },
            thursday: { open: '09:00', close: '17:00' },
            friday: { open: '09:00', close: '17:00' }
          }
        });
        navigate('/vendor-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.message || 'Tilin luonti epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-xl overflow-hidden">
        {/* Tabs at top */}
        <div className="flex">
          <Link
            to="/login"
            className="flex-1 py-4 text-center text-gray-500 hover:text-gray-700 border-b"
          >
            Sign in
          </Link>
          <div
            className="flex-1 py-4 text-center bg-blue-600 text-white font-medium"
          >
            Register
          </div>
        </div>

        <div className="p-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-blue-100 mb-4">
            <User className="w-10 h-10 text-blue-600" />
          </div>
          <h2 className="text-2xl font-semibold text-gray-900">Create Account</h2>
        </div>

        {error && (
          <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded animate-[fadeIn_0.2s_ease-out]">
            <div className="flex">
              <div className="flex-shrink-0">
                <AlertCircle className="h-5 w-5 text-red-400" />
              </div>
              <div className="ml-3">
                <p className="text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {/* Account Type Selection */}
          <div className="grid grid-cols-2 gap-4">
            <div
              onClick={() => setIsVendor(false)}
              className={`relative p-4 text-center rounded-xl cursor-pointer transition-all ${
                !isVendor ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <User className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Customer</span>
              {!isVendor && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
            <div
              onClick={() => setIsVendor(true)}
              className={`relative p-4 text-center rounded-xl cursor-pointer transition-all ${
                isVendor ? 'bg-blue-600 text-white shadow-lg scale-[1.02]' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              <Store className="w-6 h-6 mx-auto mb-1" />
              <span className="text-sm font-medium">Business</span>
              {isVendor && (
                <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-500 rounded-full flex items-center justify-center">
                  <Check className="w-3 h-3 text-white" />
                </div>
              )}
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                <span className="flex items-center">
                  <Mail className="w-4 h-4 mr-2" />
                  Sähköposti
                </span>
              </label>
              <input
                id="email"
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={`mt-1 block w-full rounded-xl py-3 px-4 bg-gray-100 border-0 focus:bg-white focus:ring-2 ${
                  validationErrors.email ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {validationErrors.email && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.email}</p>
              )}
            </div>

            {isVendor && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Yrityksen nimi</label>
                  <input
                    type="text"
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.businessName ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required={isVendor}
                  />
                  {validationErrors.businessName && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.businessName}</p>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Y-tunnus</label>
                  <input
                    type="text"
                    value={businessId}
                    onChange={(e) => setBusinessId(e.target.value)}
                    placeholder="1234567-8"
                    pattern="^[0-9]{7}-[0-9]$"
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.businessId ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required={isVendor}
                  />
                  {validationErrors.businessId && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.businessId}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Syötä Y-tunnus muodossa 1234567-8
                  </p>
                </div>

                <div>
                  <label htmlFor="address" className="block text-sm font-medium text-gray-700">Osoite</label>
                  <input
                    type="text"
                    value={address}
                    onChange={(e) => setAddress(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                      validationErrors.address ? 'border-red-300' : 'border-gray-300'
                    }`}
                    required={isVendor}
                  />
                  {validationErrors.address && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.address}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium text-gray-700">Puhelinnumero</label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${validationErrors.phone ? 'border-red-300' : 'border-gray-300'}`}
                    placeholder="+358401234567"
                    required={isVendor}
                  />
                  {validationErrors.phone && (
                    <p className="mt-1 text-sm text-red-600">{validationErrors.phone}</p>
                  )}
                  <p className="mt-1 text-sm text-gray-500">
                    Esim. +358401234567 tai 0401234567
                  </p>
                </div>
              </>
            )}

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700">Salasana</label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  checkPasswordStrength(e.target.value);
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  validationErrors.password ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex space-x-1 mb-1">
                    {[1, 2, 3, 4, 5].map((level) => (
                      <div
                        key={level}
                        className={`h-2 w-full rounded-full transition-colors ${
                          passwordStrength.score >= level
                            ? level <= 2
                              ? 'bg-red-500'
                              : level <= 3
                              ? 'bg-yellow-500'
                              : 'bg-green-500'
                            : 'bg-gray-200'
                        }`}
                      />
                    ))}
                  </div>
                  <div className="text-xs text-gray-500">
                    Salasanan vahvuus: {' '}
                    <span className={
                      passwordStrength.score <= 2
                        ? 'text-red-600 font-medium'
                        : passwordStrength.score <= 3
                        ? 'text-yellow-600 font-medium'
                        : 'text-green-600 font-medium'
                    }>
                      {passwordStrength.score <= 2
                        ? 'Heikko'
                        : passwordStrength.score <= 3
                        ? 'Kohtalainen'
                        : 'Vahva'}
                    </span>
                  </div>
                  <ul className="mt-2 space-y-1 text-xs">
                    <li className={`flex items-center ${passwordStrength.hasMinLength ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.hasMinLength ? '✓' : '○'} Vähintään 6 merkkiä
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasUpperCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.hasUpperCase ? '✓' : '○'} Sisältää ison kirjaimen
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasLowerCase ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.hasLowerCase ? '✓' : '○'} Sisältää pienen kirjaimen
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasNumber ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.hasNumber ? '✓' : '○'} Sisältää numeron
                    </li>
                    <li className={`flex items-center ${passwordStrength.hasSpecialChar ? 'text-green-600' : 'text-gray-500'}`}>
                      {passwordStrength.hasSpecialChar ? '✓' : '○'} Sisältää erikoismerkin
                    </li>
                  </ul>
                </div>
              )}
              {validationErrors.password && (
                <p className="mt-1 text-sm text-red-600">{validationErrors.password}</p>
              )}
            </div>

            <div>
              <label htmlFor="confirm-password" className="block text-sm font-medium text-gray-700">Vahvista salasana</label>
              <input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  const newValue = e.target.value;
                  setConfirmPassword(newValue);
                  setPasswordsMatch(newValue === password || newValue === '');
                }}
                className={`mt-1 block w-full rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 ${
                  !passwordsMatch ? 'border-red-300' : 'border-gray-300'
                }`}
                required
              />
              {!passwordsMatch && confirmPassword !== '' && (
                <p className="mt-1 text-sm text-red-600">Salasanat eivät täsmää</p>
              )}
            </div>
          </div>

          <div>
            <button
              type="submit"
              disabled={loading}
              className="w-full flex justify-center items-center py-3 px-4 rounded-xl
                text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 
                focus:outline-none focus:ring-2 focus:ring-blue-500
                disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                  Luodaan tiliä...
                </>
              ) : (
                'Luo tili'
              )}
            </button>
          </div>
        </form>
        </div>
      </div>
    </div>
  );
};

export default Register;
