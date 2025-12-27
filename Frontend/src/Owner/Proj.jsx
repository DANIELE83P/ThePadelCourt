/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import toast, { Toaster } from "react-hot-toast";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import withGuard from "../utils/withGuard";
import CreateCourtModal from "./modul";
import Appp from "./app";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";

const Proj = () => {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [starge, setStorge] = useState([]);
  const [courtToRemove, setCourtToRemove] = useState(null);
  const [courtToDuplicate, setCourtToDuplicate] = useState(null);
  const [duplicateName, setDuplicateName] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isOpenEditmModul, setIsOpenEditmModul] = useState(false);
  const [isOpenRemovemModul, setIsOpenremovemModul] = useState(false);
  const [isOpenDuplicateModul, setIsOpenDuplicateModul] = useState(false);
  const [editingCourt, setEditingCourt] = useState(null);
  const [loading, setLoading] = useState(false);

  const open = () => setIsOpen(true);
  const close = () => setIsOpen(false);

  const openEdit = (court) => {
    setEditingCourt(court);
    setIsOpenEditmModul(true);
  };
  const closeEdit = () => {
    setEditingCourt(null);
    setIsOpenEditmModul(false);
  };

  const openRemove = (courtId) => {
    setCourtToRemove(courtId);
    setIsOpenremovemModul(true);
  };
  const closeRemove = () => setIsOpenremovemModul(false);

  const openDuplicate = (court) => {
    setCourtToDuplicate(court);
    setDuplicateName(court.name + " - Copy");
    setIsOpenDuplicateModul(true);
  };
  const closeDuplicate = () => {
    setCourtToDuplicate(null);
    setDuplicateName("");
    setIsOpenDuplicateModul(false);
  };

  const fetchCourts = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .eq('owner_id', user.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setStorge(data || []);
    } catch (error) {
      console.error("Error fetching courts:", error);
      toast.error(t('owner_fetch_failed'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCourts();
  }, [user?.id]);

  const deleteCourt = async (courtId) => {
    try {
      const { error } = await supabase
        .from('courts')
        .delete()
        .eq('id', courtId);

      if (error) throw error;

      await fetchCourts();
      toast.success(t('owner_delete_succ'));
    } catch (error) {
      console.error("Error deleting court:", error);
      toast.error(t('owner_delete_failed'));
    }
  };

  const editCourt = async (editedData) => {
    try {
      const { error } = await supabase
        .from('courts')
        .update({
          name: editedData.name,
          number: parseInt(editedData.number),
          is_indoor: editedData.is_indoor === 'true',
          price_per_hour: parseFloat(editedData.pricePerHour),
          description: editedData.description || null,
          features: editedData.features || []
        })
        .eq('id', editedData.id);

      if (error) throw error;

      await fetchCourts();
      toast.success(t('owner_update_succ'));
      closeEdit();
    } catch (error) {
      console.error("Error updating court:", error);
      toast.error(t('owner_update_failed'));
    }
  };

  const duplicateCourt = async () => {
    if (!duplicateName.trim()) {
      toast.error(t('owner_dup_enter_name'));
      return;
    }

    try {
      setLoading(true);

      // Create duplicate court
      const { data: newCourt, error: courtError } = await supabase
        .from('courts')
        .insert({
          name: duplicateName,
          location: courtToDuplicate.location,
          operating_hours_start: courtToDuplicate.operating_hours_start,
          operating_hours_end: courtToDuplicate.operating_hours_end,
          price_per_hour: courtToDuplicate.price_per_hour,
          owner_id: user.id,
          court_img_url: courtToDuplicate.court_img_url,
          court_img_public_id: courtToDuplicate.court_img_public_id,
          is_indoor: courtToDuplicate.is_indoor,
          description: courtToDuplicate.description,
          features: courtToDuplicate.features,
          number: (parseInt(courtToDuplicate.number) || 0) + 1 // Auto-increment number for duplicate
        })
        .select()
        .single();

      if (courtError) throw courtError;

      // Generate availability for the new court (30 days by default)
      const startHour = parseInt(courtToDuplicate.operating_hours_start);
      const endHour = parseInt(courtToDuplicate.operating_hours_end);
      const availabilityRecords = [];
      const startDate = new Date();
      startDate.setHours(0, 0, 0, 0);

      // Helper function to generate time slots
      const generateTimeSlots = (start, end) => {
        const slots = [];
        for (let hour = start; hour < end; hour++) {
          const startTime =
            hour < 12
              ? `${hour === 0 ? 12 : hour}:00 AM`
              : `${hour === 12 ? 12 : hour - 12}:00 PM`;
          const nextHour = hour + 1;
          const endTime =
            nextHour < 12
              ? `${nextHour === 0 ? 12 : nextHour}:00 AM`
              : `${nextHour === 12 ? 12 : nextHour - 12}:00 PM`;
          slots.push({ start: startTime, end: endTime });
        }
        return slots;
      };

      const timeSlots = generateTimeSlots(startHour, endHour);

      for (let i = 0; i < 30; i++) {
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

      await fetchCourts();
      toast.success(t('owner_dup_succ', { name: duplicateName }));
      closeDuplicate();
    } catch (error) {
      console.error("Error duplicating court:", error);
      toast.error(t('owner_dup_failed'));
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);

    // Collect all features checkboxes
    const features = formData.getAll('features');

    const editedData = {
      id: editingCourt.id,
      name: formData.get('name'),
      number: formData.get('number'),
      is_indoor: formData.get('is_indoor'),
      pricePerHour: formData.get('pricePerHour'),
      description: formData.get('description'),
      features: features
    };

    editCourt(editedData);
  };

  const handleCourtCreated = () => {
    fetchCourts();
  };

  return (
    <>
      <div className="text-center mb-6">
        <CreateCourtModal
          open={open}
          isOpen={isOpen}
          close={close}
          onCourtCreated={handleCourtCreated}
        />
      </div>
      <br />

      {loading ? (
        <div className="text-center py-10">
          <p className="text-lg">{t('courts_loading')}</p>
        </div>
      ) : starge.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">{t('owner_no_courts')}</p>
        </div>
      ) : (
        <div className="w-auto ml-20 max-md:flex max-md:justify-center max-md:flex-col max-md:items-center max-md:my-2 max-md:mx-auto container grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4">
          {starge.map((court) => (
            <Appp
              key={court.id}
              openRemove={() => openRemove(court.id)}
              openDuplicate={() => openDuplicate(court)}
              idx={court.id}
              product={{
                ...court,
                courtImg: { url: court.court_img_url },
                pricePerHour: court.price_per_hour,
                operatingHours: {
                  start: court.operating_hours_start,
                  end: court.operating_hours_end
                }
              }}
              setEtit={() => openEdit(court)}
            />
          ))}
        </div>
      )}

      {/* Edit Modal */}
      <Dialog
        open={isOpenEditmModul}
        onClose={closeEdit}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-2xl font-semibold text-gray-800 mb-4">
              {t('owner_edit_title')}
            </Dialog.Title>
            <form onSubmit={handleEditSubmit}>
              <div className="space-y-4">
                {/* Nome Campo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('owner_name')}
                  </label>
                  <input
                    type="text"
                    name="name"
                    defaultValue={editingCourt?.name}
                    className="mt-1 block pl-3 w-full rounded-md h-10 border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    required
                  />
                </div>

                {/* Tipo Campo: Indoor/Outdoor */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo Campo
                  </label>
                  <div className="grid grid-cols-2 gap-4">
                    <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-all">
                      <input
                        type="radio"
                        name="is_indoor"
                        value="false"
                        defaultChecked={!editingCourt?.is_indoor}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-lg font-semibold">🌞 Scoperto</div>
                        <div className="text-xs text-gray-500">Campo all'aperto</div>
                      </div>
                    </label>
                    <label className="relative flex items-center p-4 border-2 rounded-lg cursor-pointer hover:border-blue-500 transition-all">
                      <input
                        type="radio"
                        name="is_indoor"
                        value="true"
                        defaultChecked={editingCourt?.is_indoor}
                        className="mr-3"
                      />
                      <div>
                        <div className="text-lg font-semibold">🏠 Coperto</div>
                        <div className="text-xs text-gray-500">Campo al chiuso</div>
                      </div>
                    </label>
                  </div>
                </div>

                {/* Numero Campo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Numero Campo
                  </label>
                  <input
                    type="number"
                    name="number"
                    defaultValue={editingCourt?.number}
                    className="mt-1 block pl-3 w-full rounded-md h-10 border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    min="1"
                    required
                  />
                </div>

                {/* Prezzo */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    {t('owner_price')} (€/ora)
                  </label>
                  <input
                    type="number"
                    name="pricePerHour"
                    defaultValue={editingCourt?.price_per_hour}
                    className="mt-1 pl-3 block w-full rounded-md h-10 border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    step="0.01"
                    min="0"
                    required
                  />
                </div>

                {/* Descrizione */}
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Descrizione (opzionale)
                  </label>
                  <textarea
                    name="description"
                    defaultValue={editingCourt?.description}
                    className="mt-1 block pl-3 w-full rounded-md border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                    rows="3"
                    placeholder="Descrizione del campo..."
                  />
                </div>

                {/* Caratteristiche */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caratteristiche (opzionale)
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="features"
                        value="illuminazione"
                        defaultChecked={editingCourt?.features?.includes('illuminazione')}
                        className="mr-2"
                      />
                      💡 Illuminazione
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="features"
                        value="spogliatoi"
                        defaultChecked={editingCourt?.features?.includes('spogliatoi')}
                        className="mr-2"
                      />
                      🚿 Spogliatoi
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="features"
                        value="parcheggio"
                        defaultChecked={editingCourt?.features?.includes('parcheggio')}
                        className="mr-2"
                      />
                      🅿️ Parcheggio
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        name="features"
                        value="bar"
                        defaultChecked={editingCourt?.features?.includes('bar')}
                        className="mr-2"
                      />
                      ☕ Bar/Ristoro
                    </label>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex justify-end space-x-2 pt-4 border-t">
                <Button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  {t('owner_save')}
                </Button>
                <Button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  onClick={closeEdit}
                >
                  {t('owner_cancel')}
                </Button>
              </div>
            </form>
          </Dialog.Panel>
        </div>
      </Dialog>

      {/* Remove Modal */}
      <Dialog
        open={isOpenRemovemModul}
        onClose={closeRemove}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full h-auto max-w-sm rounded bg-white p-6">
            <DialogTitle className="text-lg font-medium leading-6 text-gray-900">
              {t('owner_confirm_del_title')}
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                {t('owner_confirm_del_text')}
              </p>
            </div>
            <div className="mt-4 flex justify-end space-x-2">
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-red-500 focus-visible:ring-offset-2"
                onClick={() => {
                  deleteCourt(courtToRemove);
                  closeRemove();
                }}
              >
                {t('owner_yes_remove')}
              </Button>
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                onClick={closeRemove}
              >
                {t('owner_cancel')}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      {/* Duplicate Modal */}
      <Dialog
        open={isOpenDuplicateModul}
        onClose={closeDuplicate}
        className="relative z-10"
      >
        <div className="fixed inset-0 bg-black/30" aria-hidden="true" />
        <div className="fixed inset-0 flex items-center justify-center p-4">
          <DialogPanel className="w-full h-auto max-w-md rounded-lg bg-white p-6">
            <DialogTitle className="text-lg font-medium leading-6 text-gray-900 mb-4">
              Duplica Campo
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-4">
                Inserisci un nome per il campo duplicato. Tutte le altre impostazioni verranno copiate.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Nome Nuovo Campo
              </label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="w-full rounded-md h-11 p-3 border-2 border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                placeholder={t('owner_enter_name')}
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={duplicateCourt}
                disabled={loading || !duplicateName.trim()}
              >
                {loading ? t('owner_duplicating') : t('owner_duplicate')}
              </Button>
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                onClick={closeDuplicate}
                disabled={loading}
              >
                {t('owner_cancel')}
              </Button>
            </div>
          </DialogPanel>
        </div>
      </Dialog>

      <Toaster />
    </>
  );
};

export default withGuard(Proj);
