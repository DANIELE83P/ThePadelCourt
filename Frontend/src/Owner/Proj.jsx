/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import { Button, Dialog, DialogPanel, DialogTitle } from "@headlessui/react";
import Page from "./ownerPage";
import withGuard from "../utils/withGuard";
import CreateCourtModal from "./modul";
import Appp from "./app";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";

const Proj = () => {
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
      toast.error("Failed to fetch courts");
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
      toast.success("Court deleted successfully");
    } catch (error) {
      console.error("Error deleting court:", error);
      toast.error("Failed to delete court");
    }
  };

  const editCourt = async (editedData) => {
    try {
      const { error } = await supabase
        .from('courts')
        .update({
          name: editedData.name,
          location: editedData.location,
          price_per_hour: parseFloat(editedData.pricePerHour)
        })
        .eq('id', editedData.id);

      if (error) throw error;

      await fetchCourts();
      toast.success("Court updated successfully");
      closeEdit();
    } catch (error) {
      console.error("Error updating court:", error);
      toast.error("Failed to update court");
    }
  };

  const duplicateCourt = async () => {
    if (!duplicateName.trim()) {
      toast.error("Please enter a name for the duplicate court");
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
          court_img_public_id: courtToDuplicate.court_img_public_id
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
      toast.success(`Court "${duplicateName}" created successfully!`);
      closeDuplicate();
    } catch (error) {
      console.error("Error duplicating court:", error);
      toast.error("Failed to duplicate court");
    } finally {
      setLoading(false);
    }
  };

  const handleEditSubmit = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const editedData = Object.fromEntries(formData.entries());
    editedData.id = editingCourt.id;
    editCourt(editedData);
  };

  const handleCourtCreated = () => {
    fetchCourts();
  };

  return (
    <>
      <Page />
      <br />
      <div className="text-center">
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
          <p className="text-lg">Loading courts...</p>
        </div>
      ) : starge.length === 0 ? (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No courts yet. Create your first court!</p>
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
          <Dialog.Panel className="w-full max-w-lg h-auto rounded-lg bg-white p-6 shadow-lg">
            <Dialog.Title className="text-2xl font-semibold text-gray-800 mb-4">
              Edit Court
            </Dialog.Title>
            <form onSubmit={handleEditSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Name
                </label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingCourt?.name}
                  className="mt-1 block pl-3 w-full rounded-md h-10 border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Location
                </label>
                <input
                  type="text"
                  name="location"
                  defaultValue={editingCourt?.location}
                  className="mt-1 block pl-3 w-full rounded-md h-10 border-gray-300 shadow-md focus:border-blue-500 focus:ring focus:ring-blue-200 focus:ring-opacity-50"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Price Per Hour (€)
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

              <div className="mt-6 flex justify-end space-x-2">
                <Button
                  type="submit"
                  className="inline-flex justify-center rounded-md border border-transparent bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
                >
                  Save Changes
                </Button>
                <Button
                  type="button"
                  className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                  onClick={closeEdit}
                >
                  Cancel
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
              Confirm Deletion
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-500">
                Are you sure you want to remove this court? This action cannot
                be undone.
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
                Yes, Remove
              </Button>
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                onClick={closeRemove}
              >
                Cancel
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
              Duplicate Court
            </DialogTitle>
            <div className="mt-2">
              <p className="text-sm text-gray-500 mb-4">
                Enter a name for the duplicate court. All other settings will be copied.
              </p>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                New Court Name
              </label>
              <input
                type="text"
                value={duplicateName}
                onChange={(e) => setDuplicateName(e.target.value)}
                className="w-full rounded-md h-11 p-3 border-2 border-gray-300 shadow-sm focus:border-green-500 focus:ring focus:ring-green-200 focus:ring-opacity-50"
                placeholder="Enter court name"
              />
            </div>
            <div className="mt-6 flex justify-end space-x-2">
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={duplicateCourt}
                disabled={loading || !duplicateName.trim()}
              >
                {loading ? "Duplicating..." : "Duplicate"}
              </Button>
              <Button
                type="button"
                className="inline-flex justify-center rounded-md border border-transparent bg-gray-200 px-4 py-2 text-sm font-medium text-gray-900 hover:bg-gray-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-gray-500 focus-visible:ring-offset-2"
                onClick={closeDuplicate}
                disabled={loading}
              >
                Cancel
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
