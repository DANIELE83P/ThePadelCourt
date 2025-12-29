import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { useTranslation } from "react-i18next";
import SmartBookingWidget from "./SmartBookingWidget";

export default function MainSection() {
  const { t } = useTranslation();
  return (
    <>
      <h2 className="text-3xl font-bold text-gray-900 mb-6 text-center">
        {t('courts_title')}
      </h2>
      <div className="flex justify-center w-full">
        <SmartBookingWidget />
      </div>
    </>
  );
}
