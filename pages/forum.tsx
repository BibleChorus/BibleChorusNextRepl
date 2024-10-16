import React, { useEffect, useState } from 'react';
import { TopicList } from '@/components/ForumPage/TopicList';
import { NewTopicForm } from '@/components/ForumPage/NewTopicForm';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Head from 'next/head';
import { Topic } from '@/types';  // Import the Topic type from the types file
import { Input } from '@/components/ui/input';

export default function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    // Fetch topics from the API
    const fetchTopics = async () => {
      try {
        const response = await axios.get<Topic[]>('/api/forum/topics');
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    fetchTopics();
  }, []);

  const filteredTopics = topics.filter((topic) =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <Head>
        <title>BibleChorus - Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="text-3xl font-bold mb-6">Forum</h1>

      {user && <NewTopicForm onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])} />}

      <Input
        placeholder="Search topics..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="mb-4"
      />

      <TopicList topics={filteredTopics} />
    </div>
  );
}
