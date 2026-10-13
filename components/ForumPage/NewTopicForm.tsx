import {
  RichTextEditor,
  richTextHasContent,
} from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { ForumCategory } from "@/types";
import axios from "axios";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface NewTopicFormProps {
  onTopicCreated: (topic: any) => void;
}

export const NewTopicForm: React.FC<NewTopicFormProps> = ({
  onTopicCreated,
}) => {
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const response = await axios.get<ForumCategory[]>(
          "/api/forum/categories",
        );
        setCategories(response.data);
      } catch (error) {
        console.error(
          "Error fetching categories:",
          error instanceof Error ? error.message : "Unknown error",
        );
        toast.error("Failed to load categories");
      }
    };

    fetchCategories();
  }, []);

  const handleCreateTopic = async () => {
    if (
      !user ||
      !title.trim() ||
      !richTextHasContent(content) ||
      !categoryId ||
      isSubmitting
    )
      return;
    setIsSubmitting(true);
    try {
      const response = await axios.post("/api/forum/topics", {
        title,
        content,
        user_id: user?.id,
        category_id: parseInt(categoryId),
      });
      onTopicCreated(response.data);
      setTitle("");
      setContent("");
      setCategoryId("");
      toast.success("Topic created successfully!");
    } catch (error) {
      console.error(
        "Error creating topic:",
        error instanceof Error ? error.message : "Unknown error",
      );
      toast.error("Failed to create topic");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mb-6 p-4 bg-card rounded-lg shadow-sm">
      <h2 className="text-2xl font-semibold mb-4">Create a New Topic</h2>
      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium mb-1">
            Title
          </label>
          <Input
            id="title"
            placeholder="Topic Title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <label htmlFor="content" className="block text-sm font-medium mb-1">
            Description
          </label>
          <div className="border rounded-md">
            <RichTextEditor
              label="Describe your conversation"
              id="content"
              readOnly={isSubmitting}
              value={content}
              onChange={setContent}
              className="[&_.ql-editor]:min-h-[100px]"
            />
          </div>
        </div>
        <div>
          <label htmlFor="category" className="block text-sm font-medium mb-1">
            Category
          </label>
          <Select value={categoryId} onValueChange={setCategoryId}>
            <SelectTrigger id="category">
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
        </div>
        <Button
          onClick={handleCreateTopic}
          disabled={
            !title.trim() ||
            !richTextHasContent(content) ||
            !categoryId ||
            isSubmitting
          }
        >
          Create Topic
        </Button>
      </div>
    </div>
  );
};
