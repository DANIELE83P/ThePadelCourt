/* eslint-disable react/no-unescaped-entities */
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { User, Key, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState } from "react";
import { useAuth } from "../Contexts/AuthContext";

const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn, fetchProfile } = useAuth();
  const navigate = useNavigate();

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('val_email_invalid'))
      .required(t('val_email_required')),
    password: Yup.string()
      .min(6, t('val_password_min'))
      .required(t('val_password_required')),
  });

  const handleSubmit = async (values) => {
    try {
      setErrorMessage(null);
      setSuccessMessage(null);

      const { data, error } = await signIn(values.email, values.password);

      if (error) {
        if (error.message.includes('Invalid login credentials')) {
          setErrorMessage(t('err_invalid_credentials'));
        } else if (error.message.includes('Email not confirmed')) {
          setErrorMessage(t('err_confirm_email'));
        } else {
          setErrorMessage(error.message || t('err_login_failed'));
        }
        return;
      }

      console.log("Login Successful", data);
      setSuccessMessage(t('succ_login'));

      // Fetch profile to determine where to redirect
      const { data: profile } = await fetchProfile(data.user.id);

      setTimeout(() => {
        if (profile?.role === 'owner' || profile?.role === 'admin') {
          navigate("/ownerpage", { replace: true });
        } else {
          navigate("/", { replace: true });
        }
      }, 1000);
    } catch (error) {
      console.error("Login error:", error);
      setErrorMessage(t('err_unexpected'));
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
          {t('login_title')}
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
                  placeholder={t('login_email_placeholder')}
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
                  placeholder={t('login_password_placeholder')}
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
                {isSubmitting ? t('login_submitting') : t('login_submit')}
                <ArrowRight className="ml-2" size={20} />
              </motion.button>
            </Form>
          )}
        </Formik>
        <div className="mt-8 text-center">
          <p className="text-white text-opacity-80">
            {t('login_no_account')}{" "}
            <Link to="/register" className="font-bold hover:underline">
              {t('login_signup_link')}
            </Link>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default LoginForm;
