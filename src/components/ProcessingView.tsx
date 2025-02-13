import { Card } from "@/components/ui/card";
import { ChatMessage } from '@/types';
import { Button } from "@/components/ui/button";
import { Document, Packer, Paragraph, TextRun, Table, TableRow, TableCell, HeadingLevel, AlignmentType } from "docx";
import { Download, Loader2, Copy, Check, ChevronLeft } from "lucide-react";
import { useState } from "react";
import { toast } from "react-hot-toast";

interface ProcessingViewProps {
  messages: ChatMessage[];
  onNavigateBack: () => void;
}

export function ProcessingView({ messages, onNavigateBack }: ProcessingViewProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isCopied, setIsCopied] = useState(false);

  const parseHtmlToDocxElements = (htmlContent: string) => {
    // Clean up code fence markers
    let cleanContent = htmlContent.replace(/^```html\n?/, ''); // Remove opening ```html
    cleanContent = cleanContent.replace(/\n?```$/, ''); // Remove closing ```
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(cleanContent, 'text/html');
    const elements: any[] = [];

    const processNode = (node: Node) => {
      switch (node.nodeName.toLowerCase()) {
        case 'h1':
          elements.push(new Paragraph({
            text: node.textContent || '',
            heading: HeadingLevel.HEADING_1,
            spacing: { before: 240, after: 120 }
          }));
          break;

        case 'h2':
          elements.push(new Paragraph({
            text: node.textContent || '',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 240, after: 120 }
          }));
          break;

        case 'p':
          elements.push(new Paragraph({
            children: [new TextRun({ text: node.textContent || '' })],
            spacing: { before: 120, after: 120 }
          }));
          break;

        case 'ul':
          Array.from(node.childNodes).forEach((li, index) => {
            if (li.nodeName.toLowerCase() === 'li') {
              elements.push(new Paragraph({
                children: [
                  new TextRun({ text: '• ' }),
                  new TextRun({ text: li.textContent || '' })
                ],
                spacing: { before: 60, after: 60 },
                indent: { left: 720 }
              }));
            }
          });
          break;

        case 'table':
          const tableRows: TableRow[] = [];
          Array.from(node.childNodes).forEach(tr => {
            if (tr.nodeName.toLowerCase() === 'tr') {
              const tableCells: TableCell[] = [];
              Array.from(tr.childNodes).forEach(td => {
                if (td.nodeName.toLowerCase() === 'td' || td.nodeName.toLowerCase() === 'th') {
                  tableCells.push(new TableCell({
                    children: [new Paragraph({ text: td.textContent || '' })]
                  }));
                }
              });
              if (tableCells.length > 0) {
                tableRows.push(new TableRow({ children: tableCells }));
              }
            }
          });
          if (tableRows.length > 0) {
            elements.push(new Table({ rows: tableRows }));
          }
          break;

        case 'br':
          elements.push(new Paragraph({}));
          break;

        case 'strong':
        case 'b':
          elements.push(new Paragraph({
            children: [new TextRun({ text: node.textContent || '', bold: true })]
          }));
          break;

        case 'em':
        case 'i':
          elements.push(new Paragraph({
            children: [new TextRun({ text: node.textContent || '', italics: true })]
          }));
          break;

        default:
          // Handle text nodes and other elements
          if (node.nodeType === Node.TEXT_NODE && node.textContent?.trim()) {
            elements.push(new Paragraph({
              children: [new TextRun({ text: node.textContent.trim() })]
            }));
          } else if (node.childNodes?.length > 0) {
            // Recursively process child nodes
            Array.from(node.childNodes).forEach(processNode);
          }
      }
    };

    Array.from(doc.body.childNodes).forEach(processNode);
    return elements;
  };

  const handleDownload = async () => {
    setIsGenerating(true);
    try {
      // Get the last message (which should be the OCR result)
      const lastMessage = messages[messages.length - 1];
      
      if (!lastMessage) return;

      // Convert HTML content to DOCX elements
      const docElements = parseHtmlToDocxElements(lastMessage.content);

      // Create document with proper formatting
      const doc = new Document({
        sections: [{
          properties: {},
          children: docElements
        }]
      });

      // Generate blob
      const blob = await Packer.toBlob(doc);
      
      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'ocr-result.docx';
      
      // Trigger download
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

  const handleCopyToClipboard = async () => {
    try {
      const lastMessage = messages[messages.length - 1];
      if (!lastMessage) return;

      // Clean up the content by removing HTML tags
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = lastMessage.content;
      const cleanText = tempDiv.textContent || tempDiv.innerText;

      await navigator.clipboard.writeText(cleanText);
      setIsCopied(true);
      toast.success('Text copied to clipboard!');

      // Reset the copied state after 2 seconds
      setTimeout(() => {
        setIsCopied(false);
      }, 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
      toast.error('Failed to copy text to clipboard');
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

      {messages.length === 0 && (
        <Card className="p-6 text-center">
          <div className="flex flex-col items-center gap-4">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-r-transparent" />
            <div>
              <h3 className="font-semibold">Processing Your Document</h3>
              <p className="text-sm text-muted-foreground">
                Please wait while we extract the text...
              </p>
            </div>
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
}
