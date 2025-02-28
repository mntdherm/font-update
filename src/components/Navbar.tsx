import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUser } from '../lib/db';
import { Car, LogOut, Menu, X, User, Store, Package, Tag, Coins, Calendar } from 'lucide-react';

const Navbar = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [isMenuOpen, setIsMenuOpen] = React.useState(false);
  const [isAvatarMenuOpen, setIsAvatarMenuOpen] = React.useState(false);
  const [userRole, setUserRole] = React.useState<string | null>(null);
  const menuRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const loadUserRole = async () => {
      if (currentUser) {
        const userData = await getUser(currentUser.uid);
        setUserRole(userData?.role || null);
      } else {
        setUserRole(null);
      }
    };
    loadUserRole();
  }, [currentUser]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsAvatarMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
      setIsMenuOpen(false);
      setIsAvatarMenuOpen(false);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  const renderMenuItems = () => {
    switch (userRole) {
      case 'customer':
        return (
          <>
            <Link
              to="/customer/profile"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsAvatarMenuOpen(false)}
            >
              <User className="w-5 h-5 mr-3 text-gray-400" />
              Profiili
            </Link>
            <Link
              to="/customer/coins"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsAvatarMenuOpen(false)}
            >
              <Coins className="w-5 h-5 mr-3 text-gray-400" />
              Kolikot
            </Link>
            <Link
              to="/customer/appointments"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsAvatarMenuOpen(false)}
            >
              <Calendar className="w-5 h-5 mr-3 text-gray-400" />
              Varaukset
            </Link>
          </>
        );
      case 'vendor':
        return (
          <>
            <Link
              to="/vendor-dashboard"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsAvatarMenuOpen(false)}
            >
              <Store className="w-5 h-5 mr-3 text-gray-400" />
              Kojelauta
            </Link>
            <Link
              to="/vendor-offers"
              className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
              onClick={() => setIsAvatarMenuOpen(false)}
            >
              <Package className="w-5 h-5 mr-3 text-gray-400" />
              Tarjoukset
            </Link>
          </>
        );
      case 'admin':
        return (
          <Link
            to="/admin"
            className="flex items-center px-4 py-2 text-gray-700 hover:bg-gray-50"
            onClick={() => setIsAvatarMenuOpen(false)}
          >
            <Tag className="w-5 h-5 mr-3 text-gray-400" />
            Hallintapaneeli
          </Link>
        );
      default:
        return null;
    }
  };

  return (
    <nav className="bg-white/80 shadow-sm relative ios-blur fixed top-0 left-0 right-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center space-x-2">
              <Car className="h-6 w-6 text-ios-blue stroke-[1.5]" />
              <span className="text-xl font-bold text-gray-900">AutoPesu Pro</span>
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
            >
              {isMenuOpen ? (
                <X className="h-5 w-5 stroke-[1.5]" />
              ) : (
                <Menu className="h-5 w-5 stroke-[1.5]" />
              )}
            </button>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4">
            {!currentUser ? (
              <>
                <Link
                  to="/login"
                  className="text-gray-700 hover:text-blue-600 px-3 py-2 rounded-md text-sm font-medium"
                >
                  Kirjaudu
                </Link>
                <Link
                  to="/register"
                  className="bg-ios-blue text-white px-4 py-2 rounded-ios text-sm font-medium hover:opacity-90 transition-opacity ios-btn-active"
                >
                  Rekisteröidy
                </Link>
              </>
            ) : (
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsAvatarMenuOpen(!isAvatarMenuOpen)}
                  className="w-10 h-10 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center transition-colors"
                >
                  <User className="w-5 h-5 text-gray-600" />
                </button>

                {isAvatarMenuOpen && (
                  <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-100 py-2 z-50">
                    {renderMenuItems()}
                    <button
                      onClick={handleLogout}
                      className="w-full flex items-center px-4 py-2 text-red-600 hover:bg-red-50"
                    >
                      <LogOut className="w-5 h-5 mr-3" />
                      Kirjaudu ulos
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
      
      {/* Mobile Navigation */}
      <div className={`md:hidden ${isMenuOpen ? 'block' : 'hidden'}`}>
        <div className="absolute top-16 inset-x-0 bg-white border-b shadow-lg">
          <div className="px-2 pt-2 pb-3 space-y-1">
            {currentUser ? (
              <>
                {renderMenuItems()}
                <button
                  onClick={handleLogout}
                  className="w-full text-left px-3 py-2 rounded-md text-base font-medium text-red-600 hover:bg-red-50"
                >
                  Kirjaudu ulos
                </button>
              </>
            ) : (
              <>
                <Link
                  to="/login"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Kirjaudu
                </Link>
                <Link
                  to="/register"
                  onClick={() => setIsMenuOpen(false)}
                  className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-blue-600 hover:bg-gray-50"
                >
                  Rekisteröidy
                </Link>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
