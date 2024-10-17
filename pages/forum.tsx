import React, { useEffect, useState } from 'react';
import { TopicList } from '@/components/ForumPage/TopicList';
import { NewTopicDialog } from '@/components/ForumPage/NewTopicDialog';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import Head from 'next/head';
import { Topic, ForumCategory } from '@/types';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

export default function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    const fetchTopics = async () => {
      try {
        const response = await axios.get<Topic[]>('/api/forum/topics');
        setTopics(response.data);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    const fetchCategories = async () => {
      try {
        const response = await axios.get<ForumCategory[]>('/api/forum/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
      }
    };

    fetchTopics();
    fetchCategories();
  }, []);

  const filteredTopics = topics.filter((topic) =>
    topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (selectedCategory === 'all' || topic.category === selectedCategory)
  );

  return (
    <div className="container mx-auto px-4 py-6">
      <Head>
        <title>BibleChorus - Forum</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Forum</h1>
        {user && <NewTopicDialog onTopicCreated={(newTopic: Topic) => setTopics([newTopic, ...topics])} />}
      </div>

      <div className="flex space-x-4 mb-4">
        <Input
          placeholder="Search topics..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="flex-grow"
        />
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select category" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.name}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <TopicList topics={filteredTopics} />
    </div>
  );
}
