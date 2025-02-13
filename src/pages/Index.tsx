import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ChatMessage, DocumentFormData, Step } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { MainOptions } from '@/components/main/MainOptions';
import { SummaryForm } from '@/components/forms/SummaryForm';
import { SearchForm } from '@/components/forms/SearchForm';
import { MiniplexForm } from '@/components/forms/MiniplexForm';
import { OcrForm } from '@/components/forms/OcrForm';
import { ProcessingView } from '@/components/ProcessingView';

export default function Index() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentStep, setCurrentStep] = useState<Step>('initial');
  const [formData, setFormData] = useState<DocumentFormData>({
    documentType: 'paste',
    pastedText: '',
    summaryType: 'general',
    summarySize: 'quarter',
    webSource: 'all',
    searchQuery: '',
    customWebs: '',
    file: null
  });
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchResult, setSearchResult] = useState<{
    result: string;
    citations: Array<{ title: string; url: string }>;
    related_questions: string[];
  } | null>(null);

  const handleNavigate = (step: Step) => {
    setCurrentStep(step);
    if (step === 'initial') {
      setFormData({
        documentType: 'paste',
        pastedText: '',
        summaryType: 'general',
        summarySize: 'quarter',
        webSource: 'all',
        searchQuery: '',
        customWebs: '',
        file: null
      });
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleFormDataChange = (data: Partial<DocumentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      setCurrentStep('processing');
      
      if (currentStep === 'summary') {
        const { data: processingData, error: processingError } = await supabase.functions.invoke('process-document', {
          body: {
            text: formData.pastedText,
            summaryType: formData.summaryType,
            summarySize: formData.summarySize
          }
        });

        if (processingError) {
          throw new Error(processingError.message);
        }

        const result = processingData.summary;

        const messageData = {
          content: result,
          type: 'assistant',
          document_type: formData.documentType,
          summary_type: formData.summaryType,
          summary_size: formData.summarySize,
          web_source: formData.webSource,
          search_query: formData.searchQuery,
          custom_webs: formData.customWebs
        };

        const { error: insertError } = await supabase
          .from('messages')
          .insert([messageData]);

        if (insertError) {
          console.error('Error inserting message:', insertError);
          throw new Error(insertError.message);
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: result,
            timestamp: new Date()
          }
        ]);

        toast.success('Summary generated!');
      } else if (currentStep === 'search') {
        const { data: searchData, error: searchError } = await supabase.functions.invoke(
          'process-search',
          {
            body: {
              query: formData.searchQuery,
              webSource: formData.webSource,
              customWebs: formData.customWebs
            }
          }
        );

        if (searchError) {
          throw new Error(searchError.message);
        }

        setSearchResult(searchData);
        const result = searchData.result;
        
        const messageData = {
          content: result,
          type: 'assistant',
          web_source: formData.webSource,
          search_query: formData.searchQuery,
          custom_webs: formData.customWebs
        };

        const { error: insertError } = await supabase
          .from('messages')
          .insert([messageData]);

        if (insertError) {
          console.error('Error inserting message:', insertError);
          throw new Error(insertError.message);
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: result,
            timestamp: new Date()
          }
        ]);

        toast.success('Search completed!');
      } else if (currentStep === 'miniplex') {
        const { data: searchData, error: searchError } = await supabase.functions.invoke(
          'process-miniplex',
          {
            body: {
              query: formData.searchQuery,
              webSource: formData.webSource,
              customWebs: formData.customWebs
            }
          }
        );

        if (searchError) {
          throw new Error(searchError.message);
        }

        setSearchResult(searchData);
        const result = searchData.result;
        
        const messageData = {
          content: result,
          type: 'assistant',
          web_source: formData.webSource,
          search_query: formData.searchQuery,
          custom_webs: formData.customWebs
        };

        const { error: insertError } = await supabase
          .from('messages')
          .insert([messageData]);

        if (insertError) {
          console.error('Error inserting message:', insertError);
          throw new Error(insertError.message);
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: result,
            timestamp: new Date()
          }
        ]);

        toast.success('MiniPlex search completed!');
      } else if (currentStep === 'ocr') {
        if (!formData.file) {
          throw new Error('Please upload a file');
        }

        const formDataToSend = new FormData();
        formDataToSend.append('file', formData.file);

        const { data: ocrData, error: ocrError } = await supabase.functions.invoke(
          'process-ocr',
          {
            body: formDataToSend
          }
        );

        if (ocrError) {
          throw new Error(ocrError.message);
        }

        const cleanResult = ocrData.text
          .replace(/^```html\s*/, '')  // Remove opening ```html and any whitespace
          .replace(/\s*```$/, '');     // Remove closing ``` and any whitespace

        const messageData = {
          content: cleanResult,
          type: 'assistant'
        };

        const { error: insertError } = await supabase
          .from('messages')
          .insert([messageData]);

        if (insertError) {
          console.error('Error inserting message:', insertError);
          throw new Error(insertError.message);
        }

        setMessages(prev => [
          ...prev,
          {
            id: Date.now().toString(),
            type: 'assistant',
            content: cleanResult,
            timestamp: new Date()
          }
        ]);

        toast.success('Text extracted successfully!');
      }
    } catch (error) {
      console.error('Error processing request:', error);
      setError(error.message || 'An error occurred while processing the document');
      if (currentStep === 'ocr') {
        setCurrentStep('ocr');
      }
      toast.error('An error occurred. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRelatedQuestionClick = (question: string) => {
    setFormData(prev => ({ ...prev, searchQuery: question }));
    handleSubmit();
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        <Card className="glass-card overflow-hidden min-h-[600px]">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-semibold text-center">AI Assistant</h1>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            {currentStep === 'initial' && (
              <MainOptions onNavigate={handleNavigate} />
            )}
            {currentStep === 'summary' && (
              <SummaryForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNavigateBack={() => handleNavigate('initial')}
                onSubmit={handleSubmit}
              />
            )}
            {currentStep === 'search' && (
              <SearchForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNavigateBack={() => handleNavigate('initial')}
                onSubmit={handleSubmit}
              />
            )}
            {currentStep === 'miniplex' && (
              <MiniplexForm
                formData={formData}
                onFormDataChange={handleFormDataChange}
                onNavigateBack={() => handleNavigate('initial')}
                onSubmit={handleSubmit}
                searchResult={searchResult}
                currentStep={currentStep}
                onRelatedQuestionClick={handleRelatedQuestionClick}
              />
            )}
            {currentStep === 'ocr' && (
              <OcrForm
                formData={formData}
                onFileChange={handleFileChange}
                onNavigateBack={() => handleNavigate('initial')}
                onSubmit={handleSubmit}
                error={error}
                isProcessing={isProcessing}
              />
            )}
            {currentStep === 'processing' && (
              <ProcessingView 
                messages={messages} 
                onNavigateBack={() => handleNavigate('initial')} 
              />
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
