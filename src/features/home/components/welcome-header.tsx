import { formatDate } from "@/lib/utils/date";

export function WelcomeHeader({ name }: { name?: string }) {
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 18 ? "Good afternoon" : "Good evening";

  return (
    <section className="mb-6 flex items-end justify-between gap-4">
      <div>
        <p className="text-sm text-muted-foreground">{formatDate(new Date())}</p>
        <h1 className="text-3xl font-bold text-foreground">
          {greeting}, {name ?? "Student"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">Ready to make today count?</p>
      </div>
    </section>
  );
}
