"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, Textarea } from "@/components/ui";
import { communityService } from "@/services";

export function CommunityFeature() {
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState(communityService.listPosts());

  return (
    <div className="space-y-4">
      <PageHeader
        title="Community"
        description="Share updates, discover peers, and engage responsibly."
      />
      <Card>
        <Textarea
          aria-label="Community post"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Share something with the community..."
          rows={3}
        />
        <Button
          className="mt-2"
          onClick={() => {
            if (!draft.trim()) return;
            setPosts((current) => [
              {
                id: crypto.randomUUID(),
                author: "You",
                body: draft,
                createdAt: new Date().toISOString(),
                likes: 0,
                comments: 0,
              },
              ...current,
            ]);
            setDraft("");
          }}
        >
          Post update
        </Button>
      </Card>
      <div className="space-y-3">
        {posts.map((post) => (
          <Card key={post.id}>
            <p className="font-semibold">{post.author}</p>
            <p className="mt-2 text-sm text-foreground">{post.body}</p>
            <div className="mt-3 flex gap-2 text-xs text-muted-foreground">
              <button
                className="min-h-11 min-w-11 rounded-control border px-3 py-2"
                onClick={() =>
                  setPosts((current) =>
                    current.map((item) =>
                      item.id === post.id ? { ...item, likes: item.likes + 1 } : item,
                    ),
                  )
                }
              >
                👍 {post.likes}
              </button>
              <button className="min-h-11 min-w-11 rounded-control border px-3 py-2">
                💬 {post.comments}
              </button>
              <button className="min-h-11 min-w-11 rounded-control border px-3 py-2">
                Report (demo)
              </button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
