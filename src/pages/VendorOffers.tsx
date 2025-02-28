import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { getVendor, getVendorServices, getVendorOffers } from '../lib/db';
import type { Vendor, Service, Offer } from '../types/database';
import { Plus, Calendar, Percent, Clock, Tag, Loader2, AlertCircle } from 'lucide-react';
import OfferDialog from '../components/OfferDialog';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';

const VendorOffers = () => {
  const { currentUser } = useAuth();
  const [vendor, setVendor] = useState<Vendor | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isOfferDialogOpen, setIsOfferDialogOpen] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<Offer | null>(null);

  useEffect(() => {
    const loadData = async () => {
      if (!currentUser) return;

      try {
        setLoading(true);
        setError(null);

        const vendorData = await getVendor(currentUser.uid);
        if (!vendorData) {
          setError('Yritystä ei löytynyt');
          return;
        }

        const [servicesData, offersData] = await Promise.all([
          getVendorServices(vendorData.id),
          getVendorOffers(vendorData.id)
        ]);

        setVendor(vendorData);
        setServices(servicesData);
        setOffers(offersData);
      } catch (err) {
        console.error('Error loading vendor data:', err);
        setError('Virhe tietojen latauksessa');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentUser]);

  const handleRefreshOffers = async () => {
    if (!vendor) return;
    
    try {
      const offersData = await getVendorOffers(vendor.id);
      setOffers(offersData);
    } catch (err) {
      console.error('Error refreshing offers:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="flex items-center space-x-2">
          <Loader2 className="w-6 h-6 text-blue-600 animate-spin" />
          <span>Ladataan...</span>
        </div>
      </div>
    );
  }

  if (error || !vendor) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-md p-6 max-w-md w-full mx-4">
          <div className="flex items-center justify-center mb-4">
            <AlertCircle className="h-8 w-8 text-red-500" />
          </div>
          <h3 className="text-lg font-medium text-center text-gray-900 mb-2">Virhe</h3>
          <p className="text-gray-600 text-center">{error || 'Yritystä ei löytynyt'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Tarjoukset</h1>
            <p className="mt-1 text-gray-600">Hallitse yrityksesi tarjouksia</p>
          </div>
          <button
            onClick={() => {
              setSelectedOffer(null);
              setIsOfferDialogOpen(true);
            }}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            <Plus className="w-5 h-5 mr-2" />
            Lisää tarjous
          </button>
        </div>
      </div>

      {/* Offers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {offers.map(offer => {
          const service = services.find(s => s.id === offer.serviceId);
          const isActive = offer.active && new Date(offer.startDate) <= new Date() && new Date(offer.endDate) >= new Date();
          
          return (
            <div 
              key={offer.id}
              onClick={() => {
                setSelectedOffer(offer);
                setIsOfferDialogOpen(true);
              }}
              className={`bg-white rounded-xl shadow-sm p-6 cursor-pointer hover:shadow-md transition-shadow border ${
                isActive ? 'border-green-200' : 'border-gray-200'
              }`}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Tag className={`w-5 h-5 ${isActive ? 'text-green-600' : 'text-gray-400'}`} />
                  <span className={`text-sm font-medium px-2 py-1 rounded-full ${
                    isActive 
                      ? 'bg-green-100 text-green-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}>
                    {isActive ? 'Aktiivinen' : 'Ei aktiivinen'}
                  </span>
                </div>
                <div className="flex items-center bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  <Percent className="w-4 h-4 mr-1" />
                  <span className="text-sm font-medium">{offer.discountPercentage}%</span>
                </div>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{offer.title}</h3>
              <p className="text-gray-600 text-sm mb-4">{offer.description}</p>

              {service && (
                <div className="bg-gray-50 rounded-lg p-3 mb-4">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-600">{service.name}</span>
                    <div className="flex items-center text-gray-500">
                      <Clock className="w-4 h-4 mr-1" />
                      <span>{service.duration} min</span>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Normaalihinta:</span>
                    <span className="line-through">{service.price}€</span>
                  </div>
                  <div className="flex items-center justify-between text-sm font-medium">
                    <span className="text-gray-900">Tarjoushinta:</span>
                    <span className="text-blue-600">
                      {(service.price * (1 - offer.discountPercentage / 100)).toFixed(2)}€
                    </span>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-between text-sm text-gray-500">
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{format(new Date(offer.startDate), 'd.M.yyyy', { locale: fi })}</span>
                </div>
                <span>-</span>
                <div className="flex items-center">
                  <Calendar className="w-4 h-4 mr-1" />
                  <span>{format(new Date(offer.endDate), 'd.M.yyyy', { locale: fi })}</span>
                </div>
              </div>
            </div>
          );
        })}

        {offers.length === 0 && (
          <div className="col-span-full bg-gray-50 rounded-xl p-12 text-center">
            <Tag className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Ei tarjouksia</h3>
            <p className="text-gray-600 mb-6">Lisää ensimmäinen tarjous klikkaamalla "Lisää tarjous" -painiketta</p>
            <button
              onClick={() => {
                setSelectedOffer(null);
                setIsOfferDialogOpen(true);
              }}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              <Plus className="w-5 h-5 mr-2" />
              Lisää tarjous
            </button>
          </div>
        )}
      </div>

      {/* Offer Dialog */}
      {vendor && (
        <OfferDialog
          isOpen={isOfferDialogOpen}
          onClose={() => {
            setIsOfferDialogOpen(false);
            setSelectedOffer(null);
          }}
          offer={selectedOffer}
          vendorId={vendor.id}
          services={services}
          onOfferSaved={handleRefreshOffers}
        />
      )}
    </div>
  );
};

export default VendorOffers;
