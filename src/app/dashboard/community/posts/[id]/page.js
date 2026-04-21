import { redirect } from "next/navigation";

export default async function CommunityPostRedirect({ params }) {
  const { id } = await params;
  redirect(`/dashboard/community?post=${encodeURIComponent(id)}`);
}
