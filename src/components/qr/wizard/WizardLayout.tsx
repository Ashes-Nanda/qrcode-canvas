import React, { useState, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, ArrowRight, QrCode } from 'lucide-react';
import { QrTypeSelector } from './QrTypeSelector';
import { QrTypeForm } from './QrTypeForm';
import { QrStyler } from './QrStyler';
import { QrPreview } from './QrPreview';

export interface WizardState {
  qrType: string;
  formData: Record<string, any>;
  style: {
    fgColor: string;
    bgColor: string;
    logo?: File;
    logoDataUrl?: string;
    logoSize: number;
  };
}

const initialState: WizardState = {
  qrType: '',
  formData: {},
  style: {
    fgColor: '#000000',
    bgColor: '#FFFFFF',
    logoSize: 15,
  },
};

const steps = [
  { id: 1, title: 'Choose Type', description: 'Select QR code type' },
  { id: 2, title: 'Fill Details', description: 'Enter your content' },
  { id: 3, title: 'Style & Brand', description: 'Customize appearance' },
  { id: 4, title: 'Preview & Download', description: 'Generate and save' },
];

export const WizardLayout: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(1);
  const [wizardState, setWizardState] = useState<WizardState>(initialState);
  const [isStepValid, setIsStepValid] = useState<Record<number, boolean>>({
    1: false,
    2: false,
    3: true, // Styling is optional
    4: true,
  });

  const updateWizardState = useCallback((updates: Partial<WizardState>) => {
    setWizardState(prev => ({ ...prev, ...updates }));
  }, []);

  const updateStepValidity = useCallback((step: number, isValid: boolean) => {
    setIsStepValid(prev => ({ ...prev, [step]: isValid }));
  }, []);

  const canGoNext = () => {
    return isStepValid[currentStep] && currentStep < 4;
  };

  const canGoPrev = () => {
    return currentStep > 1;
  };

  const handleNext = () => {
    if (canGoNext()) {
      setCurrentStep(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (canGoPrev()) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const goToStep = (step: number) => {
    // Only allow going to completed steps or the next immediate step
    if (step <= currentStep || (step === currentStep + 1 && isStepValid[currentStep])) {
      setCurrentStep(step);
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <QrTypeSelector
            selectedType={wizardState.qrType}
            onTypeSelect={(type) => {
              updateWizardState({ qrType: type, formData: {} });
              updateStepValidity(1, !!type);
            }}
          />
        );
      case 2:
        return (
          <QrTypeForm
            qrType={wizardState.qrType}
            formData={wizardState.formData}
            onFormChange={(data) => updateWizardState({ formData: data })}
            onValidationChange={(isValid) => updateStepValidity(2, isValid)}
          />
        );
      case 3:
        return (
          <QrStyler
            style={wizardState.style}
            onStyleChange={(style) => updateWizardState({ style })}
          />
        );
      case 4:
        return (
          <QrPreview
            qrType={wizardState.qrType}
            formData={wizardState.formData}
            style={wizardState.style}
          />
        );
      default:
        return null;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-foreground mb-2 flex items-center gap-3">
          <QrCode className="h-8 w-8 text-primary" />
          Create QR Code
        </h1>
        <p className="text-gray-600">Follow the steps to create your custom QR code</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-xl p-4 shadow-sm border space-y-4">
        <div className="flex items-center justify-between">
          {steps.map((step, index) => (
            <div key={step.id} className="flex items-center">
              <button
                onClick={() => goToStep(step.id)}
                className={`flex items-center gap-3 px-4 py-2 rounded-lg transition-all duration-200 ${
                  currentStep === step.id
                    ? 'bg-primary text-white shadow-md'
                    : currentStep > step.id
                    ? 'bg-green-100 text-green-800 hover:bg-green-200 cursor-pointer'
                    : isStepValid[step.id] || step.id === 3
                    ? 'text-gray-600 hover:bg-gray-50 cursor-pointer'
                    : 'text-gray-400 cursor-not-allowed'
                }`}
                disabled={step.id > currentStep + 1 && !isStepValid[currentStep]}
              >
                <Badge
                  variant={currentStep === step.id ? 'default' : currentStep > step.id ? 'secondary' : 'outline'}
                  className={`w-8 h-8 rounded-full flex items-center justify-center ${
                    currentStep === step.id ? 'bg-white text-primary' : ''
                  }`}
                >
                  {currentStep > step.id ? '✓' : step.id}
                </Badge>
                <div className="text-left hidden sm:block">
                  <div className="font-medium text-sm">{step.title}</div>
                  <div className="text-xs opacity-75">{step.description}</div>
                </div>
              </button>
              {index < steps.length - 1 && (
                <div className="w-8 h-px bg-gray-200 mx-2 hidden sm:block" />
              )}
            </div>
          ))}
        </div>
        
        {/* Navigation Buttons - Top Position */}
        <div className="flex justify-between items-center pt-4 border-t">
          <Button
            variant="outline"
            onClick={handlePrev}
            disabled={!canGoPrev()}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Previous
          </Button>

          <div className="text-sm text-gray-500">
            Step {currentStep} of {steps.length}
          </div>

          <Button
            onClick={handleNext}
            disabled={!canGoNext()}
            className="flex items-center gap-2"
          >
            Next
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card className="rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300">
            <CardHeader className="pb-6">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Badge variant="outline" className="text-primary border-primary">
                  Step {currentStep}
                </Badge>
                {steps[currentStep - 1]?.title}
              </CardTitle>
              <p className="text-gray-600">{steps[currentStep - 1]?.description}</p>
            </CardHeader>
            <CardContent className="space-y-6">
              {renderStepContent()}
            </CardContent>
          </Card>
        </div>

        {/* Preview Sidebar (Shows from Step 2 onwards) */}
        {currentStep >= 2 && wizardState.qrType && (
          <div className="lg:col-span-1">
            <Card className="rounded-2xl shadow-lg sticky top-4">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg">Live Preview</CardTitle>
              </CardHeader>
              <CardContent>
                <QrPreview
                  qrType={wizardState.qrType}
                  formData={wizardState.formData}
                  style={wizardState.style}
                  previewMode={true}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>

    </div>
  );
};
