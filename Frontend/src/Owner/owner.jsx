import { useState } from "react";
import OwnerLayout from "./OwnerLayout";
import OwnerHome from "./OwnerHome";
import Proj from "./Proj";
import ClubSettings from "./ClubSettings";
import BookingCalendar from "./BookingCalendar";
import PromoSettings from "./PromoSettings";
import UserManagement from "./UserManagement";
import LoyaltySettings from "./LoyaltySettings";
import UniversalScanner from "./UniversalScanner";

const Owner = () => {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <OwnerHome onNavigate={setActiveSection} />;
      case "users":
        return <UserManagement />;
      case "loyalty":
        return <LoyaltySettings />;
      case "scanner":
        return <UniversalScanner />;
      case "calendar":
        return <BookingCalendar />;
      case "courts":
        return <Proj />;
      case "promo":
        return <PromoSettings />;
      case "settings":
        return <ClubSettings />;
      default:
        return <OwnerHome onNavigate={setActiveSection} />;
    }
  };

  return (
    <OwnerLayout
      activeSection={activeSection}
      setActiveSection={setActiveSection}
    >
      {renderContent()}
    </OwnerLayout>
  );
};

export default Owner;
