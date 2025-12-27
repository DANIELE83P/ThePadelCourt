import { NavLink } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  UserCircleIcon,
  TicketIcon,
  EyeIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";

export default function UserSidebar() {
  const { t } = useTranslation();
  return (
    <div className="bg-white shadow-md rounded-lg p-4">
      <NavLink
        to=""
        className={() =>
          `flex items-center font-bold p-2 rounded-lg hover:bg-gray-100 
            
          }`
        }
      >
        <UserCircleIcon className="w-8 h-8 mr-2" />
        <span>{t('sidebar_account_settings')}</span>
      </NavLink>
      <NavLink
        to="changepassword"
        className={({ isActive }) =>
          `flex items-center p-2 font-bold rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""
          }`
        }
      >
        <EyeIcon className="w-8 h-8 mr-2" />
        <span>{t('sidebar_change_password')}</span>
      </NavLink>
      <NavLink
        to="reservations"
        className={({ isActive }) =>
          `flex items-center p-2 font-bold rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""
          }`
        }
      >
        <TicketIcon className="w-8 h-8 mr-2" />
        <span>{t('sidebar_your_reservations')}</span>
      </NavLink>
      <NavLink
        to="cards"
        className={({ isActive }) =>
          `flex items-center p-2 font-bold rounded-lg hover:bg-gray-100 ${isActive ? "bg-gray-200" : ""
          }`
        }
      >
        <CreditCardIcon className="w-8 h-8 mr-2" />
        <span>Le Mie Card</span>
      </NavLink>
    </div>
  );
}
