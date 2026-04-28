import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft, ChevronRight } from 'lucide-react';

const slides = [
  {
    id: 1,
    emoji: '🏠',
    title: 'Find Your Perfect Home',
    description: 'Browse verified rental listings across Kampala with detailed photos and accurate locations.',
  },
  {
    id: 2,
    emoji: '📍',
    title: 'Map-Based Search',
    description: 'View properties on an interactive map with price pins and real-time availability.',
  },
  {
    id: 3,
    emoji: '💬',
    title: 'Direct WhatsApp Contact',
    description: 'Message landlords instantly through WhatsApp — no middlemen, no delays.',
  },
];

export default function OnboardingScreen() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();
  const slide = slides[index];

  const next = () => {
    if (index < slides.length - 1) setIndex(index + 1);
  };

  const prev = () => {
    if (index > 0) setIndex(index - 1);
  };

  const finish = () => {
    localStorage.setItem('rf_onboarded', '1');
    navigate('/login');
  };

  return (
    <div className="h-full w-full flex flex-col bg-white">
      {/* Progress dots */}
      <div className="flex justify-center gap-2 pt-6">
        {slides.map((_, i) => (
          <div
            key={i}
            className={`h-1.5 rounded-full transition-all ${i === index ? 'w-8 bg-primary' : 'w-1.5 bg-gray-300'}`}
          />
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="text-7xl mb-6">{slide.emoji}</div>
        <h2 className="text-2xl font-bold text-gray-800 text-center mb-3">{slide.title}</h2>
        <p className="text-gray-400 text-center text-sm leading-relaxed">{slide.description}</p>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between px-6 pb-8">
        {index > 0 ? (
          <button onClick={prev} className="p-2 rounded-full bg-gray-100">
            <ChevronLeft size={24} className="text-gray-600" />
          </button>
        ) : (
          <div />
        )}

        {index === slides.length - 1 ? (
          <button onClick={finish} className="btn-primary px-8 py-3">
            Get Started
          </button>
        ) : (
          <button onClick={next} className="p-2 rounded-full bg-primary">
            <ChevronRight size={24} className="text-white" />
          </button>
        )}
      </div>
    </div>
  );
}
