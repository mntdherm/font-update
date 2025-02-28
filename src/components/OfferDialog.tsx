import React, { useState } from 'react';
import { X, Loader2, Calendar, Clock, Percent } from 'lucide-react';
import type { Offer, Service } from '../types/database';
import { createOffer, updateOffer } from '../lib/db';

interface OfferDialogProps {
  isOpen: boolean;
  onClose: () => void;
  offer?: Offer | null;
  vendorId: string;
  services: Service[];
  onOfferSaved: () => void;
}

const OfferDialog: React.FC<OfferDialogProps> = ({ 
  isOpen, 
  onClose, 
  offer,
  vendorId,
  services,
  onOfferSaved 
}) => {
  const [formData, setFormData] = useState({
    title: offer?.title || '',
    description: offer?.description || '',
    serviceId: offer?.serviceId || services[0]?.id || '',
    discountPercentage: offer?.discountPercentage || 10,
    startDate: offer?.startDate ? new Date(offer.startDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
    endDate: offer?.endDate ? new Date(offer.endDate).toISOString().split('T')[0] : '',
    active: offer?.active ?? true
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.serviceId || !formData.startDate || !formData.endDate) {
      setError('Täytä kaikki kentät');
      return;
    }

    try {
      setLoading(true);
      setError(null);

      const offerData = {
        ...formData,
        vendorId,
        startDate: new Date(formData.startDate),
        endDate: new Date(formData.endDate),
        discountPercentage: Number(formData.discountPercentage)
      };

      if (offer) {
        await updateOffer(offer.id, offerData);
      } else {
        await createOffer(offerData);
      }

      onOfferSaved();
      onClose();
    } catch (err) {
      console.error('Error saving offer:', err);
      setError('Virhe tarjouksen tallennuksessa');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-xl w-full max-w-lg overflow-hidden">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold">{offer ? 'Muokkaa tarjousta' : 'Uusi tarjous'}</h2>
            <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
              <X className="w-6 h-6" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700">Palvelu</label>
              <select
                value={formData.serviceId}
                onChange={(e) => setFormData(prev => ({ ...prev, serviceId: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                required
              >
                {services.map(service => (
                  <option key={service.id} value={service.id}>
                    {service.name} ({service.price}€)
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Otsikko</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Esim. Kesätarjous"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Kuvaus</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                rows={3}
                className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                placeholder="Kerro tarjouksesta tarkemmin"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">Alennusprosentti</label>
              <div className="mt-1 relative rounded-lg shadow-sm">
                <input
                  type="number"
                  value={formData.discountPercentage}
                  onChange={(e) => setFormData(prev => ({ ...prev, discountPercentage: Number(e.target.value) }))}
                  min="1"
                  max="100"
                  className="block w-full pr-12 rounded-lg border-gray-300 focus:border-blue-500 focus:ring-blue-500"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">%</span>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700">Alkaa</label>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, startDate: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700">Päättyy</label>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, endDate: e.target.value }))}
                  className="mt-1 block w-full rounded-lg border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  required
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                checked={formData.active}
                onChange={(e) => setFormData(prev => ({ ...prev, active: e.target.checked }))}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Tarjous on aktiivinen
              </label>
            </div>

            {error && (
              <div className="bg-red-50 border-l-4 border-red-400 p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <X className="h-5 w-5 text-red-400" />
                  </div>
                  <div className="ml-3">
                    <p className="text-sm text-red-700">{error}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-gray-700 hover:text-gray-900"
              >
                Peruuta
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 flex items-center"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin h-5 w-5 mr-2" />
                    Tallennetaan...
                  </>
                ) : (
                  'Tallenna'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default OfferDialog;
