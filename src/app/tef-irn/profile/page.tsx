import { redirect } from "next/navigation";

export default function ProfileRedirect() {
  redirect("/tef-irn/settings?section=profile");
}
