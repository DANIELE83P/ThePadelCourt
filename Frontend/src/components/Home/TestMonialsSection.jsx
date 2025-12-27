import { Star, Quote } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function TestMonialsSection() {
  const { t } = useTranslation();
  const testimonials = [
    {
      text: t('test_text_1'),
      author: "Sarah E.",
      rating: 5,
      role: t('test_role_regular'),
    },
    {
      text: t('test_text_2'),
      author: "Ahmed K.",
      rating: 5,
      role: t('test_role_enthusiast'),
    },
    {
      text: t('test_text_3'),
      author: "Mona A.",
      rating: 5,
      role: t('test_role_pro'),
    },
  ];

  return (
    <section className="py-12 bg-gray-50" id="testimonials">
      <div className="max-w-6xl mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {t('testimonials_title')}
          </h2>
          <div className="w-24 h-1 bg-blue-500 mx-auto"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={index}
              className="bg-white rounded-lg shadow-lg p-8 relative"
            >
              <Quote className="absolute top-4 right-4 w-8 h-8 text-blue-200" />

              <div className="flex mb-4">
                {[...Array(testimonial.rating)].map((_, i) => (
                  <Star
                    key={i}
                    className="w-5 h-5 text-yellow-400 fill-current"
                  />
                ))}
              </div>

              <p className="text-gray-600 mb-6">"{testimonial.text}"</p>

              <div className="flex items-center">
                <div className="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center text-white font-bold mr-4">
                  {testimonial.author.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-gray-900">
                    {testimonial.author}
                  </p>
                  <p className="text-sm text-gray-500">{testimonial.role}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
