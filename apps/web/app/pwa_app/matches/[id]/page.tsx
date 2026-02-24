import { redirect } from "next/navigation";

export default async function MatchDetailRedirectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  redirect(`/matches/${id}`);
}
