import React from 'react';
import Link from 'next/link';
import { Topic } from '@/types';
import Image from 'next/image';
import { Badge } from '@/components/ui/badge';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: React.FC<TopicListProps> = ({ topics }) => {
  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div key={topic.id} className="p-4 bg-card rounded-lg shadow-sm">
          <div className="flex items-center justify-between mb-2">
            <Link href={`/Forum/topics/${topic.id}`} className="flex items-center">
              <Image
                src={topic.profile_image_url || '/default-avatar.png'}
                alt={topic.username}
                width={40}
                height={40}
                className="rounded-full mr-3"
              />
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
      ))}
    </div>
  );
};
