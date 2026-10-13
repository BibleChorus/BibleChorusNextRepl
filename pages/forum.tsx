import { NewTopicDialog } from "@/components/ForumPage/NewTopicDialog";
import { TopicList } from "@/components/ForumPage/TopicList";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { ForumCategory, Topic } from "@/types";
import axios from "axios";
import { MessageSquare, Plus, RefreshCw, Search, Users } from "lucide-react";
import Head from "next/head";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

export default function Forum() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<Topic[]>([]);
  const [categories, setCategories] = useState<ForumCategory[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState<"recent" | "popular">("recent");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const loadTopics = useCallback(async () => {
    setLoading(true);
    setError(false);
    try {
      const response = await axios.get<Topic[]>("/api/forum/topics");
      setTopics(response.data);
    } catch (failure) {
      console.error("Error fetching topics:", failure);
      setError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadTopics();
    axios
      .get<ForumCategory[]>("/api/forum/categories")
      .then((response) => setCategories(response.data))
      .catch((failure) => console.error("Error fetching categories:", failure));
  }, [loadTopics]);

  const filteredTopics = useMemo(
    () =>
      topics
        .filter(
          (topic) =>
            topic.title.toLowerCase().includes(searchTerm.toLowerCase()) &&
            (selectedCategory === "all" || topic.category === selectedCategory),
        )
        .sort((a, b) =>
          sortBy === "popular"
            ? (b.score || 0) - (a.score || 0)
            : new Date(b.created_at).getTime() -
              new Date(a.created_at).getTime(),
        ),
    [topics, searchTerm, selectedCategory, sortBy],
  );
  const addTopic = (topic: Topic) =>
    setTopics((previous) => [topic, ...previous]);
  const replies = topics.reduce(
    (total, topic) => total + (topic.replies_count || 0),
    0,
  );
  const contributors = new Set(topics.map((topic) => topic.username)).size;

  return (
    <>
      <Head>
        <title>Community · BibleChorus</title>
        <meta
          name="description"
          content="Share music, explore Scripture, and connect with the BibleChorus community."
        />
      </Head>
      <main className="page-shell">
        <header className="page-header flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
          <div>
            <p className="page-eyebrow flex items-center gap-2">
              <Users className="h-4 w-4" /> The conversation continues
            </p>
            <h1 className="page-title">Faith sounds better together.</h1>
            <p className="page-description">
              Share what you’re making, ask a question, or discover a fresh
              perspective on Scripture and music.
            </p>
          </div>
          {user ? (
            <NewTopicDialog onTopicCreated={addTopic}>
              <Button className="shrink-0">
                <Plus className="mr-2 h-4 w-4" /> Start a conversation
              </Button>
            </NewTopicDialog>
          ) : (
            <Button asChild className="shrink-0" variant="outline">
              <Link href="/login">Sign in to join in</Link>
            </Button>
          )}
        </header>
        <div className="mb-8 flex flex-wrap items-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
          <span>
            <strong className="font-semibold text-foreground">
              {topics.length}
            </strong>{" "}
            conversations
          </span>
          <span>
            <strong className="font-semibold text-foreground">{replies}</strong>{" "}
            replies
          </span>
          <span>
            <strong className="font-semibold text-foreground">
              {contributors}
            </strong>{" "}
            contributors
          </span>
        </div>
        <div className="surface-card mb-6 flex flex-col gap-3 p-4 lg:flex-row">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              aria-label="Search conversations"
              placeholder="Search the conversation…"
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              className="h-11 pl-10"
            />
          </div>
          <div className="grid grid-cols-2 gap-3 lg:w-auto">
            <Select
              value={selectedCategory}
              onValueChange={setSelectedCategory}
            >
              <SelectTrigger
                aria-label="Filter by category"
                className="h-11 lg:w-48"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.name}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select
              value={sortBy}
              onValueChange={(value) =>
                setSortBy(value as "recent" | "popular")
              }
            >
              <SelectTrigger
                aria-label="Sort conversations"
                className="h-11 lg:w-40"
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="recent">Most recent</SelectItem>
                <SelectItem value="popular">Most popular</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        {categories.length > 0 && (
          <div
            className="mb-6 flex flex-wrap gap-2"
            aria-label="Discussion categories"
          >
            <button
              type="button"
              onClick={() => setSelectedCategory("all")}
              aria-pressed={selectedCategory === "all"}
              className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedCategory === "all" ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
            >
              Everything
            </button>
            {categories.map((category) => (
              <button
                type="button"
                key={category.id}
                onClick={() => setSelectedCategory(category.name)}
                aria-pressed={selectedCategory === category.name}
                className={`rounded-full border px-3 py-1.5 text-xs transition-colors ${selectedCategory === category.name ? "border-primary bg-primary text-primary-foreground" : "border-border hover:bg-muted"}`}
              >
                {category.name}
                <span className="ml-2 opacity-60">
                  {
                    topics.filter((topic) => topic.category === category.name)
                      .length
                  }
                </span>
              </button>
            ))}
          </div>
        )}
        {loading ? (
          <div
            role="status"
            aria-label="Loading conversations"
            className="space-y-3"
          >
            {[0, 1, 2, 3].map((index) => (
              <Skeleton key={index} className="h-32 rounded-2xl" />
            ))}
          </div>
        ) : error ? (
          <div role="alert" className="surface-card px-6 py-16 text-center">
            <h2 className="text-xl font-semibold">
              The conversation couldn’t load.
            </h2>
            <p className="mb-5 mt-2 text-muted-foreground">
              Please try again in a moment.
            </p>
            <Button onClick={loadTopics} variant="outline">
              <RefreshCw className="mr-2 h-4 w-4" /> Try again
            </Button>
          </div>
        ) : filteredTopics.length ? (
          <TopicList topics={filteredTopics} />
        ) : (
          <div className="surface-card px-6 py-16 text-center">
            <MessageSquare className="mx-auto mb-4 h-9 w-9 text-muted-foreground" />
            <h2 className="text-xl font-semibold">
              {searchTerm || selectedCategory !== "all"
                ? "No conversations match yet."
                : "Every conversation starts somewhere."}
            </h2>
            <p className="mx-auto mb-5 mt-2 max-w-md text-muted-foreground">
              {searchTerm || selectedCategory !== "all"
                ? "Try a different search or explore all categories."
                : "Share a question, an idea, or a song with the community."}
            </p>
            {searchTerm || selectedCategory !== "all" ? (
              <Button
                variant="outline"
                onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("all");
                }}
              >
                Clear filters
              </Button>
            ) : user ? (
              <NewTopicDialog onTopicCreated={addTopic}>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> Start a conversation
                </Button>
              </NewTopicDialog>
            ) : (
              <Button asChild variant="outline">
                <Link href="/login">Sign in to join in</Link>
              </Button>
            )}
          </div>
        )}
      </main>
    </>
  );
}
