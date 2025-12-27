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
    number: "",
    is_indoor: false,
    description: "",
    features: [],
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
    const { name, value, type, checked } = e.target;
    if (type === 'checkbox' && name === 'features') {
      const updatedFeatures = checked
        ? [...courtData.features, value]
        : courtData.features.filter(f => f !== value);
      setCourtData({ ...courtData, features: updatedFeatures });
    } else if (type === 'radio' && name === 'is_indoor') {
      setCourtData({ ...courtData, is_indoor: value === 'true' });
    } else {
      setCourtData({ ...courtData, [name]: value });
    }
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
          number: parseInt(courtData.number) || null,
          is_indoor: courtData.is_indoor,
          description: courtData.description,
          features: courtData.features,
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
        number: "",
        is_indoor: false,
        description: "",
        features: [],
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
        className="w-48 rounded-md bg-blue-600 py-2 px-4 text-sm font-medium text-white focus:outline-none hover:bg-blue-700 shadow-md transition-all"
      >
        {t('owner_create_stadium')}
      </Button>

      <Dialog
        open={isOpen}
        as="div"
        className="relative z-50 focus:outline-none"
        onClose={close}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-black/50 backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-2xl rounded-xl bg-[var(--owner-card-bg)] p-8 shadow-2xl border border-[var(--owner-border)] text-[var(--owner-text-primary)] max-h-[90vh] overflow-y-auto">
              <h1 className="text-2xl font-bold mb-6">{t('owner_add_court_title')}</h1>

              {error && (
                <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 text-red-500 rounded-lg text-sm">
                  {error}
                </div>
              )}

              <DialogTitle className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Nome e Location - Prima Riga */}
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_name')} <span className="text-red-500">*</span></span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="text"
                      name="name"
                      value={courtData.name}
                      onChange={handleChange}
                      placeholder={t('owner_enter_name')}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_location')} <span className="text-red-500">*</span></span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="text"
                      name="location"
                      value={courtData.location}
                      onChange={handleChange}
                      placeholder={t('owner_enter_location')}
                      required
                    />
                  </label>

                  {/* Numero e Tipo (Indoor/Outdoor) */}
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">Numero Campo</span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="number"
                      name="number"
                      value={courtData.number}
                      onChange={handleChange}
                      placeholder="es. 1"
                      min="1"
                    />
                  </label>

                  <div className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase block mb-1">Tipo Campo</span>
                    <div className="flex bg-[var(--owner-bg-primary)] p-1 rounded-lg border border-[var(--owner-border)]">
                      <label className={`flex-1 text-center py-2 rounded cursor-pointer transition-colors ${!courtData.is_indoor ? 'bg-[var(--owner-accent)] text-white font-bold' : 'text-[var(--owner-text-secondary)] hover:bg-[var(--owner-bg-secondary)]'}`}>
                        <input
                          type="radio"
                          name="is_indoor"
                          value="false"
                          checked={!courtData.is_indoor}
                          onChange={handleChange}
                          className="hidden"
                        />
                        🌞 Scoperto
                      </label>
                      <label className={`flex-1 text-center py-2 rounded cursor-pointer transition-colors ${courtData.is_indoor ? 'bg-[var(--owner-accent)] text-white font-bold' : 'text-[var(--owner-text-secondary)] hover:bg-[var(--owner-bg-secondary)]'}`}>
                        <input
                          type="radio"
                          name="is_indoor"
                          value="true"
                          checked={courtData.is_indoor}
                          onChange={handleChange}
                          className="hidden"
                        />
                        🏠 Coperto
                      </label>
                    </div>
                  </div>
                </div>

                {/* Orari e Prezzi */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_start_hour')}</span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="time"
                      name="startHour"
                      value={courtData.startHour}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_end_hour')}</span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="time"
                      name="endHour"
                      value={courtData.endHour}
                      onChange={handleChange}
                      required
                    />
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_price')} <span className="text-red-500">*</span></span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
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
                </div>

                {/* Descrizione */}
                <label className="block">
                  <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">Descrizione (opzionale)</span>
                  <textarea
                    className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                    name="description"
                    value={courtData.description}
                    onChange={handleChange}
                    rows="3"
                    placeholder="Descrizione del campo..."
                  />
                </label>

                {/* Caratteristiche */}
                <div>
                  <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase mb-2 block">Caratteristiche</span>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {['illuminazione', 'spogliatoi', 'parcheggio', 'bar'].map((feat) => (
                      <label key={feat} className="flex items-center space-x-2 bg-[var(--owner-bg-primary)] p-3 rounded-lg border border-[var(--owner-border)] cursor-pointer hover:border-[var(--owner-accent)] transition-colors">
                        <input
                          type="checkbox"
                          name="features"
                          value={feat}
                          checked={courtData.features.includes(feat)}
                          onChange={handleChange}
                          className="rounded text-[var(--owner-accent)] focus:ring-[var(--owner-accent)]"
                        />
                        <span className="text-sm capitalize">
                          {feat === 'illuminazione' && '💡 Luci'}
                          {feat === 'spogliatoi' && '🚿 Docce'}
                          {feat === 'parcheggio' && '🅿️ Park'}
                          {feat === 'bar' && '☕ Bar'}
                        </span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Durata e Giorni Anticipo */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">Durata Slot</span>
                    <select
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      name="durationMinutes"
                      value={courtData.durationMinutes}
                      onChange={handleChange}
                    >
                      <option value="60">60 Minuti (1 Ora)</option>
                      <option value="90">90 Minuti (1.5 Ore)</option>
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_days_advance')}</span>
                    <input
                      className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                      type="number"
                      name="daysInAdvance"
                      value={courtData.daysInAdvance}
                      onChange={handleChange}
                      placeholder={t('owner_enter_days')}
                      min="1"
                    />
                  </label>
                </div>

                <label className="block">
                  <span className="text-sm font-bold text-[var(--owner-text-secondary)] uppercase">{t('owner_court_img')}</span>
                  <input
                    className="w-full rounded-lg bg-[var(--owner-bg-primary)] border border-[var(--owner-border)] p-3 mt-1 focus:border-[var(--owner-accent)] outline-none transition-colors"
                    type="file"
                    name="courtImg"
                    accept="image/*"
                    onChange={handleFileChange}
                  />
                </label>
              </DialogTitle>

              <div className="mt-8 flex space-x-4 border-t border-[var(--owner-border)] pt-6">
                <Button
                  className="flex-1 rounded-lg bg-[var(--owner-accent)] py-3 px-4 text-sm font-bold text-white shadow-lg hover:bg-[var(--owner-accent-hover)] transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? t('owner_creating') : t('owner_submit')}
                </Button>
                <Button
                  className="flex-1 rounded-lg bg-[var(--owner-bg-secondary)] border border-[var(--owner-border)] py-3 px-4 text-sm font-bold text-[var(--owner-text-primary)] hover:bg-[var(--owner-bg-primary)] transition-all"
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
