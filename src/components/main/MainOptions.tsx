
import { FileText, Search, Upload, Sparkles } from 'lucide-react';
import { Card } from "@/components/ui/card";
import { Step } from '@/types';

interface MainOption {
  id: string;
  icon: JSX.Element;
  label: string;
  description: string;
}

const mainOptions: MainOption[] = [
  { 
    id: 'summary', 
    icon: <FileText className="w-5 h-5" />, 
    label: 'Document Summary', 
    description: 'Get concise summaries from any document' 
  },
  { 
    id: 'search', 
    icon: <Search className="w-5 h-5" />, 
    label: 'Specialized Search', 
    description: 'Search across multiple sources with citations' 
  },
  {
    id: 'miniplex',
    icon: <Sparkles className="w-5 h-5" />,
    label: 'MiniPlex Search',
    description: 'Open-source AI search with citations'
  },
  { 
    id: 'ocr', 
    icon: <Upload className="w-5 h-5" />, 
    label: 'Document OCR', 
    description: 'Extract text from images and PDFs' 
  }
];

interface MainOptionsProps {
  onNavigate: (step: Step) => void;
}

export const MainOptions = ({ onNavigate }: MainOptionsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 animate-in">
      {mainOptions.map((option) => (
        <Card 
          key={option.id}
          className="glass-card p-6 hover:scale-[1.02] transition-all cursor-pointer"
          onClick={() => onNavigate(option.id as Step)}
        >
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-full bg-primary/10 text-primary">
              {option.icon}
            </div>
            <div>
              <h3 className="font-semibold text-lg">{option.label}</h3>
              <p className="text-sm text-muted-foreground">{option.description}</p>
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
