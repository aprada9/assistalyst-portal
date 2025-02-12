
import { Card } from "@/components/ui/card";
import { ChatMessage } from '@/types';

interface ProcessingViewProps {
  messages: ChatMessage[];
}

export const ProcessingView = ({ messages }: ProcessingViewProps) => {
  return (
    <div className="p-4 space-y-4">
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
              className="prose max-w-none"
              dangerouslySetInnerHTML={{ __html: message.content }}
            />
          </div>
        </Card>
      ))}
    </div>
  );
};
