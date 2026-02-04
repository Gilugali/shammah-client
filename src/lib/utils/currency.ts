/**
 * Format amount as Rwandan Franc (RWF).
 * Symbol goes after the number: "1,000 RWF"
 */
export const formatRWF = (amount: number): string => {
  const formatted = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
  return `${formatted} RWF`;
};

/**
 * Format amount as RWF without currency symbol (just number with commas)
 */
export const formatRWFNumber = (amount: number): string => {
  return new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

