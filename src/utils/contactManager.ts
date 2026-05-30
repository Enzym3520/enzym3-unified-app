import { Contact } from '@/types/contact';
import { EventNotification } from '@/types/notification';

export class ContactManager {
  private contactIndex = new Map<string, Contact>();
  private emailIndex = new Map<string, Contact>();
  private tagIndex = new Map<string, Contact[]>();
  private venueIndex = new Map<string, Contact[]>();

  constructor(contacts: Contact[] = []) {
    this.buildIndexes(contacts);
  }

  private buildIndexes(contacts: Contact[]) {
    // Clear existing indexes
    this.contactIndex.clear();
    this.emailIndex.clear();
    this.tagIndex.clear();
    this.venueIndex.clear();

    contacts.forEach(contact => {
      // ID and email indexes
      this.contactIndex.set(contact.id, contact);
      this.emailIndex.set(contact.email.toLowerCase(), contact);

      // Tag index
      contact.tags.forEach(tag => {
        if (!this.tagIndex.has(tag)) {
          this.tagIndex.set(tag, []);
        }
        this.tagIndex.get(tag)!.push(contact);
      });

      // Venue index
      contact.preferredVenues.forEach(venue => {
        if (!this.venueIndex.has(venue)) {
          this.venueIndex.set(venue, []);
        }
        this.venueIndex.get(venue)!.push(contact);
      });
    });
  }

  updateContacts(contacts: Contact[]) {
    this.buildIndexes(contacts);
  }

  findById(id: string): Contact | undefined {
    return this.contactIndex.get(id);
  }

  findByEmail(email: string): Contact | undefined {
    return this.emailIndex.get(email.toLowerCase());
  }

  findByTag(tag: string): Contact[] {
    return this.tagIndex.get(tag) || [];
  }

  findByVenue(venue: string): Contact[] {
    return this.venueIndex.get(venue) || [];
  }

  searchContacts(query: string, contacts: Contact[]): Contact[] {
    if (!query.trim()) return contacts;
    
    const searchTerm = query.toLowerCase();
    return contacts.filter(contact => 
      contact.name.toLowerCase().includes(searchTerm) ||
      contact.email.toLowerCase().includes(searchTerm) ||
      contact.phone?.toLowerCase().includes(searchTerm) ||
      contact.preferredVenues.some(venue => venue.toLowerCase().includes(searchTerm)) ||
      contact.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  getContactsByStatus(status: Contact['status'], contacts: Contact[]): Contact[] {
    return contacts.filter(contact => contact.status === status);
  }

  getContactsByEventType(eventType: string, contacts: Contact[]): Contact[] {
    return contacts.filter(contact => contact.eventTypes.includes(eventType));
  }

  getUpcomingEvents(contacts: Contact[]): Contact[] {
    const now = new Date();
    return contacts.filter(contact => 
      new Date(contact.primaryEventDate) > now
    ).sort((a, b) => 
      new Date(a.primaryEventDate).getTime() - new Date(b.primaryEventDate).getTime()
    );
  }

  getRecentContacts(contacts: Contact[], days: number = 30): Contact[] {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);
    
    return contacts.filter(contact => 
      new Date(contact.createdAt) > cutoffDate
    ).sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  }

  getRepeatClients(contacts: Contact[]): Contact[] {
    return contacts.filter(contact => contact.totalEvents > 1);
  }

  getAllTags(): string[] {
    return Array.from(this.tagIndex.keys()).sort();
  }

  getAllVenues(): string[] {
    return Array.from(this.venueIndex.keys()).sort();
  }

  getPopularVenues(limit: number = 5): Array<{ venue: string; count: number }> {
    return Array.from(this.venueIndex.entries())
      .map(([venue, contacts]) => ({ venue, count: contacts.length }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  }

  getTagDistribution(): Array<{ tag: string; count: number }> {
    return Array.from(this.tagIndex.entries())
      .map(([tag, contacts]) => ({ tag, count: contacts.length }))
      .sort((a, b) => b.count - a.count);
  }

  exportToCSV(contacts: Contact[]): string {
    const headers = [
      'Name', 'Email', 'Phone', 'Primary Event Type', 'Primary Event Date',
      'Total Events', 'Status', 'Preferred Venues', 'Tags', 'Created At'
    ];

    const rows = contacts.map(contact => [
      contact.name,
      contact.email,
      contact.phone || '',
      contact.primaryEventType || '',
      contact.primaryEventDate || '',
      contact.totalEvents.toString(),
      contact.status,
      contact.preferredVenues.join('; '),
      contact.tags.join('; '),
      contact.createdAt
    ]);

    return [headers, ...rows]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');
  }

  exportToJSON(contacts: Contact[]): string {
    return JSON.stringify(contacts, null, 2);
  }

  generateEmailList(contacts: Contact[]): string {
    return contacts.map(contact => contact.email).join(', ');
  }

  // Performance analytics
  getPerformanceInsights(contacts: Contact[]) {
    const totalContacts = contacts.length;
    const activeClients = this.getContactsByStatus('active', contacts).length;
    const pastClients = this.getContactsByStatus('past_client', contacts).length;
    const upcomingEvents = this.getUpcomingEvents(contacts).length;
    const repeatClients = this.getRepeatClients(contacts).length;
    const recentContacts = this.getRecentContacts(contacts).length;

    return {
      totalContacts,
      activeClients,
      pastClients,
      upcomingEvents,
      repeatClients,
      recentContacts,
      retentionRate: totalContacts > 0 ? (repeatClients / totalContacts) * 100 : 0,
      popularVenues: this.getPopularVenues(),
      tagDistribution: this.getTagDistribution(),
      indexSizes: {
        contacts: this.contactIndex.size,
        emails: this.emailIndex.size,
        tags: this.tagIndex.size,
        venues: this.venueIndex.size
      }
    };
  }
}

// Singleton instance for app-wide use
export const contactManager = new ContactManager();

export default ContactManager;