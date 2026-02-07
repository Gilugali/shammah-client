/**
 * Format amount as Rwandan Franc (RWF).
 * Symbol goes after the number: "1,000.00 RWF"
 * Shows exact amounts with 2 decimal places (no rounding)
 * For negative amounts, use formatAmountWithIndicator instead
 */
export const formatRWF = (amount: number): string => {
  // Convert to number if it's a string or other type
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  
  // Format with 2 decimal places, showing exact value without rounding
  const formatted = new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(numAmount);
  return `${formatted} RWF`;
};

/**
 * Format amount as RWF without currency symbol (just number with commas and decimals)
 * Shows exact amounts with 2 decimal places (no rounding)
 */
export const formatRWFNumber = (amount: number): string => {
  // Convert to number if it's a string or other type
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  
  return new Intl.NumberFormat('en-RW', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
    useGrouping: true,
  }).format(numAmount);
};


