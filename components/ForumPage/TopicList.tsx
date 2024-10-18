import React from 'react';
import Link from 'next/link';
import { Topic } from '@/types';
import { Badge } from '@/components/ui/badge';
import { categoryIcons, CategoryIconName } from '@/lib/categoryIcons';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: React.FC<TopicListProps> = ({ topics }) => {
  return (
    <div className="space-y-4">
      {topics.map((topic) => {
        const CategoryIcon = categoryIcons[topic.category as CategoryIconName] || categoryIcons['Uncategorized'];
        
        return (
          <div key={topic.id} className="p-4 bg-card rounded-lg shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <Link href={`/Forum/topics/${topic.id}`} className="flex items-center">
                <div className="w-10 h-10 flex items-center justify-center bg-primary/10 rounded-full mr-3">
                  <CategoryIcon className="h-6 w-6 text-primary" />
                </div>
                <h2 className="text-xl font-semibold hover:underline">{topic.title}</h2>
              </Link>
              {topic.category && (
                <Badge variant="secondary">{topic.category}</Badge>
              )}
            </div>
            <p className="text-sm text-muted-foreground">
              Posted by {topic.username} on {new Date(topic.created_at).toLocaleDateString()}
            </p>
          </div>
        );
      })}
    </div>
  );
};
