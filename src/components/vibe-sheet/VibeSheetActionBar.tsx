import { Button } from "@/components/ui/button";
import { Save, Send, Printer, Download, Mail, ChevronDown } from "lucide-react";
import { KeyboardShortcutBadge } from "@/components/KeyboardShortcutBadge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface VibeSheetActionBarProps {
  saving: boolean;
  submittedAt?: string | null;
  onPrint: (scope: 'full' | 'current') => void;
  onDownloadPDF: (scope: 'full' | 'current') => void;
  onEmailShare: () => void;
  onSave: (submit: boolean) => void;
}

export const VibeSheetActionBar = ({
  saving,
  submittedAt,
  onPrint,
  onDownloadPDF,
  onEmailShare,
  onSave,
}: VibeSheetActionBarProps) => {
  return (
    <div className="flex flex-wrap gap-2 sm:gap-4 sticky bottom-0 bg-background py-4 border-t no-print">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Printer className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Print</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover">
          <DropdownMenuItem onClick={() => onPrint('full')}>Full Vibe Sheet</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onPrint('current')}>Current Tab Only</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Download PDF</span>
            <ChevronDown className="h-4 w-4 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="bg-popover">
          <DropdownMenuItem onClick={() => onDownloadPDF('full')}>Full Vibe Sheet</DropdownMenuItem>
          <DropdownMenuItem onClick={() => onDownloadPDF('current')}>Current Tab Only</DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <Button variant="outline" size="sm" onClick={onEmailShare}>
        <Mail className="h-4 w-4 sm:mr-2" />
        <span className="hidden sm:inline">Email</span>
      </Button>
      <div className="flex-1 min-w-0" />
      <div className="flex gap-2 sm:gap-4 w-full sm:w-auto">
        <Button
          variant="outline"
          onClick={() => onSave(false)}
          disabled={saving}
          className="flex items-center gap-2 flex-1 sm:flex-initial"
          data-tour="save-draft"
        >
          <Save className="h-4 w-4" />
          <span className="hidden sm:inline">Save Draft</span>
          <span className="sm:hidden">Save</span>
          <KeyboardShortcutBadge keys={['Ctrl', 'S']} />
        </Button>
        <Button
          onClick={() => onSave(true)}
          disabled={saving}
          className="flex items-center gap-2 flex-1 sm:flex-initial"
          data-tour="submit-vibe"
        >
          <Send className="h-4 w-4" />
          <span className="hidden sm:inline">{submittedAt ? 'Update & Resubmit' : 'Submit Vibe Sheet'}</span>
          <span className="sm:hidden">Submit</span>
          <KeyboardShortcutBadge keys={['Ctrl', 'Enter']} />
        </Button>
      </div>
    </div>
  );
};
