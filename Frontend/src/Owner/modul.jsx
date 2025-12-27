/* eslint-disable react/prop-types */
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";

// Helper to format time for DB/UI
function formatValidationTime(h, m) {
  const ampm = h >= 12 ? 'PM' : 'AM';
  const hour12 = h % 12 || 12;
  const minStr = m.toString().padStart(2, '0');
  return `${hour12}:${minStr} ${ampm}`;
}

function generateTimeSlots(startHour, endHour, durationMinutes) {
  const timeSlots = [];
  let currentMinutes = startHour * 60;
  const endMinutes = endHour * 60;

  while (currentMinutes + durationMinutes <= endMinutes) {
    const startH = Math.floor(currentMinutes / 60);
    const startM = currentMinutes % 60;

    const endTotalMinutes = currentMinutes + durationMinutes;
    const endH = Math.floor(endTotalMinutes / 60);
    const endM = endTotalMinutes % 60;

    timeSlots.push({
      start: formatValidationTime(startH, startM),
      end: formatValidationTime(endH, endM),
    });

    currentMinutes += durationMinutes;
  }
  return timeSlots;
}

export default function CreateCourtModal({ open, isOpen, close, onCourtCreated }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courtData, setCourtData] = useState({
    name: "",
    location: "",
    startHour: "",
    endHour: "",
    pricePerHour: "",
    daysInAdvance: 30,
    durationMinutes: 90, // Default to 90 mins
    courtImg: null,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    setCourtData({ ...courtData, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setCourtData({ ...courtData, courtImg: e.target.files[0] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate inputs
      if (!courtData.name || !courtData.location || !courtData.startHour ||
        !courtData.endHour || !courtData.pricePerHour) {
        throw new Error(t('owner_fill_fields'));
      }

      // Convert time to hours (HH:MM format to hour number)
      const startHour = parseInt(courtData.startHour.split(':')[0]);
      const endHour = parseInt(courtData.endHour.split(':')[0]);

      if (startHour >= endHour) {
        throw new Error(t('owner_end_after_start'));
      }

      let courtImgUrl = null;
      let courtImgPublicId = null;

      // Upload image to Supabase Storage if provided
      if (courtData.courtImg) {
        const fileExt = courtData.courtImg.name.split('.').pop();
        const fileName = `${user.id}-${Date.now()}.${fileExt}`;
        const filePath = `court-images/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('courts')
          .upload(filePath, courtData.courtImg);

        if (uploadError) {
          console.error('Upload error:', uploadError);
          // Continue without image if upload fails
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('courts')
            .getPublicUrl(filePath);

          courtImgUrl = publicUrl;
          courtImgPublicId = filePath;
        }
      }

      // Create court in database
      const { data: newCourt, error: courtError } = await supabase
        .from('courts')
        .insert({
          name: courtData.name,
          location: courtData.location,
          operating_hours_start: startHour.toString(),
          operating_hours_end: endHour.toString(),
          price_per_hour: parseFloat(courtData.pricePerHour),
          owner_id: user.id,
          court_img_url: courtImgUrl,
          court_img_public_id: courtImgPublicId
        })
        .select()
        .single();

      if (courtError) throw courtError;

      // Generate availability for the specified number of days
      const availabilityRecords = [];
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);
      const timeSlots = generateTimeSlots(startHour, endHour, parseInt(courtData.durationMinutes));

      for (let i = 0; i < courtData.daysInAdvance; i++) {
        const currentDate = new Date(startDate);
        currentDate.setDate(startDate.getDate() + i);

        for (const slot of timeSlots) {
          availabilityRecords.push({
            court_id: newCourt.id,
            available_date: currentDate.toISOString().split('T')[0],
            time_slot_start: slot.start,
            time_slot_end: slot.end,
            is_available: true
          });
        }
      }

      // Insert availability records
      const { error: availError } = await supabase
        .from('court_availability')
        .insert(availabilityRecords);

      if (availError) {
        console.error('Error creating availability:', availError);
      }

      // Reset form
      setCourtData({
        name: "",
        location: "",
        startHour: "",
        endHour: "",
        pricePerHour: "",
        daysInAdvance: 30,
        durationMinutes: 90,
        courtImg: null,
      });

      // Notify parent component
      if (onCourtCreated) {
        onCourtCreated(newCourt);
      }

      // Close modal
      close();

      alert(t('owner_create_succ'));
    } catch (error) {
      console.error("Error creating court:", error);
      setError(error.message || t('owner_create_failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        onClick={open}
        className="w-48 rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white focus:outline-none hover:bg-black/30"
      >
        {t('owner_create_stadium')}
      </Button>

      <Dialog
        open={isOpen}
        as="div"
        className="relative z-10 focus:outline-none"
        onClose={close}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/30">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-sm rounded-xl bg-white p-6 backdrop-blur-2xl duration-300 ease-out">
              <h1 className="text-xl font-bold">{t('owner_add_court_title')}</h1>
              <br />

              {error && (
                <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
                  {error}
                </div>
              )}

              <DialogTitle className="space-y-4">
                <label className="block">
                  <span className="text-gray-700">{t('owner_name')} *</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="text"
                    name="name"
                    value={courtData.name}
                    onChange={handleChange}
                    placeholder={t('owner_enter_name')}
                    required
                  />
                </label>
                <label className="block">
                  <span className="text-gray-700">{t('owner_location')} *</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="text"
                    name="location"
                    value={courtData.location}
                    onChange={handleChange}
                    placeholder={t('owner_enter_location')}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700">{t('owner_start_hour')}</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="time"
                    name="startHour"
                    value={courtData.startHour}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700">{t('owner_end_hour')}</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="time"
                    name="endHour"
                    value={courtData.endHour}
                    onChange={handleChange}
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700">{t('owner_price')} *</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="number"
                    name="pricePerHour"
                    value={courtData.pricePerHour}
                    onChange={handleChange}
                    placeholder={t('owner_enter_price')}
                    min="0"
                    step="0.01"
                    required
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700">{t('owner_days_advance')}</span>
                  <input
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    type="number"
                    name="daysInAdvance"
                    value={courtData.daysInAdvance}
                    onChange={handleChange}
                    placeholder={t('owner_enter_days')}
                    min="1"
                  />
                </label>

                <label className="block">
                  <span className="text-gray-700">Slot Duration (minutes)</span>
                  <select
                    className="w-full rounded-md h-11 p-3 border-2 shadow-md mt-1"
                    name="durationMinutes"
                    value={courtData.durationMinutes}
                    onChange={handleChange}
                  >
                    <option value="60">60 Minutes (1 Hour)</option>
                    <option value="90">90 Minutes (1.5 Hours)</option>
                  </select>
                </label>

                <label className="block">
                  <span className="text-gray-700">{t('owner_court_img')}</span>
                  <input
                    className="w-full rounded-md h-15 p-3 border-2 shadow-md mt-1"
                    type="file"
                    name="courtImg"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </DialogTitle>

              <div className="mt-4 flex space-x-3">
                <Button
                  className="w-full rounded-md bg-blue-600 py-1.5 px-3 text-sm font-semibold text-white shadow-inner focus:outline-none hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? t('owner_creating') : t('owner_submit')}
                </Button>
                <Button
                  className="w-full rounded-md bg-gray-500 py-1.5 px-3 text-sm font-semibold text-white shadow-inner focus:outline-none hover:bg-gray-600"
                  onClick={close}
                  disabled={loading}
                >
                  {t('owner_cancel')}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
