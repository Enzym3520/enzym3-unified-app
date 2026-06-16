import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, Tag, Users, Calendar } from 'lucide-react';
import { Contact } from '@/types/contact';
import { getPopularTags, TAG_CATEGORIES, getTagDisplayName } from '@/utils/tagHelpers';
import { EnhancedTag, getSmartTagConfig } from '@/components/ui/enhanced-tag';

interface TagAnalyticsProps {
  contacts: Contact[];
  className?: string;
}

const COLORS = [
  'hsl(var(--tag-rose))',
  'hsl(var(--tag-info))',
  'hsl(var(--tag-success))',
  'hsl(var(--tag-warning))',
  'hsl(var(--tag-purple))',
  'hsl(var(--tag-venue))',
  'hsl(var(--tag-premium))',
  'hsl(var(--tag-event))'
];

export const TagAnalytics = ({ contacts, className }: TagAnalyticsProps) => {
  const popularTags = getPopularTags(contacts, 10);
  
  // Category distribution
  const categoryData = TAG_CATEGORIES.map(category => {
    const count = contacts.reduce((acc, contact) => {
      const categoryTags = contact.tags.filter(tag => 
        category.tags.includes(tag.toLowerCase())
      );
      return acc + categoryTags.length;
    }, 0);
    
    return {
      name: category.name,
      count,
      color: COLORS[TAG_CATEGORIES.indexOf(category) % COLORS.length]
    };
  }).filter(item => item.count > 0);

  // Tag usage over time (simplified - by event types)
  const eventTypeData = contacts.reduce((acc, contact) => {
    contact.eventTypes.forEach(eventType => {
      const existing = acc.find(item => item.eventType === eventType);
      if (existing) {
        existing.count += 1;
        existing.totalTags += contact.tags.length;
      } else {
        acc.push({
          eventType,
          count: 1,
          totalTags: contact.tags.length,
          avgTags: contact.tags.length
        });
      }
    });
    return acc;
  }, [] as Array<{eventType: string, count: number, totalTags: number, avgTags: number}>);

  // Calculate average tags per event type
  eventTypeData.forEach(item => {
    item.avgTags = Math.round((item.totalTags / item.count) * 10) / 10;
  });

  const totalContacts = contacts.length;
  const totalTags = contacts.reduce((acc, contact) => acc + contact.tags.length, 0);
  const avgTagsPerContact = totalContacts > 0 ? Math.round((totalTags / totalContacts) * 10) / 10 : 0;
  const uniqueTags = new Set(contacts.flatMap(c => c.tags)).size;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Tag className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Total Tags</p>
                <p className="text-2xl font-bold">{totalTags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Unique Tags</p>
                <p className="text-2xl font-bold">{uniqueTags}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Avg per Contact</p>
                <p className="text-2xl font-bold">{avgTagsPerContact}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-muted-foreground" />
              <div>
                <p className="text-sm text-muted-foreground">Categories</p>
                <p className="text-2xl font-bold">{categoryData.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Popular Tags Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Most Popular Tags</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={popularTags}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="tag" 
                  angle={-45}
                  textAnchor="end"
                  height={80}
                  interval={0}
                  fontSize={12}
                />
                <YAxis />
                <Tooltip 
                  formatter={(value) => [value, 'Count']}
                  labelFormatter={(label) => getTagDisplayName(label as string)}
                />
                <Bar dataKey="count" fill="hsl(var(--primary))" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Category Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>Tag Categories</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={categoryData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="count"
                >
                  {categoryData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Event Type Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Tags by Event Type</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={eventTypeData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="eventType" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="avgTags" fill="hsl(var(--tag-info))" name="Avg Tags per Contact" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Tags by Category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {TAG_CATEGORIES.slice(0, 6).map(category => {
          const categoryTags = popularTags.filter(({ tag }) => 
            category.tags.includes(tag.toLowerCase())
          ).slice(0, 5);
          
          if (categoryTags.length === 0) return null;
          
          return (
            <Card key={category.name}>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Badge variant="outline">{category.name}</Badge>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categoryTags.map(({ tag, count }) => {
                    const { variant, icon } = getSmartTagConfig(tag);
                    return (
                      <div key={tag} className="flex items-center justify-between">
                        <EnhancedTag 
                          variant={variant}
                          size="xs"
                          icon={icon}
                        >
                          {getTagDisplayName(tag)}
                        </EnhancedTag>
                        <span className="text-xs text-muted-foreground">{count}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};