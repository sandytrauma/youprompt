import { getPublicVibe } from "@/app/actions/workflow";
import { notFound } from "next/navigation";
import VibeClientView from "./VibeClientView";

export const dynamic = 'force-dynamic';

interface SharedPageProps {
  params: Promise<{ id: string }>;
}

export default async function SharedVibePage({ params }: SharedPageProps) {
  // 1. Await the params object
  const resolvedParams = await params;
  const id = resolvedParams?.id;

  // 2. Type Guard: Handle potential null/undefined to satisfy TypeScript
  if (!id) {
    notFound();
  }

  // 3. Database Fetch
  const vibe = await getPublicVibe(id);

  if (!vibe) {
    notFound();
  }

  return <VibeClientView vibe={vibe} />;
}