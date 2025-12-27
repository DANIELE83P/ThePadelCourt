import { useState } from "react";
import OwnerLayout from "./OwnerLayout";
import OwnerHome from "./OwnerHome";
import Proj from "./Proj";
import ClubSettings from "./ClubSettings";
import BookingCalendar from "./BookingCalendar";
import PromoSettings from "./PromoSettings";

const Owner = () => {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <OwnerHome onNavigate={setActiveSection} />;
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
