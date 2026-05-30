import { ChatWindow } from "@/components/ChatWindow";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Tooltip, TooltipContent, TooltipTrigger, TooltipProvider,
} from "@/components/ui/tooltip";
import {
  MessageCircle, AlertCircle, PanelLeftClose, PanelLeft, ChevronLeft, Plus, Search,
} from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { useMessages, Contact } from "@/hooks/useMessages";

export default function Messages() {
  const {
    weddingId, userId, clientName, contacts, selectedContact, loading, error,
    panelOpen, setPanelOpen, searchQuery, setSearchQuery,
    newMsgOpen, setNewMsgOpen, mobileShowChat, isMobile,
    filteredContacts, totalUnread,
    getInitials, formatTimestamp, getRoleColor,
    handleNewMessage, handleSelectContact, handleBackToContacts,
  } = useMessages();

  const fullBleed = "-m-4 md:-m-6 lg:-m-8";
  const fullHeight = "h-[calc(100dvh-4rem)]";

  if (loading) {
    return (
      <div className={cn(fullBleed, fullHeight, "flex")}>
        <div className="w-80 border-r bg-card p-4 space-y-3">
          <Skeleton className="h-10 w-full rounded-xl" />
          <Skeleton className="h-10 w-full rounded-xl" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="flex items-center gap-3 p-2">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2"><Skeleton className="h-4 w-3/4" /><Skeleton className="h-3 w-1/2" /></div>
            </div>
          ))}
        </div>
        <div className="flex-1 p-4"><Skeleton className="h-full w-full rounded-xl" /></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={cn(fullBleed, fullHeight, "flex items-center justify-center p-8")}>
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" /><AlertTitle>Error</AlertTitle><AlertDescription>{error}</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (!weddingId || !userId) {
    return (
      <div className={cn(fullBleed, fullHeight, "flex items-center justify-center")}>
        <div className="flex flex-col items-center text-muted-foreground">
          <MessageCircle className="h-16 w-16 mb-4 opacity-30" /><p>Unable to load messages</p>
        </div>
      </div>
    );
  }

  const newMessageDialog = (
    <Dialog open={newMsgOpen} onOpenChange={setNewMsgOpen}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader><DialogTitle>New Message</DialogTitle></DialogHeader>
        <div className="space-y-1 mt-2">
          {contacts.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">No contacts available</p>
          ) : (
            contacts.map((contact) => (
              <button key={contact.id} onClick={() => handleNewMessage(contact)} className="w-full flex items-center gap-3 p-3 rounded-xl hover:bg-muted/50 transition-colors text-left">
                <Avatar className={cn("h-10 w-10 shrink-0 ring-2", getRoleColor(contact.role))}>
                  <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">{getInitials(contact.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <span className="font-medium text-sm block truncate">{contact.name}</span>
                  <Badge variant="outline" className="text-[10px] px-1.5 py-0 mt-0.5">{contact.roleLabel}</Badge>
                </div>
              </button>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );

  // ─── MOBILE ───
  if (isMobile) {
    return (
      <div className={cn(fullBleed, fullHeight, "flex flex-col overflow-hidden relative")}>
        {newMessageDialog}
        <div className={cn("absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-out z-10", mobileShowChat ? "-translate-x-full" : "translate-x-0")}>
          <div className="flex items-center justify-between px-4 py-3 border-b bg-card">
            <div className="flex items-center gap-2.5">
              <MessageCircle className="h-5 w-5 text-primary" />
              <h2 className="font-semibold text-base">Messages</h2>
              {totalUnread > 0 && <Badge variant="default" className="h-5 min-w-[20px] text-[10px]">{totalUnread}</Badge>}
            </div>
            <Button variant="outline" size="sm" onClick={() => setNewMsgOpen(true)} className="h-8 gap-1.5 rounded-lg"><Plus className="h-3.5 w-3.5" />New</Button>
          </div>
          <div className="px-3 py-2 border-b bg-card">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-9 h-9 text-sm rounded-lg bg-muted/50 border-0" />
            </div>
          </div>
          <ScrollArea className="flex-1">
            <ContactList contacts={filteredContacts} selectedContact={selectedContact} onSelect={handleSelectContact} getInitials={getInitials} formatTimestamp={formatTimestamp} getRoleColor={getRoleColor} />
          </ScrollArea>
        </div>
        <div className={cn("absolute inset-0 flex flex-col bg-background transition-transform duration-300 ease-out z-20", mobileShowChat ? "translate-x-0" : "translate-x-full")}>
          <div className="flex items-center gap-2 px-2 py-2.5 border-b bg-card">
            <Button variant="ghost" size="icon" className="h-9 w-9 shrink-0" onClick={handleBackToContacts}><ChevronLeft className="h-5 w-5" /></Button>
            {selectedContact && (
              <>
                <Avatar className={cn("h-8 w-8 ring-2", getRoleColor(selectedContact.role))}>
                  <AvatarFallback className="text-[10px] font-semibold bg-accent text-accent-foreground">{getInitials(selectedContact.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-sm truncate">{selectedContact.name}</p>
                  <p className="text-[11px] text-muted-foreground">{selectedContact.roleLabel}</p>
                </div>
              </>
            )}
          </div>
          <div className="flex-1 min-h-0">
            {selectedContact && weddingId && userId && (
              <ChatWindow weddingId={weddingId} currentUserId={userId} currentUserRole="client" currentUserName={clientName} recipientId={selectedContact.id} recipientName={selectedContact.name} hideHeader />
            )}
          </div>
        </div>
      </div>
    );
  }

  // ─── DESKTOP ───
  return (
    <TooltipProvider delayDuration={300}>
      <div className={cn(fullBleed, fullHeight, "flex")}>
        {newMessageDialog}
        <aside className={cn("border-r bg-card flex flex-col transition-all duration-300 ease-out shrink-0 overflow-hidden", panelOpen ? "w-80" : "w-16")}>
          <div className={cn("flex items-center border-b shrink-0", panelOpen ? "justify-between px-4 py-3" : "justify-center py-3")}>
            {panelOpen ? (
              <>
                <div className="flex items-center gap-2.5">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  <h2 className="font-semibold text-sm">Messages</h2>
                  {totalUnread > 0 && <Badge variant="default" className="h-5 min-w-[20px] text-[10px]">{totalUnread}</Badge>}
                </div>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="sm" onClick={() => setNewMsgOpen(true)} className="h-7 gap-1 text-xs px-2 rounded-lg"><Plus className="h-3 w-3" />New</Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setPanelOpen(false)}><PanelLeftClose className="h-4 w-4" /></Button>
                </div>
              </>
            ) : (
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setPanelOpen(true)}><PanelLeft className="h-4 w-4" /></Button>
            )}
          </div>
          {panelOpen && (
            <div className="px-3 py-2 border-b">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input placeholder="Search contacts..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-8 h-8 text-sm rounded-lg bg-muted/50 border-0" />
              </div>
            </div>
          )}
          <ScrollArea className="flex-1">
            {panelOpen ? (
              <ContactList contacts={filteredContacts} selectedContact={selectedContact} onSelect={handleSelectContact} getInitials={getInitials} formatTimestamp={formatTimestamp} getRoleColor={getRoleColor} />
            ) : (
              <div className="flex flex-col items-center gap-1 py-2">
                {contacts.map((contact) => {
                  const isActive = selectedContact?.id === contact.id;
                  return (
                    <Tooltip key={contact.id ?? "general"}>
                      <TooltipTrigger asChild>
                        <button onClick={() => handleSelectContact(contact)} className={cn("relative p-1.5 rounded-xl transition-colors", isActive ? "bg-primary/10" : "hover:bg-muted/50")}>
                          <Avatar className={cn("h-9 w-9 ring-2", getRoleColor(contact.role))}>
                            <AvatarFallback className="text-[10px] font-semibold bg-accent text-accent-foreground">{getInitials(contact.name)}</AvatarFallback>
                          </Avatar>
                          {contact.unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full bg-destructive text-destructive-foreground text-[9px] font-bold flex items-center justify-center px-1">{contact.unreadCount}</span>
                          )}
                        </button>
                      </TooltipTrigger>
                      <TooltipContent side="right" className="text-xs">{contact.name}<span className="text-muted-foreground ml-1">· {contact.roleLabel}</span></TooltipContent>
                    </Tooltip>
                  );
                })}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <button onClick={() => setNewMsgOpen(true)} className="p-1.5 rounded-xl hover:bg-muted/50 transition-colors mt-1">
                      <div className="h-9 w-9 rounded-full border-2 border-dashed border-muted-foreground/30 flex items-center justify-center"><Plus className="h-4 w-4 text-muted-foreground" /></div>
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="text-xs">New message</TooltipContent>
                </Tooltip>
              </div>
            )}
          </ScrollArea>
        </aside>
        <div className="flex-1 flex flex-col min-w-0">
          {selectedContact ? (
            <ChatWindow weddingId={weddingId} currentUserId={userId} currentUserRole="client" currentUserName={clientName} recipientId={selectedContact.id} recipientName={selectedContact.name} recipientRole={selectedContact.roleLabel} />
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-muted-foreground">
              <div className="w-20 h-20 rounded-full bg-muted/50 flex items-center justify-center mb-6"><MessageCircle className="h-10 w-10 opacity-40" /></div>
              <p className="text-lg font-medium text-foreground">Select a conversation</p>
              <p className="text-sm mt-1">Choose a contact to start messaging</p>
              <Button variant="outline" className="mt-5 gap-2 rounded-lg" onClick={() => setNewMsgOpen(true)}><Plus className="h-4 w-4" />New Message</Button>
            </div>
          )}
        </div>
      </div>
    </TooltipProvider>
  );
}

// ─── Contact List ───
function ContactList({ contacts, selectedContact, onSelect, getInitials, formatTimestamp, getRoleColor }: {
  contacts: Contact[]; selectedContact: Contact | null; onSelect: (c: Contact) => void;
  getInitials: (name: string) => string; formatTimestamp: (date?: string) => string; getRoleColor: (role: string) => string;
}) {
  if (contacts.length === 0) {
    return (
      <div className="flex flex-col items-center py-12 text-muted-foreground">
        <Search className="h-8 w-8 mb-3 opacity-30" /><p className="text-sm font-medium">No contacts found</p>
      </div>
    );
  }

  return (
    <div className="p-2 space-y-0.5">
      {contacts.map((contact) => {
        const isActive = selectedContact?.id === contact.id;
        const timeAgo = formatTimestamp(contact.lastMessageAt);
        return (
          <button key={contact.id ?? "general"} onClick={() => onSelect(contact)}
            className={cn("w-full p-3 text-left transition-all duration-200 flex items-start gap-3 rounded-xl relative group", isActive ? "bg-primary/8 shadow-sm ring-1 ring-primary/15" : "hover:bg-muted/60")}>
            <div className="relative shrink-0">
              <Avatar className={cn("h-10 w-10 ring-2 transition-shadow", getRoleColor(contact.role))}>
                <AvatarFallback className="text-xs font-semibold bg-accent text-accent-foreground">{getInitials(contact.name)}</AvatarFallback>
              </Avatar>
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between gap-2">
                <span className={cn("truncate text-sm", contact.unreadCount > 0 ? "font-bold" : "font-medium")}>{contact.name}</span>
                {timeAgo && <span className="text-[10px] text-muted-foreground shrink-0">{timeAgo}</span>}
              </div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <Badge variant="outline" className="text-[10px] px-1.5 py-0 shrink-0 rounded-md">{contact.roleLabel}</Badge>
                {contact.unreadCount > 0 && <Badge variant="default" className="text-[10px] h-5 min-w-[20px] shrink-0 ml-auto">{contact.unreadCount}</Badge>}
              </div>
              {contact.lastMessage && (
                <p className={cn("text-xs mt-1.5 truncate leading-relaxed", contact.unreadCount > 0 ? "text-foreground font-medium" : "text-muted-foreground")}>{contact.lastMessage}</p>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
