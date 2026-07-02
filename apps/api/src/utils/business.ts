import { userRepository } from "@/repositories/user.repository";

export async function getBusinessIdForUser(userId: string) {
  const user = await userRepository.findById(userId);
  return user?.businessId ?? null;
}
