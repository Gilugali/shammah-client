import { formatRWF } from "@/lib/utils/currency";

interface AmountWithIndicatorProps {
  amount: number | string;
  className?: string;
}

/**
 * Component to display amount with red down arrow for negative values
 */
export const AmountWithIndicator = ({ amount, className = "" }: AmountWithIndicatorProps) => {
  const numAmount = typeof amount === 'number' ? amount : parseFloat(String(amount)) || 0;
  const isNegative = numAmount < 0;
  const absoluteAmount = Math.abs(numAmount);
  const formatted = formatRWF(absoluteAmount);
  
  if (isNegative) {
    return (
      <span className={`flex items-center gap-1 text-red-600 ${className}`}>
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 14l-7 7m0 0l-7-7m7 7V3"
          />
        </svg>
        {formatted}
      </span>
    );
  }
  
  return <span className={className}>{formatted}</span>;
};

