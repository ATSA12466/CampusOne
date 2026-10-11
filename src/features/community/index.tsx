"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { MagazineHeader } from "@/components/shared/magazine-header";
import { EmptyState } from "@/components/shared/empty-state";
import { CommunityFeedback } from "./components/community-feedback";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Pagination } from "@/components/ui/pagination";
import { images } from "@/config/images";
import { useWorkspace } from "@/features/workspace/hooks/use-workspace";
import { useAuthStore } from "@/stores/auth-store";
import { PostComposer } from "./components/post-composer";
import { PostCard, type FeedPost } from "./components/post-card";
import type { CampusFeed } from "@/types/campus-feed";
export function CommunityFeature({
  initial,
}: {
  initial: CampusFeed<"posts">;
}) {
  const router = useRouter(),
    user = useAuthStore((s) => s.user),
    posts = useWorkspace("communityPosts"),
    reactions = useWorkspace("reactions"),
    replies = useWorkspace("replies"),
    concerns = useWorkspace("concerns"),
    [query, setQuery] = useState(""),
    [view, setView] = useState("all"),
    [page, setPage] = useState(1);
  const all: FeedPost[] = [
    ...posts.items.map((p) => ({ ...p, likes: 0, comments: 0, private: true })),
    ...initial.items,
  ];
  const filtered = all
    .filter(
      (p) =>
        (view !== "mine" || p.private) &&
        (view !== "liked" || reactions.items.some((r) => r.postId === p.id)) &&
        `${p.author} ${p.body} ${p.topic ?? p.details?.topic ?? ""}`
          .toLowerCase()
          .includes(query.toLowerCase()),
    )
    .sort(
      (a, b) =>
        b.createdAt.localeCompare(a.createdAt) || a.id.localeCompare(b.id),
    );
  const pages = Math.max(1, Math.ceil(filtered.length / 6)),
    current = Math.min(page, pages),
    visible = filtered.slice((current - 1) * 6, current * 6);
  const error =
    posts.error || reactions.error || replies.error || concerns.error;
  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <MagazineHeader
        eyebrow="GOOD COMPANY, GOOD CONVERSATION"
        title="A campus full of stories."
        description="A useful idea. A little question. A moment worth sharing. Make room for your campus community."
        image={images.eventSocial}
      />
      <PostComposer
        key={posts.owner}
        owner={posts.owner}
        author={user?.name ?? "You"}
        ready={posts.ready && !posts.loading && !error}
        busy={posts.busy}
        onSave={posts.put}
      />
      <CommunityFeedback
        publicError={initial.error}
        onPublicRetry={() => router.refresh()}
        states={[posts, reactions, replies, concerns]}
      />
      <div className="grid gap-3 sm:grid-cols-[1fr_220px]">
        <Input
          aria-label="Search community posts"
          placeholder="A topic, a story, a person…"
          value={query}
          maxLength={120}
          onChange={(e) => {
            setQuery(e.target.value);
            setPage(1);
          }}
        />
        <Select
          aria-label="Community view"
          value={view}
          onChange={(e) => {
            setView(e.target.value);
            setPage(1);
          }}
        >
          <option value="all">All loaded stories</option>
          <option value="mine">Your private updates</option>
          <option value="liked">Your reactions</option>
        </Select>
      </div>
      <p className="text-xs text-muted-foreground">
        {initial.items.length} of {initial.total} public-source records loaded ·{" "}
        {posts.items.length} private workspace updates. Filtering covers loaded
        records only. Demo photos/people/counts are illustrative, not actual
        GCTU activity.
      </p>
      {visible.length ? (
        <div className="grid items-start gap-5 lg:grid-cols-2">
          {visible.map((post) => (
            <PostCard
              key={post.id}
              post={post}
              author={user?.name ?? "You"}
              liked={reactions.items.some((r) => r.postId === post.id)}
              ready={reactions.ready && !error}
              busy={reactions.busy || replies.busy || concerns.busy}
              replies={replies.items.filter((r) => r.postId === post.id)}
              onReact={() =>
                void (
                  reactions.items.some((r) => r.postId === post.id)
                    ? reactions.remove(post.id)
                    : reactions.put({
                        id: post.id,
                        postId: post.id,
                        kind: "like",
                      })
                ).catch(() => {})
              }
              onReply={replies.put}
              onConcern={concerns.put}
              onRemove={() => void posts.remove(post.id).catch(() => {})}
            />
          ))}
        </div>
      ) : (
        <EmptyState
          title="A little quiet in this view."
          description="Try another search or share a private demo update."
        />
      )}
      <Pagination
        page={current}
        totalPages={pages}
        onPageChange={setPage}
        label="Community pages"
      />
    </div>
  );
}
