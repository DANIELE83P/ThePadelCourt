/* eslint-disable react-refresh/only-export-components */
import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { supabase } from "../../lib/supabase";
import withGuard from "../../utils/withGuard";
import CourtCart from "../CourtCart";

const CourtPage = () => {
  const { t } = useTranslation();
  const [searchZone, setSearchZone] = useState("");
  const [filteredCourts, setFilteredCourts] = useState([]);
  const [allCourts, setAllCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Extract unique zones from all courts
  const zones = Array.from(new Set(allCourts.map((court) => court.location).filter(Boolean)));

  // Fetch courts data on component mount
  useEffect(() => {
    fetchCourts();
  }, []);

  const fetchCourts = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('courts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setAllCourts(data || []);
      setFilteredCourts(data || []);
    } catch (error) {
      console.error("Error Fetching Courts:", error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search filtering for courts based on selected zone
  useEffect(() => {
    if (!searchZone) {
      setFilteredCourts(allCourts);
      return;
    }

    setFilteredCourts(
      allCourts.filter((court) => {
        if (searchZone === "indoor") return court.is_indoor === true;
        if (searchZone === "outdoor") return court.is_indoor === false;
        return true;
      })
    );
  }, [searchZone, allCourts]);

  // Reset filters
  const handleReset = () => {
    setSearchZone("");
    setFilteredCourts(allCourts);
  };

  if (loading) {
    return (
      <div className="pt-20 px-4 text-center">
        <p className="text-lg">{t('courts_loading')}</p>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 max-md:pr-0 mb-4 max-md:my-2 max-md:mx-auto">
      <h1 className="text-4xl font-bold text-center mb-8">{t('courts_title')}</h1>

      {/* Search Filters */}
      <div className="mb-6 mr-3">
        <div className="flex gap-2 flex-col md:flex-row md:space-x-2 mb-4 justify-center">
          <div className="flex gap-2">
            <button
              onClick={() => setSearchZone("")}
              className={`py-2 px-6 rounded-full transition-colors duration-300 font-medium border ${!searchZone ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Tutti
            </button>
            <button
              onClick={() => setSearchZone("indoor")}
              className={`py-2 px-6 rounded-full transition-colors duration-300 font-medium border ${searchZone === 'indoor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Indoor 🏠
            </button>
            <button
              onClick={() => setSearchZone("outdoor")}
              className={`py-2 px-6 rounded-full transition-colors duration-300 font-medium border ${searchZone === 'outdoor' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'}`}
            >
              Outdoor ☀️
            </button>
          </div>
        </div>
      </div>

      {/* Display courts based on the filtered results */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourts.length > 0 ? (
          filteredCourts.map((court) => (
            <CourtCart court={court} key={court.id} />
          ))
        ) : (
          <div className="col-span-full text-center py-10">
            <p className="text-lg text-gray-600">
              {searchZone
                ? `${t('courts_not_found_zone')} "${searchZone}"`
                : t('courts_not_available')}
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default withGuard(CourtPage);
