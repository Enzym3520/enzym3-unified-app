import React from 'react';
import { format } from 'date-fns';
import { 
  Clock, Mail, Phone, Calendar, AlertCircle, CheckCircle2, 
  X, MoreHorizontal, Edit, Trash2, Send, MessageSquare 
} from 'lucide-react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator,
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { Reminder } from '@/types/reminder';

interface ReminderCardProps {
  reminder: Reminder;
  onEdit: (reminder: Reminder) => void;
  onDelete: (reminder: Reminder) => void;
  onMarkAsSent: (reminder: Reminder) => void;
  onMarkAsCompleted: (reminder: Reminder) => void;
  onGenerateMessage: (reminder: Reminder) => void;
  onSendNow?: (reminder: Reminder) => void;
}

const ReminderCard = ({ 
  reminder, 
  onEdit, 
  onDelete, 
  onMarkAsSent, 
  onMarkAsCompleted,
  onGenerateMessage,
  onSendNow
}: ReminderCardProps) => {
  const statusConfig = {
    pending: {
      colors: 'bg-status-pending-bg text-status-pending border-status-pending/20',
      bgClass: 'bg-status-pending/10',
      textClass: 'text-status-pending'
    },
    sent: {
      colors: 'bg-status-sent-bg text-status-sent border-status-sent/20',
      bgClass: 'bg-status-sent/10',
      textClass: 'text-status-sent'
    },
    completed: {
      colors: 'bg-status-completed-bg text-status-completed border-status-completed/20',
      bgClass: 'bg-status-completed/10',
      textClass: 'text-status-completed'
    },
    cancelled: {
      colors: 'bg-muted text-muted-foreground border-border',
      bgClass: 'bg-muted/50',
      textClass: 'text-muted-foreground'
    }
  };

  const priorityConfig = {
    low: {
      colors: 'bg-priority-low-bg text-priority-low',
      textClass: 'text-priority-low'
    },
    medium: {
      colors: 'bg-priority-medium-bg text-priority-medium',
      textClass: 'text-priority-medium'
    },
    high: {
      colors: 'bg-priority-high-bg text-priority-high',
      textClass: 'text-priority-high'
    }
  };

  const typeLabels = {
    pre_wedding: 'Pre-Wedding',
    post_wedding: 'Post-Wedding',
    anniversary: 'Anniversary',
    business_development: 'Business Dev',
    custom: 'Custom'
  };

  const getStatusIcon = () => {
    const iconProps = "w-4 h-4 md:w-5 md:h-5";
    switch (reminder.status) {
      case 'pending':
        return <Clock className={iconProps} />;
      case 'sent':
        return <Send className={iconProps} />;
      case 'completed':
        return <CheckCircle2 className={iconProps} />;
      case 'cancelled':
        return <X className={iconProps} />;
      default:
        return <AlertCircle className={iconProps} />;
    }
  };

  const isOverdue = reminder.status === 'pending' && new Date(reminder.scheduled_date) < new Date();
  const currentStatusConfig = statusConfig[reminder.status];
  const currentPriorityConfig = priorityConfig[reminder.priority];

  return (
    <Card className={`hover-lift transition-all duration-300 bg-gradient-to-br from-card to-card/95 ${
      isOverdue 
        ? 'border-status-overdue/30 bg-gradient-to-br from-status-overdue-bg/20 to-status-overdue-bg/10 shadow-lg shadow-status-overdue/20' 
        : 'border-border/60 shadow-card'
    }`}>
      <CardHeader className="pb-3 md:pb-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shrink-0 ${
              isOverdue 
                ? 'bg-status-overdue-bg text-status-overdue border border-status-overdue/20' 
                : `${currentStatusConfig.bgClass} ${currentStatusConfig.textClass} border border-current/20`
            }`}>
              {getStatusIcon()}
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm md:text-base text-foreground truncate">
                {reminder.contact_name}
              </h3>
              <p className="text-xs md:text-sm text-muted-foreground/80 truncate">
                {typeLabels[reminder.reminder_type]}
              </p>
            </div>
          </div>
          <div className="flex items-start gap-2 shrink-0">
            <Badge 
              variant="outline" 
              className={`text-xs border-0 ${currentStatusConfig.colors} font-medium`}
            >
              {reminder.status.charAt(0).toUpperCase() + reminder.status.slice(1)}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="h-8 w-8 p-0 hover:bg-accent/50 transition-colors"
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem onClick={() => onEdit(reminder)} className="gap-2">
                  <Edit className="h-4 w-4" />
                  Edit Reminder
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onGenerateMessage(reminder)} className="gap-2">
                  <MessageSquare className="h-4 w-4" />
                  Generate Message
                </DropdownMenuItem>
                {reminder.status === 'pending' && onSendNow && (
                  <DropdownMenuItem onClick={() => onSendNow(reminder)} className="gap-2">
                    <Mail className="h-4 w-4" />
                    Send Now
                  </DropdownMenuItem>
                )}
                {reminder.status === 'pending' && (
                  <DropdownMenuItem onClick={() => onMarkAsSent(reminder)} className="gap-2">
                    <Send className="h-4 w-4" />
                    Mark as Sent
                  </DropdownMenuItem>
                )}
                {reminder.status === 'sent' && (
                  <DropdownMenuItem onClick={() => onMarkAsCompleted(reminder)} className="gap-2">
                    <CheckCircle2 className="h-4 w-4" />
                    Mark as Completed
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={() => onDelete(reminder)}
                  className="text-destructive gap-2 focus:text-destructive"
                >
                  <Trash2 className="h-4 w-4" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-3 md:space-y-4">
        <div className="space-y-2.5 md:space-y-3">
          <div className="flex items-center gap-2.5 text-xs md:text-sm">
            <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/70 shrink-0" />
            <span className="truncate text-foreground/80">{reminder.contact_email}</span>
          </div>
          
          <div className="flex items-center gap-2.5 text-xs md:text-sm">
            <Calendar className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/70 shrink-0" />
            <span className={isOverdue ? 'text-status-overdue font-medium' : 'text-foreground/80'}>
              {format(new Date(reminder.scheduled_date), 'MMM dd, yyyy')}
              {isOverdue && ' (Overdue)'}
            </span>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs md:text-sm">
            <div className="flex items-center gap-2">
              {reminder.channel === 'email' && <Mail className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/70" />}
              {reminder.channel === 'phone' && <Phone className="w-3.5 h-3.5 md:w-4 md:h-4 text-muted-foreground/70" />}
              {reminder.channel === 'both' && (
                <>
                  <Mail className="w-3.5 h-3.5 text-muted-foreground/70" />
                  <Phone className="w-3.5 h-3.5 text-muted-foreground/70" />
                </>
              )}
              <span className="capitalize text-foreground/80">{reminder.channel}</span>
            </div>
            <Badge 
              variant="secondary" 
              className={`text-xs border-0 ${currentPriorityConfig.colors} font-medium`}
            >
              {reminder.priority}
            </Badge>
          </div>
        </div>

        {reminder.notes && (
          <div className="bg-surface-overlay/50 rounded-lg p-3 text-xs md:text-sm border border-border/30">
            <p className="text-muted-foreground/90 leading-relaxed">{reminder.notes}</p>
          </div>
        )}

        {(reminder.sent_at || reminder.completed_at) && (
          <div className="text-xs text-muted-foreground/70 pt-2 md:pt-3 border-t border-border/30 space-y-1">
            {reminder.sent_at && (
              <div className="flex items-center gap-1">
                <Send className="w-3 h-3" />
                Sent: {format(new Date(reminder.sent_at), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
            {reminder.completed_at && (
              <div className="flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" />
                Completed: {format(new Date(reminder.completed_at), 'MMM dd, yyyy HH:mm')}
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReminderCard;