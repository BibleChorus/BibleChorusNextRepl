import {
  RichTextEditor,
  richTextHasContent,
} from "@/components/RichTextEditor";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { uiTheme } from "@/lib/design-system";
import { ForumCategory } from "@/types";
import axios from "axios";
import { useTheme } from "next-themes";
import React, { useEffect, useState } from "react";
import { toast } from "sonner";

interface NewTopicDialogProps {
  onTopicCreated: (topic: any) => void;
  children?: React.ReactNode;
}

export const NewTopicDialog: React.FC<NewTopicDialogProps> = ({
  onTopicCreated,
  children,
}) => {
  const { user } = useAuth();
  const { resolvedTheme } = useTheme();
  const [title, setTitle] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [content, setContent] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  const isDark = resolvedTheme === "dark";

  const theme = {
    ...uiTheme,
    separator: "hsl(var(--border))",
    accentGlow: "hsl(var(--primary) / .1)",
  };

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
      setIsOpen(false);
      setTitle("");
      setContent("");
      setCategoryId("");
      toast.success("Topic created successfully");
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
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        {children || <Button>Create New Topic</Button>}
      </DialogTrigger>
      <DialogContent
        className="sm:max-w-[500px] rounded-2xl"
        style={{
          backgroundColor: theme.bgCard,
          border: `1px solid ${theme.border}`,
        }}
      >
        <DialogHeader>
          <DialogTitle
            className="text-2xl"
            style={{ color: theme.text, fontFamily: "var(--font-serif)" }}
          >
            Create a New Topic
          </DialogTitle>
          <DialogDescription
            style={{
              color: theme.textSecondary,
              fontFamily: "var(--font-sans)",
            }}
          >
            Fill in the details for your new forum topic.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-5 mt-4">
          <div>
            <label
              htmlFor="title"
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "var(--font-sans)" }}
            >
              Title
            </label>
            <Input
              id="title"
              placeholder="Topic Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="h-11 rounded-lg transition-all duration-300"
              style={{
                backgroundColor: isDark
                  ? "rgba(255, 255, 255, 0.05)"
                  : "rgba(0, 0, 0, 0.03)",
                borderColor: theme.border,
                color: theme.text,
                fontFamily: "var(--font-sans)",
              }}
            />
          </div>
          <div>
            <label
              htmlFor="content"
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "var(--font-sans)" }}
            >
              Description
            </label>
            <div
              className="rounded-lg overflow-hidden"
              style={{ border: `1px solid ${theme.border}` }}
            >
              <RichTextEditor
                label="Describe your conversation"
                id="content"
                readOnly={isSubmitting}
                value={content}
                onChange={setContent}
                placeholder="Write your topic description..."
              />
            </div>
          </div>
          <div>
            <label
              htmlFor="category"
              className="block text-sm font-medium mb-2"
              style={{ color: theme.text, fontFamily: "var(--font-sans)" }}
            >
              Category
            </label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger
                id="category"
                className="h-11 rounded-lg transition-all duration-300"
                style={{
                  backgroundColor: isDark
                    ? "rgba(255, 255, 255, 0.05)"
                    : "rgba(0, 0, 0, 0.03)",
                  borderColor: theme.border,
                  color: theme.text,
                  fontFamily: "var(--font-sans)",
                }}
              >
                <SelectValue placeholder="Select Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem
                    key={category.id}
                    value={category.id.toString()}
                    disabled={
                      category.name === "Announcements" && user?.id !== 1
                    }
                  >
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
            className="w-full h-11 rounded-lg font-medium transition-all duration-300 disabled:opacity-50"
            style={{
              backgroundColor: theme.accent,
              color: "#ffffff",
              fontFamily: "var(--font-sans)",
            }}
            onMouseEnter={(e) => {
              if (!e.currentTarget.disabled) {
                e.currentTarget.style.backgroundColor = theme.accentHover;
              }
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = theme.accent;
            }}
          >
            {isSubmitting ? "Creating…" : "Create topic"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
