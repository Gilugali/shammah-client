interface SummaryCard {
  title: string;
  value: string | number;
  icon?: React.ReactNode;
  color?: string;
  bgColor?: string;
}

interface SummaryCardsProps {
  cards: SummaryCard[];
  isLoading?: boolean;
}

export const SummaryCards = ({ cards, isLoading = false }: SummaryCardsProps) => {
  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="bg-white rounded-lg border border-gray-200 p-4 animate-pulse"
          >
            <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
            <div className="h-8 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {cards.map((card, index) => (
        <div
          key={index}
          className={`bg-white rounded-lg border border-gray-200 p-4 shadow-sm hover:shadow-md transition-shadow ${
            card.bgColor || "bg-white"
          }`}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-1">
                {card.title}
              </p>
              <p
                className={`text-2xl font-bold ${
                  card.color || "text-gray-900"
                }`}
              >
                {card.value}
              </p>
            </div>
            {card.icon && (
              <div className={`${card.color || "text-gray-400"}`}>
                {card.icon}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

