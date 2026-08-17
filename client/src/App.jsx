import { BrowserRouter, Routes, Route, Link, Navigate, useLocation } from "react-router";
import { AnimatePresence } from "framer-motion";
import { Toaster } from "@/components/ui/sonner";
import { AuthProvider } from "@/lib/AuthContext";
import { SocketProvider } from "@/lib/SocketContext";
import { ThemeProvider } from "@/lib/ThemeContext";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { DashboardLayout } from "@/components/site/DashboardLayout";
import { AdminLayout } from "@/components/site/AdminLayout";
import { GuestOnlyRoute } from "@/components/site/RouteGuards";
import { PageTransition } from "@/components/motion/PageTransition";
import { ScrollProgressBar } from "@/components/motion/ScrollProgressBar";
import Home from "@/pages/Home";
import Influencers from "@/pages/Influencers";
import InfluencerProfile from "@/pages/InfluencerProfile";
import Auth from "@/pages/Auth";
import Dashboard from "@/pages/Dashboard";
import DashCampaigns from "@/pages/DashCampaigns";
import CreateCampaign from "@/pages/CreateCampaign";
import EditCampaign from "@/pages/EditCampaign";
import DashOffers from "@/pages/DashOffers";
import Workroom from "@/pages/Workroom";
import DashEarnings from "@/pages/DashEarnings";
import DashUnlocks from "@/pages/DashUnlocks";
import DashInterests from "@/pages/DashInterests";
import DashOthers from "@/pages/DashOthers";
import DashComingSoon from "@/pages/DashComingSoon";
import DashMessages from "@/pages/DashMessages";
import DashProfile from "@/pages/DashProfile";
import BuyConnects from "@/pages/BuyConnects";
import ConnectWallet from "@/pages/ConnectWallet";
import ConnectPurchaseHistory from "@/pages/ConnectPurchaseHistory";
import PackagePurchaseHistory from "@/pages/PackagePurchaseHistory";
import AdminCatalog from "@/pages/AdminCatalog";
import AdminVerification from "@/pages/AdminVerification";
import AdminDashboard from "@/pages/AdminDashboard";
import AdminUsers from "@/pages/AdminUsers";
import AdminCampaigns from "@/pages/AdminCampaigns";
import AdminTransactions from "@/pages/AdminTransactions";
import Contact from "@/pages/Contact";
import ForBrands from "@/pages/ForBrands";
import SignupBrand from "@/pages/SignupBrand";
import SignupInfluencer from "@/pages/SignupInfluencer";
import SignupAdmin from "@/pages/SignupAdmin";

function SiteLayout({ children }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>{children}</PageTransition>
      <SiteFooter />
    </>
  );
}

// Same as SiteLayout but without the footer — used for the brand's
// influencer-browsing page reached from the dashboard navbar, which
// already omits the marketing footer to keep focus on the results.
function SiteLayoutNoFooter({ children }) {
  return (
    <>
      <SiteHeader />
      <PageTransition>{children}</PageTransition>
    </>
  );
}

function AnimatedRoutes() {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <Routes location={location} key={location.pathname}>
        {/* Dashboard routes — own layout with tabs */}
        <Route path="/dashboard" element={<DashboardLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="influencers" element={<Influencers isDashboard={true} />} />
          <Route path="influencers/:id" element={<InfluencerProfile isDashboard={true} fetchOwnProfile={false} />} />
          <Route path="campaigns" element={<DashCampaigns />} />
          <Route path="campaigns/new" element={<CreateCampaign />} />
          <Route path="campaigns/:id/edit" element={<EditCampaign />} />
          <Route path="offers" element={<DashOffers />} />
          <Route path="workroom/:id" element={<Workroom />} />
          <Route path="messages" element={<DashMessages />} />
          <Route path="interests" element={<DashInterests />} />
          <Route path="unlocks" element={<DashUnlocks />} />
          <Route path="earnings" element={<DashEarnings />} />
          <Route path="purchases" element={<Navigate to="/dashboard/purchases/buy-connects" replace />} />
          <Route path="purchases/buy-connects" element={<BuyConnects />} />
          <Route path="purchases/wallet" element={<ConnectWallet />} />
          <Route path="purchases/connect-history" element={<ConnectPurchaseHistory />} />
          <Route path="purchases/package-history" element={<PackagePurchaseHistory />} />
          <Route path="others" element={<DashOthers />} />
          <Route path="public-profile" element={<InfluencerProfile isDashboard={true} fetchOwnProfile={true} />} />
          <Route path="profile" element={<DashProfile />} />
          <Route path="support" element={<Contact />} />
        </Route>

        {/* Admin Dashboard Routes - Dedicated Layout */}
        <Route path="/dashboard/admin" element={<AdminLayout />}>
          <Route path="overview" element={<AdminDashboard />} />
          <Route path="users" element={<AdminUsers />} />
          <Route path="campaigns" element={<AdminCampaigns />} />
          <Route path="transactions" element={<AdminTransactions />} />
          <Route path="catalog" element={<AdminCatalog />} />
          <Route path="verification" element={<AdminVerification />} />
        </Route>

        {/* Public site routes */}
        <Route
          path="/"
          element={
            <GuestOnlyRoute>
              <SiteLayout>
                <Home />
              </SiteLayout>
            </GuestOnlyRoute>
          }
        />
        <Route
          path="/influencers"
          element={
            <SiteLayoutNoFooter>
              <Influencers />
            </SiteLayoutNoFooter>
          }
        />
        <Route
          path="/influencers/:id"
          element={
            <SiteLayoutNoFooter>
              <InfluencerProfile />
            </SiteLayoutNoFooter>
          }
        />
        <Route
          path="/auth"
          element={
            <SiteLayout>
              <Auth />
            </SiteLayout>
          }
        />
        <Route
          path="/contact"
          element={
            <SiteLayout>
              <Contact />
            </SiteLayout>
          }
        />
        <Route
          path="/for-brands"
          element={
            <SiteLayout>
              <ForBrands />
            </SiteLayout>
          }
        />
        <Route
          path="/signup/brand"
          element={
            <SiteLayout>
              <SignupBrand />
            </SiteLayout>
          }
        />
        <Route
          path="/signup/influencer"
          element={
            <SiteLayout>
              <SignupInfluencer />
            </SiteLayout>
          }
        />
        <Route
          path="/signup/admin"
          element={
            <SiteLayout>
              <SignupAdmin />
            </SiteLayout>
          }
        />
        <Route
          path="*"
          element={
            <SiteLayout>
              <main className="mx-auto flex min-h-[60vh] w-full max-w-2xl flex-col items-center justify-center px-4 py-24 text-center">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-primary">404</p>
                <h1 className="mt-3 font-display text-3xl font-bold sm:text-4xl">Page not found</h1>
                <p className="mt-3 text-sm text-muted-foreground">
                  The page you're looking for doesn't exist or may have moved.
                </p>
                <Link
                  to="/"
                  className="mt-8 inline-flex h-10 items-center justify-center rounded-md bg-[image:var(--gradient-mint)] px-5 text-sm font-semibold text-primary-foreground"
                >
                  Back to home
                </Link>
              </main>
            </SiteLayout>
          }
        />
      </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <AuthProvider>
          <SocketProvider>
            <div className="min-h-screen">
              <ScrollProgressBar />
              <Toaster position="bottom-right" />
              <AnimatedRoutes />
            </div>
          </SocketProvider>
        </AuthProvider>
      </BrowserRouter>
    </ThemeProvider>
  );
}
