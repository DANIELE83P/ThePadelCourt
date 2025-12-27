import { useState } from "react";
import { Dialog, DialogPanel, DialogTitle, Button } from "@headlessui/react";
import { supabase } from "../lib/supabase";
import { useAuth } from "../Contexts/AuthContext";
import { toast } from "react-hot-toast";

export default function NewBookingModal({ isOpen, close, slot, courtName, onSuccess }) {
    const { user } = useAuth();
    const [playerName, setPlayerName] = useState("");
    const [loading, setLoading] = useState(false);

    const handleConfirm = async () => {
        if (!playerName) {
            toast.error("Please enter a player name");
            return;
        }

        try {
            setLoading(true);

            // 1. Create offline booking
            const { data: booking, error: bookingError } = await supabase
                .from('bookings')
                .insert({
                    court_id: slot.courtId,
                    user_id: user.id, // Owner creates it, maybe linked to owner for now? Or null if allowed.
                    booking_date: slot.data.available_date,
                    time_slot_start: slot.start,
                    time_slot_end: slot.end,
                    status: 'Confirmed',
                    booking_type: 'offline',
                    player_names: [playerName] // Array of names
                })
                .select()
                .single();

            if (bookingError) throw bookingError;

            // 2. Mark availability as false
            const { error: updateError } = await supabase
                .from('court_availability')
                .update({ is_available: false })
                .eq('id', slot.data.id);

            if (updateError) {
                // Rollback
                await supabase.from('bookings').delete().eq('id', booking.id);
                throw updateError;
            }

            toast.success("Booking created!");
            setPlayerName("");
            onSuccess();
            close();

        } catch (error) {
            console.error("Error creating manual booking:", error);
            toast.error(error.message || "Failed to book");
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={isOpen} onClose={close} className="relative z-50">
            <div className="fixed inset-0 bg-black/30 w-screen h-screen" aria-hidden="true" />

            <div className="fixed inset-0 flex items-center justify-center p-4">
                <DialogPanel className="w-full max-w-sm rounded bg-white p-6 shadow-xl">
                    <DialogTitle className="font-bold text-lg mb-4">Manual Booking</DialogTitle>

                    {slot && (
                        <div className="mb-4 text-sm text-gray-600 bg-gray-50 p-3 rounded">
                            <p><strong>Court:</strong> {courtName}</p>
                            <p><strong>Date:</strong> {slot.data.available_date}</p>
                            <p><strong>Time:</strong> {slot.start} - {slot.end}</p>
                        </div>
                    )}

                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Player Name</label>
                        <input
                            type="text"
                            value={playerName}
                            onChange={(e) => setPlayerName(e.target.value)}
                            className="w-full border rounded p-2 focus:ring-2 focus:ring-green-500 outline-none"
                            placeholder="e.g. Mario Rossi"
                            autoFocus
                        />
                    </div>

                    <div className="flex justify-end gap-2">
                        <Button onClick={close} className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded">
                            Cancel
                        </Button>
                        <Button
                            onClick={handleConfirm}
                            disabled={loading}
                            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                            {loading ? "Booking..." : "Confirm Booking"}
                        </Button>
                    </div>
                </DialogPanel>
            </div>
        </Dialog>
    );
}
