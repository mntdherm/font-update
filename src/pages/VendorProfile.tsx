import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { MapPin, Star, Clock, Calendar, Shield, Award, Tag, Percent, ChevronRight, Coins, Package } from 'lucide-react';
import { getVendor, getVendorServices, getServiceCategories, getVendorOffers } from '../lib/db';
import type { Vendor, Service, ServiceCategory, Offer } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import BookingModal from '../components/BookingModal';
import { useAuth } from '../contexts/AuthContext';

const VendorProfile = () => {
  const { id } = useParams<{ id: string }>();
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [categories, setCategories] = useState<ServiceCategory[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [isBookingModalOpen, setIsBookingModalOpen] = useState(false);

  useEffect(() => {
    const loadVendorData = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const vendorData = await getVendor(id);
        const [servicesData, categoriesData, offersData] = await Promise.all([
          getVendorServices(id),
          getServiceCategories(id),
          getVendorOffers(id)
        ]);
        
        if (!vendorData) {
          setError('Yritystä ei löytynyt');
          return;
        }

        setVendor(vendorData);
        setServices(servicesData);
        setCategories(categoriesData);
        setOffers(offersData.filter(o => o.active));
      } catch (err) {
        console.error('Error loading vendor:', err);
        setError('Virhe ladattaessa yrityksen tietoja');
      } finally {
        setLoading(false);
      }
    };

    loadVendorData();
  }, [id]);

  const handleBooking = (service: Service) => {
    setSelectedService(service);
    setIsBookingModalOpen(true);
  };

  const getServiceDiscount = (service: Service) => {
    const activeOffer = offers.find(o => 
      o.serviceId === service.id && 
      new Date(o.startDate) <= new Date() && 
      new Date(o.endDate) >= new Date()
    );
    return activeOffer?.discountPercentage || 0;
  };

  const getDiscountedPrice = (service: Service) => {
    const discount = getServiceDiscount(service);
    return discount > 0 
      ? service.price * (1 - discount / 100)
      : service.price;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-800 mb-2">Hups!</h2>
          <p className="text-gray-600">{error || 'Yritystä ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  const today = format(new Date(), 'EEEE').toLowerCase();
  const todayHours = vendor.operatingHours[today] || vendor.operatingHours.monday;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Cover Photo */}
      <div 
        className="h-80 bg-cover bg-center relative"
        style={{ 
          backgroundImage: vendor.coverImage 
            ? `url(${vendor.coverImage})` 
            : 'url("https://images.unsplash.com/photo-1605164599901-db7f68c4b175?auto=format&fit=crop&q=80")'
        }}
      >
        <div className="absolute inset-0 bg-black bg-opacity-30"></div>
      </div>

      {/* Profile Section */}
      <div className="max-w-7xl mx-auto px-4 relative">
        {/* Logo */}
        <div className="absolute -top-20 left-8 w-40 h-40 rounded-full border-4 border-white overflow-hidden bg-white shadow-lg">
          <img 
            src={vendor.logoImage || "https://images.unsplash.com/photo-1607860108855-64acf2078ed9?auto=format&fit=crop&q=80"} 
            alt={vendor.businessName}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Business Info */}
        <div className="pt-24 pb-8">
          <div className="flex justify-between items-start">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{vendor.businessName}</h1>
              <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-6 text-gray-600">
                <div className="flex items-center shrink-0">
                  <MapPin className="h-5 w-5 mr-1" />
                  <span>{vendor.address}, {vendor.postalCode} {vendor.city}</span>
                </div>
                {vendor.rating && (
                  <div className="flex items-center shrink-0">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`h-4 w-4 ${i < Math.floor(vendor.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                        />
                      ))}
                    </div>
                    <span className="ml-2">{vendor.rating.toFixed(1)}</span>
                  </div>
                )}
                <div className="flex items-center shrink-0">
                  <Clock className="h-5 w-5 mr-1" />
                  <span className="whitespace-nowrap">
                    {todayHours.open === 'closed' && todayHours.close === 'closed'
                      ? 'Suljettu tänään'
                      : todayHours.open === '00:00' && todayHours.close === '23:59'
                      ? 'Avoinna 24h'
                      : `Avoinna tänään: ${todayHours.open} - ${todayHours.close}`
                    }
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Stats & Highlights */}
          <div className="mt-6 bg-white rounded-lg shadow-sm p-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <Calendar className="h-5 w-5 text-gray-500 mb-1" />
                <span className="text-sm font-medium text-gray-900">{new Date(vendor.createdAt.seconds * 1000).getFullYear()}</span>
                <span className="text-xs text-gray-500">Perustettu</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <Shield className={`h-5 w-5 mb-1 ${vendor.verified ? 'text-green-500' : 'text-gray-500'}`} />
                <span className={`text-sm font-medium ${vendor.verified ? 'text-green-600' : 'text-gray-900'}`}>
                  {vendor.verified ? 'Vahvistettu' : 'Odottaa'}
                </span>
                <span className="text-xs text-gray-500">Tila</span>
              </div>
              <div className="flex flex-col items-center justify-center p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                <Star className="h-5 w-5 text-yellow-400 mb-1" />
                <span className="text-sm font-medium text-gray-900">
                  {vendor.rating ? `${vendor.rating.toFixed(1)}/5` : '-'}
                </span>
                <span className="text-xs text-gray-500">
                  {vendor.ratingCount ? `${vendor.ratingCount} arvostelua` : 'Ei arvosteluja'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Services Section */}
        <div className="py-12">
          {/* Active Offers */}
          {offers.length > 0 && (
            <div className="mb-12">
              <div className="flex items-center justify-center mb-8">
                <div className="text-center">
                  <h2 className="text-3xl font-bold text-gray-900">Voimassa olevat tarjoukset</h2>
                  <p className="mt-2 text-gray-600">Hyödynnä erikoistarjoukset nyt!</p>
                  <div className="mt-4 w-20 h-1 bg-green-600 mx-auto rounded-full"></div>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {offers.map(offer => {
                  const service = services.find(s => s.id === offer.serviceId);
                  if (!service) return null;
                  
                  const discountedPrice = service.price * (1 - offer.discountPercentage / 100);
                  
                  return (
                    <div key={offer.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-green-100">
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-4">
                          <div className="flex items-center space-x-2">
                            <Tag className="w-5 h-5 text-green-600" />
                            <span className="text-sm font-medium bg-green-100 text-green-800 px-2 py-1 rounded-full">
                              Tarjous
                            </span>
                          </div>
                          <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                            <Percent className="w-4 h-4 mr-1" />
                            <span className="text-sm font-medium">{offer.discountPercentage}%</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
                        <p className="text-gray-600 text-sm mb-4">{offer.description}</p>
                        
                        <div className="bg-gray-50 rounded-lg p-4">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">{service.name}</span>
                            <div className="flex items-center text-gray-500">
                              <Clock className="w-4 h-4 mr-1" />
                              <span>{service.duration} min</span>
                            </div>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm text-gray-600">Normaalihinta:</span>
                            <span className="text-sm line-through text-gray-500">{service.price}€</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium text-gray-900">Tarjoushinta:</span>
                            <span className="text-lg font-semibold text-green-600">
                              {discountedPrice.toFixed(2)}€
                            </span>
                          </div>
                        </div>
                        
                        <button 
                          onClick={() => handleBooking(service)}
                          className="mt-4 w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors text-sm font-medium flex items-center justify-center"
                        >
                          Varaa tarjoushintaan
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div className="flex items-center justify-center mb-12">
            <div className="text-center">
              <h2 className="text-3xl font-bold text-gray-900">Saatavilla olevat palvelut</h2>
              <p className="mt-2 text-gray-600">Valitse haluamasi palvelu alta ja varaa aika</p>
              <div className="mt-4 w-20 h-1 bg-blue-600 mx-auto rounded-full"></div>
            </div>
          </div>
          <div className="space-y-8">
            {categories.map(category => {
              const categoryServices = services.filter(service => service.categoryId === category.id);
              if (categoryServices.length === 0) return null;
              
              return (
                <div key={category.id}>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{category.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {categoryServices.map(service => (
                      <div 
                        key={service.id} 
                        className="group bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100 hover:border-blue-100 overflow-hidden"
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="text-lg font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                {service.name}
                              </h4>
                              <p className="mt-1.5 text-gray-600 text-sm leading-relaxed">
                                {service.description}
                              </p>
                            </div>
                            <div className="flex items-center justify-center w-10 h-10 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                              <Clock className="w-5 h-5 text-blue-600" />
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                              <div className="flex items-center px-3 py-1 bg-gray-50 rounded-full text-sm text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-700 transition-colors">
                                <Clock className="w-4 h-4 mr-1.5" />
                                {service.duration} min
                              </div>
                              {service.coinReward > 0 && (
                                <div className="flex items-center px-3 py-1 bg-yellow-50 rounded-full text-sm text-yellow-700">
                                  <Coins className="w-4 h-4 mr-1.5" />
                                  +{service.coinReward}
                                </div>
                              )}
                            </div>
                            <div className="mt-4 flex items-center space-x-3">
                              <div className="flex flex-col items-end">
                                {getServiceDiscount(service) > 0 && (
                                  <span className="text-sm text-gray-500 line-through">
                                    {service.price.toFixed(2)}€
                                  </span>
                                )}
                                <span className={`text-lg font-semibold ${
                                  getServiceDiscount(service) > 0 ? 'text-green-600' : 'text-gray-900'
                                }`}>
                                  {getDiscountedPrice(service).toFixed(2)}€
                                </span>
                              </div>
                              <button 
                                onClick={() => handleBooking(service)}
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium flex items-center group-hover:scale-105 transform duration-200"
                              >
                                Varaa
                                <ChevronRight className="w-4 h-4 ml-1" />
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
            
            {services.length === 0 && (
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <div className="text-gray-400 mb-3">
                  <Package className="w-12 h-12 mx-auto" />
                </div>
                <p className="text-gray-600">
                  Ei palveluita saatavilla
                </p>
                    </div>
            )}
          </div>
        </div>
      </div>

      {selectedService && (
        <BookingModal
          isOpen={isBookingModalOpen}
          onClose={() => {
            setIsBookingModalOpen(false);
            setSelectedService(null);
          }}
          service={selectedService}
          vendorId={vendor.id}
          vendor={vendor}
        />
      )}
    </div>
  );
};

export default VendorProfile;
