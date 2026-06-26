import { redirect } from "next/navigation";

export default function ProfileRedirect() {
  redirect("/TEF_IRN/settings?section=profile");
}
