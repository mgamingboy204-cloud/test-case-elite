"use client";

export const INTEREST_OPTIONS = [
  "Art",
  "Fitness",
  "Food",
  "Music",
  "Outdoors",
  "Travel",
  "Wellness",
  "Tech"
];

export function buildDobString({
  year,
  month,
  day
}: {
  year: string;
  month: string;
  day: string;
}) {
  if (!year || !month || !day) return "";
  const monthValue = month.padStart(2, "0");
  const dayValue = day.padStart(2, "0");
  return `${year}-${monthValue}-${dayValue}`;
}

export function getAgeFromDob(dob: string) {
  const date = new Date(dob);
  if (Number.isNaN(date.getTime())) return null;
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age -= 1;
  }
  return age;
}

export function parseDobString(dob?: string | null) {
  if (!dob) return { year: "", month: "", day: "" };
  const [year, month, day] = dob.split("-");
  if (!year || !month || !day) return { year: "", month: "", day: "" };
  return { year, month, day };
}
