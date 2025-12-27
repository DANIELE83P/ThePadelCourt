import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useAuth } from "../../Contexts/AuthContext";

export default function ChangePassword() {
  const { t } = useTranslation();
  const { changePassword } = useAuth();
  const [newPasswordInput, setNewPasswordInput] = useState("");
  const [confirmPasswordInput, setConfirmPasswordInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const handleNewPasswordChange = (e) => {
    setNewPasswordInput(e.target.value);
  };

  const handleConfirmPasswordChange = (e) => {
    setConfirmPasswordInput(e.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");
    setSuccessMessage("");

    // Validate passwords match
    if (newPasswordInput !== confirmPasswordInput) {
      setErrorMessage(t('cp_err_mismatch'));
      return;
    }

    // Validate password length
    if (newPasswordInput.length < 6) {
      setErrorMessage(t('cp_err_min_length'));
      return;
    }

    try {
      setLoading(true);
      const { error } = await changePassword(newPasswordInput);

      if (error) {
        setErrorMessage(error.message || t('cp_err_failed'));
        return;
      }

      setSuccessMessage(t('cp_succ_changed'));
      setNewPasswordInput("");
      setConfirmPasswordInput("");
    } catch (error) {
      console.error("Error changing password:", error);
      setErrorMessage(t('cp_err_generic'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-36 p-6 w-full">
      <br /><br />
      <h1 className="text-2xl text-center mb-4 font-semibold">
        {t('cp_title')}
      </h1>
      <form className="space-y-4" onSubmit={handleSubmit}>
        <div>
          <label
            htmlFor="newpassword"
            className="block text-sm font-medium text-gray-700"
          >
            {t('cp_new_password')} <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className="mt-1 py-2 px-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500"
            id="newpassword"
            value={newPasswordInput}
            onChange={handleNewPasswordChange}
            placeholder={t('cp_placeholder_new')}
            required
            minLength={6}
          />
        </div>
        <div>
          <label
            htmlFor="confirmpassword"
            className="block text-sm font-medium text-gray-700"
          >
            {t('cp_confirm_password')} <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            className="mt-1 py-2 px-3 block w-full border border-gray-300 rounded-md shadow-sm focus:ring focus:ring-blue-500 focus:border-blue-500"
            id="confirmpassword"
            value={confirmPasswordInput}
            onChange={handleConfirmPasswordChange}
            placeholder={t('cp_placeholder_confirm')}
            required
            minLength={6}
          />
        </div>
        {errorMessage && (
          <div className="text-center mt-2 p-3 bg-red-100 border border-red-400 rounded">
            <span className="text-red-700">{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="text-center mt-2 p-3 bg-green-100 border border-green-400 rounded">
            <span className="text-green-700">{successMessage}</span>
          </div>
        )}
        <div className="text-center">
          <button
            type="submit"
            className="w-full max-w-44 mt-4 bg-blue-600 text-white font-semibold py-2 rounded-md hover:bg-blue-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? t('cp_saving') : t('cp_save')}
          </button>
        </div>
      </form>
      <div className="mt-4 p-4 bg-blue-50 border border-blue-200 rounded">
        <p className="text-sm text-blue-800">
          <strong>{t('cp_note_label')}</strong> {t('cp_note_text')}
        </p>
      </div>
    </div>
  );
}
