import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";

export const revalidate = 0;

export default async function OrdersPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/auth/login?callbackUrl=/profile?tab=orders");
  }

  redirect("/profile?tab=orders");
}
