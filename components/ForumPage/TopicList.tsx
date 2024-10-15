import React from 'react';
import Link from 'next/link';
import { Topic } from '@/types';

interface TopicListProps {
  topics: Topic[];
}

export const TopicList: React.FC<TopicListProps> = ({ topics }) => {
  return (
    <div className="space-y-4">
      {topics.map((topic) => (
        <div key={topic.id} className="p-4 bg-card rounded-lg shadow-sm">
          <Link href={`/Forum/topics/${topic.id}`}>
            <h2 className="text-xl font-semibold hover:underline">{topic.title}</h2>
          </Link>
          <p className="text-sm text-muted-foreground">
            Posted by {topic.username} on {new Date(topic.created_at).toLocaleDateString()}
          </p>
        </div>
      ))}
    </div>
  );
};