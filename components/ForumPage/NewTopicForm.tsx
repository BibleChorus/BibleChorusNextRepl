import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import axios from 'axios';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

interface NewTopicFormProps {
  onTopicCreated: (topic: any) => void;
}

export const NewTopicForm: React.FC<NewTopicFormProps> = ({ onTopicCreated }) => {
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleCreateTopic = async () => {
    try {
      const response = await axios.post('/api/forum/topics', {
        title,
        content,
        user_id: user?.id,
      });
      onTopicCreated(response.data);
      setTitle('');
      setContent('');
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
      <Textarea
        placeholder="Write your content here..."
        value={content}
        onChange={(e) => setContent(e.target.value)}
        className="mb-2"
      />
      <Button onClick={handleCreateTopic} disabled={!title || !content}>
        Create Topic
      </Button>
    </div>
  );
};