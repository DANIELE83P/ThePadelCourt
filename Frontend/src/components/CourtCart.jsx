/* eslint-disable react/prop-types */
import { useTranslation } from "react-i18next";
import { FaCalendarAlt, FaMapMarkerAlt, FaClock, FaCheck, FaInfoCircle } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CourtCart({ court }) {
  const { t } = useTranslation();
  const navigate = useNavigate();

  if (!court) return null;

  // Handle both old and new data structures
  const courtId = court.id;
  const isIndoor = court.is_indoor;
  const features = court.features || [];

  return (
    <div className="border mr-6 border-gray-300 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 transform hover:scale-105 bg-white flex flex-col h-full">
      <div className="relative">
        <div className="h-48 bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center text-white text-4xl font-bold">
          {court.name}
        </div>
        <div className="absolute top-2 right-2 bg-white px-2 py-1 rounded-full text-xs font-bold shadow-sm">
          {isIndoor ? 'Indoor 🏠' : 'Outdoor ☀️'}
        </div>
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h2 className="text-xl font-bold">{court.name}</h2>
            <p className="text-sm text-gray-500">{t('court_type_padel')}</p>
          </div>
        </div>

        {court.description && (
          <p className="text-sm text-gray-600 mb-4 line-clamp-2">
            {court.description}
          </p>
        )}

        {features.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {features.slice(0, 3).map((feature, idx) => (
              <span key={idx} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md border border-gray-200">
                {feature}
              </span>
            ))}
            {features.length > 3 && (
              <span className="text-xs text-gray-400 px-1 py-1">+{features.length - 3}</span>
            )}
          </div>
        )}

        <div className="mt-auto">
          <button
            className="w-full bg-[var(--owner-accent)] text-white py-2 rounded-lg hover:bg-opacity-90 transition-colors duration-300 flex items-center justify-center font-bold shadow-md"
            onClick={() => navigate(`/court/${courtId}`)}
            style={{ backgroundColor: '#00BFA5' }} // Fallback color
          >
            <FaCalendarAlt className="mr-2" />
            {t('book_now')}
          </button>
        </div>
      </div>
    </div>
  );
}
