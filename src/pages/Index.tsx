
import { Card } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { MainOptions } from '@/components/main/MainOptions';
import { SummaryForm } from '@/components/forms/SummaryForm';
import { SearchForm } from '@/components/forms/SearchForm';
import { MiniplexForm } from '@/components/forms/MiniplexForm';
import { OcrForm } from '@/components/forms/OcrForm';
import { ProcessingView } from '@/components/ProcessingView';
import { useDocumentProcessing } from '@/hooks/useDocumentProcessing';

export default function Index() {
  const {
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
  } = useDocumentProcessing();

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
                onRelatedQuestionClick={(question) => {
                  handleFormDataChange({ searchQuery: question });
                  handleSubmit();
                }}
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
                references={searchReferences}
                isSearching={isSearching}
              />
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  );
}
