import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Trash2, Plus } from 'lucide-react';

interface QRRule {
  id?: string;
  conditionType: 'time' | 'day' | 'device';
  conditionValue: any;
  redirectUrl: string;
  priority: number;
}

interface RuleBuilderProps {
  rules: QRRule[];
  onRulesChange: (rules: QRRule[]) => void;
}

export const RuleBuilder = ({ rules, onRulesChange }: RuleBuilderProps) => {
  const addRule = () => {
    const newRule: QRRule = {
      conditionType: 'time',
      conditionValue: { startHour: 9, endHour: 17 },
      redirectUrl: '',
      priority: rules.length + 1,
    };
    onRulesChange([...rules, newRule]);
  };

  const updateRule = (index: number, field: keyof QRRule, value: any) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], [field]: value };
    onRulesChange(updatedRules);
  };

  const updateConditionValue = (index: number, conditionValue: any) => {
    const updatedRules = [...rules];
    updatedRules[index] = { ...updatedRules[index], conditionValue };
    onRulesChange(updatedRules);
  };

  const removeRule = (index: number) => {
    const updatedRules = rules.filter((_, i) => i !== index);
    onRulesChange(updatedRules);
  };

  const renderConditionInputs = (rule: QRRule, index: number) => {
    switch (rule.conditionType) {
      case 'time':
        return (
          <div className="grid grid-cols-2 gap-2">
            <div>
              <Label className="text-xs">Start Hour (0-23)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={rule.conditionValue.startHour || 0}
                onChange={(e) => updateConditionValue(index, {
                  ...rule.conditionValue,
                  startHour: parseInt(e.target.value)
                })}
              />
            </div>
            <div>
              <Label className="text-xs">End Hour (0-23)</Label>
              <Input
                type="number"
                min="0"
                max="23"
                value={rule.conditionValue.endHour || 23}
                onChange={(e) => updateConditionValue(index, {
                  ...rule.conditionValue,
                  endHour: parseInt(e.target.value)
                })}
              />
            </div>
          </div>
        );
      
      case 'day':
        return (
          <div>
            <Label className="text-xs">Days of Week</Label>
            <div className="flex flex-wrap gap-2 mt-1">
              {['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, dayIndex) => (
                <label key={day} className="flex items-center space-x-1 text-sm">
                  <input
                    type="checkbox"
                    checked={rule.conditionValue.days?.includes(dayIndex) || false}
                    onChange={(e) => {
                      const days = rule.conditionValue.days || [];
                      const newDays = e.target.checked
                        ? [...days, dayIndex]
                        : days.filter((d: number) => d !== dayIndex);
                      updateConditionValue(index, { days: newDays });
                    }}
                  />
                  <span>{day.substring(0, 3)}</span>
                </label>
              ))}
            </div>
          </div>
        );
      
      case 'device':
        return (
          <div>
            <Label className="text-xs">Device Type</Label>
            <Select
              value={rule.conditionValue.device || 'mobile'}
              onValueChange={(value) => updateConditionValue(index, { device: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile">Mobile</SelectItem>
                <SelectItem value="desktop">Desktop</SelectItem>
                <SelectItem value="tablet">Tablet</SelectItem>
              </SelectContent>
            </Select>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Conditional Rules</Label>
        <Button type="button" onClick={addRule} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Rule
        </Button>
      </div>
      
      {rules.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-sm">No rules configured</p>
          <p className="text-gray-400 text-xs mt-1">Add a rule to make this QR code context-aware</p>
        </div>
      ) : (
        rules.map((rule, index) => (
          <Card key={index} className="border">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm">Rule #{index + 1}</CardTitle>
                <Button
                  type="button"
                  onClick={() => removeRule(index)}
                  size="sm"
                  variant="ghost"
                  className="text-red-600 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <Label className="text-xs">Condition Type</Label>
                <Select
                  value={rule.conditionType}
                  onValueChange={(value: 'time' | 'day' | 'device') => {
                    updateRule(index, 'conditionType', value);
                    // Reset condition value when type changes
                    if (value === 'time') {
                      updateConditionValue(index, { startHour: 9, endHour: 17 });
                    } else if (value === 'day') {
                      updateConditionValue(index, { days: [] });
                    } else if (value === 'device') {
                      updateConditionValue(index, { device: 'mobile' });
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="time">Time-based</SelectItem>
                    <SelectItem value="day">Day of Week</SelectItem>
                    <SelectItem value="device">Device Type</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {renderConditionInputs(rule, index)}
              
              <div>
                <Label className="text-xs">Redirect URL</Label>
                <Input
                  placeholder="https://example.com/mobile"
                  value={rule.redirectUrl}
                  onChange={(e) => updateRule(index, 'redirectUrl', e.target.value)}
                />
              </div>
              
              <div>
                <Label className="text-xs">Priority (higher = checked first)</Label>
                <Input
                  type="number"
                  min="1"
                  value={rule.priority}
                  onChange={(e) => updateRule(index, 'priority', parseInt(e.target.value) || 1)}
                />
              </div>
            </CardContent>
          </Card>
        ))
      )}
    </div>
  );
};
