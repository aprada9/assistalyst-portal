
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, Search } from 'lucide-react';
import { DocumentFormData } from '@/types';

interface SearchFormProps {
  formData: DocumentFormData;
  onFormDataChange: (data: Partial<DocumentFormData>) => void;
  onNavigateBack: () => void;
  onSubmit: () => void;
}

export const SearchForm = ({ formData, onFormDataChange, onNavigateBack, onSubmit }: SearchFormProps) => {
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
        <h2 className="text-lg font-semibold">Specialized Search</h2>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Enter your search query..."
          value={formData.searchQuery}
          onChange={(e) => onFormDataChange({ searchQuery: e.target.value })}
        />

        <Select
          value={formData.webSource}
          onValueChange={(value) => onFormDataChange({ webSource: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select source" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Sources</SelectItem>
            <SelectItem value="boe">BOE</SelectItem>
            <SelectItem value="borne">BORNE</SelectItem>
            <SelectItem value="custom">Custom Sources</SelectItem>
          </SelectContent>
        </Select>

        {formData.webSource === 'custom' && (
          <Input
            placeholder="Enter custom websites (comma-separated)"
            value={formData.customWebs}
            onChange={(e) => onFormDataChange({ customWebs: e.target.value })}
          />
        )}

        <Button 
          className="w-full"
          onClick={onSubmit}
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );
};
