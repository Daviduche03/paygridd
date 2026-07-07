import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { inviteRepository } from "@/repositories/invite.repository";
import { membershipRepository } from "@/repositories/membership.repository";
import { userRepository } from "@/repositories/user.repository";
import { businessService } from "@/services/business.service";
import { membersService } from "@/services/members.service";
import { nombaService } from "@/services/nomba/service";
import { overviewService } from "@/services/overview.service";
import {
  protectedProcedure,
  publicProcedure,
  roleProtectedProcedure,
  t,
} from "@/trpc/init";

const businessRoleSchema = z.enum(["owner", "admin", "member"]);

export const businessRouter = t.router({
  list: protectedProcedure.query(async ({ ctx }) => {
    let businessIds = await membershipRepository.findUserBusinessIds(
      ctx.user.id,
    );
    if (businessIds.length === 0) {
      const user = await userRepository.findById(ctx.user.id);
      if (user?.businessId) {
        businessIds = [user.businessId];
      }
    }
    const businesses = await Promise.all(
      businessIds.map((id) => businessService.getBusinessById(id)),
    );
    return businesses.filter(Boolean);
  }),

  current: protectedProcedure.query(async ({ ctx }) => {
    const user = await userRepository.findById(ctx.user.id);
    if (!user?.businessId) return null;
    return businessService.getBusinessById(user.businessId);
  }),

  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1, "Business name is required"),
        baseCurrency: z.string().optional(),
        countryCode: z.string().optional(),
        fiscalYearStartMonth: z.number().optional(),
        companyType: z.string().optional(),
        heardAbout: z.string().optional(),
      }),
    )
    .mutation(async ({ ctx, input }) =>
      businessService.createBusiness({ ...input, userId: ctx.user.id }),
    ),

  get: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const membership = await membershipRepository.findOne(
        ctx.user.id,
        input.id,
      );
      if (!membership)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Business not found",
        });
      return businessService.getBusinessById(input.id);
    }),

  update: protectedProcedure
    .input(z.object({ id: z.string().optional(), name: z.string().optional() }))
    .mutation(async () => ({ success: true })),

  updateSettlementAccount: protectedProcedure
    .input(
      z.object({
        settlementBankName: z.string().min(1),
        settlementBankCode: z.string().min(1),
        settlementAccountNumber: z.string().min(10).max(10),
        settlementAccountName: z.string().min(1),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const user = await userRepository.findById(ctx.user.id);
      if (!user?.businessId) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "No business found",
        });
      }
      return businessService.updateSettlementAccount(user.businessId, input);
    }),

  members: roleProtectedProcedure().query(async ({ ctx }) => {
    return membersService.getMembers(ctx.businessId!);
  }),

  connectionStatus: protectedProcedure.query(async () => ({
    bankConnections: [],
    inboxAccounts: [],
  })),

  acceptInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return membersService.acceptInvite(input.inviteId, ctx.user.id);
    }),

  declineInvite: protectedProcedure
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await inviteRepository.findById(input.inviteId);
      if (!invite)
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      const user = await userRepository.findById(ctx.user.id);
      if (!user || user.email !== invite.email) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "This invite is not for you",
        });
      }
      return membersService.declineInvite(input.inviteId);
    }),

  delete: roleProtectedProcedure("owner")
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.businessId !== input.id) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "You can only delete your own business",
        });
      }
      await businessService.deleteBusiness(input.id);
      return { success: true };
    }),

  deleteInvite: roleProtectedProcedure("owner", "admin")
    .input(z.object({ inviteId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const invite = await inviteRepository.findById(input.inviteId);
      if (!invite || invite.businessId !== ctx.businessId) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      }
      return membersService.deleteInvite(input.inviteId);
    }),

  deleteMember: roleProtectedProcedure("owner", "admin")
    .input(z.object({ memberId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return membersService.removeMember(ctx.businessId!, input.memberId);
    }),

  invite: roleProtectedProcedure("owner", "admin")
    .input(
      z.array(
        z.object({
          email: z.string().email(),
          role: businessRoleSchema,
        }),
      ),
    )
    .mutation(async ({ ctx, input }) => {
      return membersService.inviteMembers({
        businessId: ctx.businessId!,
        invites: input,
        invitedByUserId: ctx.user.id,
      });
    }),

  invitesByEmail: protectedProcedure.query(async ({ ctx }) => {
    const user = await userRepository.findById(ctx.user.id);
    if (!user?.email) return [];
    return membersService.getUserInvites(user.email);
  }),

  leave: protectedProcedure
    .input(z.object({ businessId: z.string() }))
    .mutation(async ({ ctx, input }) => {
      return membersService.leaveBusiness(ctx.user.id, input.businessId);
    }),

  businessInvites: roleProtectedProcedure("owner", "admin").query(
    async ({ ctx }) => {
      return membersService.getBusinessInvites(ctx.businessId!);
    },
  ),

  updateBaseCurrency: protectedProcedure
    .input(z.object({ currency: z.string() }))
    .mutation(async () => ({ success: true })),

  updateMember: roleProtectedProcedure("owner", "admin")
    .input(
      z.object({
        memberId: z.string(),
        role: businessRoleSchema.optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (input.role) {
        const members = await membershipRepository.findByBusiness(
          ctx.businessId!,
        );
        const target = members.find((m) => m.id === input.memberId);
        if (!target)
          throw new TRPCError({
            code: "NOT_FOUND",
            message: "Member not found",
          });
        if (input.role === "owner" && ctx.membershipRole !== "owner") {
          throw new TRPCError({
            code: "FORBIDDEN",
            message: "Only owners can promote to owner",
          });
        }
        return membersService.updateMemberRole(input.memberId, input.role);
      }
      return { success: true };
    }),
});

export const banksRouter = t.router({
  list: publicProcedure.query(async () => nombaService.getBanks()),
  verify: publicProcedure
    .input(z.object({ accountNumber: z.string(), bankCode: z.string() }))
    .mutation(async ({ input }) =>
      nombaService.lookupAccount(input.accountNumber, input.bankCode),
    ),
});

const FALLBACK_INSTITUTIONS = [
  {
    id: "ng_001",
    name: "First Bank of Nigeria",
    logo: null,
    popularity: 100,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_002",
    name: "GTBank (Guaranty Trust Bank)",
    logo: null,
    popularity: 95,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_003",
    name: "Access Bank",
    logo: null,
    popularity: 90,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_004",
    name: "Zenith Bank",
    logo: null,
    popularity: 85,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_005",
    name: "United Bank for Africa (UBA)",
    logo: null,
    popularity: 80,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_006",
    name: "Kuda Bank",
    logo: null,
    popularity: 75,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_007",
    name: "Moniepoint Microfinance Bank",
    logo: null,
    popularity: 70,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
  {
    id: "ng_008",
    name: "Opay",
    logo: null,
    popularity: 65,
    availableHistory: 90,
    maximumConsentValidity: null,
    provider: "nomba",
    type: null,
    countries: ["NG"],
  },
];

export const institutionsRouter = t.router({
  get: publicProcedure
    .input(z.object({ q: z.string(), countryCode: z.string() }))
    .query(async ({ input }) => {
      const q = input.q?.toLowerCase() ?? "";
      return FALLBACK_INSTITUTIONS.filter((inst) => {
        if (!inst.countries.includes(input.countryCode)) return false;
        if (!q) return true;
        return inst.name.toLowerCase().includes(q);
      });
    }),
  updateUsage: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async () => null),
});

export const overviewRouter = t.router({
  summary: protectedProcedure.query(async ({ ctx }) =>
    overviewService.getSummary(ctx.user.id),
  ),
});
