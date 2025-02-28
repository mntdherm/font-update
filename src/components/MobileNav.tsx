import React, { useState, useRef, useEffect } from 'react';
import { Car, Search, User, LogIn, LogOut, Tag, X, Store, Package, Coins, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../lib/db';
import SearchPopup from './SearchPopup';
import { useNavigate, useLocation } from 'react-router-dom';

const MobileNav = () => {
  const [showMenu, setShowMenu] = useState(false);
  const [showSearch, setShowSearch] = useState(false);
  const { currentUser, logout } = useAuth();
  const [userRole, setUserRole] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadUserRole = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        setUserRole(userData?.role || null);
      }
    }
    loadUserRole();
  }, [currentUser]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <>
      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-lg border-t py-2 px-6 md:hidden ios-blur">
        <div className="flex justify-between items-center max-w-md mx-auto">
          {/* Home - For All */}
          <button 
            onClick={() => {
              if (location.pathname === '/') {
                window.scrollTo({ top: 0, behavior: 'smooth' });
              } else {
                navigate('/');
              }
            }}
            className="p-2 text-ios-blue ios-btn-active"
          >
            <Car className="w-6 h-6" />
          </button>

          {/* Search - For All */}
          <button 
            onClick={() => {
              setShowSearch(true);
            }}
            className="p-2 text-gray-400"
          >
            <Search className="w-6 h-6" />
          </button>

          {/* Profile/Login Button */}
          {currentUser ? (
            <button 
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 text-gray-400"
            >
              <User className="w-6 h-6" />
            </button>
          ) : (
            <button 
              onClick={() => navigate('/login')}
              className="p-2 text-gray-400"
            >
              <LogIn className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      {/* User Menu */}
      {showMenu && (
        <div className="fixed inset-0 bg-black/50 z-50 animate-[fadeIn_0.2s_ease-out] md:hidden">
          {/* Menu Content */}
          {/* Menu Content */}
          <div ref={menuRef} className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl p-4 space-y-2">
            <div className="flex items-center justify-between mb-4 pb-2 border-b">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{currentUser?.displayName || 'Käyttäjä'}</h3>
                <p className="text-sm text-gray-500">{currentUser?.email}</p>
              </div>
              <button 
                onClick={() => setShowMenu(false)}
                className="p-2 hover:bg-gray-100 rounded-full"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Customer Options */}
            {userRole === 'customer' && (
              <>
                <button 
                  onClick={() => {
                    navigate('/customer/profile');
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
                >
                  <User className="w-5 h-5 mr-3 text-gray-400" />
                  Profiili
                </button>
                <button 
                  onClick={() => {
                    navigate('/customer/coins');
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
                >
                  <Coins className="w-5 h-5 mr-3 text-gray-400" />
                  Kolikot
                </button>
                <button 
                  onClick={() => {
                    navigate('/customer/appointments');
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
                >
                  <Calendar className="w-5 h-5 mr-3 text-gray-400" />
                  Varaukset
                </button>
              </>
            )}

            {/* Vendor Options */}
            {userRole === 'vendor' && (
              <>
                <button 
                  onClick={() => {
                    navigate('/vendor-dashboard');
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
                >
                  <Store className="w-5 h-5 mr-3 text-gray-400" />
                  Kojelauta
                </button>
                <button 
                  onClick={() => {
                    navigate('/vendor-offers');
                    setShowMenu(false);
                  }}
                  className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
                >
                  <Package className="w-5 h-5 mr-3 text-gray-400" />
                  Tarjoukset
                </button>
              </>
            )}

            {/* Admin Options */}
            {userRole === 'admin' && (
              <button 
                onClick={() => {
                  navigate('/admin');
                  setShowMenu(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center"
              >
                <Tag className="w-5 h-5 mr-3 text-gray-400" />
                Hallintapaneeli
              </button>
            )}

            {/* Logout Button - For Authenticated Users */}
            {currentUser && (
              <button 
                onClick={() => {
                  handleLogout();
                  setShowMenu(false);
                }}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg flex items-center text-red-500"
              >
                <LogOut className="w-5 h-5 mr-3" />
                Kirjaudu ulos
              </button>
            )}
          </div>
        </div>
      )}

      {/* Search Popup */}
      <SearchPopup 
        isOpen={showSearch}
        onClose={() => setShowSearch(false)}
      />
    </>
  );
};

export default MobileNav;
