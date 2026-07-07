import { NombaApi } from "@/services/nomba/nomba-api";
import { NombaProvider } from "@/services/nomba/provider";

const NIGERIAN_BANKS = [
  { code: "011", name: "First Bank of Nigeria" },
  { code: "014", name: "Moniepoint Microfinance Bank" },
  { code: "033", name: "United Bank for Africa (UBA)" },
  { code: "044", name: "Access Bank" },
  { code: "050", name: "Ecobank Nigeria" },
  { code: "057", name: "Zenith Bank" },
  { code: "058", name: "GTBank (Guaranty Trust Bank)" },
  { code: "063", name: "Diamond Bank (now Access)" },
  { code: "068", name: "Standard Chartered Bank" },
  { code: "070", name: "Fidelity Bank" },
  { code: "076", name: "Polaris Bank" },
  { code: "082", name: "Keystone Bank" },
  { code: "084", name: "First City Monument Bank (FCMB)" },
  { code: "085", name: "Unity Bank" },
  { code: "101", name: "Providus Bank" },
  { code: "214", name: "Afribank (now Main Street)" },
  { code: "215", name: "Sterling Bank" },
  { code: "221", name: "Stanbic IBTC Bank" },
  { code: "232", name: "CitiBank Nigeria" },
  { code: "301", name: "Jaiz Bank" },
  { code: "303", name: "Chartered Bank" },
  { code: "305", name: "Paycom (Opay)" },
  { code: "309", name: "Kuda Bank" },
  { code: "315", name: "Paga" },
  { code: "323", name: "Access Money" },
  { code: "327", name: "Paga" },
  { code: "329", name: "PalmPay" },
  { code: "502", name: "Rand Merchant Bank" },
  { code: "503", name: "Globus Bank" },
  { code: "504", name: "Titan Bank" },
  { code: "505", name: "Mint Finex MFB" },
  { code: "506", name: "Mutual Trust Microfinance Bank" },
];

const api = new NombaApi();
const provider = new NombaProvider();

export const nombaService = {
  getBanks() {
    return NIGERIAN_BANKS;
  },

  lookupAccount(accountNumber: string, bankCode: string) {
    return api.lookupAccount(accountNumber, bankCode);
  },

  provider,
};
