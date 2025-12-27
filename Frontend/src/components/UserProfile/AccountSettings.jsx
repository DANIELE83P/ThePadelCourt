import { useTranslation } from "react-i18next";
import { useUser } from "./UserContext"; // Adjust the import path as needed
import { User, Mail, Star } from "lucide-react"; // Assuming you're using lucide-react for icons

export default function AccountSettings() {
  const { t } = useTranslation();
  const { userData, loading } = useUser();

  if (loading) {
    return <div className="max-w-2xl mx-auto p-6">{t('res_loading')}</div>;
  }

  return (

    <div className="max-w-2xl mx-36 p-6">
      <br /><br />
      <h1 className="text-3xl font-bold text-gray-800 mb-6">
        {t('account_info_title')}
      </h1>
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center">
            <User className="text-blue-500 mr-3" size={24} />
            <span className="text-gray-600 font-medium">{t('account_name')}</span>
          </div>
          <span className="text-gray-800">{userData.name}</span>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center">
            <Mail className="text-blue-500 mr-3" size={24} />
            <span className="text-gray-600 font-medium">{t('account_email')}</span>
          </div>
          <span className="text-gray-800">{userData.email}</span>
        </div>

        <div className="flex items-center justify-between border-b pb-3">
          <div className="flex items-center">
            <Star className="text-blue-500 mr-3" size={24} />
            <span className="text-gray-600 font-medium">{t('account_role')}</span>
          </div>
          <span className="text-gray-800">
            {userData.role || t('account_role_not_specified')}
          </span>
        </div>
      </div>
    </div>
  );
}
