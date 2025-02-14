
import { Card } from "@/components/ui/card";
import { ChatMessage } from '@/types';
import { Button } from "@/components/ui/button";
import { Document, Packer, Paragraph, TextRun } from "docx";
import { Download, Loader2, Copy, Check, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

interface ProcessingViewProps {
  messages: ChatMessage[];
  onNavigateBack: () => void;
  references?: Array<{ title: string; url: string }>;
  isSearching?: boolean;
}

export const ProcessingView = ({ 
  messages, 
  onNavigateBack,
  references = [],
  isSearching = false
}: ProcessingViewProps) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const handleCopyToClipboard = async () => {
    try {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = lastMessage.content;
      const cleanText = tempDiv.textContent || tempDiv.innerText;

      await navigator.clipboard.writeText(cleanText);
      setIsCopied(true);
      toast.success('Text copied to clipboard!');

      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy text to clipboard');
    }
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              children: [
                new TextRun({ text: lastMessage.content })
              ]
            })
          ]
        }]
      });

      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'result.docx';
      
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error generating DOCX:', error);
      toast.error('Error generating document. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="p-4 space-y-4">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={onNavigateBack}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Results</h2>
      </div>

      {isSearching && references.length === 0 && (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <div>
              <h3 className="font-semibold">Searching...</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we process your query
              </p>
            </div>
          </div>
        </Card>
      )}

      {isSearching && references.length > 0 && (
        <Card className="p-4 bg-muted/50">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 animate-spin rounded-full border-2 border-primary border-r-transparent" />
            <p className="text-sm text-muted-foreground">
              Analyzing references...
            </p>
          </div>
          <div className="mt-3 space-y-2">
            {references.map((ref, index) => (
              <div key={index} className="text-sm flex items-start gap-2">
                <span className="min-w-[20px] text-primary">[{index + 1}]</span>
                <a 
                  href={ref.url} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary hover:underline"
                >
                  {ref.title || ref.url}
                </a>
              </div>
            ))}
          </div>
        </Card>
      )}
      
      {messages.map((message) => (
        <Card 
          key={message.id}
          className={`p-4 ${
            message.type === 'assistant' 
              ? 'bg-primary/5 border-primary/10' 
              : 'bg-secondary/5 border-secondary/10'
          }`}
        >
          <div className="space-y-4">
            <div 
              className="prose max-w-none [&>ul]:list-disc [&>ul]:pl-6 [&>ul>li]:mt-2"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        </Card>
      ))}
      
      {messages.length > 0 && (
        <div className="flex justify-end gap-2 mt-4">
          <Button
            onClick={handleCopyToClipboard}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isCopied}
          >
            {isCopied ? (
              <>
                <Check className="h-4 w-4" />
                Copied!
              </>
            ) : (
              <>
                <Copy className="h-4 w-4" />
                Copy to Clipboard
              </>
            )}
          </Button>

          <Button
            onClick={handleDownload}
            variant="outline"
            className="flex items-center gap-2"
            disabled={isGenerating}
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Download className="h-4 w-4" />
                Download as Word
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
};
