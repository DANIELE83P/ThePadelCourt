/* eslint-disable react/no-unescaped-entities */
import { motion } from "framer-motion";
import { User, Key, Mail } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext";

const SignUpForm = () => {
  const [serverError, setServerError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const validationSchema = Yup.object({
    name: Yup.string()
      .min(4, "Name must be at least 4 characters")
      .required("Name is Required"),
    email: Yup.string()
      .email("Invalid Email Format")
      .required("Email is Required"),
    password: Yup.string()
      .min(6, "Password must be at least 6 characters")
      .required("Password is Required"),
    role: Yup.string()
      .oneOf(['user', 'owner'], 'Please select a role')
      .required("Role is Required"),
  });

  const handleSubmit = async (values) => {
    try {
      setServerError(null);
      setSuccessMessage(null);

      const { data, error } = await signUp(
        values.email,
        values.password,
        values.name,
        values.role
      );

      if (error) {
        if (error.message.includes('already registered')) {
          setServerError("Email already registered. Please login instead.");
        } else {
          setServerError(error.message || "Registration failed");
        }
        return;
      }

      console.log("Signup Successful", data);
      setSuccessMessage("Registration successful! Redirecting to login...");

      setTimeout(() => {
        navigate("/login");
      }, 2000);
    } catch (error) {
      console.error("Signup error:", error);
      setServerError("An unexpected error occurred. Please try again.");
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
          Register
        </h2>
        <Formik
          initialValues={{ name: "", email: "", password: "", role: "" }}
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
                  type="text"
                  className="w-full bg-white bg-opacity-10 text-white placeholder-white placeholder-opacity-70 rounded-xl py-3 px-10 focus:outline-none focus:ring-2 focus:ring-white focus:ring-opacity-50 transition duration-300"
                  placeholder="Name"
                  name="name"
                />
                <ErrorMessage
                  name="name"
                  component="p"
                  className="error font-bold text-white mt-1 text-sm"
                />
              </div>
              <div className="mb-6 relative">
                <Mail
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
              <div className="text-white flex gap-4 items-center mb-4 font-bold">
                <label className="flex items-center gap-2 cursor-pointer">
                  <Field type="radio" name="role" value="owner" className="cursor-pointer" />
                  Owner
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <Field type="radio" name="role" value="user" className="cursor-pointer" />
                  User
                </label>
              </div>
              <ErrorMessage
                name="role"
                component="p"
                className="error font-bold text-white mb-4 text-sm"
              />

              {/* Server Error Message */}
              {serverError && (
                <p className="text-red-400 mb-4 font-bold text-sm mt-4 bg-red-900 bg-opacity-30 p-3 rounded-lg">
                  {serverError}
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
                {isSubmitting ? "Signing Up..." : "Sign Up"}
              </motion.button>
            </Form>
          )}
        </Formik>
        <div className="mt-8 text-center">
          <p className="text-white font-semibold text-opacity-80">
            Already a member?{" "}
            <Link to="/login" className="font-bold hover:underline">
              Login
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default SignUpForm;
