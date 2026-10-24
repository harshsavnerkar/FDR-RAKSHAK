import React from 'react';

export function LogoStrip() {
  const brands = [
    { name: 'Northwind', icon: '✦' },
    { name: 'Fig&Co', icon: '●' },
    { name: 'Superbloom', icon: '✿' },
    { name: 'Kettle', icon: '▲' },
    { name: 'Halcyon', icon: '❖' },
  ];

  return (
    <section className="w-full bg-ink border-y-3 border-ink py-7 px-4 sm:px-8 select-none">
      <div className="max-w-[1440px] mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-10">
        
        {/* Left: Mustard Tracked Label */}
        <div className="flex-shrink-0 flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-memphis-coral" />
          <span className="font-display font-extrabold text-xs sm:text-sm tracking-[0.2em] text-memphis-mustard uppercase">
            TRUSTED BY TEAMS AT
          </span>
        </div>

        {/* Right: 5 Cream Wordmarks */}
        <div className="flex flex-wrap items-center justify-center md:justify-end gap-8 sm:gap-12 lg:gap-16">
          {brands.map((brand) => (
            <div
              key={brand.name}
              className="flex items-center gap-2 opacity-85 hover:opacity-100 transition-opacity cursor-default group"
            >
              <span className="text-memphis-mustard text-xs group-hover:scale-125 transition-transform">
                {brand.icon}
              </span>
              <span className="font-display font-bold text-lg sm:text-xl tracking-tight text-cream">
                {brand.name}
              </span>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
