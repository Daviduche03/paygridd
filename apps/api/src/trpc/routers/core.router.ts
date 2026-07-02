import { z } from "zod";
import { overviewService } from "@/services/overview.service";
import { nombaService } from "@/services/nomba/service";
import { businessService } from "@/services/business.service";
import { userRepository } from "@/repositories/user.repository";
import {
  protectedProcedure,
  publicProcedure,
  stubList,
  stubMutation,
  stubQuery,
  t,
} from "@/trpc/init";

export const businessRouter = t.router({
  list: protectedProcedure.query(async () => businessService.getAllBusinesses()),
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
    .query(async ({ input }) => businessService.getBusinessById(input.id)),
  update: protectedProcedure
    .input(z.object({ id: z.string().optional(), name: z.string().optional() }))
    .mutation(async () => ({ success: true })),
  members: stubList(),
  connectionStatus: protectedProcedure.query(async () => ({
    bankConnections: [],
    inboxAccounts: [],
  })),
  acceptInvite: stubMutation(z.object({ inviteId: z.string() })),
  declineInvite: stubMutation(z.object({ inviteId: z.string() })),
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ input }) => {
      await businessService.deleteBusiness(input.id);
      return { success: true };
    }),
  deleteInvite: stubMutation(z.object({ inviteId: z.string() })),
  deleteMember: stubMutation(z.object({ memberId: z.string() })),
  exportAllData: stubQuery(),
  invite: stubMutation(z.object({ email: z.string() })),
  invitesByEmail: stubList(),
  leave: stubMutation(z.object({ businessId: z.string() })),
  businessInvites: stubList(),
  updateBaseCurrency: stubMutation(z.object({ currency: z.string() })),
  updateMember: stubMutation(
    z.object({ memberId: z.string(), role: z.string().optional() }),
  ),
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
  { id: "ng_001", name: "First Bank of Nigeria", logo: null, popularity: 100, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_002", name: "GTBank (Guaranty Trust Bank)", logo: null, popularity: 95, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_003", name: "Access Bank", logo: null, popularity: 90, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_004", name: "Zenith Bank", logo: null, popularity: 85, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_005", name: "United Bank for Africa (UBA)", logo: null, popularity: 80, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_006", name: "Kuda Bank", logo: null, popularity: 75, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_007", name: "Moniepoint Microfinance Bank", logo: null, popularity: 70, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
  { id: "ng_008", name: "Opay", logo: null, popularity: 65, availableHistory: 90, maximumConsentValidity: null, provider: "gocardless", type: null, countries: ["NG"] },
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
  summary: protectedProcedure.query(async ({ ctx }) => overviewService.getSummary(ctx.user.id)),
});
