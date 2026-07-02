"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function revalidateAfterBusinessChange() {
  // Revalidate the layout and all pages that depend on user/business data
  revalidatePath("/", "layout"); // This revalidates the entire layout
  revalidatePath("/"); // Revalidate the root page
  revalidatePath("/businesses"); // Revalidate businesses page

  // Redirect to home after revalidating
  redirect("/");
}

export async function redirectAfterAccountDeletion() {
  revalidatePath("/", "layout");
  redirect("/");
}

export async function revalidateAfterCheckout() {
  revalidatePath("/", "layout");
  redirect("/");
}
