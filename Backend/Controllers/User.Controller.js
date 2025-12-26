const asyncHandler = require("../middlewares/AsyncHandler");
const appError = require("../utils/AppError");
const { supabase } = require("../db/supabase");

/**
 * @desc Get all users
 * @route GET /api/getusers
 * @access Private
 * @middleware verifyToken, isAdminOrOwner
 */
exports.getUsers = asyncHandler(async (req, res, next) => {
  try {
    const { data: users, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return next(new appError(error.message, 500));
    }

    if (!users || users.length === 0) {
      return next(new appError("No Users found", 404));
    }

    res.status(200).json({ length: users.length, Users: users });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Get the logged-in user details
 * @route GET /api/getuser
 * @access Private
 * @middleware verifyToken
 */
exports.getUser = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;

  try {
    const { data: user, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !user) {
      return next(new appError("User not found", 404));
    }

    // Get user's bookings
    const { data: bookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        *,
        courts (
          id,
          name,
          location,
          price_per_hour
        )
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (bookingsError) {
      console.error('Error fetching bookings:', bookingsError);
    }

    res.status(200).json({
      user: {
        ...user,
        bookings: bookings || []
      }
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Update the logged-in user's details
 * @route PUT /api/updateuser
 * @access Private
 * @middleware verifyToken
 */
exports.updateUser = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const { name } = req.body;

  if (!name) {
    return next(new appError("Name is required", 400));
  }

  if (name.length < 4) {
    return next(new appError("Name must be at least 4 characters", 400));
  }

  try {
    const { data: updatedUser, error } = await supabase
      .from('profiles')
      .update({ name })
      .eq('id', userId)
      .select()
      .single();

    if (error) {
      return next(new appError(error.message, 500));
    }

    res.status(200).json({
      message: "User updated successfully",
      updatedUser
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Change the logged-in user's password
 * @route POST /api/changepassword
 * @access Private
 * @middleware verifyToken
 */
exports.ChangePassword = asyncHandler(async (req, res, next) => {
  const userId = req.user.userId;
  const { oldPassword, newPassword } = req.body;

  if (!oldPassword || !newPassword) {
    return next(new appError("Old password and new password are required", 400));
  }

  if (newPassword.length < 6) {
    return next(new appError("New password must be at least 6 characters", 400));
  }

  try {
    // Get user email first
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (profileError || !profile) {
      return next(new appError("User not found", 404));
    }

    // Get user from auth
    const { data: { user }, error: userError } = await supabase.auth.admin.getUserById(userId);

    if (userError || !user) {
      return next(new appError("User not found", 404));
    }

    // Verify old password by attempting to sign in
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: oldPassword
    });

    if (signInError) {
      return next(new appError("Invalid Old Password", 401));
    }

    // Update password using Supabase Auth
    const { error: updateError } = await supabase.auth.admin.updateUserById(
      userId,
      { password: newPassword }
    );

    if (updateError) {
      return next(new appError(updateError.message, 500));
    }

    res.status(200).json({
      status: "success",
      message: "Password changed successfully",
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});
