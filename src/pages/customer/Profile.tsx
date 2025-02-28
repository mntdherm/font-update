import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUser, updateUser } from '../../lib/db';
import { Loader2 } from 'lucide-react';
import CustomerLayout from './Layout';

const CustomerProfile = () => {
  const { currentUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [profileData, setProfileData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    licensePlate: ''
  });

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        if (userData) {
          setProfileData({
            firstName: userData.firstName || '',
            lastName: userData.lastName || '',
            email: userData.email || '',
            phone: userData.phone || '',
            licensePlate: userData.licensePlate || ''
          });
        }
      }
    };
    loadUserData();
  }, [currentUser]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      await updateUser(currentUser.uid, profileData);

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError('Profiilin päivitys epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CustomerLayout>
      <div className="bg-gray-100 min-h-screen px-4 py-8 font-sans">
        <div className="max-w-md mx-auto bg-white rounded-2xl shadow-sm overflow-hidden">
          <div className="px-6 py-8">
            <h2 className="text-4xl font-normal text-gray-900 mb-8">Profiilitiedot</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-5">
                <div>
                  <label className="block text-lg font-normal text-gray-700 mb-2 font-poppins">Etunimi</label>
                  <input
                    type="text"
                    value={profileData.firstName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-lg font-poppins"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-normal text-gray-700 mb-2 font-poppins">Sukunimi</label>
                  <input
                    type="text"
                    value={profileData.lastName}
                    onChange={(e) => setProfileData(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-lg font-poppins"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-normal text-gray-700 mb-2 font-poppins">Rekisterinumero</label>
                  <input
                    type="text"
                    value={profileData.licensePlate}
                    onChange={(e) => setProfileData(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-lg font-poppins"
                    placeholder="ABC-123"
                    required
                  />
                </div>

                <div>
                  <label className="block text-lg font-normal text-gray-700 mb-2 font-poppins">Sähköposti</label>
                  <input
                    type="email"
                    value={profileData.email}
                    disabled
                    className="w-full px-4 py-3 rounded-xl border border-gray-200 bg-gray-100 text-gray-500 cursor-not-allowed text-lg font-poppins"
                  />
                </div>

                <div>
                  <label className="block text-lg font-normal text-gray-700 mb-2 font-poppins">Puhelinnumero</label>
                  <input
                    type="tel"
                    value={profileData.phone}
                    onChange={(e) => setProfileData(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-4 py-3 rounded-xl border border-gray-300 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-shadow text-lg font-poppins"
                    placeholder="+358"
                    required
                  />
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded-md">
                  <p className="text-lg text-red-700 font-poppins">{error}</p>
                </div>
              )}

              {success && (
                <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-md">
                  <p className="text-lg text-green-700 font-poppins">Profiili päivitetty onnistuneesti!</p>
                </div>
              )}

              <div className="pt-6">
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-4 py-3 bg-[#e5e7eb] text-gray-800 rounded-xl text-xl hover:bg-gray-300 active:bg-gray-400 transition-colors duration-200 ease-in-out disabled:opacity-50 disabled:cursor-not-allowed font-madimi"
                >
                  {loading ? (
                    <Loader2 className="animate-spin h-6 w-6 mx-auto" />
                  ) : (
                    'Tallenna muutokset'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
};

export default CustomerProfile;
