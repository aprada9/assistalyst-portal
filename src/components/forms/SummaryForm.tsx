import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ChevronLeft, Link, Upload, Type, Sparkles } from 'lucide-react';
import { DocumentFormData } from '@/types';
import { Input } from "@/components/ui/input";

interface SummaryFormProps {
  formData: DocumentFormData;
  onFormDataChange: (data: Partial<DocumentFormData>) => void;
  onNavigateBack: () => void;
  onSubmit: () => void;
}

export const SummaryForm = ({ formData, onFormDataChange, onNavigateBack, onSubmit }: SummaryFormProps) => {
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
        <h2 className="text-lg font-semibold">Document Summary</h2>
      </div>

      <div className="space-y-4">
        <Select
          value={formData.documentType}
          onValueChange={(value) => onFormDataChange({ documentType: value as any })}
        >
          <SelectTrigger>
            <SelectValue placeholder="Select input type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="url">
              <div className="flex items-center gap-2">
                <Link className="w-4 h-4" />
                <span>URL</span>
              </div>
            </SelectItem>
            <SelectItem value="file">
              <div className="flex items-center gap-2">
                <Upload className="w-4 h-4" />
                <span>File Upload</span>
              </div>
            </SelectItem>
            <SelectItem value="paste">
              <div className="flex items-center gap-2">
                <Type className="w-4 h-4" />
                <span>Paste Text</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>

        {formData.documentType === 'url' && (
          <div className="space-y-2">
            <Input
              type="url"
              placeholder="Enter URL (e.g., https://example.com/article)"
              value={formData.pastedText}
              onChange={(e) => onFormDataChange({ pastedText: e.target.value })}
            />
          </div>
        )}

        {formData.documentType === 'paste' && (
          <Textarea
            placeholder="Paste your text here..."
            value={formData.pastedText}
            onChange={(e) => onFormDataChange({ pastedText: e.target.value })}
            className="min-h-[200px]"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            value={formData.summaryType}
            onValueChange={(value) => onFormDataChange({ summaryType: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Summary type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="bullets">Bullet Points</SelectItem>
              <SelectItem value="general">General Summary</SelectItem>
            </SelectContent>
          </Select>

          <Select
            value={formData.summarySize}
            onValueChange={(value) => onFormDataChange({ summarySize: value as any })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Summary length" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="quarter">Quarter Page</SelectItem>
              <SelectItem value="half">Half Page</SelectItem>
              <SelectItem value="full">Full Page</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Button 
          className="w-full"
          onClick={onSubmit}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Summary
        </Button>
      </div>
    </div>
  );
};
