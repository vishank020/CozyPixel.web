"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

const features = [
  { title: "Beautiful Design", desc: "Pixel-perfect layouts crafted with care." },
  { title: "Smooth Animations", desc: "Silky 60fps animations that engage users." },
  { title: "High Performance", desc: "Optimized delivery with Next.js and modern tooling." },
];

export function Features() {
  const sectionRef = useRef<HTMLElement>(null);
  const cardsRef = useRef<HTMLDivElement[]>([]);

  useEffect(() => {
    // We register here just in case, though it's registered in SmoothScroll
    gsap.registerPlugin(ScrollTrigger);
    
    const ctx = gsap.context(() => {
      // Stagger animation for feature cards as they scroll into view
      gsap.from(cardsRef.current, {
        scrollTrigger: {
          trigger: sectionRef.current,
          start: "top 75%", // Trigger when the top of section hits 75% down the viewport
          toggleActions: "play none none reverse",
        },
        y: 100,
        opacity: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power3.out",
      });
    }, sectionRef);

    return () => ctx.revert(); // Cleanup GSAP context on unmount
  }, []);

  return (
    <section ref={sectionRef} className="py-32 px-6 bg-white text-black min-h-screen flex flex-col justify-center">
      <div className="max-w-6xl mx-auto w-full">
        <h2 className="text-4xl md:text-6xl font-bold mb-16 text-center">
          What makes us different?
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div 
              key={index}
              ref={(el) => {
                if (el) cardsRef.current[index] = el;
              }}
              className="bg-zinc-100 p-8 rounded-3xl border border-zinc-200 shadow-sm"
            >
              <div className="h-12 w-12 bg-black text-white rounded-full flex items-center justify-center mb-6 text-xl font-bold">
                {index + 1}
              </div>
              <h3 className="text-2xl font-bold mb-4">{feature.title}</h3>
              <p className="text-zinc-600 text-lg leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
