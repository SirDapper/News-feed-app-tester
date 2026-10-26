import Link from "next/link";
import { COMMANDS } from "@newsapp/core";
import { StoryCard } from "@/components/story-card";
import { getStories } from "@/lib/stories";

export default async function Home() {
  const stories = await getStories();
  return (
    <div className="flex flex-col gap-8">
      <section>
        <h1 className="mb-3 text-2xl font-semibold">Commands</h1>
        <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {COMMANDS.map((c) => (
            <li key={c.id}>
              <Link
                href={`/command/${c.id.toLowerCase()}`}
                className="block rounded-lg border border-black/10 p-4 hover:bg-black/5 dark:border-white/15 dark:hover:bg-white/5"
              >
                <div className="font-semibold">{c.id === "GLOBAL" ? "Global" : c.id}</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">{c.summary}</div>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      <section>
        <h2 className="mb-3 text-xl font-semibold">Latest</h2>
        <div className="flex flex-col gap-3">
          {stories.map((s) => (
            <StoryCard key={s.id} story={s} />
          ))}
        </div>
      </section>
    </div>
  );
}
