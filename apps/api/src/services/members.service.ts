import { env } from "@/config/env";
import { businessRepository } from "@/repositories/business.repository";
import { inviteRepository } from "@/repositories/invite.repository";
import type { BusinessRole } from "@/repositories/membership.repository";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { emailService } from "@/services/email.service";

export const membersService = {
  async getMembers(businessId: string) {
    const members = await membershipRepository.findByBusiness(businessId);
    return members.map((m) => ({
      id: m.id,
      userId: m.userId,
      name: m.user?.fullName ?? null,
      email: m.user?.email ?? "",
      role: m.role,
      avatarUrl: m.user?.avatarUrl ?? null,
      createdAt: m.createdAt,
    }));
  },

  async getUserRole(
    userId: string,
    businessId: string,
  ): Promise<BusinessRole | null> {
    const membership = await membershipRepository.findOne(userId, businessId);
    return membership?.role ?? null;
  },

  async inviteMembers(data: {
    businessId: string;
    invites: { email: string; role: BusinessRole }[];
    invitedByUserId: string;
  }) {
    const results: { email: string; sent: boolean; reason?: string }[] = [];

    for (const invite of data.invites) {
      const existingUser = await userRepository.findByEmail(invite.email);
      if (existingUser) {
        const alreadyMember = await membershipRepository.findOne(
          existingUser.id,
          data.businessId,
        );
        if (alreadyMember) {
          results.push({
            email: invite.email,
            sent: false,
            reason: "already_member",
          });
          continue;
        }
      }

      const pendingInvite = await inviteRepository.findPending(
        data.businessId,
        invite.email,
      );
      if (pendingInvite) {
        results.push({
          email: invite.email,
          sent: false,
          reason: "already_invited",
        });
        continue;
      }

      await inviteRepository.create({
        businessId: data.businessId,
        email: invite.email,
        role: invite.role,
        invitedBy: data.invitedByUserId,
      });

      const [business, inviter] = await Promise.all([
        businessRepository.findById(data.businessId),
        userRepository.findById(data.invitedByUserId),
      ]);
      if (business?.name) {
        emailService
          .sendMemberInvite({
            to: invite.email,
            businessName: business.name,
            invitedByName: inviter?.fullName ?? "A team member",
            inviteUrl: `${env.FRONTEND_URL}/invite`,
          })
          .catch(() => {});
      }

      results.push({ email: invite.email, sent: true });
    }

    return {
      sent: results.filter((r) => r.sent).length,
      skipped: results.filter((r) => !r.sent).length,
      results,
    };
  },

  async acceptInvite(inviteId: string, userId: string) {
    const invite = await inviteRepository.findById(inviteId);
    if (!invite || invite.status !== "pending") {
      throw new Error("Invite not found or expired");
    }

    const user = await userRepository.findById(userId);
    if (!user || user.email !== invite.email) {
      throw new Error("This invite is for a different email address");
    }

    await membershipRepository.create({
      userId,
      businessId: invite.businessId,
      role: invite.role,
    });

    await inviteRepository.updateStatus(inviteId, "accepted");

    await userRepository.switchBusiness(userId, invite.businessId);

    return { success: true, businessId: invite.businessId };
  },

  async declineInvite(inviteId: string) {
    await inviteRepository.updateStatus(inviteId, "declined");
    return { success: true };
  },

  async deleteInvite(inviteId: string) {
    await inviteRepository.remove(inviteId);
    return { success: true };
  },

  async getBusinessInvites(businessId: string) {
    return inviteRepository.findByBusiness(businessId);
  },

  async getUserInvites(email: string) {
    return inviteRepository.findByEmail(email);
  },

  async updateMemberRole(membershipId: string, role: BusinessRole) {
    const updated = await membershipRepository.updateRole(membershipId, role);
    if (!updated) throw new Error("Membership not found");
    return updated;
  },

  async removeMember(businessId: string, membershipId: string) {
    const membership = await membershipRepository.findByBusiness(businessId);
    const target = membership.find((m) => m.id === membershipId);
    if (!target) throw new Error("Member not found");
    if (target.role === "owner")
      throw new Error("Cannot remove the business owner");

    await membershipRepository.remove(membershipId);
    return { success: true };
  },

  async leaveBusiness(userId: string, businessId: string) {
    const membership = await membershipRepository.findOne(userId, businessId);
    if (!membership) throw new Error("You are not a member of this business");
    if (membership.role === "owner") {
      const count = await membershipRepository.countByBusiness(businessId);
      if (count <= 1) {
        throw new Error(
          "Cannot leave as the last owner. Delete the business instead.",
        );
      }
    }

    await membershipRepository.removeByUserAndBusiness(userId, businessId);

    const remaining = await membershipRepository.findByUser(userId);
    if (remaining.length > 0) {
      await userRepository.switchBusiness(userId, remaining[0]!.businessId);
    } else {
      await userRepository.switchBusiness(userId, "");
    }

    return { success: true };
  },
};
