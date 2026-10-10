"use client";

import { useState } from "react";
import { PageHeader } from "@/components/shared/page-header";
import { Button, Card, Textarea } from "@/components/ui";
import { communityService } from "@/services/demo";

export function CommunityFeature() {
  const [draft, setDraft] = useState("");
  const [posts, setPosts] = useState(communityService.listPosts());

  return (
    <div className="space-y-4">
      <PageHeader title="Community" description="Share updates, discover peers, and engage responsibly." />
      <Card>
        <Textarea value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Share something with the community..." rows={3} />
        <Button
          className="mt-2"
          onClick={() => {
            if (!draft.trim()) return;
            setPosts((current) => [{ id: crypto.randomUUID(), author: "You", body: draft, createdAt: new Date().toISOString(), likes: 0, comments: 0 }, ...current]);
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
            <p className="mt-2 text-sm text-slate-700">{post.body}</p>
            <div className="mt-3 flex gap-2 text-xs text-slate-500">
              <button
                className="rounded-md border px-2 py-1"
                onClick={() =>
                  setPosts((current) => current.map((item) => (item.id === post.id ? { ...item, likes: item.likes + 1 } : item)))
                }
              >
                👍 {post.likes}
              </button>
              <button className="rounded-md border px-2 py-1">💬 {post.comments}</button>
              <button className="rounded-md border px-2 py-1">Report (demo)</button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
