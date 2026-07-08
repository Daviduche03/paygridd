import { Routes, Route, Navigate, Outlet } from "react-router-dom";
import { ThemeProvider } from "@/components/theme-provider";
import { SidebarLayout } from "@/components/sidebar";
import { RootPage } from "@/components/root-page";

import LoginPage from "@/pages/login";
import VerifyPage from "@/pages/verify";
import OnboardingPage from "@/pages/onboarding";
import BusinessesPage from "@/pages/businesses";
import MfaSetupPage from "@/pages/mfa/setup";
import MfaVerifyPage from "@/pages/mfa/verify";
import OverviewPage from "@/pages/overview";
import TransactionsPage from "@/pages/transactions";
import InvoicesPage from "@/pages/invoices";
import VirtualAccountsPage from "@/pages/virtual-accounts";
import ReconciliationPage from "@/pages/reconciliation";
import AutomationPage from "@/pages/automation";
import CustomersPage from "@/pages/customers";
import AccountPage from "@/pages/account";
import AccountSecurityPage from "@/pages/account/security";
import AccountBusinessesPage from "@/pages/account/businesses";
import AccountDateLocalePage from "@/pages/account/date-and-locale";
import AccountSupportPage from "@/pages/account/support";
import SettingsPage from "@/pages/settings";
import SettingsMembersPage from "@/pages/settings/members";
import SettingsDeveloperPage from "@/pages/settings/developer";
import SettingsKycPage from "@/pages/settings/kyc";
import SettingsPayoutsPage from "@/pages/settings/payouts";
import OAuthAuthorizePage from "@/pages/oauth/authorize";
import InvoicePublicPage from "@/pages/invoice-public";
import { hasAuthToken } from "@/utils/session";

function PublicRoute() {
  return <Outlet />;
}

function AuthRoute() {
  if (!hasAuthToken()) return <Navigate to="/login" replace />;
  return <Outlet />;
}

export default function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/" element={<RootPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/verify" element={<VerifyPage />} />
          <Route path="/p/:portalId" element={<div>Portal</div>} />
          <Route path="/s/:shortId" element={<div>Short Link</div>} />
          <Route path="/i/:token" element={<InvoicePublicPage />} />
          <Route path="/oauth-callback" element={<div>OAuth Callback</div>} />
          <Route path="/connectors/callback" element={<div>Connectors Callback</div>} />
        </Route>

        <Route element={<AuthRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
          <Route path="/businesses" element={<BusinessesPage />} />
          <Route path="/teams" element={<Navigate to="/businesses" replace />} />
          <Route path="/mfa/setup" element={<MfaSetupPage />} />
          <Route path="/mfa/verify" element={<MfaVerifyPage />} />
          <Route path="/oauth/authorize" element={<OAuthAuthorizePage />} />

          <Route element={<SidebarLayout />}>
            <Route path="/overview" element={<OverviewPage />} />
            <Route path="/transactions" element={<TransactionsPage />} />
            <Route path="/invoices" element={<InvoicesPage />} />
            <Route path="/virtual-accounts" element={<VirtualAccountsPage />} />
            <Route path="/reconciliation" element={<ReconciliationPage />} />
            <Route path="/automation" element={<AutomationPage />} />
            <Route path="/customers" element={<CustomersPage />} />
            <Route path="/account" element={<AccountPage />} />
            <Route path="/account/security" element={<AccountSecurityPage />} />
            <Route path="/account/businesses" element={<AccountBusinessesPage />} />
            <Route path="/account/teams" element={<Navigate to="/account/businesses" replace />} />
            <Route path="/account/date-and-locale" element={<AccountDateLocalePage />} />
            <Route path="/account/support" element={<AccountSupportPage />} />
            <Route path="/settings" element={<SettingsPage />} />
            <Route path="/settings/members" element={<SettingsMembersPage />} />
            <Route path="/settings/developer" element={<SettingsDeveloperPage />} />
            <Route path="/settings/kyc" element={<SettingsKycPage />} />
            <Route path="/settings/payouts" element={<SettingsPayoutsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </ThemeProvider>
  );
}