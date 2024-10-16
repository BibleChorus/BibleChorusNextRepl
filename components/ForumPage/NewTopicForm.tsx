import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ForumCategory } from '@/types';
import dynamic from 'next/dynamic';
const ReactQuill = dynamic(() => import('react-quill'), { ssr: false });
import 'react-quill/dist/quill.snow.css';

interface NewTopicFormProps {
  onTopicCreated: (topic: any) => void;
}

export const NewTopicForm: React.FC<NewTopicFormProps> = ({ onTopicCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [categories, setCategories] = useState<ForumCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ForumCategory[]>('/api/forum/categories');
        setCategories(response.data);
      } catch (error) {
        console.error('Error fetching categories:', error);
        toast.error('Failed to load categories');
      }
    };

    fetchCategories();
  }, []);

  const handleCreateTopic = async () => {
    try {
      const response = await axios.post('/api/forum/topics', {
        title,
        content,
        user_id: user?.id,
        category_id: parseInt(categoryId),
      });
      onTopicCreated(response.data);
      setTitle('');
      setContent('');
      setCategoryId('');
      toast.success('Topic created successfully!');
    } catch (error) {
      console.error('Error creating topic:', error);
      toast.error('Failed to create topic');
    }
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Create a New Topic</h2>
      <Input
        placeholder="Topic Title"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        className="mb-2"
      />
      <ReactQuill
        value={content}
        onChange={setContent}
        className="mb-2"
      />
      <Select value={categoryId} onValueChange={setCategoryId}>
        <SelectTrigger className="mb-2">
          <SelectValue placeholder="Select Category" />
        </SelectTrigger>
        <SelectContent>
          {categories.map((category) => (
            <SelectItem key={category.id} value={category.id.toString()}>
              {category.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <Button onClick={handleCreateTopic} disabled={!title || !content || !categoryId}>
        Create Topic
      </Button>
    </div>
  );
};
