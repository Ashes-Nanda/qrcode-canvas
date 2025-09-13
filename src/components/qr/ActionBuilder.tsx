import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { Trash2, Plus, Phone, Globe, MessageSquare, MapPin, User } from 'lucide-react';

interface QRAction {
  id?: string;
  actionType: 'call' | 'website' | 'whatsapp' | 'directions' | 'vcard';
  actionData: any;
  displayOrder: number;
}

interface ActionBuilderProps {
  actions: QRAction[];
  onActionsChange: (actions: QRAction[]) => void;
}

const actionIcons = {
  call: Phone,
  website: Globe,
  whatsapp: MessageSquare,
  directions: MapPin,
  vcard: User,
};

const actionLabels = {
  call: 'Phone Call',
  website: 'Website',
  whatsapp: 'WhatsApp',
  directions: 'Directions',
  vcard: 'Save Contact',
};

export const ActionBuilder = ({ actions, onActionsChange }: ActionBuilderProps) => {
  const addAction = () => {
    const newAction: QRAction = {
      actionType: 'website',
      actionData: { url: '' },
      displayOrder: actions.length + 1,
    };
    onActionsChange([...actions, newAction]);
  };

  const updateAction = (index: number, field: keyof QRAction, value: any) => {
    const updatedActions = [...actions];
    updatedActions[index] = { ...updatedActions[index], [field]: value };
    onActionsChange(updatedActions);
  };

  const updateActionData = (index: number, actionData: any) => {
    const updatedActions = [...actions];
    updatedActions[index] = { ...updatedActions[index], actionData };
    onActionsChange(updatedActions);
  };

  const removeAction = (index: number) => {
    const updatedActions = actions.filter((_, i) => i !== index);
    // Reorder display orders
    updatedActions.forEach((action, i) => {
      action.displayOrder = i + 1;
    });
    onActionsChange(updatedActions);
  };

  const moveAction = (index: number, direction: 'up' | 'down') => {
    if (
      (direction === 'up' && index === 0) ||
      (direction === 'down' && index === actions.length - 1)
    ) {
      return;
    }

    const newActions = [...actions];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    [newActions[index], newActions[targetIndex]] = [newActions[targetIndex], newActions[index]];
    
    // Update display orders
    newActions.forEach((action, i) => {
      action.displayOrder = i + 1;
    });
    
    onActionsChange(newActions);
  };

  const renderActionInputs = (action: QRAction, index: number) => {
    switch (action.actionType) {
      case 'call':
        return (
          <div>
            <Label className="text-xs">Phone Number</Label>
            <Input
              placeholder="+1234567890"
              value={action.actionData.phone || ''}
              onChange={(e) => updateActionData(index, { phone: e.target.value })}
            />
          </div>
        );
      
      case 'website':
        return (
          <div>
            <Label className="text-xs">Website URL</Label>
            <Input
              placeholder="https://example.com"
              value={action.actionData.url || ''}
              onChange={(e) => updateActionData(index, { url: e.target.value })}
            />
          </div>
        );
      
      case 'whatsapp':
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Phone Number</Label>
              <Input
                placeholder="+1234567890"
                value={action.actionData.phone || ''}
                onChange={(e) => updateActionData(index, {
                  ...action.actionData,
                  phone: e.target.value
                })}
              />
            </div>
            <div>
              <Label className="text-xs">Pre-filled Message (optional)</Label>
              <Textarea
                placeholder="Hello! I found you via QR code."
                value={action.actionData.message || ''}
                onChange={(e) => updateActionData(index, {
                  ...action.actionData,
                  message: e.target.value
                })}
                rows={2}
              />
            </div>
          </div>
        );
      
      case 'directions':
        return (
          <div className="space-y-2">
            <div>
              <Label className="text-xs">Address or Place Name</Label>
              <Input
                placeholder="123 Main St, City, State"
                value={action.actionData.address || ''}
                onChange={(e) => updateActionData(index, {
                  ...action.actionData,
                  address: e.target.value
                })}
              />
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Latitude (optional)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="40.7128"
                  value={action.actionData.latitude || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    latitude: e.target.value
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Longitude (optional)</Label>
                <Input
                  type="number"
                  step="any"
                  placeholder="-74.0060"
                  value={action.actionData.longitude || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    longitude: e.target.value
                  })}
                />
              </div>
            </div>
          </div>
        );
      
      case 'vcard':
        return (
          <div className="space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">First Name</Label>
                <Input
                  placeholder="John"
                  value={action.actionData.firstName || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    firstName: e.target.value
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Last Name</Label>
                <Input
                  placeholder="Doe"
                  value={action.actionData.lastName || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    lastName: e.target.value
                  })}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Phone</Label>
                <Input
                  placeholder="+1234567890"
                  value={action.actionData.phone || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    phone: e.target.value
                  })}
                />
              </div>
              <div>
                <Label className="text-xs">Email</Label>
                <Input
                  placeholder="john@example.com"
                  value={action.actionData.email || ''}
                  onChange={(e) => updateActionData(index, {
                    ...action.actionData,
                    email: e.target.value
                  })}
                />
              </div>
            </div>
            <Input
              placeholder="Company (optional)"
              value={action.actionData.company || ''}
              onChange={(e) => updateActionData(index, {
                ...action.actionData,
                company: e.target.value
              })}
            />
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Action Menu</Label>
        <Button type="button" onClick={addAction} size="sm" variant="outline">
          <Plus className="h-4 w-4 mr-1" />
          Add Action
        </Button>
      </div>
      
      {actions.length === 0 ? (
        <div className="text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          <p className="text-gray-500 text-sm">No actions configured</p>
          <p className="text-gray-400 text-xs mt-1">Add actions to create a multi-action menu</p>
        </div>
      ) : (
        actions.map((action, index) => {
          const IconComponent = actionIcons[action.actionType];
          return (
            <Card key={index} className="border">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <IconComponent className="h-4 w-4 text-primary" />
                    <CardTitle className="text-sm">
                      {actionLabels[action.actionType]} #{index + 1}
                    </CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      type="button"
                      onClick={() => moveAction(index, 'up')}
                      size="sm"
                      variant="ghost"
                      disabled={index === 0}
                      className="h-8 w-8 p-0"
                    >
                      ↑
                    </Button>
                    <Button
                      type="button"
                      onClick={() => moveAction(index, 'down')}
                      size="sm"
                      variant="ghost"
                      disabled={index === actions.length - 1}
                      className="h-8 w-8 p-0"
                    >
                      ↓
                    </Button>
                    <Button
                      type="button"
                      onClick={() => removeAction(index)}
                      size="sm"
                      variant="ghost"
                      className="text-red-600 hover:text-red-700 h-8 w-8 p-0"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div>
                  <Label className="text-xs">Action Type</Label>
                  <Select
                    value={action.actionType}
                    onValueChange={(value: 'call' | 'website' | 'whatsapp' | 'directions' | 'vcard') => {
                      updateAction(index, 'actionType', value);
                      // Reset action data when type changes
                      const defaultData = {
                        call: { phone: '' },
                        website: { url: '' },
                        whatsapp: { phone: '', message: '' },
                        directions: { address: '', latitude: '', longitude: '' },
                        vcard: { firstName: '', lastName: '', phone: '', email: '', company: '' },
                      };
                      updateActionData(index, defaultData[value]);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="call">Phone Call</SelectItem>
                      <SelectItem value="website">Website</SelectItem>
                      <SelectItem value="whatsapp">WhatsApp</SelectItem>
                      <SelectItem value="directions">Get Directions</SelectItem>
                      <SelectItem value="vcard">Save Contact</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {renderActionInputs(action, index)}
              </CardContent>
            </Card>
          );
        })
      )}
    </div>
  );
};
