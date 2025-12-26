const jwt = require("jsonwebtoken");
exports.generateToeknAndSetCookie = (res, user) => {
  // Support both MongoDB (_id) and Supabase (userId or id) formats
  const userId = user.userId || user.id || user._id;
  const userRole = user.role || 'user';

  const token = jwt.sign(
    { userId, role: userRole },
    process.env.JWT_SECRET_KEY || process.env.JWT_SECRET,
    {
      expiresIn: "7d",
    }
  );
  res.cookie("token", token, {
    secure: true,
    sameSite: "none",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
  return token;
};

