/* eslint-disable react/no-unescaped-entities */
import { motion } from "framer-motion";
import { User, Key, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext";

const LoginForm = () => {
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn } = useAuth();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email("Invalid Email Format")
      .required("Email is Required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is Required"),
  });

  const handleSubmit = async (values) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await signIn(values.email, values.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage("Invalid email or password");
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage("Please confirm your email before logging in");
        } else {
          setErrorMessage(error.message || "Login failed");
        }
        return;
      }

      console.log("Login Successful", data);
      setSuccessMessage("Login successful! Redirecting...");

      setTimeout(() => {
        navigate("/", { replace: true });
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage("An unexpected error occurred. Please try again.");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[url('/api/placeholder/1920/1080')] bg-cover bg-center">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="bg-white bg-opacity-10 backdrop-filter backdrop-blur-md rounded-3xl p-8 shadow-2xl w-full max-w-md border border-white border-opacity-20"
      >
        <h2 className="text-4xl font-extrabold text-center text-white mb-8 tracking-tight">
          Login
        </h2>
        <Formik
          initialValues={{ email: "", password: "" }}
          validationSchema={validationSchema}
          onSubmit={(values, { setSubmitting }) => {
            handleSubmit(values);
            setSubmitting(false);
          }}
        >
          {({ isSubmitting }) => (
            <Form>
              <div className="mb-6 relative">
                <User
                  className="absolute top-3 left-3 text-white opacity-70"
                  size={20}
                />
                <Field
                  type="email"
                  className="w-full bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-70 rounded-xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition duration-300"
                  placeholder="Email"
                  name="email"
                />
                <ErrorMessage
                  name="email"
                  component="p"
                  className="error font-bold text-white mt-1 text-sm"
                />
              </div>
              <div className="mb-8 relative">
                <Key
                  className="absolute top-3 left-3 text-white opacity-70"
                  size={20}
                />
                <Field
                  type="password"
                  className="w-full bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-70 rounded-xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition duration-300"
                  placeholder="Password"
                  name="password"
                />
                <ErrorMessage
                  name="password"
                  component="p"
                  className="error font-bold text-white mt-1 text-sm"
                />
              </div>

              {/* Display error messages if any */}
              {errorMessage && (
                <p className="text-red-400 mb-4 font-bold text-sm mt-4 bg-red-900 bg-opacity-30 p-3 rounded-lg">
                  {errorMessage}
                </p>
              )}

              {/* Success Message */}
              {successMessage && (
                <p className="text-green-400 mb-4 font-bold text-sm mt-4 bg-green-900 bg-opacity-30 p-3 rounded-lg">
                  {successMessage}
                </p>
              )}

              <motion.button
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.98 }}
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-white text-black font-bold py-3 px-4 rounded-xl shadow-lg hover:bg-opacity-90 transition duration-300 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "Signing In..." : "Sign In"}
                <ArrowRight className="ml-2" size={20} />
              </motion.button>
            </Form>
          )}
        </Formik>
        <div className="mt-8 text-center">
          <p className="text-white text-opacity-80">
            Don't have an account?{" "}
            <Link to="/register" className="font-bold hover:underline">
              Sign Up
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
