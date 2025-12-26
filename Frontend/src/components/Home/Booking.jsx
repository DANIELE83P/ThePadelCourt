import { useEffect, useState } from "react";
import CourtCart from "../CourtCart";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import { supabase } from "../../lib/supabase";

const Book = () => {
  const [allCourts, setAllCourts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourts = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('courts')
          .select('*')
          .order('created_at', { ascending: false })
          .limit(10);

        if (error) throw error;
        setAllCourts(data || []);
      } catch (error) {
        console.error("Error Fetching Courts:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchCourts();
  }, []);

  const settings = {
    dots: true,
    infinite: allCourts.length > 3,
    speed: 500,
    slidesToShow: 3,
    slidesToScroll: 1,
    responsive: [
      {
        breakpoint: 1024,
        settings: {
          slidesToShow: 2,
          slidesToScroll: 1,
          infinite: allCourts.length > 2,
          dots: true,
        },
      },
      {
        breakpoint: 600,
        settings: {
          slidesToShow: 1,
          slidesToScroll: 1,
        },
      },
    ],
  };

  if (loading) {
    return (
      <div className="w-full text-center py-10">
        <p className="text-lg">Loading courts...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      {allCourts.length > 0 ? (
        <Slider {...settings}>
          {allCourts.map((court) => (
            <CourtCart court={court} key={court.id} />
          ))}
        </Slider>
      ) : (
        <div className="text-center py-10">
          <p className="text-lg text-gray-600">No courts available yet</p>
        </div>
      )}
    </div>
  );
};

export default Book;
