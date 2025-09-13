import React, { useState, useEffect, useCallback } from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Plus, Trash2, MapPin, Upload, CheckCircle, AlertCircle } from 'lucide-react';

interface FormField {
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'url' | 'textarea' | 'select' | 'file' | 'number' | 'date' | 'datetime-local';
  required?: boolean;
  placeholder?: string;
  options?: { value: string; label: string }[];
  accept?: string; // for file inputs
  validation?: {
    pattern?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
  };
  description?: string;
  multiple?: boolean; // for fields that can have multiple values
}

const qrFormSchemas: Record<string, FormField[]> = {
  url: [
    {
      name: 'url',
      label: 'Website URL',
      type: 'url',
      required: true,
      placeholder: 'https://example.com',
      validation: {
        pattern: '^https?:\\/\\/.+',
      },
      description: 'Enter the complete URL including http:// or https://',
    },
  ],
  text: [
    {
      name: 'text',
      label: 'Text Content',
      type: 'textarea',
      required: true,
      placeholder: 'Enter your text content here...',
      validation: {
        maxLength: 1000,
      },
      description: 'Plain text that will be encoded in the QR code',
    },
  ],
  contact: [
    {
      name: 'firstName',
      label: 'First Name',
      type: 'text',
      required: true,
      placeholder: 'John',
    },
    {
      name: 'lastName',
      label: 'Last Name',
      type: 'text',
      required: true,
      placeholder: 'Doe',
    },
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: '+1 (555) 123-4567',
    },
    {
      name: 'email',
      label: 'Email Address',
      type: 'email',
      required: true,
      placeholder: 'john.doe@example.com',
    },
    {
      name: 'company',
      label: 'Company',
      type: 'text',
      placeholder: 'Acme Corporation',
    },
    {
      name: 'jobTitle',
      label: 'Job Title',
      type: 'text',
      placeholder: 'Software Engineer',
    },
    {
      name: 'website',
      label: 'Website',
      type: 'url',
      placeholder: 'https://example.com',
    },
    {
      name: 'address',
      label: 'Address',
      type: 'textarea',
      placeholder: '123 Main St, City, State 12345',
    },
  ],
  sms: [
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: '+1 (555) 123-4567',
      description: 'Include country code for international numbers',
    },
    {
      name: 'message',
      label: 'Message',
      type: 'textarea',
      required: true,
      placeholder: 'Your SMS message here...',
      validation: {
        maxLength: 160,
      },
      description: 'SMS message content (max 160 characters)',
    },
  ],
  email: [
    {
      name: 'email',
      label: 'Recipient Email',
      type: 'email',
      required: true,
      placeholder: 'recipient@example.com',
    },
    {
      name: 'subject',
      label: 'Subject',
      type: 'text',
      required: true,
      placeholder: 'Email subject',
    },
    {
      name: 'body',
      label: 'Message Body',
      type: 'textarea',
      placeholder: 'Your email message...',
      validation: {
        maxLength: 1000,
      },
    },
  ],
  phone: [
    {
      name: 'phone',
      label: 'Phone Number',
      type: 'tel',
      required: true,
      placeholder: '+1 (555) 123-4567',
      description: 'Include country code for international numbers',
    },
  ],
  location: [
    {
      name: 'latitude',
      label: 'Latitude',
      type: 'number',
      required: true,
      placeholder: '40.7128',
      validation: {
        min: -90,
        max: 90,
      },
    },
    {
      name: 'longitude',
      label: 'Longitude',
      type: 'number',
      required: true,
      placeholder: '-74.0060',
      validation: {
        min: -180,
        max: 180,
      },
    },
    {
      name: 'placeName',
      label: 'Place Name',
      type: 'text',
      placeholder: 'Times Square, New York',
    },
  ],
  app: [
    {
      name: 'iosUrl',
      label: 'iOS App Store URL',
      type: 'url',
      placeholder: 'https://apps.apple.com/app/...',
    },
    {
      name: 'androidUrl',
      label: 'Android Play Store URL',
      type: 'url',
      placeholder: 'https://play.google.com/store/apps/...',
    },
  ],
  socials: [
    {
      name: 'platform',
      label: 'Social Platform',
      type: 'select',
      required: true,
      options: [
        { value: 'instagram', label: 'Instagram' },
        { value: 'facebook', label: 'Facebook' },
        { value: 'linkedin', label: 'LinkedIn' },
        { value: 'twitter', label: 'Twitter/X' },
        { value: 'tiktok', label: 'TikTok' },
        { value: 'youtube', label: 'YouTube' },
        { value: 'snapchat', label: 'Snapchat' },
      ],
    },
    {
      name: 'username',
      label: 'Username/Handle',
      type: 'text',
      required: true,
      placeholder: '@username',
    },
    {
      name: 'profileUrl',
      label: 'Profile URL (Optional)',
      type: 'url',
      placeholder: 'https://instagram.com/username',
    },
  ],
  pdf: [
    {
      name: 'file',
      label: 'PDF File',
      type: 'file',
      required: true,
      accept: '.pdf',
      description: 'Upload a PDF file (max 10MB)',
    },
  ],
  file: [
    {
      name: 'file',
      label: 'File',
      type: 'file',
      required: true,
      accept: '.doc,.docx,.xls,.xlsx,.zip,.png,.jpg,.jpeg,.gif,.pdf',
      description: 'Supported: DOC, XLS, ZIP, Images, PDF (Max: 25MB)',
    },
  ],
  event: [
    {
      name: 'title',
      label: 'Event Title',
      type: 'text',
      required: true,
      placeholder: 'Meeting with Client',
    },
    {
      name: 'description',
      label: 'Description',
      type: 'textarea',
      placeholder: 'Event description...',
    },
    {
      name: 'location',
      label: 'Location',
      type: 'text',
      placeholder: 'Conference Room A',
    },
    {
      name: 'startDate',
      label: 'Start Date & Time',
      type: 'datetime-local',
      required: true,
    },
    {
      name: 'endDate',
      label: 'End Date & Time',
      type: 'datetime-local',
    },
  ],
};

interface QrTypeFormProps {
  qrType: string;
  formData: Record<string, any>;
  onFormChange: (data: Record<string, any>) => void;
  onValidationChange: (isValid: boolean) => void;
}

export const QrTypeForm: React.FC<QrTypeFormProps> = ({
  qrType,
  formData,
  onFormChange,
  onValidationChange,
}) => {
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const schema = qrFormSchemas[qrType] || [];

  const validateField = useCallback((field: FormField, value: any): string => {
    if (field.required && (!value || (typeof value === 'string' && !value.trim()))) {
      return `${field.label} is required`;
    }

    if (value && field.validation) {
      const val = typeof value === 'string' ? value.trim() : value;
      
      if (field.validation.pattern && typeof val === 'string') {
        const regex = new RegExp(field.validation.pattern);
        if (!regex.test(val)) {
          return `${field.label} format is invalid`;
        }
      }

      if (field.validation.minLength && typeof val === 'string' && val.length < field.validation.minLength) {
        return `${field.label} must be at least ${field.validation.minLength} characters`;
      }

      if (field.validation.maxLength && typeof val === 'string' && val.length > field.validation.maxLength) {
        return `${field.label} must be no more than ${field.validation.maxLength} characters`;
      }

      if (field.validation.min && typeof val === 'number' && val < field.validation.min) {
        return `${field.label} must be at least ${field.validation.min}`;
      }

      if (field.validation.max && typeof val === 'number' && val > field.validation.max) {
        return `${field.label} must be no more than ${field.validation.max}`;
      }
    }

    return '';
  }, []);

  const validateForm = useCallback(() => {
    const newErrors: Record<string, string> = {};
    let isValid = true;

    schema.forEach(field => {
      const error = validateField(field, formData[field.name]);
      if (error) {
        newErrors[field.name] = error;
        isValid = false;
      }
    });

    setErrors(newErrors);
    onValidationChange(isValid);
  }, [schema, formData, validateField, onValidationChange]);

  useEffect(() => {
    validateForm();
  }, [validateForm]);

  const handleFieldChange = (fieldName: string, value: any) => {
    const newFormData = { ...formData, [fieldName]: value };
    onFormChange(newFormData);
  };

  const handleFieldBlur = (fieldName: string) => {
    setTouched(prev => ({ ...prev, [fieldName]: true }));
  };

  const getCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          handleFieldChange('latitude', position.coords.latitude);
          handleFieldChange('longitude', position.coords.longitude);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const renderField = (field: FormField) => {
    const value = formData[field.name] || '';
    const hasError = errors[field.name] && touched[field.name];

    return (
      <div key={field.name} className="space-y-2">
        <div className="flex items-center justify-between">
          <Label htmlFor={field.name} className="text-sm font-medium flex items-center gap-1">
            {field.label}
            {field.required && <span className="text-red-500">*</span>}
          </Label>
          {field.name === 'latitude' && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={getCurrentLocation}
              className="text-xs"
            >
              <MapPin className="h-3 w-3 mr-1" />
              Use Current
            </Button>
          )}
        </div>

        {field.type === 'textarea' ? (
          <Textarea
            id={field.name}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            onBlur={() => handleFieldBlur(field.name)}
            className={`rounded-lg ${hasError ? 'border-red-500' : ''}`}
            rows={3}
          />
        ) : field.type === 'select' ? (
          <Select value={value} onValueChange={(val) => handleFieldChange(field.name, val)}>
            <SelectTrigger className={`rounded-lg ${hasError ? 'border-red-500' : ''}`}>
              <SelectValue placeholder={field.placeholder || `Select ${field.label.toLowerCase()}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map(option => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ) : field.type === 'file' ? (
          <div className="space-y-2">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-gray-400 transition-colors">
              <Upload className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <label className="cursor-pointer">
                <span className="text-sm text-gray-600">
                  Click to upload or drag and drop
                </span>
                <input
                  type="file"
                  accept={field.accept}
                  onChange={(e) => handleFieldChange(field.name, e.target.files?.[0] || null)}
                  onBlur={() => handleFieldBlur(field.name)}
                  className="hidden"
                />
              </label>
            </div>
            {value && (
              <div className="flex items-center gap-2 text-sm text-green-600">
                <CheckCircle className="h-4 w-4" />
                {value.name}
              </div>
            )}
          </div>
        ) : (
          <Input
            id={field.name}
            type={field.type}
            placeholder={field.placeholder}
            value={value}
            onChange={(e) => handleFieldChange(field.name, field.type === 'number' ? parseFloat(e.target.value) || '' : e.target.value)}
            onBlur={() => handleFieldBlur(field.name)}
            className={`rounded-lg ${hasError ? 'border-red-500' : ''}`}
            step={field.type === 'number' ? 'any' : undefined}
          />
        )}

        {field.description && (
          <p className="text-xs text-gray-500">{field.description}</p>
        )}

        {hasError && (
          <div className="flex items-center gap-1 text-red-600 text-sm">
            <AlertCircle className="h-3 w-3" />
            {errors[field.name]}
          </div>
        )}

        {field.validation?.maxLength && typeof value === 'string' && (
          <div className="text-right">
            <span className={`text-xs ${value.length > field.validation.maxLength ? 'text-red-500' : 'text-gray-500'}`}>
              {value.length}/{field.validation.maxLength}
            </span>
          </div>
        )}
      </div>
    );
  };

  if (!schema.length) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500">Please select a QR code type first.</p>
      </div>
    );
  }

  // Group fields for better layout
  const requiredFields = schema.filter(field => field.required);
  const optionalFields = schema.filter(field => !field.required);

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Fill in the details for your {qrType.toUpperCase()} QR code
        </h3>
        <p className="text-gray-600 text-sm">
          Required fields are marked with an asterisk (*)
        </p>
      </div>

      {/* Required Fields */}
      {requiredFields.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="destructive" className="text-xs">Required</Badge>
              Essential Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {requiredFields.map(renderField)}
          </CardContent>
        </Card>
      )}

      {/* Optional Fields */}
      {optionalFields.length > 0 && (
        <Card>
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Badge variant="outline" className="text-xs">Optional</Badge>
              Additional Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {optionalFields.map(renderField)}
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      <div className="mt-6">
        {Object.keys(errors).length === 0 ? (
          <div className="flex items-center gap-2 text-green-600 text-sm">
            <CheckCircle className="h-4 w-4" />
            All required fields are completed and valid
          </div>
        ) : (
          <div className="flex items-center gap-2 text-amber-600 text-sm">
            <AlertCircle className="h-4 w-4" />
            Please complete all required fields to continue
          </div>
        )}
      </div>
    </div>
  );
};
