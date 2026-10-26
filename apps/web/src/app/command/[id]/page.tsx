import { notFound } from "next/navigation";
import { COMMANDS, type CommandId } from "@newsapp/core";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/stories";

export function generateStaticParams() {
  return COMMANDS.map((c) => ({ id: c.id.toLowerCase() }));
}

export default async function CommandPage({ params }: PageProps<"/command/[id]">) {
  const { id } = await params;
  const command = COMMANDS.find((c) => c.id === (id.toUpperCase() as CommandId));
  if (!command) notFound();

  const stories = await getStories(command.id);
  return (
    <div className="flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-semibold">{command.name}</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">{command.summary}</p>
      </div>
      {stories.length === 0 ? (
        <p className="text-sm text-zinc-500">No stories yet.</p>
      ) : (
        stories.map((s) => <StoryCard key={s.id} story={s} />)
      )}
    </div>
  );
}
