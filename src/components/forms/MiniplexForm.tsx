
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Sparkles, Search } from 'lucide-react';
import { DocumentFormData } from '@/types';

interface SearchResult {
  result: string;
  citations: Array<{ title: string; url: string }>;
  related_questions: string[];
}

interface MiniplexFormProps {
  formData: DocumentFormData;
  onFormDataChange: (data: Partial<DocumentFormData>) => void;
  onNavigateBack: () => void;
  onSubmit: () => void;
  searchResult: SearchResult | null;
  currentStep: string;
  onRelatedQuestionClick: (question: string) => void;
}

export const MiniplexForm = ({ 
  formData, 
  onFormDataChange, 
  onNavigateBack, 
  onSubmit,
  searchResult,
  currentStep,
  onRelatedQuestionClick
}: MiniplexFormProps) => {
  return (
    <div className="space-y-6 p-4 animate-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">MiniPlex Search</h2>
      </div>

      <div className="space-y-4">
        <div className="relative">
          <Input
            placeholder="Ask anything..."
            value={formData.searchQuery}
            onChange={(e) => onFormDataChange({ searchQuery: e.target.value })}
            className="pr-12"
          />
          <Button 
            className="absolute right-1 top-1 h-8"
            size="sm"
            onClick={onSubmit}
            disabled={!formData.searchQuery.trim()}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Search Sources</label>
          <Select
            value={formData.webSource}
            onValueChange={(value) => onFormDataChange({ webSource: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select source" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sources</SelectItem>
              <SelectItem value="boe">Spanish Official Gazette (BOE)</SelectItem>
              <SelectItem value="borne">UK Government (BORNE)</SelectItem>
              <SelectItem value="custom">Custom Sources</SelectItem>
            </SelectContent>
          </Select>

          {formData.webSource === 'custom' && (
            <div className="space-y-2">
              <Input
                placeholder="Enter domains (e.g., example.com, site.org)"
                value={formData.customWebs}
                onChange={(e) => onFormDataChange({ customWebs: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple domains with commas
              </p>
            </div>
          )}

          <div className="flex flex-wrap gap-2 mt-2">
            {formData.webSource === 'boe' && (
              <Badge variant="secondary">BOE.es</Badge>
            )}
            {formData.webSource === 'borne' && (
              <Badge variant="secondary">BORNE.gov.uk</Badge>
            )}
            {formData.webSource === 'custom' && formData.customWebs && (
              formData.customWebs.split(',').map((domain, index) => (
                <Badge key={index} variant="secondary">
                  {domain.trim()}
                </Badge>
              ))
            )}
            {formData.webSource === 'all' && (
              <Badge variant="secondary">All Available Sources</Badge>
            )}
          </div>
        </div>
      </div>

      {currentStep === 'processing' && searchResult && (
        <div className="mt-8 space-y-6">
          <Card className="p-6">
            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: searchResult.result }} />
            </div>
          </Card>

          {searchResult.citations.length > 0 && (
            <Card className="p-6 bg-muted/50">
              <h3 className="text-lg font-semibold mb-4">Web References</h3>
              <div className="space-y-3">
                {searchResult.citations.map((citation, index) => (
                  <div key={index} className="flex items-start gap-2">
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

          {searchResult.related_questions.length > 0 && (
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Related Questions</h3>
              <div className="space-y-2">
                {searchResult.related_questions.map((question, index) => (
                  <Button
                    key={index}
                    variant="ghost"
                    className="w-full justify-start text-left"
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
      )}
    </div>
  );
};
