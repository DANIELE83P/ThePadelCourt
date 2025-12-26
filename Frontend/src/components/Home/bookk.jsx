import { faMapMarkerAlt } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import withGuard from "../../utils/withGuard";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../Contexts/AuthContext";
import toast, { Toaster } from "react-hot-toast";

const Bookk = () => {
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

    if (!date) {
      setAvailableTimeSlots([]);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('court_availability')
        .select('*')
        .eq('court_id', id)
        .eq('available_date', date)
        .eq('is_available', true)
        .order('time_slot_start');

      if (error) throw error;
      setAvailableTimeSlots(data || []);
    } catch (error) {
      console.error("Error fetching time slots:", error);
      toast.error("Failed to load available time slots");
    }
  };

  const handleBooking = async () => {
    if (!selectedDate || !selectedTimeSlot) {
      toast.error("Please select a date and a time slot");
      return;
    }

    if (!user) {
      toast.error("Please login to book a court");
      return;
    }

    try {
      setBookingLoading(true);

      // Create booking
      const { data: booking, error: bookingError } = await supabase
        .from('bookings')
        .insert({
          court_id: court.id,
          user_id: user.id,
          booking_date: selectedDate,
          time_slot_start: selectedTimeSlot.time_slot_start,
          time_slot_end: selectedTimeSlot.time_slot_end,
          status: 'Pending'
        })
        .select()
        .single();

      if (bookingError) throw bookingError;

      // Mark time slot as unavailable
      const { error: updateError } = await supabase
        .from('court_availability')
        .update({ is_available: false })
        .eq('id', selectedTimeSlot.id);

      if (updateError) {
        // Rollback: delete the booking
        await supabase.from('bookings').delete().eq('id', booking.id);
        throw updateError;
      }

      toast.success("Booking successful! Redirecting to your reservations...");

      setTimeout(() => {
        navigate('/profile/reservations');
      }, 2000);
    } catch (error) {
      console.error("Error creating booking:", error);
      toast.error(error.message || "Failed to create booking. Please try again.");
    } finally {
      setBookingLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg">Loading court details...</p>
      </div>
    );
  }

  if (!court) {
    return (
      <div className="flex justify-center items-center h-screen">
        <p className="text-lg text-red-600">Court not found</p>
      </div>
    );
  }

  const courtImage = court.court_img_url || '/placeholder-court.jpg';
  const pricePerHour = court.price_per_hour || 0;

  return (
    <>
      <div className="flex flex-col md:flex-row justify-between mt-28 bg-white rounded-lg shadow-lg p-6 max-w-5xl mx-auto my-10">
        <div className="w-full md:w-2/5 mb-6 md:mb-0">
          <img
            src={courtImage}
            alt={court.name}
            className="w-full h-96 rounded-lg object-cover"
            onError={(e) => {
              e.target.src = '/placeholder-court.jpg';
            }}
          />
        </div>

        <div className="w-full md:w-3/5 md:pl-6">
          <h2 className="text-2xl font-bold mb-2">{court.name}</h2>
          <div className="mb-4">
            <FontAwesomeIcon
              icon={faMapMarkerAlt}
              size="1x"
              style={{ color: "black" }}
              className="mr-2 font-bold"
            />
            <span className="font-semibold">{court.location}</span>
          </div>

          <div className="my-4">
            <label className="font-semibold">Select Date:</label>
            <input
              type="date"
              className="border rounded p-2 ml-2 w-full md:w-auto"
              onChange={handleDateChange}
              min={new Date().toISOString().split('T')[0]}
              required
            />
          </div>

          <div className="my-4">
            <label className="font-semibold block mb-2">Available Time Slots:</label>
            <div className="flex flex-wrap gap-2">
              {selectedDate ? (
                availableTimeSlots.length > 0 ? (
                  availableTimeSlots.map((slot) => (
                    <button
                      key={slot.id}
                      onClick={() => setSelectedTimeSlot(slot)}
                      className={`border rounded p-2 ${selectedTimeSlot?.id === slot.id
                          ? "bg-blue-500 text-white"
                          : "bg-gray-200 hover:bg-gray-300"
                        }`}
                    >
                      {slot.time_slot_start} - {slot.time_slot_end}
                    </button>
                  ))
                ) : (
                  <p className="text-gray-600">No available time slots for this date.</p>
                )
              ) : (
                <p className="text-gray-600">Please select a date first.</p>
              )}
            </div>
          </div>

          {selectedTimeSlot && (
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h2 className="font-semibold">Selected Time Slot:</h2>
              <p className="text-lg">
                {selectedTimeSlot.time_slot_start} - {selectedTimeSlot.time_slot_end}
              </p>
            </div>
          )}

          <div className="flex flex-col md:flex-row justify-between items-start md:items-center mt-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <h2 className="font-semibold text-xl">Price summary</h2>
              <p className="text-gray-600 font-semibold">
                €{pricePerHour} per hour
              </p>
            </div>
            <div className="text-left md:text-right mt-4 md:mt-0">
              <h2 className="text-2xl font-bold text-green-600">
                €{pricePerHour}
              </h2>
              <p className="text-gray-500 font-semibold text-sm">
                Taxes and charges included
              </p>
            </div>
          </div>

          <div className="mt-6 text-right">
            <button
              onClick={handleBooking}
              className="bg-blue-500 font-bold text-white py-3 px-8 rounded-lg hover:bg-blue-600 transition disabled:opacity-50 disabled:cursor-not-allowed w-full md:w-auto"
              disabled={!selectedDate || !selectedTimeSlot || bookingLoading}
            >
              {bookingLoading ? "Booking..." : "Book Now"}
            </button>
          </div>
        </div>
      </div>
      <Toaster />
    </>
  );
};

export default withGuard(Bookk);
