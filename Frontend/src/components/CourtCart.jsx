/* eslint-disable react/prop-types */
import { FaCalendarAlt, FaMapMarkerAlt, FaClock } from "react-icons/fa";
import { useNavigate } from "react-router-dom";

export default function CourtCart({ court }) {
  const navigate = useNavigate();

  if (!court) return null;

  // Handle both old and new data structures
  const courtImage = court.court_img_url || court.courtImg?.url || '/placeholder-court.jpg';
  const courtId = court.id || court._id;
  const operatingStart = court.operating_hours_start || court.operatingHours?.start;
  const operatingEnd = court.operating_hours_end || court.operatingHours?.end;

  return (
    <div className="border mr-6 border-gray-300 rounded-lg overflow-hidden shadow-lg transition-transform duration-300 transform hover:scale-105 bg-white">
      <img
        src={courtImage}
        alt={court.name}
        className="w-full h-48 object-cover transition duration-300 ease-in-out hover:scale-105"
        onError={(e) => {
          e.target.src = '/placeholder-court.jpg';
        }}
      />
      <div className="p-4">
        <h2 className="text-2xl font-semibold mb-2">{court.name}</h2>
        <div className="flex items-center mb-1">
          <FaMapMarkerAlt className="text-lime-500 mr-2" />
          <p className="text-gray-700 text-sm">{court.location}</p>
        </div>
        <div className="flex items-center mb-3">
          <FaClock className="text-lime-500 mr-2" />
          <p className="text-gray-700 text-sm">
            Open: {operatingStart}:00 To {operatingEnd}:00
          </p>
        </div>
        {court.price_per_hour && (
          <p className="text-gray-600 mb-3 font-semibold">
            €{court.price_per_hour}/hour
          </p>
        )}
        <button
          className="w-full bg-blue-500 text-white py-2 rounded-lg hover:bg-blue-600 transition-colors duration-300 flex items-center justify-center font-semibold"
          onClick={() => navigate(`/court/${courtId}`)}
        >
          <FaCalendarAlt className="mr-2" />
          Book Now
        </button>
      </div>
    </div>
  );
}
