/* eslint-disable react/no-unescaped-entities */
import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { supabase } from "../../lib/supabase";
import { useAuth } from "../../Contexts/AuthContext";

export default function YourReservations() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchReservations();
  }, [user?.id]);

  const fetchReservations = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('bookings')
        .select(`
          *,
          courts (
            id,
            name,
            location
          )
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setReservations(data || []);
    } catch (error) {
      console.error("Error fetching reservations:", error);
      toast.error(t('res_failed_load'));
    } finally {
      setLoading(false);
    }
  };

  const handleConfirm = async (id) => {
    try {
      const { error } = await supabase
        .from('bookings')
        .update({ status: 'confirmed' })
        .eq('id', id);

      if (error) throw error;

      toast.success(t('res_confirmed_succ'));
      fetchReservations(); // Refresh list
    } catch (error) {
      console.error("Error confirming booking:", error);
      toast.error(t('res_confirm_failed'));
    }
  };

  const handleCancel = async (id) => {
    try {
      // Get booking details first
      const { data: booking, error: fetchError } = await supabase
        .from('bookings')
        .select('*')
        .eq('id', id)
        .single();

      if (fetchError) throw fetchError;

      // Update booking status
      const { error: updateError } = await supabase
        .from('bookings')
        .update({ status: 'cancelled' })
        .eq('id', id);

      if (updateError) throw updateError;

      // Return slot to availability
      await supabase
        .from('court_availability')
        .update({ is_available: true })
        .eq('court_id', booking.court_id)
        .eq('available_date', booking.booking_date)
        .eq('time_slot_start', booking.time_slot_start)
        .eq('time_slot_end', booking.time_slot_end);

      toast.error(t('res_canceled'));
      fetchReservations(); // Refresh list
    } catch (error) {
      console.error("Error canceling booking:", error);
      toast.error(t('res_cancel_failed'));
    }
  };

  if (loading) {
    return <div className="text-center p-4">{t('res_loading')}</div>;
  }

  return (
    <div className="max-w-4xl overflow-auto flex flex-col h-screen mx-20 p-4">
      <br /><br />
      <h1 className="text-3xl font-bold mb-6 text-center">{t('res_title')}</h1>
      {reservations.length === 0 ? (
        <p className="text-center text-lg text-gray-500">
          {t('res_no_reservations')}
        </p>
      ) : (
        <ul className="space-y-6">
          {reservations.map((reservation) => (
            <li
              key={reservation.id}
              className="border p-6 rounded-lg shadow-lg bg-white hover:shadow-xl transition-shadow duration-300"
            >
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold">
                  {reservation.courts?.name || 'Court'}
                </h3>
                <span
                  className={`px-3 py-1 font-semibold rounded-full text-white ${reservation.status === "confirmed"
                    ? "bg-green-500"
                    : reservation.status === "cancelled"
                      ? "bg-red-500"
                      : "bg-yellow-500"
                    }`}
                >
                  {reservation.status === 'confirmed' ? t('status_confirmed') : reservation.status === 'cancelled' ? t('status_cancelled') : reservation.status === 'Pending' ? t('status_pending') : reservation.status}
                </span>
                {reservation.is_recurring && (
                  <span className="ml-2 px-3 py-1 font-semibold rounded-full text-blue-800 bg-blue-100 flex items-center gap-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Ricorrente
                  </span>
                )}
              </div>
              <div className="text-gray-600">
                <p className="font-bold mb-2">
                  {t('res_date')} {new Date(reservation.booking_date).toLocaleDateString("it-IT")}
                </p>
                <p className="mb-2">
                  <span className="font-semibold">{t('res_checkin')}</span>{" "}
                  {reservation.time_slot_start}
                </p>
                <p className="mb-4">
                  <span className="font-semibold">{t('res_checkout')}</span>{" "}
                  {reservation.time_slot_end}
                </p>
                {reservation.courts?.location && (
                  <p className="mb-2 text-sm text-gray-500">
                    <span className="font-semibold">{t('res_location')}</span>{" "}
                    {reservation.courts.location}
                  </p>
                )}
              </div>
              {reservation.status !== "cancelled" && (
                <div className="flex justify-end space-x-4">
                  {reservation.status === "Pending" && (
                    <button
                      onClick={() => handleConfirm(reservation.id)}
                      className="px-4 py-2 font-semibold bg-blue-600 text-white rounded-md hover:bg-blue-700 transition duration-200"
                    >
                      {t('res_confirm_btn')}
                    </button>
                  )}
                  <button
                    onClick={() => handleCancel(reservation.id)}
                    className="px-4 py-2 font-semibold bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-200"
                  >
                    {reservation.is_recurring ? 'Segnala Assenza' : t('res_cancel_btn')}
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}
      <Toaster />
    </div>
  );
}
