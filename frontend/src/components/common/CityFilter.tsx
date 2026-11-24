import React from 'react';
import { MapPin } from 'lucide-react';

export interface CityFilterProps {
  selectedCity: string;
  onCityChange: (city: string) => void;
  cityCounts?: Record<string, number>;
  cities?: string[];
}

export const DEFAULT_CITIES = [
  'All Cities',
  'Bengaluru',
  'Hyderabad',
  'Mumbai',
  'Delhi',
  'Chennai',
  'Pune',
  'Kolkata',
];

export const CityFilter: React.FC<CityFilterProps> = ({
  selectedCity,
  onCityChange,
  cityCounts = {},
  cities = DEFAULT_CITIES,
}) => {
  return (
    <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
      <div className="flex items-center text-xs font-semibold text-neutral-400 pl-1 pr-2">
        <MapPin className="w-3.5 h-3.5 mr-1 text-emerald-400" />
        <span>City Hub:</span>
      </div>
      {cities.map((city) => {
        const isAll = city === 'All Cities';
        const active = isAll
          ? selectedCity === 'all' || selectedCity === 'All Cities'
          : selectedCity.toLowerCase() === city.toLowerCase();

        const count = isAll
          ? Object.values(cityCounts).reduce((a, b) => a + b, 0)
          : cityCounts[city] ?? 0;

        return (
          <button
            key={city}
            type="button"
            onClick={() => onCityChange(isAll ? 'all' : city)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition-all duration-150 flex items-center gap-1.5 border ${
              active
                ? 'bg-emerald-500 text-neutral-950 border-emerald-400 font-bold shadow-md shadow-emerald-500/20'
                : 'bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white'
            }`}
          >
            <span>{city}</span>
            {count > 0 && (
              <span
                className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                  active ? 'bg-neutral-950/20 text-neutral-950 font-black' : 'bg-neutral-800 text-neutral-300'
                }`}
              >
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
};
