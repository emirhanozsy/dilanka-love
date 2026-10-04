import { useState, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

function FloatingBackground() {
  const elements = useMemo(() => {
    return Array.from({ length: 25 }).map((_, i) => {
      const isHeart = Math.random() > 0.4;
      return {
        id: i,
        emoji: isHeart ? '❤️' : '💍',
        left: `${Math.random() * 100}vw`,
        animationDuration: `${12 + Math.random() * 20}s`,
        animationDelay: `-${Math.random() * 20}s`,
        fontSize: `${1.5 + Math.random() * 2.5}rem`,
        opacity: 0.4 + Math.random() * 0.4,
      };
    });
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-0">
      {elements.map((el) => (
        <div
          key={el.id}
          className="floating-item"
          style={{
            left: el.left,
            animationDuration: el.animationDuration,
            animationDelay: el.animationDelay,
            fontSize: el.fontSize,
            opacity: el.opacity,
          }}
        >
          {el.emoji}
        </div>
      ))}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-rose-200/40 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-rose-300/30 rounded-full blur-3xl"></div>
    </div>
  );
}

export default function App() {
  const [accepted, setAccepted] = useState(false);
  const [noCount, setNoCount] = useState(0);
  const [noPosition, setNoPosition] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleNoHover = () => {
    setNoCount((prev) => prev + 1);
    
    if (containerRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const randomX = Math.random() * (containerRect.width - 150) - (containerRect.width - 150) / 2;
      const randomY = Math.random() * (containerRect.height - 150) - (containerRect.height - 150) / 2;
      setNoPosition({ x: randomX, y: randomY });
    }
  };

  if (accepted) {
    return (
      <div className="min-h-screen bg-rose-50 flex flex-col items-center py-16 px-4 sm:px-8 relative overflow-hidden">
        <FloatingBackground />
        
        <motion.h1 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-4xl sm:text-6xl text-rose-600 font-serif italic text-center mb-16 relative z-10 drop-shadow-sm"
        >
          Seni seviyorum, iyiki sen...
        </motion.h1>

        <div className="max-w-3xl w-full flex flex-col gap-16 relative z-10 pb-20">
          <ImageCard 
            src="/özbekistan.jpeg" 
            text="Aşkımın başladığı gün, 16/05/2025 ❤️"
            delay={0.2}
          />
          <ImageCard 
            src="/üsküdar.jpeg" 
            text="Aşıkların şehrine, ismini veren fotoğraf, 15/08/2026"
            delay={0.4}
          />
          <ImageCard 
            src="/facetime.jpeg" 
            text="Hayallerimi süsleyen kadın... 20/09/2026"
            delay={0.6}
          />
        </div>
      </div>
    );
  }

  const yesButtonScale = 1 + noCount * 0.2;

  return (
    <div className="min-h-screen bg-rose-50 flex items-center justify-center p-4 overflow-hidden relative" ref={containerRef}>
      <FloatingBackground />
      
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white/70 backdrop-blur-md rounded-3xl p-10 md:p-16 shadow-2xl border border-white/50 flex flex-col items-center text-center max-w-2xl w-full relative z-10"
      >
        <h1 className="text-4xl md:text-5xl text-slate-800 font-serif italic mb-4 leading-tight drop-shadow-sm">
          Sana ne hata yaptığımı söyleyecek misin?
        </h1>
        <p className="text-rose-500 font-medium text-lg md:text-xl mb-12 italic opacity-90 drop-shadow-sm">
          Not: Tıklayacağın seçeneği ben görebilicem!
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-8 w-full min-h-[120px] relative">
          <motion.button
            onClick={() => setAccepted(true)}
            style={{ scale: yesButtonScale }}
            className="bg-rose-500 hover:bg-rose-600 text-white font-semibold py-3 px-10 rounded-full shadow-lg transition-colors whitespace-nowrap z-20 text-lg"
          >
            Evet
          </motion.button>
          
          <motion.button
            animate={{ x: noPosition.x, y: noPosition.y }}
            transition={{ type: "spring", stiffness: 300, damping: 20 }}
            onHoverStart={handleNoHover}
            onClick={handleNoHover}
            className="bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold py-3 px-10 rounded-full shadow-md whitespace-nowrap absolute sm:relative z-10 text-lg"
          >
            Hayır
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}

function ImageCard({ src, text, delay }: { src: string, text: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, delay }}
      className="flex flex-col group w-full"
    >
      <div className="bg-white/90 backdrop-blur-sm p-4 md:p-8 rounded-[2rem] shadow-2xl border border-rose-100/50 transform transition-transform duration-500 hover:-translate-y-2 hover:shadow-rose-200/50">
        <div className="overflow-hidden rounded-2xl bg-rose-50 mb-6 relative shadow-inner">
          <img 
            src={src} 
            alt="Anı" 
            className="w-full h-auto max-h-[80vh] object-contain transition-transform duration-1000 group-hover:scale-105"
          />
          <div className="absolute inset-0 bg-rose-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
        </div>
        <p className="text-slate-700 font-serif italic text-2xl md:text-3xl text-center px-4 leading-relaxed drop-shadow-sm">
          {text}
        </p>
      </div>
    </motion.div>
  );
}
