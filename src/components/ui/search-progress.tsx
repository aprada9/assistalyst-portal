
import { useEffect, useState } from "react";
import { Card } from "./card";
import { Badge } from "./badge";
import { Loader2 } from "lucide-react";

interface SearchProgressProps {
  isSearching: boolean;
}

export function SearchProgress({ isSearching }: SearchProgressProps) {
  const [sources, setSources] = useState<string[]>([]);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    if (isSearching) {
      const steps = [
        "Analyzing query...",
        "Connecting to search APIs...",
        "Searching academic sources...",
        "Scanning web content...",
        "Processing results...",
        "Generating response..."
      ];

      let currentIndex = 0;
      const interval = setInterval(() => {
        if (currentIndex < steps.length) {
          setSources(prev => [...prev, steps[currentIndex]]);
          setCurrentStep(currentIndex);
          currentIndex++;
        }
      }, 800);

      return () => {
        clearInterval(interval);
        setSources([]);
        setCurrentStep(0);
      };
    }
  }, [isSearching]);

  if (!isSearching) return null;

  return (
    <Card className="p-6 mt-4">
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="text-sm font-medium">Searching across sources...</span>
        </div>
        <div className="space-y-2">
          {sources.map((source, index) => (
            <div
              key={index}
              className="flex items-center gap-2 text-sm animate-fade-in"
              style={{
                animationDelay: `${index * 150}ms`,
                opacity: currentStep === index ? 1 : 0.5
              }}
            >
              <Badge 
                variant={currentStep === index ? "default" : "secondary"}
                className="h-6"
              >
                {index + 1}
              </Badge>
              <span className={currentStep === index ? "text-primary font-medium" : "text-muted-foreground"}>
                {source}
              </span>
              {currentStep === index && (
                <Loader2 className="w-3 h-3 animate-spin ml-2" />
              )}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
}
