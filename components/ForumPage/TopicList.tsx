import { Badge } from "@/components/ui/badge";
import { CategoryIconName, categoryIcons } from "@/lib/categoryIcons";
import { Topic } from "@/types";
import { ArrowUpRight, MessageSquare } from "lucide-react";
import Link from "next/link";
import React from "react";
import { VoteButtons } from "./VoteButtons";

export const TopicList: React.FC<{ topics: Topic[] }> = ({ topics }) => (
  <div className="space-y-3">
    {topics.map((topic) => {
      const CategoryIcon =
        categoryIcons[topic.category as CategoryIconName] ||
        categoryIcons.Uncategorized;
      return (
        <article
          key={topic.id}
          className="surface-card group flex items-start gap-4 p-4 transition-colors hover:border-primary/30 sm:gap-6 sm:p-6"
        >
          <div className="hidden rounded-xl bg-muted/50 p-2 sm:block">
            <VoteButtons
              itemId={topic.id}
              itemType="topic"
              initialUpvotes={topic.upvotes || 0}
              initialDownvotes={topic.downvotes || 0}
              initialUserVote={topic.userVote}
            />
          </div>
          <div className="min-w-0 flex-1">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              {topic.category && (
                <Badge
                  variant="secondary"
                  className="gap-1.5 rounded-full font-normal"
                >
                  <CategoryIcon className="h-3 w-3" />
                  {topic.category}
                </Badge>
              )}
              <span className="text-xs text-muted-foreground">
                {topic.username}
              </span>
              <span className="text-xs text-muted-foreground">·</span>
              <time
                dateTime={topic.created_at}
                className="text-xs text-muted-foreground"
              >
                {new Date(topic.created_at).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                })}
              </time>
            </div>
            <Link
              href={`/Forum/topics/${topic.id}`}
              className="block rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <h2 className="text-lg font-semibold leading-snug tracking-tight transition-colors group-hover:text-primary">
                {topic.title}
              </h2>
              {topic.preview && (
                <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted-foreground">
                  {topic.preview}
                </p>
              )}
            </Link>
            <div className="mt-4 flex items-center justify-between">
              <Link
                href={`/Forum/topics/${topic.id}`}
                className="inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-primary"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                {topic.replies_count || 0}{" "}
                {(topic.replies_count || 0) === 1 ? "reply" : "replies"}
              </Link>
              <div className="sm:hidden">
                <VoteButtons
                  itemId={topic.id}
                  itemType="topic"
                  initialUpvotes={topic.upvotes || 0}
                  initialDownvotes={topic.downvotes || 0}
                  initialUserVote={topic.userVote}
                />
              </div>
            </div>
          </div>
          <Link
            href={`/Forum/topics/${topic.id}`}
            aria-label={`Read ${topic.title}`}
            className="hidden rounded-full bg-muted p-2.5 text-muted-foreground hover:bg-primary/10 hover:text-primary md:block"
          >
            <ArrowUpRight className="h-4 w-4" />
          </Link>
        </article>
      );
    })}
  </div>
);
