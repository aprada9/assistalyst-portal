
import { useState } from 'react';
import { supabase } from "@/integrations/supabase/client";
import { ChatMessage, DocumentFormData, Step } from '@/types';
import { toast } from 'sonner';

export const useDocumentProcessing = () => {
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
  const [searchReferences, setSearchReferences] = useState<Array<{ title: string; url: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);

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

  const handleFormDataChange = (data: Partial<DocumentFormData>) => {
    setFormData(prev => ({ ...prev, ...data }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async () => {
    try {
      setError(null);
      setIsProcessing(true);
      setMessages([]);
      
      if (currentStep === 'search') {
        await handleSearchSubmit();
      } else if (currentStep === 'summary') {
        await handleSummarySubmit();
      } else if (currentStep === 'miniplex') {
        await handleMiniplexSubmit();
      } else if (currentStep === 'ocr') {
        await handleOcrSubmit();
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
      setIsSearching(false);
    }
  };

  const handleSearchSubmit = async () => {
    setIsSearching(true);
    setSearchReferences([]);
    setCurrentStep('processing');

    setMessages([{
      id: Date.now().toString(),
      type: 'assistant',
      content: 'Processing your query...',
      timestamp: new Date()
    }]);

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

    if (searchData.references) {
      setSearchReferences(searchData.references);
    }

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
      throw new Error(insertError.message);
    }

    setMessages(prev => [{
      id: prev[0].id,
      type: 'assistant',
      content: result,
      timestamp: new Date()
    }]);

    toast.success('Search completed!');
  };

  const handleSummarySubmit = async () => {
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
    const formattedResult = formData.summaryType === 'bullets' 
      ? result.startsWith('<ul>') 
        ? result 
        : `<ul>${result.split('\n').map(point => `<li>${point.trim().replace(/^[•-]\s*/, '')}</li>`).join('')}</ul>`
      : result;

    const messageData = {
      content: formattedResult,
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
      throw new Error(insertError.message);
    }

    setMessages(prev => [
      ...prev,
      {
        id: Date.now().toString(),
        type: 'assistant',
        content: formattedResult,
        timestamp: new Date()
      }
    ]);

    toast.success('Summary generated!');
  };

  const handleMiniplexSubmit = async () => {
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
  };

  const handleOcrSubmit = async () => {
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
      .replace(/^```html\s*/, '')
      .replace(/\s*```$/, '');

    const messageData = {
      content: cleanResult,
      type: 'assistant'
    };

    const { error: insertError } = await supabase
      .from('messages')
      .insert([messageData]);

    if (insertError) {
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
  };

  return {
    messages,
    currentStep,
    formData,
    isProcessing,
    error,
    searchResult,
    searchReferences,
    isSearching,
    handleNavigate,
    handleFormDataChange,
    handleFileChange,
    handleSubmit
  };
};
