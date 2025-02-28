import React, { useState, useEffect } from 'react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, startOfWeek, endOfWeek, isBefore, startOfToday } from 'date-fns';
import { fi } from 'date-fns/locale';
import { Calendar, Clock, CreditCard, X, ChevronRight, ChevronLeft, Check, UserIcon, Coins, LogIn } from 'lucide-react';
import type { Service, Vendor, User as UserType, Offer } from '../types/database';
import { createAppointment, getUser, getVendorOffers } from '../lib/db';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const getDayOperatingHours = (date: Date, vendor: Vendor) => {
  const dayName = format(date, 'EEEE').toLowerCase();
  return vendor.operatingHours[dayName] || { open: '09:00', close: '17:00' };
};

interface BookingModalProps {
  isOpen: boolean;
  onClose: () => void;
  service: Service;
  vendorId: string;
  vendor: Vendor;
}

type Step = 'date' | 'time' | 'details' | 'signup' | 'confirm';

interface CustomerDetails {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  licensePlate: string;
  password?: string;
}

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

const BookingModal: React.FC<BookingModalProps> = ({ isOpen, onClose, service, vendorId, vendor }) => {
  const { currentUser, signup } = useAuth();
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState<Step>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [useCoins, setUseCoins] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [bookingComplete, setBookingComplete] = useState(false);
  const [userData, setUserData] = useState<UserType | null>(null);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [customerDetails, setCustomerDetails] = useState<CustomerDetails>({
    firstName: '',
    lastName: '',
    email: currentUser?.email || '',
    phone: '',
    licensePlate: '',
    password: ''
  });

  if (!isOpen) return null;

  useEffect(() => {
    const loadUserData = async () => {
      if (currentUser) {
        const [user, vendorOffers] = await Promise.all([
          getUser(currentUser.uid),
          getVendorOffers(vendorId)
        ]);
        setUserData(user);
        setOffers(vendorOffers.filter(o => o.active));
      }
    };
    loadUserData();
  }, [currentUser, vendorId]);

  const getServiceDiscount = () => {
    const activeOffer = offers.find(o => 
      o.serviceId === service.id && 
      new Date(o.startDate) <= new Date() && 
      new Date(o.endDate) >= new Date()
    );
    return activeOffer?.discountPercentage || 0;
  };

  const getDiscountedPrice = () => {
    const discount = getServiceDiscount();
    return discount > 0 
      ? service.price * (1 - discount / 100)
      : service.price;
  };

  const handleSubmit = async () => {
    if (!selectedDate || !selectedTime) {
      setError('Valitse päivä ja aika');
      return;
    }

    if (!customerDetails.firstName || !customerDetails.lastName || !customerDetails.email || 
        !customerDetails.phone || !customerDetails.licensePlate) {
      setError('Täytä kaikki asiakastiedot');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      let userId = currentUser?.uid;

      // If user is not authenticated, create an account
      if (!currentUser && customerDetails.password) {
        try {
          const userCredential = await signup(customerDetails.email, customerDetails.password);
          userId = userCredential.user.uid;
        } catch (err: any) {
          // Check if the error is due to existing email
          if (err.code === 'auth/email-already-in-use') {
            setShowLoginPrompt(true);
            setError('Sähköposti on jo käytössä. Kirjaudu sisään jatkaaksesi.');
            return;
          }
          throw err;
        }
      }

      if (!userId) {
        setError('Kirjautuminen epäonnistui');
        return;
      }

      const dateTime = new Date(selectedDate);
      const [hours, minutes] = selectedTime.split(':');
      dateTime.setHours(parseInt(hours), parseInt(minutes));

      // Validate coin usage
      if (useCoins) {
        if (!userData || useCoins > userData.wallet.coins) {
          setError('Ei tarpeeksi kolikoita');
          return;
        }
      }

      const appointmentData = {
        customerId: userId,
        vendorId,
        serviceId: service.id,
        date: dateTime,
        status: 'confirmed',
        totalPrice: useCoins 
          ? Math.max(0, getDiscountedPrice() - (Math.min(
              userData?.wallet.coins || 0,
              Math.floor(getDiscountedPrice() / 0.5)
            ) * 0.5))
          : getDiscountedPrice(),
        customerDetails: {
          firstName: customerDetails.firstName,
          lastName: customerDetails.lastName,
          email: customerDetails.email,
          phone: customerDetails.phone,
          licensePlate: customerDetails.licensePlate
        }
      };

      await createAppointment(appointmentData, useCoins ? Math.min(
        userData?.wallet.coins || 0,
        Math.floor(service.price / 0.5)
      ) : 0);

      setBookingComplete(true);
      // Redirect to home page after 3 seconds
      setTimeout(() => {
        navigate('/');
        onClose();
      }, 3000);

    } catch (err) {
      console.error('Booking error:', err);
      setError('Varauksen luonti epäonnistui. Yritä uudelleen.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = () => {
    // Store booking details in session storage
    const bookingDetails = {
      service,
      vendorId,
      selectedDate,
      selectedTime,
      customerDetails
    };
    sessionStorage.setItem('pendingBooking', JSON.stringify(bookingDetails));
    
    // Redirect to login page
    navigate('/login');
  };

  const getAvailableTimes = () => {
    if (!selectedDate) return [];

    const hours = getDayOperatingHours(selectedDate, vendor);
    
    // If closed, return empty array
    if (hours.open === 'closed' && hours.close === 'closed') {
      return [];
    }

    // If 24h operation
    if (hours.open === '00:00' && hours.close === '23:59') {
      return Array.from({ length: 48 }, (_, i) => {
        const hour = Math.floor(i / 2);
        const minute = i % 2 === 0 ? '00' : '30';
        return `${hour.toString().padStart(2, '0')}:${minute}`;
      });
    }

    // Parse operating hours
    const [openHour, openMinute = '0'] = hours.open.split(':');
    const [closeHour, closeMinute = '0'] = hours.close.split(':');
    const startTime = parseInt(openHour) * 60 + parseInt(openMinute);
    const endTime = parseInt(closeHour) * 60 + parseInt(closeMinute);

    const times = [];
    for (let time = startTime; time < endTime; time += 30) {
      const hour = Math.floor(time / 60);
      const minute = time % 60;
      times.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    }

    return times;
  };

  const hasAvailableTimes = (date: Date) => {
    const hours = getDayOperatingHours(date, vendor);
    return !(hours.open === 'closed' && hours.close === 'closed');
  };

  const nextStep = () => {
    if (currentStep === 'date' && selectedDate) {
      setCurrentStep('time');
    } else if (currentStep === 'time' && selectedTime) {
      setCurrentStep('details');
    } else if (currentStep === 'details' && 
               customerDetails.firstName && 
               customerDetails.lastName && 
               customerDetails.email && 
               customerDetails.phone && 
               customerDetails.licensePlate) {
      if (!currentUser) {
        setCurrentStep('signup');
      } else {
        setCurrentStep('confirm');
      }
    } else if (currentStep === 'signup' && customerDetails.password) {
      setCurrentStep('confirm');
    }
  };

  const prevStep = () => {
    if (currentStep === 'time') {
      setCurrentStep('date');
    } else if (currentStep === 'details') {
      setCurrentStep('time');
    } else if (currentStep === 'signup') {
      setCurrentStep('details');
    } else if (currentStep === 'confirm') {
      setCurrentStep(currentUser ? 'details' : 'signup');
    }
  };

  const nextMonth = () => {
    setCurrentMonth(addMonths(currentMonth, 1));
  };

  const prevMonth = () => {
    setCurrentMonth(subMonths(currentMonth, 1));
  };

  const renderDateStep = () => {
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(monthStart);
    const startDate = startOfWeek(monthStart, { weekStartsOn: 1 });
    const endDate = endOfWeek(monthEnd, { weekStartsOn: 1 });
    const today = startOfToday();

    const days = eachDayOfInterval({ start: startDate, end: endDate });

    return (
      <div className="p-4">
        <div className="flex items-center justify-between mb-8">
          <button
            onClick={prevMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <h2 className="text-xl font-semibold">
            {format(currentMonth, 'MMMM yyyy', { locale: fi })}
          </h2>
          <button
            onClick={nextMonth}
            className="p-2 hover:bg-gray-100 rounded-full"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-7 gap-1 mb-2">
          {WEEKDAYS.map(day => (
            <div key={day} className="text-center text-sm font-medium text-gray-500">
              {day}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-7 gap-1">
          {days.map(day => {
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            const isCurrentMonth = isSameMonth(day, currentMonth);
            const isPast = isBefore(day, today);
            const isAvailable = hasAvailableTimes(day);

            return (
              <div
                key={day.toString()}
                className={`
                  relative p-2 text-center
                  ${!isCurrentMonth && 'opacity-30'}
                  ${isPast && 'opacity-30 cursor-not-allowed'}
                `}
              >
                <button
                  onClick={() => !isPast && setSelectedDate(day)}
                  disabled={isPast || !isCurrentMonth}
                  className={`
                    w-full aspect-square flex flex-col items-center justify-center rounded-lg
                    ${isSelected ? 'bg-blue-600 text-white' : 'hover:bg-gray-100'}
                    ${isPast || !isCurrentMonth ? 'cursor-not-allowed' : 'cursor-pointer'}
                  `}
                >
                  <span className={`text-sm ${isToday(day) && 'font-bold'}`}>
                    {format(day, 'd')}
                  </span>
                  {isAvailable && (
                    <div className="mt-1 h-1 w-4 bg-green-500 rounded-full mx-auto"></div>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderTimeStep = () => {
    const times = getAvailableTimes();

    if (times.length === 0) {
      return (
        <div className="p-4 text-center">
          <p className="text-gray-600">Valitettavasti tämä päivä on suljettu.</p>
          <button
            onClick={() => setCurrentStep('date')}
            className="mt-4 text-blue-600 hover:text-blue-800"
          >
            Valitse toinen päivä
          </button>
        </div>
      );
    }

    return (
      <div className="p-4">
        <div className="text-center mb-6">
          <h3 className="text-lg font-medium">
            {selectedDate && format(selectedDate, 'EEEE d.M.yyyy', { locale: fi })}
          </h3>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
          {times.map(time => {
            const isSelected = time === selectedTime;

            return (
              <button
                key={time}
                onClick={() => setSelectedTime(time)}
                className={`
                  p-3 rounded-lg text-center transition-colors
                  ${isSelected ? 'bg-blue-600 text-white' : 'bg-gray-50 hover:bg-gray-100'}
                `}
              >
                <span className="text-lg">{time}</span>
              </button>
            );
          })}
        </div>
      </div>
    );
  };

  const renderDetailsStep = () => {
    return (
      <div className="p-4">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Etunimi</label>
              <input
                type="text"
                value={customerDetails.firstName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, firstName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Sukunimi</label>
              <input
                type="text"
                value={customerDetails.lastName}
                onChange={(e) => setCustomerDetails(prev => ({ ...prev, lastName: e.target.value }))}
                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Rekisterinumero</label>
            <input
              type="text"
              value={customerDetails.licensePlate}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, licensePlate: e.target.value.toUpperCase() }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="ABC-123"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Sähköposti</label>
            <input
              type="email"
              value={customerDetails.email}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, email: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Puhelinnumero</label>
            <input
              type="tel"
              value={customerDetails.phone}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, phone: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="+358"
              required
            />
          </div>
        </div>
      </div>
    );
  };

  const renderSignupStep = () => {
    return (
      <div className="p-4">
        <div className="bg-blue-50 p-6 rounded-lg mb-6">
          <div className="flex items-center space-x-3 text-blue-700">
            <Coins className="h-6 w-6" />
            <h3 className="font-semibold text-lg">Liity jäseneksi ja saa 10 kolikkoa!</h3>
          </div>
          <p className="mt-2 text-sm text-blue-600">
            Aseta salasana tilillesi ja saat heti 10 kolikkoa käyttöösi. 
            Voit käyttää kolikoita alennuksiin tulevissa varauksissa.
          </p>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Sähköposti</label>
            <input
              type="email"
              value={customerDetails.email}
              disabled
              className="mt-1 block w-full rounded-md border-gray-300 bg-gray-50 shadow-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Salasana</label>
            <input
              type="password"
              value={customerDetails.password}
              onChange={(e) => setCustomerDetails(prev => ({ ...prev, password: e.target.value }))}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
              placeholder="Vähintään 6 merkkiä"
              required
              minLength={6}
            />
          </div>
        </div>
      </div>
    );
  };

  const renderConfirmStep = () => {
    if (!selectedDate || !selectedTime) return null;

    return (
      <div className="p-4">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="font-semibold text-lg mb-4">Varauksen tiedot</h3>
          <div className="space-y-4">
            {currentUser && userData && userData.wallet.coins > 0 && (
              <div className="bg-yellow-50 p-4 rounded-lg mb-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-yellow-600 mr-2" />
                    <span className="text-sm text-yellow-700">Käytettävissä: {userData.wallet.coins} kolikkoa</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUseCoins(!useCoins)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      useCoins 
                        ? 'bg-green-500 text-white hover:bg-green-600'
                        : 'bg-yellow-500 text-white hover:bg-yellow-600'
                    }`}
                  >
                    {useCoins ? 'Kolikot käytössä' : 'Käytä kolikot'}
                  </button>
                </div>
                {useCoins && (
                  <div className="mt-3 text-sm text-yellow-600">
                    <p>Käytetään {Math.min(
                      userData.wallet.coins,
                      Math.floor(service.price / 0.5)
                    )} kolikkoa = {(Math.min(
                      userData.wallet.coins,
                      Math.floor(service.price / 0.5)
                    ) * 0.5).toFixed(2)}€ alennus</p>
                  </div>
                )}
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Palvelu</span>
              <span className="font-medium text-gray-900">{service.name}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Päivämäärä</span>
              <span className="font-medium text-gray-900">
                {format(selectedDate, 'd.M.yyyy')}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Aika</span>
              <span className="font-medium text-gray-900">{selectedTime}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Kesto</span>
              <span className="font-medium text-gray-900">{service.duration} min</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Asiakas</span>
              <span className="font-medium text-gray-900">{customerDetails.firstName} {customerDetails.lastName}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-gray-600">Rekisterinumero</span>
              <span className="font-medium text-gray-900">{customerDetails.licensePlate}</span>
            </div>
            
            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="font-semibold">Yhteensä</span>
                <div className="text-right">
                  {useCoins && (
                    <div className="text-sm text-gray-500 line-through mb-1">
                      {getDiscountedPrice().toFixed(2)}€
                    </div>
                  )}
                  <span className="font-semibold text-lg text-gray-900">
                    {useCoins 
                      ? Math.max(0, getDiscountedPrice() - (Math.min(
                          userData?.wallet.coins || 0,
                          Math.floor(getDiscountedPrice() / 0.5)
                        ) * 0.5)).toFixed(2)
                      : getDiscountedPrice().toFixed(2)
                    }€
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderSuccessStep = () => (
    <div className="p-8 text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-2">
        Varaus vahvistettu!
      </h3>
      <p className="text-gray-600 mb-4">
        Lähetimme varausvahvistuksen sähköpostiisi. Nähdään pian!
      </p>
      <div className="animate-pulse text-sm text-gray-500">
        Sinut ohjataan kojelaudalle...
      </div>
    </div>
  );

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="border-b p-4">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-bold">Varaa aika</h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          {/* Progress Steps */}
          <div className="flex items-center mt-4">
            {/* Date Step */}
            <div className={`flex items-center ${currentStep === 'date' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 
                ${currentStep === 'date' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                <Calendar className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Päivä</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>

            {/* Time Step */}
            <div className={`flex items-center ${currentStep === 'time' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                ${currentStep === 'time' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                <Clock className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Aika</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>

            {/* Details Step */}
            <div className={`flex items-center ${currentStep === 'details' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                ${currentStep === 'details' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                <UserIcon className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Tiedot</span>
            </div>
            <div className="flex-1 h-px bg-gray-300 mx-2"></div>

            {/* Signup Step (only for non-authenticated users) */}
            {!currentUser && (
              <>
                <div className={`flex items-center ${currentStep === 'signup' ? 'text-blue-600' : 'text-gray-500'}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                    ${currentStep === 'signup' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                    <Coins className="w-4 h-4" />
                  </div>
                  <span className="ml-2 text-sm">Liity</span>
                </div>
                <div className="flex-1 h-px bg-gray-300 mx-2"></div>
              </>
            )}

            {/* Confirm Step */}
            <div className={`flex items-center ${currentStep === 'confirm' ? 'text-blue-600' : 'text-gray-500'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2
                ${currentStep === 'confirm' ? 'border-blue-600 bg-blue-50' : 'border-gray-300'}`}>
                <Check className="w-4 h-4" />
              </div>
              <span className="ml-2 text-sm">Vahvista</span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto">
          {bookingComplete ? renderSuccessStep() : (
            <>
          {currentStep === 'date' && renderDateStep()}
          {currentStep === 'time' && renderTimeStep()}
          {currentStep === 'details' && renderDetailsStep()}
          {currentStep === 'signup' && renderSignupStep()}
          {currentStep === 'confirm' && renderConfirmStep()}
            </>
          )}

          {error && (
            <div className="m-4 bg-red-50 border-l-4 border-red-400 p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <X className="h-5 w-5 text-red-400" />
                </div>
                <div className="ml-3">
                  <p className="text-sm text-red-700">{error}</p>
                  {showLoginPrompt && (
                    <button
                      onClick={handleLogin}
                      className="mt-2 flex items-center text-blue-600 hover:text-blue-800"
                    >
                      <LogIn className="h-4 w-4 mr-1" />
                      Kirjaudu sisään
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {!bookingComplete && (
        <div className="border-t p-4 bg-gray-50">
          <div className="flex justify-between">
            {currentStep !== 'date' ? (
              <button
                onClick={prevStep}
                className="flex items-center px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                <ChevronLeft className="w-5 h-5 mr-1" />
                Edellinen
              </button>
            ) : (
              <div></div>
            )}

            {currentStep !== 'confirm' ? (
              <button
                onClick={nextStep}
                disabled={
                  !selectedDate || 
                  (currentStep === 'time' && !selectedTime) ||
                  (currentStep === 'details' && (!customerDetails.firstName || !customerDetails.lastName || 
                   !customerDetails.email || !customerDetails.phone || !customerDetails.licensePlate)) ||
                  (currentStep === 'signup' && !customerDetails.password)
                }
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Seuraava
                <ChevronRight className="w-5 h-5 ml-1" />
              </button>
            ) : (
              <button
                onClick={handleSubmit}
                disabled={loading}
                className="flex items-center px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Clock className="animate-spin h-5 w-5 mr-2" />
                    Varataan...
                  </>
                ) : (
                  <>
                    <CreditCard className="h-5 w-5 mr-2" />
                    Vahvista varaus
                  </>
                )}
              </button>
            )}
          </div>
        </div>
        )}
      </div>
    </div>
  );
};

export default BookingModal;
