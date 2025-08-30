import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Trash2, Eye, EyeOff, Download } from 'lucide-react';

interface BulkActionsProps {
  qrCodes: any[];
  selectedIds: string[];
  onSelectionChange: (ids: string[]) => void;
  onUpdate: () => void;
}

export const BulkActions = ({ qrCodes, selectedIds, onSelectionChange, onUpdate }: BulkActionsProps) => {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      onSelectionChange(qrCodes.map(qr => qr.id));
    } else {
      onSelectionChange([]);
    }
  };

  const handleSelectOne = (id: string, checked: boolean) => {
    if (checked) {
      onSelectionChange([...selectedIds, id]);
    } else {
      onSelectionChange(selectedIds.filter(selectedId => selectedId !== id));
    }
  };

  const bulkDelete = async () => {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('qr_codes')
        .delete()
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: "Deleted",
        description: `${selectedIds.length} QR codes have been deleted.`,
      });

      onSelectionChange([]);
      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const bulkToggleActive = async (activate: boolean) => {
    if (selectedIds.length === 0) return;
    
    setLoading(true);
    try {
      const { error } = await supabase
        .from('qr_codes')
        .update({ is_active: activate })
        .in('id', selectedIds);

      if (error) throw error;

      toast({
        title: activate ? "Activated" : "Deactivated",
        description: `${selectedIds.length} QR codes have been ${activate ? 'activated' : 'deactivated'}.`,
      });

      onUpdate();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (qrCodes.length === 0) return null;

  const allSelected = selectedIds.length === qrCodes.length;
  const someSelected = selectedIds.length > 0;

  return (
    <div className="space-y-4">
      {/* Selection Header */}
      <div className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={allSelected}
            onCheckedChange={handleSelectAll}
          />
          <span className="text-sm font-medium text-gray-900">
            {someSelected ? `${selectedIds.length} selected` : 'Select all'}
          </span>
        </div>

        {someSelected && (
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleActive(true)}
              disabled={loading}
              className="rounded-xl border-gray-200 bg-white hover:bg-gray-50"
            >
              <Eye className="h-4 w-4 mr-1" />
              Activate
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => bulkToggleActive(false)}
              disabled={loading}
              className="rounded-xl border-gray-200 bg-white hover:bg-gray-50"
            >
              <EyeOff className="h-4 w-4 mr-1" />
              Deactivate
            </Button>
            
            <Button
              variant="destructive"
              size="sm"
              onClick={bulkDelete}
              disabled={loading}
              className="rounded-xl bg-red-600 hover:bg-red-700 text-white"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          </div>
        )}
      </div>

      {/* Individual Checkboxes (to be integrated into QRList) */}
      <div className="hidden">
        {qrCodes.map((qr) => (
          <Checkbox
            key={qr.id}
            checked={selectedIds.includes(qr.id)}
            onCheckedChange={(checked) => handleSelectOne(qr.id, checked as boolean)}
          />
        ))}
      </div>
    </div>
  );
};