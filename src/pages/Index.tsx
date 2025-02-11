import { useState } from 'react';
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { FileText, Search, Upload, Link, Type, ChevronLeft, Sparkles } from 'lucide-react';
import { ChatMessage, DocumentFormData, Step } from '@/types';
import { toast } from 'sonner';
import { supabase } from "@/integrations/supabase/client";
import { SearchProgress } from "@/components/ui/search-progress";
import { SearchResult } from "@/components/ui/search-result";
import { Textarea } from "@/components/ui/textarea";

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

  const [searchResult, setSearchResult] = useState<{
    result: string;
    citations: Array<{ title: string; url: string }>;
    related_questions: string[];
  } | null>(null);
  
  const [isSearching, setIsSearching] = useState(false);

  const mainOptions = [
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
    const file = e.target.files?.[0];
    if (file) {
      setFormData(prev => ({ ...prev, file }));
    }
  };

  const handleSubmit = async () => {
    try {
      setCurrentStep('processing');
      
      if (currentStep === 'miniplex') {
        setIsSearching(true);
        setSearchResult(null);

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

        // Simulate some delay to show the progress
        await new Promise(resolve => setTimeout(resolve, 2000));

        setSearchResult(searchData);
        setIsSearching(false);
        
        const messageData = {
          content: searchData.result,
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
            content: searchData.result,
            timestamp: new Date()
          }
        ]);

        toast.success('Search completed!');
      } else {
        let result: string;
        
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

          result = processingData.summary;

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
          result = searchData.result;
          
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

          result = ocrData.text;

          const messageData = {
            content: result,
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
              content: result,
              timestamp: new Date()
            }
          ]);

          toast.success('Text extracted successfully!');
        }
      }
    } catch (error) {
      console.error('Error processing request:', error);
      toast.error('An error occurred. Please try again.');
      setIsSearching(false);
    }
  };

  const renderInitialView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 animate-in">
      {mainOptions.map((option) => (
        <Card 
          key={option.id}
          className="glass-card p-6 hover:scale-[1.02] transition-all cursor-pointer"
          onClick={() => handleNavigate(option.id as Step)}
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

  const renderSummaryForm = () => (
    <div className="space-y-6 p-4 animate-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('initial')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Document Summary</h2>
      </div>

      <div className="space-y-4">
        <Select
          value={formData.documentType}
          onValueChange={(value) => setFormData({ ...formData, documentType: value as any })}
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

        {formData.documentType === 'paste' && (
          <Textarea
            placeholder="Paste your text here..."
            value={formData.pastedText}
            onChange={(e) => setFormData({ ...formData, pastedText: e.target.value })}
            className="min-h-[200px]"
          />
        )}

        <div className="grid grid-cols-2 gap-4">
          <Select
            value={formData.summaryType}
            onValueChange={(value) => setFormData({ ...formData, summaryType: value as any })}
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
            onValueChange={(value) => setFormData({ ...formData, summarySize: value as any })}
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
          onClick={handleSubmit}
        >
          <Sparkles className="w-4 h-4 mr-2" />
          Generate Summary
        </Button>
      </div>
    </div>
  );

  const renderSearchForm = () => (
    <div className="space-y-6 p-4 animate-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('initial')}
        >
          <ChevronLeft className="w-4 h-4" />
        </Button>
        <h2 className="text-lg font-semibold">Specialized Search</h2>
      </div>

      <div className="space-y-4">
        <Input
          placeholder="Enter your search query..."
          value={formData.searchQuery}
          onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
        />

        <Select
          value={formData.webSource}
          onValueChange={(value) => setFormData({ ...formData, webSource: value as any })}
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
            onChange={(e) => setFormData({ ...formData, customWebs: e.target.value })}
          />
        )}

        <Button 
          className="w-full"
          onClick={handleSubmit}
        >
          <Search className="w-4 h-4 mr-2" />
          Search
        </Button>
      </div>
    </div>
  );

  const renderMiniPlexForm = () => (
    <div className="space-y-6 p-4 animate-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('initial')}
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
            onChange={(e) => setFormData({ ...formData, searchQuery: e.target.value })}
            className="pr-12"
          />
          <Button 
            className="absolute right-1 top-1 h-8"
            size="sm"
            onClick={handleSubmit}
            disabled={!formData.searchQuery.trim() || isSearching}
          >
            <Sparkles className="w-4 h-4 mr-2" />
            Search
          </Button>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Search Sources</label>
          <Select
            value={formData.webSource}
            onValueChange={(value) => setFormData({ ...formData, webSource: value as any })}
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
                onChange={(e) => setFormData({ ...formData, customWebs: e.target.value })}
              />
              <p className="text-sm text-muted-foreground">
                Separate multiple domains with commas
              </p>
            </div>
          )}
        </div>

        <SearchProgress isSearching={isSearching} />

        {searchResult && !isSearching && (
          <SearchResult
            content={searchResult.result}
            citations={searchResult.citations}
            relatedQuestions={searchResult.related_questions}
            onRelatedQuestionClick={(question) => {
              setFormData(prev => ({ ...prev, searchQuery: question }));
              handleSubmit();
            }}
          />
        )}
      </div>
    </div>
  );

  const renderOCRForm = () => (
    <div className="space-y-6 p-4 animate-in">
      <div className="flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => handleNavigate('initial')}
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
            onChange={handleFileChange}
            className="cursor-pointer"
          />
          <p className="text-sm text-muted-foreground">
            Upload images or PDF files
          </p>
        </div>

        <Button 
          className="w-full"
          onClick={handleSubmit}
          disabled={!formData.file}
        >
          <Upload className="w-4 h-4 mr-2" />
          Process Document
        </Button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-white">
      <div className="max-w-3xl mx-auto pt-8 pb-16">
        <Card className="glass-card overflow-hidden min-h-[600px]">
          <div className="p-6 border-b">
            <h1 className="text-2xl font-semibold text-center">AI Assistant</h1>
          </div>

          <ScrollArea className="h-[calc(100vh-16rem)]">
            {currentStep === 'initial' && renderInitialView()}
            {currentStep === 'summary' && renderSummaryForm()}
            {currentStep === 'search' && renderSearchForm()}
            {currentStep === 'miniplex' && renderMiniPlexForm()}
            {currentStep === 'ocr' && renderOCRForm()}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
