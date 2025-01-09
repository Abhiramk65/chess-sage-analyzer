import React, { useEffect, useRef } from 'react';
import { MoveEvaluation } from '../utils/moveAnalysis';
import { ScrollArea } from './ui/scroll-area';
import { Button } from './ui/button';
import { Search, RotateCcw, ArrowRight } from 'lucide-react';

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
    if (currentMoveIndex >= 0 && moveRefs.current[currentMoveIndex]) {
      moveRefs.current[currentMoveIndex]?.scrollIntoView({
        behavior: 'smooth',
        block: 'nearest',
      });
    }
  }, [currentMoveIndex]);

  const getEvaluationIcon = (quality: string) => {
    if (quality.includes('Brilliant')) return '!!';
    if (quality.includes('Good')) return '!';
    if (quality.includes('Inaccuracy')) return '?';
    if (quality.includes('Mistake')) return '??';
    if (quality.includes('Blunder')) return '???';
    return '⟳';
  };

  const analyzeMoveQuality = (move: string, index: number) => {
    const moveNumber = Math.floor(index / 2) + 1;
    const isWhiteMove = index % 2 === 0;
    const moveNotation = `${moveNumber}${isWhiteMove ? '.' : '...'} ${move}`;
    const evaluation = moveEvaluations[index];
    const icon = evaluation ? getEvaluationIcon(evaluation.quality) : '';
    
    return (
      <div 
        key={index} 
        className="space-y-2"
        ref={el => moveRefs.current[index] = el}
      >
        <div 
          className={`cursor-pointer p-2 rounded-md hover:bg-gray-100 ${
            currentMoveIndex === index ? 'bg-gray-200' : ''
          } ${evaluation?.className || ''}`}
          onClick={() => onMoveClick(index)}
        >
          <div className="flex items-center justify-between">
            <span>{moveNotation}</span>
            <span className="text-sm font-bold">{icon}</span>
          </div>
          {evaluation?.quality.includes('Inaccuracy') || 
           evaluation?.quality.includes('Mistake') || 
           evaluation?.quality.includes('Blunder') ? (
            <div className="mt-2 text-sm bg-gray-50 p-2 rounded">
              <div className="font-medium text-gray-700">Best move was:</div>
              {evaluation?.alternateLines && evaluation.alternateLines.length > 0 && (
                <div className="ml-2 font-mono">
                  {evaluation.alternateLines[0].moves.join(' ')}
                </div>
              )}
            </div>
          ) : null}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <Button variant="outline" size="sm" className="flex-1">
          <Search className="w-4 h-4 mr-2" />
          Best
        </Button>
        <Button variant="outline" size="sm" className="flex-1">
          <RotateCcw className="w-4 h-4 mr-2" />
          Retry
        </Button>
        <Button variant="default" size="sm" className="flex-1 bg-[#85b853]">
          <ArrowRight className="w-4 h-4 mr-2" />
          Next
        </Button>
      </div>
      <ScrollArea className="h-[400px] border rounded-md p-2">
        <div className="space-y-2">
          {moves.map((move, index) => analyzeMoveQuality(move, index))}
        </div>
      </ScrollArea>
    </div>
  );
};

export default MoveList;