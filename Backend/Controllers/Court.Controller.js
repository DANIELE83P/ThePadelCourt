const asyncHandler = require("../middlewares/AsyncHandler");
const appError = require("../utils/AppError");
const { supabase } = require("../db/supabase");
const { UploadPhotoToCloud } = require("../middlewares/UploadToCloudaniry");

// Generate time slots based on start and end hours
function generateTimeSlots(startHour, endHour) {
  // Check if startHour and endHour are defined
  if (startHour === undefined || endHour === undefined) {
    throw new Error("The startHour and endHour parameters are required");
  }

  // Check if startHour and endHour are valid
  if (startHour >= endHour) {
    throw new Error("Start hour must be less than end hour");
  }

  if (startHour < 0 || startHour > 23 || endHour < 0 || endHour > 23) {
    throw new Error("Time must be between 0 and 23");
  }

  const timeSlots = [];

  for (let hour = startHour; hour < endHour; hour++) {
    const startTime =
      hour < 12
        ? `${hour === 0 ? 12 : hour}:00 AM`
        : `${hour === 12 ? 12 : hour - 12}:00 PM`;

    const nextHour = hour + 1;
    const endTime =
      nextHour < 12
        ? `${nextHour === 0 ? 12 : nextHour}:00 AM`
        : `${nextHour === 12 ? 12 : nextHour - 12}:00 PM`;

    timeSlots.push({
      start: startTime,
      end: endTime,
    });
  }

  return timeSlots;
}

/**
 * @desc Create a new court
 * @route POST /api/createcourt
 * @access Private
 * @middleware verifyToken, isAdminOrOwner
 */
exports.CreateCourt = asyncHandler(async (req, res, next) => {
  const { name, location, pricePerHour, daysInAdvance = 30 } = req.body;
  const startHour = parseInt(req.body.startHour, 10);
  const endHour = parseInt(req.body.endHour, 10);

  // Check if the conversion was successful
  if (isNaN(startHour) || isNaN(endHour)) {
    return next(new appError("Invalid startHour or endHour", 400));
  }

  const ownerId = req.user.userId;

  // Ensure the owner is logged in
  if (!ownerId) return next(new appError("You Must Login", 401));

  // Validate required fields
  if (!name || !location || !startHour || !endHour || !pricePerHour)
    return next(new appError("All Fields are Required", 400));

  try {
    // Check if the court already exists
    const { data: existingCourt } = await supabase
      .from('courts')
      .select('id')
      .eq('name', name)
      .single();

    if (existingCourt) {
      return next(new appError("This Court Already Exists", 400));
    }

    let courtImgUrl = null;
    let courtImgPublicId = null;

    // Upload image if provided
    if (req.file) {
      const courtImg = await UploadPhotoToCloud(req.file);
      courtImgUrl = courtImg.url;
      courtImgPublicId = courtImg.public_id;
    }

    // Create the court
    const { data: newCourt, error: courtError } = await supabase
      .from('courts')
      .insert({
        name,
        location,
        operating_hours_start: startHour.toString(),
        operating_hours_end: endHour.toString(),
        price_per_hour: pricePerHour,
        owner_id: ownerId,
        court_img_url: courtImgUrl,
        court_img_public_id: courtImgPublicId
      })
      .select()
      .single();

    if (courtError) {
      return next(new appError(courtError.message, 500));
    }

    // Generate availability for the specified number of days in advance
    const availabilityRecords = [];
    const startDate = new Date();
    startDate.setHours(0, 0, 0, 0);
    const timeSlots = generateTimeSlots(startHour, endHour);

    for (let i = 0; i < daysInAdvance; i++) {
      const currentDate = new Date(startDate);
      currentDate.setDate(startDate.getDate() + i);

      // Create availability records for each time slot
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

    // Insert all availability records
    const { error: availError } = await supabase
      .from('court_availability')
      .insert(availabilityRecords);

    if (availError) {
      console.error('Error creating availability:', availError);
      // Don't fail the whole operation if availability creation fails
    }

    res.status(201).json({
      message: "Court created Successfully",
      newCourt
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get court availability for a specific date
 * @route GET /api/getcourt/:courtId
 * @access Private
 * @middleware verifyToken
 */
exports.getCourtAvailability = asyncHandler(async (req, res, next) => {
  const { courtId } = req.params;
  const { date } = req.query;

  try {
    // Find the court by ID
    const { data: court, error: courtError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', courtId)
      .single();

    if (courtError || !court) {
      return next(new appError("Court not found", 404));
    }

    let query = supabase
      .from('court_availability')
      .select('*')
      .eq('court_id', courtId)
      .eq('is_available', true)
      .order('available_date', { ascending: true })
      .order('time_slot_start', { ascending: true });

    // Filter by date if provided
    if (date) {
      query = query.eq('available_date', date);
    }

    const { data: availability, error: availError } = await query;

    if (availError) {
      return next(new appError(availError.message, 500));
    }

    res.status(200).json({
      status: "success",
      data: {
        courtName: court.name,
        availability: availability || []
      },
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get all courts
 * @route GET /api/getcourts
 * @access Public
 */
exports.getCourts = asyncHandler(async (req, res, next) => {
  try {
    const { data: courts, error } = await supabase
      .from('courts')
      .select(`
        *,
        profiles:owner_id (
          id,
          name
        )
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new appError(error.message, 500));
    }

    res.status(200).json({
      length: courts?.length || 0,
      message: "Courts",
      courts: courts || []
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get courts owned by the logged-in user
 * @route GET /api/getcourtsofowner
 * @access Private
 * @middleware verifyToken, isAdminOrOwner
 */
exports.getOwnerCourts = asyncHandler(async (req, res, next) => {
  const ownerId = req.user.userId;

  try {
    const { data: courts, error } = await supabase
      .from('courts')
      .select('*')
      .eq('owner_id', ownerId)
      .order('created_at', { ascending: false });

    if (error) {
      return next(new appError(error.message, 500));
    }

    res.status(200).json({
      length: courts?.length || 0,
      message: "Courts",
      courts: courts || []
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Delete a court
 * @route DELETE /api/deletecourt
 * @access Private
 * @middleware verifyToken, isAdminOrOwner
 */
exports.deleteCourt = asyncHandler(async (req, res, next) => {
  const { id } = req.body;

  // Validate court ID
  if (!id) return next(new appError("Court Id is Required", 400));

  try {
    // Check if court exists
    const { data: court, error: findError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !court) {
      return next(new appError("Court Not Found", 404));
    }

    // Delete the court (cascade will handle availability and bookings)
    const { error: deleteError } = await supabase
      .from('courts')
      .delete()
      .eq('id', id);

    if (deleteError) {
      return next(new appError(deleteError.message, 500));
    }

    res.status(200).json({ message: "Court Deleted" });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Edit an existing court
 * @route PUT /api/updatecourt
 * @access Private
 * @middleware verifyToken, isAdminOrOwner
 */
exports.editCourt = asyncHandler(async (req, res, next) => {
  const { id, name, location, pricePerHour } = req.body;

  // Validate court ID
  if (!id) return next(new appError("Court Id is Required", 400));

  try {
    // Check if court exists
    const { data: court, error: findError } = await supabase
      .from('courts')
      .select('*')
      .eq('id', id)
      .single();

    if (findError || !court) {
      return next(new appError("Court Not Found", 404));
    }

    // Prepare update data
    const updateData = {};
    if (name) updateData.name = name;
    if (location) updateData.location = location;
    if (pricePerHour) updateData.price_per_hour = pricePerHour;

    // Update the court
    const { data: updatedCourt, error: updateError } = await supabase
      .from('courts')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      return next(new appError(updateError.message, 500));
    }

    res.status(200).json({ message: "Court Updated", newCourt: updatedCourt });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get details of a specific court
 * @route GET /api/getcourt/:id
 * @access Public
 */
exports.getCourt = asyncHandler(async (req, res, next) => {
  const { id } = req.params;

  try {
    // Find the court by ID with owner info
    const { data: court, error } = await supabase
      .from('courts')
      .select(`
        *,
        profiles:owner_id (
          id,
          name
        )
      `)
      .eq('id', id)
      .single();

    if (error || !court) {
      return next(new appError("Court Not Found", 404));
    }

    res.status(200).json({ court });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});
