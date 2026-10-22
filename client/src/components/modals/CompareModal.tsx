import { X, Check, Minus } from 'lucide-react';
import { PropertySummary, PropertyPurpose } from '../../types';
import { formatPrice, getPropertyTypeLabel } from '../../lib/utils';
import { Link } from 'react-router-dom';

interface CompareModalProps {
  properties: PropertySummary[];
  isOpen: boolean;
  onClose: () => void;
  onRemove: (id: string) => void;
}

export default function CompareModal({
  properties,
  isOpen,
  onClose,
  onRemove,
}: CompareModalProps) {
  if (!isOpen || properties.length === 0) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-estate-900/60 backdrop-blur-sm animate-in fade-in">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[90vh] flex flex-col shadow-2xl relative border border-estate-200 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-estate-200">
          <div>
            <h3 className="font-bold text-lg text-estate-900">Compare Properties</h3>
            <p className="text-xs text-estate-500">Side-by-side comparison of up to 4 properties</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-estate-400 hover:text-estate-700 rounded-lg hover:bg-estate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Table */}
        <div className="flex-1 overflow-x-auto overflow-y-auto p-6">
          <table className="w-full text-left border-collapse min-w-[600px]">
            <thead>
              <tr className="border-b border-estate-200">
                <th className="p-3 w-40 text-xs font-semibold uppercase text-estate-400">Features</th>
                {properties.map((p) => (
                  <th key={p.id} className="p-3 min-w-[200px] align-top">
                    <div className="relative">
                      <button
                        onClick={() => onRemove(p.id)}
                        className="absolute -top-2 -right-2 p-1 bg-estate-100 hover:bg-red-50 text-estate-500 hover:text-red-600 rounded-full"
                        title="Remove"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                      <img
                        src={p.cover_image_url || 'https://images.unsplash.com/photo-1560518883-ce09059eeffa?auto=format&fit=crop&w=400&q=80'}
                        alt={p.title}
                        className="w-full h-28 object-cover rounded-lg mb-2"
                      />
                      <Link to={`/properties/${p.id}`} className="font-bold text-sm text-estate-900 hover:text-primary-600 line-clamp-1">
                        {p.title}
                      </Link>
                      <div className="text-sm font-extrabold text-primary-600 mt-0.5">
                        {formatPrice(Number(p.asking_price))}
                        {p.purpose === PropertyPurpose.RENT && <span className="text-xs text-estate-500 font-normal">/mo</span>}
                      </div>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-estate-100 text-sm">
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Type & Purpose</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3 text-estate-800 font-medium">
                    {getPropertyTypeLabel(p.type)} ({p.purpose})
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Bedrooms</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3 text-estate-800">
                    {p.bedrooms != null ? `${p.bedrooms} BHK` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Bathrooms</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3 text-estate-800">
                    {p.bathrooms != null ? `${p.bathrooms} Baths` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Super Built-up Area</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3 text-estate-800">
                    {p.area_sqft != null ? `${p.area_sqft} sq.ft` : '—'}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Price / sq.ft</td>
                {properties.map((p) => {
                  const rate = p.area_sqft && p.asking_price ? Math.round(Number(p.asking_price) / p.area_sqft) : null;
                  return (
                    <td key={p.id} className="p-3 text-estate-800 font-semibold">
                      {rate ? `₹${rate.toLocaleString('en-IN')}/sq.ft` : '—'}
                    </td>
                  );
                })}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Brokerage Mode</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3">
                    {p.handling_mode === 'DIRECT' ? (
                      <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                        Zero Brokerage
                      </span>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700 bg-amber-50 px-2.5 py-1 rounded-full">
                        Broker Assisted
                      </span>
                    )}
                  </td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium text-estate-500 text-xs uppercase">Location</td>
                {properties.map((p) => (
                  <td key={p.id} className="p-3 text-estate-800 text-xs">
                    {[p.locality, p.city].filter(Boolean).join(', ')}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
