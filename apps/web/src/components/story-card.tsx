import { TRUST_LABELS, getCommand, type Story } from "@newsapp/core";

export function StoryCard({ story }: { story: Story }) {
  return (
    <article className="rounded-lg border border-black/10 p-4 dark:border-white/15">
      <div className="mb-1 flex flex-wrap gap-2 text-xs text-zinc-500">
        <span>{getCommand(story.primaryCommand).shortName}</span>
        <span>Severity {story.severity}/5</span>
        <time dateTime={story.updatedAt}>{story.updatedAt.slice(0, 16).replace("T", " ")} UTC</time>
      </div>
      <h2 className="font-semibold">{story.title}</h2>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{story.summary}</p>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs">
        {story.sources.map((s) => (
          <li key={s.url + s.name}>
            <a href={s.url} className="underline" target="_blank" rel="noreferrer">
              {s.name}
            </a>{" "}
            <span className="text-zinc-500">({TRUST_LABELS[s.trust]})</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
