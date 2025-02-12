
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ChevronLeft, Upload } from 'lucide-react';
import { DocumentFormData } from '@/types';

interface OcrFormProps {
  formData: DocumentFormData;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onNavigateBack: () => void;
  onSubmit: () => void;
  error: string | null;
  isProcessing: boolean;
}

export const OcrForm = ({ 
  formData, 
  onFileChange, 
  onNavigateBack, 
  onSubmit,
  error,
  isProcessing 
}: OcrFormProps) => {
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
        <h2 className="text-lg font-semibold">Document OCR</h2>
      </div>

      <div className="space-y-4">
        <div className="grid w-full max-w-sm items-center gap-1.5">
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={onFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Upload images (PNG, JPEG, GIF, WebP)
          </p>
        </div>

        {error && (
          <Card className="p-4 border-destructive/50 bg-destructive/5">
            <div className="flex gap-2 items-start text-destructive">
              <div className="h-5 w-5 shrink-0 mt-0.5">⚠️</div>
              <div>
                <p className="font-medium">Error</p>
                <p className="text-sm text-destructive/90">{error}</p>
              </div>
            </div>
          </Card>
        )}

        <Button 
          className="w-full"
          onClick={onSubmit}
          disabled={!formData.file || isProcessing}
        >
          {isProcessing ? (
            <>
              <div className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
              Processing Document...
            </>
          ) : (
            <>
              <Upload className="w-4 h-4 mr-2" />
              Process Document
            </>
          )}
        </Button>
      </div>
    </div>
  );
};
