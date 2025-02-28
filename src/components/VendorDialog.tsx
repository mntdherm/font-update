import React, { useEffect, useState } from 'react';
import { X, MapPin, Phone, Mail, Globe, Star, Store, Calendar, Check, Ban, Clock, Package } from 'lucide-react';
import type { Vendor, Service, Appointment } from '../types/database';
import { format } from 'date-fns';
import { fi } from 'date-fns/locale';
import { getVendorServices, getVendorAppointments } from '../lib/db';

interface VendorDialogProps {
  isOpen: boolean;
  onClose: () => void;
  vendor: Vendor;
  onVerify: (vendorId: string) => void;
  onBan: (userId: string) => void;
}

const VendorDialog: React.FC<VendorDialogProps> = ({ 
  isOpen, 
  onClose, 
  vendor,
  onVerify,
  onBan
}) => {
  const [services, setServices] = useState<Service[]>([]);
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        setLoading(true);
        const [servicesData, appointmentsData] = await Promise.all([
          getVendorServices(vendor.id),
          getVendorAppointments(vendor.id)
        ]);
        setServices(servicesData);
        setAppointments(appointmentsData);
      } catch (err) {
        console.error('Error loading vendor data:', err);
      } finally {
        setLoading(false);
      }
    };

    if (isOpen) {
      loadData();
    }
  }, [isOpen, vendor.id]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="p-6 border-b">
            <div className="flex justify-between items-start">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-gray-100">
                  {vendor.logoImage ? (
                    <img 
                      src={vendor.logoImage} 
                      alt={vendor.businessName} 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Store className="w-8 h-8 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-gray-900">{vendor.businessName}</h2>
                  <p className="text-gray-500">Y-tunnus: {vendor.businessId}</p>
                </div>
              </div>
              <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
                <X className="w-6 h-6" />
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Basic Info */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Perustiedot</h3>
                <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                  <div className="flex items-center">
                    <MapPin className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <p className="font-medium">{vendor.address}</p>
                      <p className="text-sm text-gray-500">{vendor.postalCode} {vendor.city}</p>
                    </div>
                  </div>
                  <div className="flex items-center">
                    <Phone className="w-5 h-5 text-gray-400 mr-3" />
                    <p>{vendor.phone}</p>
                  </div>
                  <div className="flex items-center">
                    <Mail className="w-5 h-5 text-gray-400 mr-3" />
                    <p>{vendor.email}</p>
                  </div>
                  {vendor.website && (
                    <div className="flex items-center">
                      <Globe className="w-5 h-5 text-gray-400 mr-3" />
                      <a 
                        href={vendor.website} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-blue-600 hover:text-blue-800"
                      >
                        {vendor.website}
                      </a>
                    </div>
                  )}
                </div>

                {/* Operating Hours */}
                <h3 className="text-lg font-semibold pt-4">Aukioloajat</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-2">
                    {Object.entries(vendor.operatingHours).map(([day, hours]) => (
                      <div key={day} className="flex justify-between items-center">
                        <span className="capitalize">{format(new Date(2024, 0, 1), 'EEEE', { locale: fi })}</span>
                        <span className="text-gray-600">
                          {hours.open === 'closed' && hours.close === 'closed'
                            ? 'Suljettu'
                            : hours.open === '00:00' && hours.close === '23:59'
                            ? '24h'
                            : `${hours.open} - ${hours.close}`
                          }
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Stats and Services */}
              <div className="space-y-4">
                {/* Stats */}
                <h3 className="text-lg font-semibold">Tilastot</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Calendar className="w-5 h-5 text-blue-600 mr-2" />
                        <span className="text-gray-600">Varaukset</span>
                      </div>
                      <span className="text-2xl font-bold">{appointments.length}</span>
                    </div>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <Star className="w-5 h-5 text-yellow-500 mr-2" />
                        <span className="text-gray-600">Arvosana</span>
                      </div>
                      <span className="text-2xl font-bold">{vendor.rating || '-'}</span>
                    </div>
                  </div>
                </div>

                {/* Services */}
                <h3 className="text-lg font-semibold pt-4">Palvelut ({services.length})</h3>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="space-y-3">
                    {services.map(service => (
                      <div key={service.id} className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{service.name}</p>
                          <div className="flex items-center text-sm text-gray-500">
                            <Clock className="w-4 h-4 mr-1" />
                            <span>{service.duration} min</span>
                          </div>
                        </div>
                        <span className="font-medium">{service.price}€</span>
                      </div>
                    ))}
                    {services.length === 0 && (
                      <div className="text-center py-4 text-gray-500">
                        <Package className="w-8 h-8 mx-auto mb-2" />
                        <p>Ei palveluita</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="flex items-center">
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  vendor.verified 
                    ? 'bg-green-100 text-green-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {vendor.verified ? 'Vahvistettu' : 'Odottaa vahvistusta'}
                </span>
                <span className="mx-2 text-gray-300">•</span>
                <span className="text-sm text-gray-500">
                  Liittynyt {format(new Date(vendor.createdAt.seconds * 1000), 'd.M.yyyy')}
                </span>
              </div>
              <div className="flex space-x-3">
                {!vendor.verified && (
                  <button
                    onClick={() => onVerify(vendor.id)}
                    className="flex items-center px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                  >
                    <Check className="w-4 h-4 mr-2" />
                    Vahvista
                  </button>
                )}
                <button
                  onClick={() => onBan(vendor.userId)}
                  className="flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
                >
                  <Ban className="w-4 h-4 mr-2" />
                  Estä
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VendorDialog;
