import { getPublicVibe } from "@/app/actions/workflow";
import { notFound } from "next/navigation";
import VibeClientView from "./VibeClientView";

export const dynamic = 'force-dynamic';

export default async function SharedVibePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vibe = await getPublicVibe(id);

  if (!vibe) {
    notFound();
  }

  return <VibeClientView vibe={vibe} />;
}