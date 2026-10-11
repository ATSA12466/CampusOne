"use client";
import { useState } from "react";
import { Heart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar } from "@/components/ui/avatar";
import { CampusImage } from "@/components/media/campus-image";
import { OwnedPhoto } from "@/components/media/owned-photo";
import { appConfig } from "@/config/app-config";
import { PostThread } from "./post-thread";
import { ConcernDialog } from "./concern-dialog";
import type { CommunityPost } from "@/types/community";
import type { SocialReply, SocialConcern } from "@/types/social";
export interface FeedPost extends CommunityPost {
  photo?: string;
  topic?: string;
  private?: boolean;
}
export function PostCard({
  post,
  liked,
  ready,
  busy,
  author,
  replies,
  onReact,
  onReply,
  onConcern,
  onRemove,
}: {
  post: FeedPost;
  liked: boolean;
  ready: boolean;
  busy: boolean;
  author: string;
  replies: SocialReply[];
  onReact: () => void;
  onReply: (reply: SocialReply) => Promise<void>;
  onConcern: (concern: SocialConcern) => Promise<void>;
  onRemove: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  return (
    <article
      data-post-id={post.id}
      className="overflow-hidden rounded-media border border-border bg-surface shadow-low"
    >
      {post.photo ? (
        <OwnedPhoto
          data={post.photo}
          alt={`Your owned photo attached to ${post.author}'s private update`}
        />
      ) : post.details?.cover ? (
        <div className="relative">
          <CampusImage
            image={post.details.cover}
            sizes="(max-width:639px) 100vw, 500px"
          />
          <span className="absolute bottom-3 left-3 rounded-full bg-nav/85 px-3 py-1 text-[10px] text-on-photo">
            {appConfig.dataSource === "demo"
              ? "Generated demo illustration"
              : "Publisher cover image"}
          </span>
        </div>
      ) : null}
      <div className="space-y-4 p-5">
        <div className="flex items-center gap-3">
          <Avatar name={post.author} />
          <div className="min-w-0">
            <h2 className="break-words text-sm font-semibold">{post.author}</h2>
            <p className="text-xs text-muted-foreground">
              {new Intl.DateTimeFormat("en-GH", {
                day: "numeric",
                month: "short",
                year: "numeric",
                timeZone: "Africa/Accra",
              }).format(new Date(post.createdAt))}{" "}
              · {post.topic ?? post.details?.topic ?? "Campus life"}
            </p>
          </div>
        </div>
        <p
          className={`${expanded ? "" : "line-clamp-5"} whitespace-pre-wrap break-words text-sm leading-relaxed`}
        >
          {post.body}
        </p>
        {post.body.length > 260 ? (
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setExpanded(!expanded)}
          >
            {expanded ? "Show less" : "Read more"}
          </Button>
        ) : null}
        <p className="text-[11px] text-muted-foreground">
          {post.private
            ? "Private workspace update, not broadcast"
            : appConfig.dataSource === "demo"
              ? "Fictional campus post · supplied activity counts"
              : "Publisher post · supplied activity counts"}
        </p>
        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button
            size="sm"
            variant={liked ? "primary" : "ghost"}
            aria-pressed={liked}
            aria-label={`Like post by ${post.author}`}
            disabled={!ready || busy}
            onClick={onReact}
          >
            <Heart className="size-4" aria-hidden="true" />
            {post.likes + (liked ? 1 : 0)}
          </Button>
          <PostThread
            postId={post.id}
            author={author}
            replies={replies}
            suppliedCount={post.comments}
            ready={ready}
            busy={busy}
            onSave={onReply}
          />
          <ConcernDialog
            targetId={post.id}
            area="community"
            disabled={!ready || busy}
            onSave={onConcern}
          />
          {post.private ? (
            <Button
              size="sm"
              variant="ghost"
              disabled={busy}
              onClick={onRemove}
            >
              Delete your update
            </Button>
          ) : null}
        </div>
      </div>
    </article>
  );
}
