import type { Song } from "@/types/song";
import { ChangeEvent, useCallback, useMemo, useState } from "react";
import { extract, partial_ratio } from "fuzzball";
import Router from "next/router";
import Head from "next/head";

import { Link } from "@/components/Link";
import Logo from "@/components/Logo";
import { Input } from "@/components/Input";
import { usePWAPrompt } from "@/lib/usePWAPrompt";

import { Merriweather } from "@next/font/google";
import { Button } from "@/components/Button";
import { InferGetStaticPropsType } from "next";
import { getSongs } from "@/lib/songs";
const merriweather = Merriweather({ subsets: ["latin"], weight: "400" });

export async function getStaticProps() {
  const songs = await getSongs();
  return {
    props: { songs: songs.map(({ title, slug }) => ({ title, slug })) },
  };
}

const Index = ({ songs }: InferGetStaticPropsType<typeof getStaticProps>) => {
  // PWA update prompting, song downloads
  const { promptToUpdate, updateWorker } = usePWAPrompt();

  // Search box
  const [query, setQuery] = useState("");
  const updateQuery = useCallback(
    ({ target }: ChangeEvent<HTMLInputElement>) => {
      setQuery(target.value);
    },
    [setQuery]
  );

  const sortedSongs = useMemo(() => {
    if (query.trim().length === 0) {
      return songs.map((song) => ({ ...song, score: 100 }));
    }

    const fuzzSortedSongs = extract(query, songs, {
      scorer: partial_ratio,
      processor: (choice: Song) => choice.title,
      cutoff: 40,
      limit: 15,
    }) as [Pick<Song, "title" | "slug">, number, number][];

    return fuzzSortedSongs.map(([song, score]) => ({ ...song, score }));
  }, [query, songs]);

  const handleSubmit = useCallback(() => {
    if (sortedSongs.length === 0) {
      return;
    }

    Router.push(`songs/${sortedSongs[0].slug}`);
  }, [sortedSongs]);

  return (
    <>
      <Head>
        <title>laulum.me | TKO-äly Songbook</title>
      </Head>
      <header style={{ display: "flex", gap: "1rem", alignItems: "center" }}>
        <h1 className={merriweather.className}>laulum.me</h1>
        {promptToUpdate && (
          <Button style={{ padding: ".5rem" }} onClick={updateWorker}>
            ⟳ Update
          </Button>
        )}
        <Logo style={{ marginLeft: "auto" }} />
      </header>
      <main>
        <form onSubmit={handleSubmit}>
          <Input
            placeholder="Type song name and press enter/submit"
            value={query}
            onChange={updateQuery}
          />
        </form>
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
            gap: "1rem",
            alignItems: "center",
          }}
        >
          {sortedSongs.map(({ title, slug, score }) => (
            <Link
              key={title}
              href={`/songs/${slug}`}
              style={{ width: "100%", opacity: Math.max(score, 20) / 100 }}
            >
              {title}
            </Link>
          ))}
        </div>
      </main>
      <footer style={{ marginBlock: "2rem", textAlign: "center" }}>
        <Link
          href="https://github.com/TKOaly/laulum.me"
          variant="primary"
          target="_blank"
          rel="noreferrer noopener"
        >
          Contribute a song on GitHub
        </Link>
      </footer>
    </>
  );
};

export default Index;
