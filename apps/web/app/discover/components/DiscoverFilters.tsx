"use client";

import type { DiscoverFilters } from "../useDiscoverFeed";

const genderOptions: Array<{ label: string; value: DiscoverFilters["gender"] }> = [
  { label: "All", value: "all" },
  { label: "Male", value: "male" },
  { label: "Female", value: "female" }
];

const intentOptions: Array<{ label: string; value: DiscoverFilters["intent"] }> = [
  { label: "All", value: "all" },
  { label: "Dating", value: "dating" },
  { label: "Friends", value: "friends" }
];

type DiscoverFiltersProps = {
  filters: DiscoverFilters;
  onChange: (filters: DiscoverFilters) => void;
  onRefresh?: () => void;
  isRefreshing?: boolean;
};

export default function DiscoverFilters({ filters, onChange, onRefresh, isRefreshing }: DiscoverFiltersProps) {
  return (
    <div className="discover-filters">
      <div className="filter-group">
        <span className="filter-label">Gender</span>
        <div className="segmented" role="group" aria-label="Gender">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filters.gender === option.value ? "segmented__button active" : "segmented__button"}
              onClick={() => onChange({ ...filters, gender: option.value })}
              aria-pressed={filters.gender === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-group">
        <span className="filter-label">Intent</span>
        <div className="segmented" role="group" aria-label="Intent">
          {intentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={filters.intent === option.value ? "segmented__button active" : "segmented__button"}
              onClick={() => onChange({ ...filters, intent: option.value })}
              aria-pressed={filters.intent === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row">
        <div className="filter-group">
          <label className="filter-label" htmlFor="age-min">
            Age min
          </label>
          <input
            id="age-min"
            type="number"
            min={18}
            max={99}
            value={filters.ageMin}
            onChange={(event) => {
              const value = Number(event.target.value);
              onChange({ ...filters, ageMin: Number.isFinite(value) ? value : filters.ageMin });
            }}
            className="filter-input"
          />
        </div>
        <div className="filter-group">
          <label className="filter-label" htmlFor="age-max">
            Age max
          </label>
          <input
            id="age-max"
            type="number"
            min={18}
            max={99}
            value={filters.ageMax}
            onChange={(event) => {
              const value = Number(event.target.value);
              onChange({ ...filters, ageMax: Number.isFinite(value) ? value : filters.ageMax });
            }}
            className="filter-input"
          />
        </div>
      </div>

      <div className="filter-group">
        <label className="filter-label" htmlFor="distance">
          Distance (miles)
        </label>
        <input
          id="distance"
          type="range"
          min={5}
          max={100}
          step={5}
          value={filters.distance}
          onChange={(event) => onChange({ ...filters, distance: Number(event.target.value) })}
        />
        <span className="filter-range">Within {filters.distance} miles</span>
      </div>

      {onRefresh ? (
        <button type="button" className="filter-refresh" onClick={onRefresh} disabled={isRefreshing}>
          {isRefreshing ? "Refreshing..." : "Refresh feed"}
        </button>
      ) : null}
    </div>
  );
}
