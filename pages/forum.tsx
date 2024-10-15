import React, { useEffect, useState } from 'react';
import { TopicList } from '@/components/ForumPage/TopicList';
import { NewTopicForm } from '@/components/ForumPage/NewTopicForm';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Head from 'next/head';
import { Topic } from '@/types';  // Import the Topic type from the types file

export default function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);

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

  return (
    <div className="container mx-auto px-4 py-6">
      <Head>
        <title>BibleChorus - Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <h1 className="text-3xl font-bold mb-6">Forum</h1>

      {user && <NewTopicForm onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])} />}

      <TopicList topics={topics} />
    </div>
  );
}
