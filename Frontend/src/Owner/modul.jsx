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
  const interval = 30; // 30 minute interval

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

    currentMinutes += interval;
  }
  return timeSlots;
}

export default function CreateCourtModal({ open, isOpen, close, onCourtCreated }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [courtData, setCourtData] = useState({
    name: '',
    location: 'n/a',
    number: 1,
    is_indoor: false,
    startHour: '08:00',
    endHour: '23:00',
    pricePerHour: '',
    durationMinutes: 90,
    daysInAdvance: 30, // Default to 30 days
    description: '',
    features: [],
    courtImg: null
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;

    if (name === 'features') {
      let updatedFeatures = [...courtData.features];
      if (checked) {
        updatedFeatures.push(value);
      } else {
        updatedFeatures = updatedFeatures.filter(f => f !== value);
      }
      setCourtData(prev => ({ ...prev, features: updatedFeatures }));
    } else if (name === 'is_indoor') { // Specific handling for radio buttons
      setCourtData(prev => ({ ...prev, is_indoor: value === 'true' }));
    } else {
      setCourtData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setCourtData(prev => ({ ...prev, courtImg: e.target.files[0] }));
    }
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
        className="w-48 rounded-xl bg-[var(--owner-accent)] py-3 px-4 text-sm font-bold text-white focus:outline-none hover:bg-[var(--owner-accent-hover)] shadow-[var(--owner-glow-accent)] transition-all hover:scale-[1.02]"
      >
        {t('owner_create_stadium')}
      </Button>

      <Dialog
        open={isOpen}
        as="div"
        className="relative z-50 focus:outline-none"
        onClose={close}
      >
        <div className="fixed inset-0 z-10 w-screen overflow-y-auto bg-[rgba(224,229,242,0.5)] backdrop-blur-sm">
          <div className="flex min-h-full items-center justify-center p-4">
            <DialogPanel className="w-full max-w-3xl rounded-[var(--owner-radius-lg)] bg-[var(--owner-card-bg)] p-0 shadow-[var(--owner-shadow-premium)] border-none text-[var(--owner-text-primary)] max-h-[90vh] overflow-hidden flex flex-col">
              {/* Header */}
              <div className="p-8 border-b border-[var(--owner-border)] flex items-center justify-between bg-white">
                <div>
                  <DialogTitle className="text-2xl font-bold text-[var(--owner-text-primary)]">{t('owner_add_court_title')}</DialogTitle>
                  <p className="text-sm text-[var(--owner-text-secondary)] mt-1 font-medium">Inserisci i dettagli per configurare il tuo nuovo campo da padel.</p>
                </div>
                <button onClick={close} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-[var(--owner-text-secondary)]">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path></svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-8">
                {error && (
                  <div className="mb-8 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-medium flex items-center gap-3">
                    <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"></path></svg>
                    {error}
                  </div>
                )}

                <div className="space-y-10">
                  {/* Informazioni Generali */}
                  <section>
                    <h2 className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-6 px-1">Informazioni Generali</h2>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">{t('owner_name')} <span className="text-red-500">*</span></label>
                        <input
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] placeholder:text-[var(--owner-text-secondary)] focus:bg-white focus:border-[var(--owner-accent)] focus:ring-0 outline-none transition-all font-medium"
                          type="text"
                          name="name"
                          value={courtData.name}
                          onChange={handleChange}
                          placeholder="Inserisci nome campo"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">Tipo Campo</label>
                        <div className="flex p-1.5 bg-[var(--owner-bg-primary)] rounded-2xl h-[58px]">
                          <label className={`flex-1 flex items-center justify-center rounded-xl cursor-pointer transition-all ${!courtData.is_indoor ? 'bg-white text-[var(--owner-accent)] shadow-sm' : 'text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]'}`}>
                            <input type="radio" name="is_indoor" value="false" checked={!courtData.is_indoor} onChange={handleChange} className="hidden" />
                            <span className="font-bold flex items-center gap-2 text-sm"><span className="text-lg">🌞</span> Scoperto</span>
                          </label>
                          <label className={`flex-1 flex items-center justify-center rounded-xl cursor-pointer transition-all ${courtData.is_indoor ? 'bg-white text-[var(--owner-accent)] shadow-sm' : 'text-[var(--owner-text-secondary)] hover:text-[var(--owner-text-primary)]'}`}>
                            <input type="radio" name="is_indoor" value="true" checked={courtData.is_indoor} onChange={handleChange} className="hidden" />
                            <span className="font-bold flex items-center gap-2 text-sm"><span className="text-lg">🏠</span> Coperto</span>
                          </label>
                        </div>
                      </div>
                    </div>
                  </section>

                  {/* Configurazione Operativa */}
                  <section>
                    <h2 className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-6 px-1">Configurazione Operativa</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">{t('owner_start_hour')}</label>
                        <input
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all font-medium"
                          type="time"
                          name="startHour"
                          value={courtData.startHour}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">{t('owner_end_hour')}</label>
                        <input
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all font-medium"
                          type="time"
                          name="endHour"
                          value={courtData.endHour}
                          onChange={handleChange}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">{t('owner_price')} (€/h)</label>
                        <input
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] placeholder:text-[var(--owner-text-secondary)] focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all font-medium"
                          type="number"
                          name="pricePerHour"
                          value={courtData.pricePerHour}
                          onChange={handleChange}
                          placeholder="0.00"
                          min="0"
                          step="0.01"
                          required
                        />
                      </div>

                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">{t('owner_days_advance')}</label>
                        <input
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all font-medium"
                          type="number"
                          name="daysInAdvance"
                          value={courtData.daysInAdvance}
                          onChange={handleChange}
                          min="1"
                        />
                      </div>
                    </div>
                  </section>

                  {/* Dettagli e Caratteristiche */}
                  <section>
                    <h2 className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-6 px-1">Dettagli e Caratteristiche</h2>
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-sm font-bold text-[var(--owner-text-primary)] px-1">Descrizione campo</label>
                        <textarea
                          className="w-full rounded-2xl bg-[var(--owner-bg-primary)] border-transparent p-4 text-[var(--owner-text-primary)] placeholder:text-[var(--owner-text-secondary)] focus:bg-white focus:border-[var(--owner-accent)] outline-none transition-all min-h-[100px] font-medium"
                          name="description"
                          value={courtData.description}
                          onChange={handleChange}
                          placeholder="Aggiungi una descrizione per questo campo..."
                        />
                      </div>

                      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {['illuminazione', 'spogliatoi', 'parcheggio', 'bar'].map((feat) => (
                          <label key={feat} className={`flex items-center gap-3 p-4 rounded-2xl border transition-all cursor-pointer ${courtData.features.includes(feat) ? 'bg-[var(--owner-bg-primary)] border-[var(--owner-accent)]' : 'bg-white border-[var(--owner-border)] hover:bg-[var(--owner-bg-primary)]'}`}>
                            <input type="checkbox" name="features" value={feat} checked={courtData.features.includes(feat)} onChange={handleChange} className="w-5 h-5 rounded border-gray-300 text-[var(--owner-accent)] focus:ring-[var(--owner-accent)] bg-transparent" />
                            <span className={`text-sm font-bold flex items-center gap-2 ${courtData.features.includes(feat) ? 'text-[var(--owner-accent)]' : 'text-[var(--owner-text-secondary)]'}`}>
                              {feat === 'illuminazione' && <><span className="text-lg">💡</span> Luci</>}
                              {feat === 'spogliatoi' && <><span className="text-lg">🚿</span> Docce</>}
                              {feat === 'parcheggio' && <><span className="text-lg">🅿️</span> Park</>}
                              {feat === 'bar' && <><span className="text-lg">☕</span> Bar</>}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  </section>

                  {/* Immagine */}
                  <section>
                    <h2 className="text-xs font-bold text-[var(--owner-accent)] uppercase tracking-widest mb-6 px-1">{t('owner_court_img')}</h2>
                    <div className={`relative group border-2 border-dashed rounded-[30px] p-10 transition-all flex flex-col items-center justify-center gap-4 ${courtData.courtImg ? 'border-[var(--owner-accent)] bg-[var(--owner-bg-primary)]' : 'border-[var(--owner-border)] hover:border-gray-300 bg-white'}`}>
                      <input
                        type="file"
                        name="courtImg"
                        accept="image/*"
                        onChange={handleFileChange}
                        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"
                      />
                      <div className={`p-4 rounded-full ${courtData.courtImg ? 'bg-white text-[var(--owner-accent)] shadow-sm' : 'bg-[var(--owner-bg-primary)] text-[var(--owner-text-secondary)]'}`}>
                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                      </div>
                      <div className="text-center">
                        <p className="text-sm font-bold text-[var(--owner-text-primary)]">{courtData.courtImg ? courtData.courtImg.name : "Carica un'immagine per il campo"}</p>
                        <p className="text-xs text-[var(--owner-text-secondary)] mt-1 font-medium">PNG, JPG fino a 10MB</p>
                      </div>
                    </div>
                  </section>
                </div>
              </div>

              {/* Footer */}
              <div className="p-8 border-t border-[var(--owner-border)] bg-gray-50 flex gap-4">
                <Button
                  className="flex-1 rounded-2xl bg-white border border-[var(--owner-border)] py-4 px-6 text-sm font-bold hover:bg-gray-50 transition-all text-[var(--owner-text-secondary)] shadow-sm"
                  onClick={close}
                  disabled={loading}
                >
                  {t('owner_cancel')}
                </Button>
                <Button
                  className="flex-[2] rounded-2xl bg-[var(--owner-accent)] py-4 px-6 text-sm font-bold text-white shadow-[var(--owner-glow-accent)] hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--owner-accent-hover)]"
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <span className="flex items-center justify-center gap-2">
                      <svg className="animate-spin h-5 w-5 text-white" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                      {t('owner_creating')}
                    </span>
                  ) : t('owner_submit')}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </div>
      </Dialog>
    </>
  );
}
