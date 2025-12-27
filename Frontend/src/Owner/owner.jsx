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
import EmailTemplateManager from "./EmailTemplateManager";
import AnalyticsDashboard from "./AnalyticsDashboard";
import NotificationSettings from "./NotificationSettings";
import AnnouncementManager from "./AnnouncementManager";
import ClubHoursManager from "./ClubHoursManager";
import ClosuresManager from "./ClosuresManager";
import CourtPricingManager from "./CourtPricingManager";
import RecurringBookingsManager from "./RecurringBookingsManager";
import AdminUserManagement from "./AdminUserManagement";

const Owner = () => {
  const [activeSection, setActiveSection] = useState("home");

  const renderContent = () => {
    switch (activeSection) {
      case "home":
        return <OwnerHome onNavigate={setActiveSection} />;
      case "announcements":
        return <AnnouncementManager />;
      case "users":
        return <UserManagement />;
      case "admin-users":
        return <AdminUserManagement />;
      case "loyalty":
        return <LoyaltySettings />;
      case "scanner":
        return <UniversalScanner />;
      case "email-templates":
        return <EmailTemplateManager />;
      case "analytics":
        return <AnalyticsDashboard />;
      case "calendar":
        return <BookingCalendar />;
      case "recurring":
        return <RecurringBookingsManager />;
      case "courts":
        return <Proj />;
      case "court-pricing":
        return <CourtPricingManager />;
      case "promo":
        return <PromoSettings />;
      case "settings":
        return <ClubSettings />;
      case "club-hours":
        return <ClubHoursManager />;
      case "closures":
        return <ClosuresManager />;
      case "notifications":
        return <NotificationSettings />;
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
