const asyncHandler = require("../middlewares/AsyncHandler");
const appError = require("../utils/AppError");
const { supabase } = require("../db/supabase");

/**
 * @desc Create a new booking for a court
 * @route POST /api/createbooking
 * @access Private
 * @middleware verifyToken
 */
exports.CreateBooking = asyncHandler(async (req, res, next) => {
  const { courtId, date, timeSlot } = req.body;
  const userId = req.user.userId;

  if (!courtId || !date || !timeSlot || !timeSlot.start || !timeSlot.end) {
    return next(new appError("All fields are required", 400));
  }

  try {
    // Check if the court exists
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (courtError || !court) {
      return next(new appError("Court not found", 404));
    }

    // Check if the time slot is available
    const { data: availability, error: availError } = await supabase
      .from('court_availability')
      .select('*')
      .eq('court_id', courtId)
      .eq('available_date', date)
      .eq('time_slot_start', timeSlot.start)
      .eq('time_slot_end', timeSlot.end)
      .eq('is_available', true)
      .single();

    if (availError || !availability) {
      return next(new appError("This Court is not available at this time", 400));
    }

    // Create the booking
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .insert({
        court_id: courtId,
        user_id: userId,
        booking_date: date,
        time_slot_start: timeSlot.start,
        time_slot_end: timeSlot.end,
        status: 'Pending'
      })
      .select()
      .single();

    if (bookingError) {
      return next(new appError(bookingError.message, 500));
    }

    // Mark the time slot as unavailable
    const { error: updateError } = await supabase
      .from('court_availability')
      .update({ is_available: false })
      .eq('id', availability.id);

    if (updateError) {
      // Rollback: delete the booking
      await supabase.from('bookings').delete().eq('id', booking.id);
      return next(new appError("Failed to update availability", 500));
    }

    res.status(200).json({
      message: "Booking Created Successfully",
      booking: {
        ...booking,
        courtName: court.name
      }
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Confirm a pending booking
 * @route POST /api/confirmbooking/:bookingId
 * @access Private
 * @middleware verifyToken
 */
exports.confirmBooking = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;

  try {
    // Find the pending booking
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .eq('status', 'Pending')
      .single();

    if (findError || !booking) {
      return next(new appError("Booking not found or not pending", 404));
    }

    // Update booking status to confirmed
    const { data: updatedBooking, error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'confirmed' })
      .eq('id', bookingId)
      .select()
      .single();

    if (updateError) {
      return next(new appError(updateError.message, 500));
    }

    res.status(200).json({
      success: true,
      message: "Booking Confirmed",
      booking: updatedBooking,
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Cancel an existing booking
 * @route POST /api/cancelbooking/:bookingId
 * @access Private
 * @middleware verifyToken
 */
exports.cancelBooking = asyncHandler(async (req, res, next) => {
  const { bookingId } = req.params;
  const userId = req.user.userId;

  try {
    // Find the booking
    const { data: booking, error: findError } = await supabase
      .from('bookings')
      .select('*')
      .eq('id', bookingId)
      .single();

    if (findError || !booking) {
      return next(new appError("Booking not found", 404));
    }

    // Check if user owns this booking
    if (booking.user_id !== userId) {
      return next(new appError("You are not authorized to cancel this booking", 403));
    }

    // Update booking status to cancelled
    const { error: updateError } = await supabase
      .from('bookings')
      .update({ status: 'cancelled' })
      .eq('id', bookingId);

    if (updateError) {
      return next(new appError(updateError.message, 500));
    }

    // Return the time slot to availability
    const { error: availError } = await supabase
      .from('court_availability')
      .update({ is_available: true })
      .eq('court_id', booking.court_id)
      .eq('available_date', booking.booking_date)
      .eq('time_slot_start', booking.time_slot_start)
      .eq('time_slot_end', booking.time_slot_end);

    if (availError) {
      console.error('Error updating availability:', availError);
      // Don't fail the cancellation if availability update fails
    }

    res.status(200).json({
      success: true,
      message: "Booking cancelled successfully",
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Retrieve all bookings
 * @route GET /api/bookings
 * @access Private
 * @middleware verifyToken
 */
exports.getBookings = asyncHandler(async (req, res, next) => {
  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          location,
          price_per_hour
        ),
        profiles:user_id (
          id,
          name,
          email
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new appError(error.message, 500));
    }

    res.status(200).json({
      success: true,
      bookings: bookings || [],
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get bookings for a specific user
 * @route GET /api/userbookings
 * @access Private
 * @middleware verifyToken
 */
exports.getUserBookings = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const { data: bookings, error } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          location,
          price_per_hour,
          court_img_url
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new appError(error.message, 500));
    }

    res.status(200).json({
      success: true,
      bookings: bookings || [],
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});
