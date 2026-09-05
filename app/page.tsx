"use client";

import { useState } from "react";
import IdeaForm, { type Idea } from "@/components/IdeaForm";
import ResultsList from "@/components/ResultsList";

export default function Home() {
  const [ideas, setIdeas] = useState<Idea[]>([]);
  const [source, setSource] = useState<"llm" | "fallback">("fallback");
  const [lastInput, setLastInput] = useState<{ interests: string[]; skills: string[] }>({ interests: [], skills: [] });

  return (
    <main className="wrap">
      <header className="page-header">
        <div className="kicker">IdeaForge · capstone project advisor</div>
        <h1>Tell us what you know. Get a project you can finish.</h1>
        <p className="lead">
          Ranked, fully-specified project ideas — each with a visible reason for its ranking and a
          week-by-week build order. Like a professor in your pocket.
        </p>
      </header>

      <IdeaForm
        onGenerated={(newIdeas, newSource, input) => {
          setIdeas(newIdeas);
          setSource(newSource);
          setLastInput(input);
        }}
      />

      <div style={{ height: 30 }} />

      <ResultsList
        ideas={ideas}
        source={source}
        interests={lastInput.interests}
        skills={lastInput.skills}
      />
    </main>
  );
}