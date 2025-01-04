import React, { useEffect, useRef } from 'react';
import { MoveEvaluation } from '../utils/moveAnalysis';
import { ScrollArea } from './ui/scroll-area';

interface MoveListProps {
  moves: string[];
  moveEvaluations: MoveEvaluation[];
  currentMoveIndex: number;
  onMoveClick: (index: number) => void;
}

const MoveList: React.FC<MoveListProps> = ({
  moves,
  moveEvaluations,
  currentMoveIndex,
  onMoveClick,
}) => {
  const moveRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    console.log('Scrolling to move:', currentMoveIndex);
    if (currentMoveIndex >= 0 && moveRefs.current[currentMoveIndex]) {
      moveRefs.current[currentMoveIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'start',
      });
    }
  }, [currentMoveIndex]);

  const analyzeMoveQuality = (move: string, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;
    const moveNotation = `${moveNumber}${isWhiteMove ? '.' : '...'} ${move}`;
    const evaluation = moveEvaluations[index];
    
    return (
      <div 
        key={index} 
        className="space-y-2"
        ref={el => moveRefs.current[index] = el}
      >
        <div 
          className={`cursor-pointer p-2 hover:bg-gray-100 ${
            currentMoveIndex === index ? 'bg-gray-200' : ''
          } ${evaluation?.className || ''}`}
          onClick={() => onMoveClick(index)}
        >
          {moveNotation} {evaluation?.quality || ''}
        </div>
        {evaluation?.alternateLines && evaluation.alternateLines.length > 0 && (
          <div className="ml-4 text-sm space-y-1">
            {evaluation.alternateLines.map((line, lineIndex) => (
              <div 
                key={lineIndex}
                className="text-gray-600 hover:text-gray-900"
              >
                Alternative {lineIndex + 1} (eval: {line.evaluation.toFixed(2)}):
                <div className="ml-2 font-mono">
                  {line.moves.join(' ')}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <ScrollArea className="h-[400px] border rounded-md p-2">
      <div className="space-y-2">
        {moves.map((move, index) => analyzeMoveQuality(move, index))}
      </div>
    </ScrollArea>
  );
};

export default MoveList;