import { userRepository } from "@/repositories/user.repository";

export const userService = {
  async getAllUsers() {
    return userRepository.findAll();
  },

  async getUserById(id: string) {
    return userRepository.findById(id);
  },

  async updateUser(id: string, data: Record<string, unknown>) {
    return userRepository.update(id, data);
  },

  async switchBusiness(id: string, businessId: string) {
    await userRepository.switchBusiness(id, businessId);
  },
};
