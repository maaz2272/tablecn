import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(input: string | number | Date) {
  if (!input) return "";
  const date = new Date(input);
  if (isNaN(date.getTime())) return "";

  // Consistent date formatting across SSR server & client hydration
  const year = date.getUTCFullYear();
  const months = [
    "Jan", "Feb", "Mar", "Apr", "May", "Jun",
    "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"
  ];
  const month = months[date.getUTCMonth()];
  const day = date.getUTCDate();

  return `${month} ${day}, ${year}`;
}
