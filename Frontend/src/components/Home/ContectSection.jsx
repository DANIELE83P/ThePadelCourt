import { Mail, Phone, MapPin, Clock } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";

const DAYS_MAP = {
  0: 'Domenica',
  1: 'Lunedì',
  2: 'Martedì',
  3: 'Mercoledì',
  4: 'Giovedì',
  5: 'Venerdì',
  6: 'Sabato'
};

export default function ContactSection() {
  const { t } = useTranslation();
  const [clubInfo, setClubInfo] = useState(null);
  const [clubHours, setClubHours] = useState([]);

  useEffect(() => {
    fetchClubInfo();
    fetchClubHours();
  }, []);

  const fetchClubInfo = async () => {
    try {
      const { data, error } = await supabase
        .from("club_profiles")
        .select("*")
        .limit(1)
        .maybeSingle();

      if (data) {
        setClubInfo(data);
      }
    } catch (error) {
      console.error("Error loading club info:", error);
    }
  };

  const fetchClubHours = async () => {
    try {
      const { data, error } = await supabase
        .from("club_hours")
        .select("*")
        .order('day_of_week');

      if (data) {
        setClubHours(data);
      }
    } catch (error) {
      console.error("Error loading club hours:", error);
    }
  };

  const getEmbedUrl = (url, address) => {
    // 1. If it's a valid embed URL, return it as is
    if (url && (url.includes('google.com/maps/embed') || url.includes('output=embed'))) {
      return url;
    }

    // 2. If we have an address, generate a query-based embed URL (most reliable fallback)
    if (address) {
      const encodedAddress = encodeURIComponent(address);
      return `https://maps.google.com/maps?q=${encodedAddress}&t=&z=15&ie=UTF8&iwloc=&output=embed`;
    }

    // 3. Fallback default
    return "https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3454.9898413491133!2d31.231328474388896!3d30.063204022447812!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x14583f6cf35a39ff%3A0x8261cbb028164c71!2sNasr%20City!5e0!3m2!1sen!2seg!4v1647610892171!5m2!1sen!2seg";
  };

  const info = {
    email: clubInfo?.email || "info@padelCourt.com",
    phone: clubInfo?.phone || "+20 123 456 7890",
    address: clubInfo?.address || "123 Padel Street, Nasr City, Cairo, Egypt",
    get map_url() {
      return getEmbedUrl(clubInfo?.map_url, this.address);
    }
  };

  const formatHours = (dayHours) => {
    if (!dayHours.is_open) return 'Chiuso';

    let hoursStr = `${dayHours.open_time} - ${dayHours.close_time}`;
    if (dayHours.break_start && dayHours.break_end) {
      hoursStr += ` (pausa: ${dayHours.break_start}-${dayHours.break_end})`;
    }
    return hoursStr;
  };

  return (
    <section id="contact" className="py-12 bg-white">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('contact_title')}
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            {t('contact_text')}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div className="bg-gray-50 p-8 rounded-lg shadow-lg">
            <div className="space-y-6">
              <div className="flex items-start space-x-4">
                <Mail className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('contact_email_us')}</h3>
                  <a
                    href={`mailto:${info.email}`}
                    className="text-blue-500 hover:underline"
                  >
                    {info.email}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Phone className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('contact_call_us')}</h3>
                  <a href={`tel:${info.phone}`} className="text-gray-600">
                    {info.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <MapPin className="w-6 h-6 text-blue-500 mt-1" />
                <div>
                  <h3 className="font-semibold text-gray-900 mb-1">{t('contact_visit_us')}</h3>
                  <p className="text-gray-600">
                    {info.address}
                  </p>
                </div>
              </div>

              <div className="flex items-start space-x-4">
                <Clock className="w-6 h-6 text-blue-500 mt-1" />
                <div className="w-full">
                  <h3 className="font-semibold text-gray-900 mb-3">
                    {t('contact_hours_title')}
                  </h3>
                  {clubHours.length > 0 ? (
                    <div className="space-y-2 text-sm">
                      {clubHours.map(dayHours => (
                        <div key={dayHours.day_of_week} className="flex justify-between">
                          <span className="font-medium text-gray-700">
                            {DAYS_MAP[dayHours.day_of_week]}:
                          </span>
                          <span className="text-gray-600">
                            {formatHours(dayHours)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-600 text-sm">
                      {t('contact_hours_week')}
                      <br />
                      {t('contact_hours_weekend')}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          <div className="h-full min-h-[400px] rounded-lg overflow-hidden shadow-lg">
            <iframe
              src={info.map_url}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              allowFullScreen=""
              loading="lazy"
              title="Location Map"
              className="w-full h-full"
            ></iframe>
          </div>
        </div>
      </div>
    </section>
  );
}
