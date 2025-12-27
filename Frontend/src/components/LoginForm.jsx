/* eslint-disable react/no-unescaped-entities */
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { User, Key, ArrowRight } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { Formik, Form, Field, ErrorMessage } from "formik";
import * as Yup from "yup";
import { useState, useEffect } from "react";
import { useAuth } from "../Contexts/AuthContext";

const LoginForm = () => {
  const { t } = useTranslation();
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const { signIn, fetchProfile, signInWithOAuth, isLoggedIn, profile } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoggedIn && profile) {
      if (profile.must_change_password) {
        navigate("/force-password-change", { replace: true });
      } else if (profile.role === 'owner' || profile.role === 'admin') {
        navigate("/ownerpage", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [isLoggedIn, profile, navigate]);

  const validationSchema = Yup.object({
    email: Yup.string()
      .email(t('val_email_invalid'))
      .required(t('val_email_required')),
    password: Yup.string()
      .min(6, t('val_password_min'))
      .required(t('val_password_required')),
  });

  const handleSocialLogin = async (provider) => {
    try {
      setErrorMessage(null);
      const { error } = await signInWithOAuth(provider);
      if (error) {
        setErrorMessage(error.message);
      }
    } catch (err) {
      console.error("Social login error:", err);
      setErrorMessage(t('err_unexpected'));
    }
  };

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
        // Check if user must change password
        if (profile?.must_change_password) {
          navigate("/force-password-change", { replace: true });
          return;
        }

        // Normal redirect based on role
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

              <div className="flex items-center my-6">
                <div className="flex-grow border-t border-white border-opacity-20"></div>
                <span className="flex-shrink-0 mx-4 text-white text-sm font-bold opacity-60">OR</span>
                <div className="flex-grow border-t border-white border-opacity-20"></div>
              </div>

              <div className="flex gap-4 mb-4">
                <button
                  type="button"
                  onClick={() => handleSocialLogin('google')}
                  className="flex-1 bg-white bg-opacity-90 hover:bg-opacity-100 text-gray-800 font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md group"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.26.81-.58z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span className="hidden sm:inline">Google</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleSocialLogin('facebook')}
                  className="flex-1 bg-[#1877F2] hover:bg-[#166fe5] text-white font-bold py-2 px-4 rounded-xl flex items-center justify-center gap-2 transition-all shadow-md"
                >
                  <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
                    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.791-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
                  </svg>
                  <span className="hidden sm:inline">Facebook</span>
                </button>
              </div>
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
