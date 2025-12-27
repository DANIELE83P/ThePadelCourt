import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import withGuard from "../../utils/withGuard";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../Contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { isSlotAvailable } from "../../services/bookingValidation"; // Import validation service
import { notify } from "../../utils/notification";

const Bookk = () => {
  const { t } = useTranslation();
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [court, setCourt] = useState(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [availableTimeSlots, setAvailableTimeSlots] = useState([]);
  const [selectedTimeSlot, setSelectedTimeSlot] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingLoading, setBookingLoading] = useState(false);

  useEffect(() => {
    fetchCourtDetails();
  }, [id]);

  const fetchCourtDetails = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('id', id)
        .single();

      if (error) throw error;
      setCourt(data);
    } catch (error) {
      console.error("Error fetching court details:", error);
      toast.error("Failed to load court details");
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = async (e) => {
    const date = e.target.value;
    setSelectedDate(date);
    setSelectedTimeSlot(null);

    if (!date || !court) {
      setAvailableTimeSlots([]);
      return;
    }

    try {
      // Use logic from bookingValidation instead of querying deprecated court_availability table
      // Generate slots based on club hours (fetching from new club_hours table is needed)
      // For now, let's assume standard 9-22 slots or fetch from club_hours

      const { data: hoursData } = await supabase
        .from('club_hours')
        .select('*')
        .eq('day_of_week', new Date(date).getDay())
        .single();

      if (!hoursData || !hoursData.is_open) {
        setAvailableTimeSlots([]);
        return;
      }

      const slots = [];
      const startTime = parseInt(hoursData.open_time.split(':')[0]);
      const endTime = parseInt(hoursData.close_time.split(':')[0]);

      for (let h = startTime; h < endTime; h++) {
        const slotStart = `${h.toString().padStart(2, '0')}:00`;
        const slotEnd = `${(h + 1).toString().padStart(2, '0')}:00`;

        // Check if slot is available
        const isAvailable = await isSlotAvailable(court.id, date, slotStart, slotEnd);

        if (isAvailable) {
          slots.push({
            id: `${date}-${slotStart}`, // Temp ID
            time_slot_start: slotStart,
            time_slot_end: slotEnd
          });
        }
      }

      setAvailableTimeSlots(slots);

    } catch (error) {
      console.error("Error calculating slots:", error);
      toast.error("Failed to load available time slots");
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.error(t('select_date_time') || "Please select a date and time");
      return;
    }

    if (!user) {
      toast.error(t('login_to_book') || "Please login to book");
      return;
    }

    try {
      setBookingLoading(true);

      // Double check availability
      const isAvailable = await isSlotAvailable(
        court.id,
        selectedDate,
        selectedTimeSlot.time_slot_start,
        selectedTimeSlot.time_slot_end
      );

      if (!isAvailable) {
        toast.error(t('slot_no_longer_available') || "Slot no longer available");
        // Refresh slots
        handleDateChange({ target: { value: selectedDate } });
        return;
      }

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          court_id: court.id,
          user_id: user.id,
          booking_date: selectedDate,
          time_slot_start: selectedTimeSlot.time_slot_start,
          time_slot_end: selectedTimeSlot.time_slot_end,
          status: 'confirmed', // Auto-confirm for users
          price: court.price_per_hour // Store price snapshot
        })
        .select(`
            *,
            courts (name)
        `)
        .single();

      if (bookingError) throw bookingError;

      toast.success(t('booking_success') || "Booking confirmed!");

      // Send notifications
      await notify.bookingConfirmed({
        userId: user.id,
        courtName: booking.courts?.name || court.name,
        date: booking.booking_date,
        time: booking.time_slot_start
      });

      // Redirect
      navigate('/profile/reservations');

    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">{t('loading_court_details') || "Loading..."}</p>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-600">{t('court_not_found') || "Court not found"}</p>
      </div>
    );
  }

  // Handle both old and new data structures
  const courtImage = court.court_img_url || court.courtImg?.url || '/placeholder-court.jpg';
  const pricePerHour = court.price_per_hour || 0;
  const isIndoor = court.is_indoor;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mt-28 bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto my-10">
        <div className="w-full md:w-2/5 mb-6 md:mb-0">
          <div className="relative">
            <img
              src={courtImage}
              alt={court.name}
              className="w-full h-96 rounded-lg object-cover"
              onError={(e) => {
                e.target.src = '/placeholder-court.jpg';
              }}
            />
            <div className="absolute top-4 right-4 bg-white px-3 py-1 rounded-full text-sm font-bold shadow-md">
              {isIndoor ? 'Indoor 🏠' : 'Outdoor ☀️'}
            </div>
          </div>

          {/* Features List */}
          {court.features && court.features.length > 0 && (
            <div className="mt-4">
              <h3 className="font-bold mb-2 text-gray-700">Caratteristiche:</h3>
              <div className="flex flex-wrap gap-2">
                {court.features.map((feature, idx) => (
                  <span key={idx} className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm border border-gray-200">
                    {feature}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="w-full md:w-3/5 md:pl-6">
          <h2 className="text-3xl font-bold mb-2">{court.name}</h2>

          {court.description && (
            <p className="text-gray-600 mb-4">{court.description}</p>
          )}

          <div className="mb-4 flex items-center text-gray-500">
            <FontAwesomeIcon icon={faMapMarkerAlt} className="mr-2" />
            <span>The Padel Court Club</span>
          </div>

          <div className="my-6 border-t border-b py-6 border-gray-100">
            <label className="font-bold text-lg block mb-3">{t('select_date') || "Select Date"}</label>
            <input
              type="date"
              className="border-2 border-gray-200 rounded-lg p-3 w-full md:w-auto focus:border-blue-500 outline-none transition-colors"
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="my-4">
            <label className="font-bold text-lg block mb-3">
              {t('available_time_slots') || "Available Time Slots"}
              {selectedDate && <span className="text-sm font-normal text-gray-500 ml-2">({availableTimeSlots.length} available)</span>}
            </label>

            <div className="flex flex-wrap gap-2 max-h-60 overflow-y-auto custom-scrollbar p-1">
              {selectedDate ? (
                availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot) => (
                    <button
                      key={slot.time_slot_start}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 border-2 ${selectedTimeSlot?.time_slot_start === slot.time_slot_start
                          ? "bg-[var(--owner-accent)] text-white border-[var(--owner-accent)] shadow-md"
                          : "bg-white text-gray-700 border-gray-200 hover:border-[var(--owner-accent)] hover:text-[var(--owner-accent)]"
                        }`}
                      style={selectedTimeSlot?.time_slot_start === slot.time_slot_start ? { backgroundColor: '#00BFA5', borderColor: '#00BFA5' } : {}}
                    >
                      {slot.time_slot_start}
                    </button>
                  ))
                ) : (
                  <div className="w-full text-center py-4 bg-gray-50 rounded-lg text-gray-500">
                    {t('no_slots_available') || "No slots available for this date"}
                  </div>
                )
              ) : (
                <div className="w-full text-center py-4 bg-gray-50 rounded-lg text-gray-500">
                  {t('select_date_first') || "Please select a date first"}
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-between items-center mt-8 p-6 bg-gray-50 rounded-xl border border-gray-100">
            <div>
              <h2 className="font-semibold text-lg text-gray-700">{t('price_summary') || "Price"}</h2>
              {selectedTimeSlot && (
                <p className="text-sm text-green-600 font-medium">
                  Selected: {selectedTimeSlot.time_slot_start} - {selectedTimeSlot.time_slot_end}
                </p>
              )}
            </div>
            <div className="text-right">
              <h2 className="text-3xl font-bold text-[var(--owner-accent)]" style={{ color: '#00BFA5' }}>
                €{pricePerHour}
              </h2>
              <p className="text-gray-400 text-xs">
                {t('taxes_included') || "incl. taxes"} / hour
              </p>
            </div>
          </div>

          <div className="mt-6">
            <button
              onClick={handleBooking}
              className="w-full font-bold text-white py-4 px-8 rounded-xl shadow-lg transition-all transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
              style={{ backgroundColor: '#00BFA5' }}
              disabled={!selectedDate || !selectedTimeSlot || bookingLoading}
            >
              {bookingLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Processing...
                </span>
              ) : (
                t('book_now') || "Confirm Booking"
              )}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default withGuard(Bookk);
