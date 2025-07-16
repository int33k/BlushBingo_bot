import React, { useState, useEffect, useMemo } from 'react';

interface BingoCardProps {
  card?: number[][];
  onCardChange?: (card: number[][]) => void;
  isEditable?: boolean;
  className?: string;
}

const BingoCard: React.FC<BingoCardProps> = ({
  card: initialCard,
  onCardChange,
  isEditable = true,
  className = ''
}) => {
  const [card, setCard] = useState<number[][]>(() => {
    if (initialCard) return initialCard;
    return Array(5).fill(null).map(() => Array(5).fill(0));
  });

  useEffect(() => {
    if (initialCard) {
      setCard(initialCard);
    }
  }, [initialCard]);

  const handleCellClick = (row: number, col: number) => {
    if (!isEditable) return;

    const newCard = [...card];
    const currentValue = newCard[row][col];

    if (currentValue === 0) {
      // Optimized number finding with Set for O(1) lookups
      const usedNumbers = new Set<number>();
      for (let r = 0; r < 5; r++) {
        for (let c = 0; c < 5; c++) {
          if (card[r][c] > 0) usedNumbers.add(card[r][c]);
        }
      }

      // Find first available number efficiently
      for (let i = 1; i <= 25; i++) {
        if (!usedNumbers.has(i)) {
          newCard[row][col] = i;
          break;
        }
      }
    } else {
      newCard[row][col] = 0;
    }

    setCard(newCard);
    onCardChange?.(newCard);
  };

  const autoFillCard = () => {
    if (!isEditable) return;

    // Optimized with single pass for used numbers
    const usedNumbers = new Set<number>();
    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (card[row][col] > 0) usedNumbers.add(card[row][col]);
      }
    }

    const availableNumbers = [];
    for (let i = 1; i <= 25; i++) {
      if (!usedNumbers.has(i)) {
        availableNumbers.push(i);
      }
    }

    // Fisher-Yates shuffle - optimized
    for (let i = availableNumbers.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [availableNumbers[i], availableNumbers[j]] = [availableNumbers[j], availableNumbers[i]];
    }

    const newCard = [...card];
    let numberIndex = 0;

    for (let row = 0; row < 5; row++) {
      for (let col = 0; col < 5; col++) {
        if (newCard[row][col] === 0 && numberIndex < availableNumbers.length) {
          newCard[row][col] = availableNumbers[numberIndex];
          numberIndex++;
        }
      }
    }

    setCard(newCard);
    onCardChange?.(newCard);
  };

  // Memoized validation functions for better performance
  const isCardComplete = useMemo(() => {
    return card.every(row => row.every(cell => cell > 0));
  }, [card]);

  const getEmptyCellsCount = useMemo(() => {
    return card.flat().filter(cell => cell === 0).length;
  }, [card]);

  return (
    <div className={`bingo-card-container ${className}`}>
      <div className="grid grid-cols-5 gap-1 p-2 border-2 border-teal-400 rounded-lg bg-gray-900/50 shadow-lg shadow-teal-400/30">
        {card.map((row, rowIndex) =>
          row.map((cell, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                aspect-square flex items-center justify-center text-sm font-bold rounded cursor-pointer transition-all duration-200 min-h-[35px]
                ${cell > 0
                  ? 'bg-teal-500 text-white shadow-md shadow-teal-400/50 hover:bg-teal-400 border border-teal-300'
                  : 'bg-gray-800 text-gray-500 hover:bg-gray-700 border border-gray-600'
                }
                ${isEditable ? 'hover:scale-105' : 'cursor-default'}
              `}
              onClick={() => handleCellClick(rowIndex, colIndex)}
            >
              {cell > 0 ? cell : ''}
            </div>
          ))
        )}
      </div>

      {isEditable && (
        <div className="mt-2 flex flex-col gap-2">
          {!isCardComplete && (
            <button
              type="button"
              onClick={autoFillCard}
              className="px-3 py-2 bg-gradient-to-r from-indigo-700 to-blue-800 hover:from-indigo-600 hover:to-blue-700 text-white rounded-lg transition-all duration-300 text-sm font-semibold shadow-lg shadow-indigo-400/30 hover:shadow-indigo-400/50 hover:scale-105 border border-indigo-400/30"
            >
              {getEmptyCellsCount === 25 ? 'Auto-fill Card' : 'Auto-fill Remaining'}
            </button>
          )}

          {isCardComplete && (
            <div className="text-center text-green-400 font-semibold text-sm">
              Card Complete! You can now mark yourself as ready.
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BingoCard;
