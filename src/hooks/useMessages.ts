import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useClientEvent } from "@/hooks/useClientEvent";
import { useIsMobile } from "@/hooks/use-mobile";
import { formatDistanceToNow } from "date-fns";

export interface Contact {
  id: string | null;
  name: string;
  role: string;
  roleLabel: string;
  unreadCount: number;
  lastMessage?: string;
  lastMessageAt?: string;
}

export function useMessages() {
  const { event: wedding, loading: eventLoading, userId, user } = useClientEvent<{
    id: string; couple_name: string; submitted_by_user_id: string; event_type: string; primary_contact_name: string | null;
  }>("id, couple_name, submitted_by_user_id, event_type, primary_contact_name");

  const [contacts, setContacts] = useState<Contact[]>([]);
  const [selectedContact, setSelectedContact] = useState<Contact | null>(null);
  const [contactsLoading, setContactsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [clientName, setClientName] = useState<string>("");
  const [panelOpen, setPanelOpen] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [newMsgOpen, setNewMsgOpen] = useState(false);
  const [mobileShowChat, setMobileShowChat] = useState(false);
  const isMobile = useIsMobile();

  useEffect(() => {
    if (eventLoading) return;
    if (!user) { setError("Please log in to view messages"); setContactsLoading(false); return; }
    if (!wedding) { setError("No wedding found for your account"); setContactsLoading(false); return; }

    const loadContacts = async () => {
      setContactsLoading(true);
      setError(null);

      try {
        const { data: profile } = await supabase
          .from("profiles").select("first_name, last_name").eq("id", user.id).maybeSingle();
        if (profile) setClientName([profile.first_name, profile.last_name].filter(Boolean).join(" "));

        const contactsList: Contact[] = [];
        const addedIds = new Set<string>();

        // Coordinators
        let coordinators: any[] = [];
        if (wedding.submitted_by_user_id) {
          const { data } = await supabase.from("profiles").select("id, first_name, last_name, company_name, role").eq("id", wedding.submitted_by_user_id);
          coordinators = data || [];
        } else {
          coordinators = []; // Don't expose all coordinators when none is assigned
        }

        for (const coord of coordinators) {
          const coordName = coord.company_name || [coord.first_name, coord.last_name].filter(Boolean).join(" ");
          const { count: unread } = await supabase.from("chat_messages")
            .select("*", { count: "exact", head: true })
            .eq("wedding_id", wedding.id).eq("sender_id", coord.id).eq("recipient_id", user.id).is("read_at", null);
          const { data: lastMsg } = await supabase.from("chat_messages")
            .select("content, created_at").eq("wedding_id", wedding.id)
            .or(`and(sender_id.eq.${user.id},recipient_id.eq.${coord.id}),and(sender_id.eq.${coord.id},recipient_id.eq.${user.id})`)
            .order("created_at", { ascending: false }).limit(1).maybeSingle();
          contactsList.push({ id: coord.id, name: coordName, role: "coordinator", roleLabel: "Coordinator", unreadCount: unread || 0, lastMessage: lastMsg?.content, lastMessageAt: lastMsg?.created_at });
          addedIds.add(coord.id);
        }

        // Vendors
        const { data: assignments } = await supabase.from("event_dj_assignments")
          .select("dj_user_id, profiles:dj_user_id(first_name, last_name, company_name, role)")
          .eq("event_id", wedding.id).in("status", ["confirmed", "pending"]);

        if (assignments) {
          for (const a of assignments) {
            if (addedIds.has(a.dj_user_id)) continue;
            const p = a.profiles as any;
            if (!p) continue;
            const vendorName = p.company_name || [p.first_name, p.last_name].filter(Boolean).join(" ");
            const roleLabel = p.role === "dj" ? "DJ" : p.role === "coordinator" ? "Coordinator" : "Vendor";
            const { count: unread } = await supabase.from("chat_messages")
              .select("*", { count: "exact", head: true })
              .eq("wedding_id", wedding.id).eq("sender_id", a.dj_user_id).eq("recipient_id", user.id).is("read_at", null);
            const { data: lastMsg } = await supabase.from("chat_messages")
              .select("content, created_at").eq("wedding_id", wedding.id)
              .or(`and(sender_id.eq.${user.id},recipient_id.eq.${a.dj_user_id}),and(sender_id.eq.${a.dj_user_id},recipient_id.eq.${user.id})`)
              .order("created_at", { ascending: false }).limit(1).maybeSingle();
            contactsList.push({ id: a.dj_user_id, name: vendorName, role: p.role || "vendor", roleLabel, unreadCount: unread || 0, lastMessage: lastMsg?.content, lastMessageAt: lastMsg?.created_at });
            addedIds.add(a.dj_user_id);
          }
        }

        // Sort: coordinators first, then by unread/recency
        const coordContacts = contactsList.filter(c => c.role === "coordinator");
        const vendorContacts = contactsList.filter(c => c.role !== "coordinator");
        vendorContacts.sort((a, b) => {
          if (a.unreadCount > 0 && b.unreadCount === 0) return -1;
          if (b.unreadCount > 0 && a.unreadCount === 0) return 1;
          if (a.lastMessageAt && b.lastMessageAt) return new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime();
          if (a.lastMessageAt) return -1;
          if (b.lastMessageAt) return 1;
          return 0;
        });

        const sortedContacts = [...coordContacts, ...vendorContacts];
        setContacts(sortedContacts);
        if (!isMobile) setSelectedContact(sortedContacts[0] || null);
      } catch (err) {
        console.error("Error:", err);
        setError("An unexpected error occurred");
      }
      setContactsLoading(false);
    };
    loadContacts();
  }, [wedding, user, eventLoading, isMobile]);

  const loading = eventLoading || contactsLoading;

  const filteredContacts = useMemo(() => {
    if (!searchQuery.trim()) return contacts;
    const q = searchQuery.toLowerCase();
    return contacts.filter(c => c.name.toLowerCase().includes(q) || c.roleLabel.toLowerCase().includes(q));
  }, [contacts, searchQuery]);

  const totalUnread = contacts.reduce((sum, c) => sum + c.unreadCount, 0);

  const getInitials = (name: string) => name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const formatTimestamp = (dateString?: string) => {
    if (!dateString) return "";
    try { return formatDistanceToNow(new Date(dateString), { addSuffix: false }); } catch { return ""; }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case "coordinator": return "ring-emerald-500/60";
      case "dj": return "ring-primary/60";
      default: return "ring-accent/60";
    }
  };

  const handleNewMessage = (contact: Contact) => {
    setSelectedContact(contact);
    setNewMsgOpen(false);
    if (isMobile) setMobileShowChat(true);
  };

  const handleSelectContact = (contact: Contact) => {
    setSelectedContact(contact);
    if (isMobile) setMobileShowChat(true);
  };

  const handleBackToContacts = () => setMobileShowChat(false);

  return {
    weddingId: wedding?.id ?? null, userId, clientName, contacts, selectedContact, loading, error,
    panelOpen, setPanelOpen, searchQuery, setSearchQuery,
    newMsgOpen, setNewMsgOpen, mobileShowChat, isMobile,
    filteredContacts, totalUnread,
    getInitials, formatTimestamp, getRoleColor,
    handleNewMessage, handleSelectContact, handleBackToContacts,
  };
}
