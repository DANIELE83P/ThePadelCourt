const asyncHandler = require("../middlewares/AsyncHandler");
const appError = require("../utils/AppError");
const { supabase } = require("../db/supabase");
const { generateToeknAndSetCookie } = require("../utils/generateToken");

/**
 * @desc Create a new user || Signup
 * @route POST /api/signup
 * @access Public
 */
exports.Signup = asyncHandler(async (req, res, next) => {
  const { name, email, password, role = 'user' } = req.body;

  // Validate required fields
  if (!name || !email || !password) {
    return next(new appError("All Fields are required", 400));
  }

  // Validate name length
  if (name.length < 4) {
    return next(new appError("Name must be at least 4 characters", 400));
  }

  // Validate password length
  if (password.length < 6) {
    return next(new appError("Password must be at least 6 characters", 400));
  }

  try {
    // Sign up user with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          role
        }
      }
    });

    if (authError) {
      if (authError.message.includes('already registered')) {
        return next(new appError("User already exists", 400));
      }
      return next(new appError(authError.message, 400));
    }

    // The profile is automatically created by the trigger
    const user = {
      id: authData.user.id,
      email: authData.user.email,
      name,
      role
    };

    res.status(200).json({
      message: "User Created Successfully",
      user,
      session: authData.session
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Login a user and set JWT token in cookie
 * @route POST /api/login
 * @access Public
 */
exports.Login = asyncHandler(async (req, res, next) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return next(new appError("Email and password are required", 400));
  }

  try {
    // Sign in with Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password
    });

    if (authError) {
      return next(new appError("Invalid Email Or Password", 401));
    }

    // Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', authData.user.id)
      .single();

    if (profileError) {
      return next(new appError("Error fetching user profile", 500));
    }

    const user = {
      id: authData.user.id,
      email: authData.user.email,
      name: profile.name,
      role: profile.role
    };

    // Generate JWT token and set cookie (for backward compatibility)
    generateToeknAndSetCookie(res, { userId: user.id, role: user.role });

    res.status(200).json({
      message: "Login Successfully",
      user,
      session: authData.session
    });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});

/**
 * @desc Logout a user and clear the JWT token cookie
 * @route POST /api/logout
 * @access Private
 * @middleware verifyToken
 */
exports.logout = asyncHandler(async (req, res, next) => {
  try {
    // Sign out from Supabase
    const { error } = await supabase.auth.signOut();

    if (error) {
      console.error('Supabase logout error:', error);
    }

    // Clear cookie
    res.clearCookie("token");
    res.status(200).json({ Success: true, message: "Logout Successfully" });
  } catch (error) {
    return next(new appError(error.message, 500));
  }
});
