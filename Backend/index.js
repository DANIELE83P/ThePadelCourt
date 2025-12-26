const express = require("express");
require("dotenv").config();
const cors = require("cors");
const cookieParser = require("cookie-parser");
const authRoutes = require("./routes/authRoutes");
const courtRoutes = require("./routes/Courts.Route");
const bookingRoutes = require("./routes/Booking.Route");
const route = require("./Routs/Rout.js");
const userRoutes = require("./routes/User.Route.js");
const { supabase } = require("./db/supabase");
const {
  NotFoundRoutes,
  GlobalErrorHandler,
} = require("./middlewares/ErrorHandling");

const app = express();

app.use(
  cors({
    origin:
      process.env.CORS_ORIGIN ||
      "https://padelcourt-m907iusj9-fahd-azmys-projects.vercel.app",
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
    credentials: true,
  })
);

// Other middleware
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Routes
app.use("/api", authRoutes);
app.use("/api", courtRoutes);
app.use("/api", bookingRoutes);
app.use("/api", route);
app.use("/api", userRoutes);

//error Handler
app.use(NotFoundRoutes);
app.use(GlobalErrorHandler);

// Start server
const Port = process.env.PORT || 4000;
app.listen(Port, async () => {
  // Test Supabase connection
  try {
    const { data, error } = await supabase.from('profiles').select('count');
    if (error) {
      console.log('⚠️  Supabase connection warning:', error.message);
    } else {
      console.log('✅ Supabase connected successfully');
    }
  } catch (err) {
    console.log('⚠️  Could not verify Supabase connection:', err.message);
  }

  console.log("🚀 Server Listening on Port", Port);
});

