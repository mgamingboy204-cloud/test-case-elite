"use client";

import type { DiscoverFilters } from "../useDiscoverFeed";
import styles from "../discover.module.css";

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
  const minAge = Math.max(18, Number.isFinite(filters.ageMin) ? filters.ageMin : 18);
  const maxAge = Math.max(18, Number.isFinite(filters.ageMax) ? filters.ageMax : 18);

  function handleAgeChange(type: "min" | "max", value: number) {
    const sanitized = Number.isFinite(value) ? value : type === "min" ? minAge : maxAge;
    const nextValue = Math.min(99, Math.max(18, sanitized));
    if (type === "min") {
      const nextMax = Math.max(nextValue, maxAge);
      onChange({ ...filters, ageMin: nextValue, ageMax: nextMax });
      return;
    }
    const nextMin = Math.min(minAge, nextValue);
    onChange({ ...filters, ageMin: nextMin, ageMax: nextValue });
  }

  return (
    <div className={styles.filters}>
      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Gender</span>
        <div className={styles.segmented} role="group" aria-label="Gender">
          {genderOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.segmentButton} ${
                filters.gender === option.value ? styles.segmentButtonActive : ""
              }`}
              onClick={() => onChange({ ...filters, gender: option.value })}
              aria-pressed={filters.gender === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterGroup}>
        <span className={styles.filterLabel}>Intent</span>
        <div className={styles.segmented} role="group" aria-label="Intent">
          {intentOptions.map((option) => (
            <button
              key={option.value}
              type="button"
              className={`${styles.segmentButton} ${
                filters.intent === option.value ? styles.segmentButtonActive : ""
              }`}
              onClick={() => onChange({ ...filters, intent: option.value })}
              aria-pressed={filters.intent === option.value}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>

      <div className={styles.filterRow}>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="age-min">
            Age min
          </label>
          <input
            id="age-min"
            type="number"
            min={18}
            max={99}
            value={minAge}
            onChange={(event) => {
              const value = Number(event.target.value);
              handleAgeChange("min", value);
            }}
            className={styles.filterInput}
          />
        </div>
        <div className={styles.filterGroup}>
          <label className={styles.filterLabel} htmlFor="age-max">
            Age max
          </label>
          <input
            id="age-max"
            type="number"
            min={18}
            max={99}
            value={maxAge}
            onChange={(event) => {
              const value = Number(event.target.value);
              handleAgeChange("max", value);
            }}
            className={styles.filterInput}
          />
        </div>
      </div>

      <div className={styles.filterGroup}>
        <label className={styles.filterLabel} htmlFor="distance">
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
          className={styles.filterRangeInput}
        />
        <span className={styles.filterRange}>Within {filters.distance} miles</span>
      </div>

      {onRefresh ? (
        <button
          type="button"
          className={styles.filterRefresh}
          onClick={onRefresh}
          disabled={isRefreshing}
        >
          {isRefreshing ? "Refreshing..." : "Refresh feed"}
        </button>
      ) : null}
    </div>
  );
}
