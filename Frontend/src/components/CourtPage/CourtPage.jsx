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
  const handleSearch = () => {
    if (!searchZone) {
      setFilteredCourts(allCourts);
      return;
    }

    setFilteredCourts(
      allCourts.filter((court) => {
        const isZoneMatch = court.location
          ?.toLowerCase()
          .includes(searchZone.toLowerCase());
        return isZoneMatch;
      })
    );
  };

  // Trigger search on Enter key press
  const handleKeyDown = (event) => {
    if (event.key === "Enter") {
      handleSearch();
    }
  };

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
        <div className="flex gap-2 flex-col md:flex-row md:space-x-2 mb-4">
          <select
            className="border rounded-lg p-2 flex-1"
            value={searchZone}
            onChange={(e) => setSearchZone(e.target.value)}
            onKeyDown={handleKeyDown}
          >
            <option value="">{t('courts_all_locations')}</option>
            {zones.map((zone, index) => (
              <option key={index} value={zone}>
                {zone}
              </option>
            ))}
          </select>

          <button
            onClick={handleSearch}
            className="bg-blue-500 text-white py-2 px-6 rounded-lg hover:bg-blue-600 transition-colors duration-300"
          >
            {t('courts_search')}
          </button>

          <button
            onClick={handleReset}
            className="bg-gray-500 text-white py-2 px-6 rounded-lg hover:bg-gray-600 transition-colors duration-300"
          >
            {t('courts_reset')}
          </button>
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
