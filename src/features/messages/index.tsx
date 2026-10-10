import { EmptyState } from "@/components/shared/empty-state";
import { PageHeader } from "@/components/shared/page-header";
import { Card } from "@/components/ui";
import { communityService } from "@/services/demo";

export function MessagesFeature() {
  const conversations = communityService.listConversations();

  return (
    <div className="space-y-4">
      <PageHeader title="Messages" description="Conversation UI powered by demo datasets." />
      {conversations.length ? (
        <div className="grid gap-3 lg:grid-cols-[300px,1fr]">
          <Card>
            <ul className="space-y-2 text-sm">
              {conversations.map((conversation) => (
                <li key={conversation.id} className="rounded-xl border border-[var(--color-border)] p-3">
                  <p className="font-medium">{conversation.name}</p>
                  <p className="text-slate-600">{conversation.lastMessage}</p>
                </li>
              ))}
            </ul>
          </Card>
          <Card>
            <p className="text-sm text-slate-600">Select a conversation. Real-time messaging will require backend websocket support.</p>
          </Card>
        </div>
      ) : (
        <EmptyState title="No messages" description="Start a conversation once messaging backend is connected." />
      )}
    </div>
  );
}
