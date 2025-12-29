import { useEffect, useState } from "react";
import ContectSection from "../components/Home/ContectSection";
import MainSection from "../components/Home/MainSection";
import TestMonialsSection from "../components/Home/TestMonialsSection";
import NewsWidget from "../components/Home/NewsWidget";

import { useTranslation } from "react-i18next";

export default function Home() {
  const { t } = useTranslation();
  const [text, setText] = useState("");
  const fullText = `${t('home_welcome_title')}\n${t('home_welcome_text')}`;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // Reset typing effect when language changes or component mounts
    setText("");
    setIndex(0);
  }, [fullText]);

  useEffect(() => {
    if (index < fullText.length) {
      const timer = setTimeout(() => {
        setText((prev) => prev + fullText[index]);
        setIndex((prev) => prev + 1);
      }, 50); // Adjust speed of typing here

      return () => clearTimeout(timer);
    }
  }, [index, fullText]);

  return (
    <>
      <div className="relative">
        {/* Background Image */}
        <img
          src="/PadelGallery.png"
          alt="Padel Court"
          className="w-full h-[800px] object-cover"
        />

        {/* Animated Text Overlay */}
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-black bg-opacity-30 text-white p-4">
          <div className="max-w-2xl absolute left-10 top-60">
            <h1 className="text-4xl font-bold mb-4 whitespace-pre-line">
              {text}
            </h1>
          </div>
        </div>
      </div>
      <div className="container mx-auto p-8">
        {/* Courts Section */}
        <MainSection />

        {/* News Section */}
        <NewsWidget />

        {/* Testimonials Section */}
        <TestMonialsSection />
        {/* Contact Section */}
        <ContectSection />
      </div>
    </>
  );
}
