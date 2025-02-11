
import { Card } from "./card";
import { Badge } from "./badge";
import { Button } from "./button";
import { Search } from "lucide-react";

interface Citation {
  title: string;
  url: string;
}

interface SearchResultProps {
  content: string;
  citations?: Citation[];
  relatedQuestions?: string[];
  onRelatedQuestionClick: (question: string) => void;
}

export function SearchResult({ 
  content, 
  citations, 
  relatedQuestions,
  onRelatedQuestionClick 
}: SearchResultProps) {
  return (
    <div className="space-y-4 animate-fade-in">
      <Card className="p-6">
        <div 
          className="prose max-w-none"
          dangerouslySetInnerHTML={{ __html: content }}
        />
      </Card>

      {citations && citations.length > 0 && (
        <Card className="p-6 bg-muted/50">
          <h3 className="text-lg font-semibold mb-4">Sources</h3>
          <div className="space-y-3">
            {citations.map((citation, index) => (
              <div 
                key={index} 
                className="flex items-start gap-2 animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
              >
                <div className="min-w-[24px] h-6 flex items-center justify-center rounded-full bg-primary/10 text-primary text-sm">
                  {index + 1}
                </div>
                <a
                  href={citation.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline flex-1 text-sm"
                >
                  {citation.url}
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}

      {relatedQuestions && relatedQuestions.length > 0 && (
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">Related Questions</h3>
          <div className="space-y-2">
            {relatedQuestions.map((question, index) => (
              <Button
                key={index}
                variant="ghost"
                className="w-full justify-start text-left animate-fade-in"
                style={{ animationDelay: `${index * 150}ms` }}
                onClick={() => onRelatedQuestionClick(question)}
              >
                <Search className="w-4 h-4 mr-2" />
                {question}
              </Button>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
