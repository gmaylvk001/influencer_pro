import { useState, useEffect } from "react";
import { Lock, Bell, Download, ShieldCheck, Mail, MessageSquare, Megaphone, CheckCircle2 } from "lucide-react";
import { auth as authApi } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

export default function DashOthers() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState("security");
  
  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="font-display text-2xl font-bold flex items-center gap-2">
          <ShieldCheck className="size-6 text-primary" />
          Settings & Privacy
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Manage your account security, notification preferences, and privacy data.
        </p>
      </div>

      <div className="flex flex-col sm:flex-row gap-8">
        {/* Sidebar Nav */}
        <div className="w-full sm:w-64 shrink-0 space-y-1">
          <button
            onClick={() => setActiveTab("security")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "security" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Lock className="size-4" />
            Account Security
          </button>
          <button
            onClick={() => setActiveTab("notifications")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "notifications" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Bell className="size-4" />
            Notifications
          </button>
          <button
            onClick={() => setActiveTab("privacy")}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-semibold transition-colors ${
              activeTab === "privacy" ? "bg-foreground text-background" : "text-muted-foreground hover:bg-muted/50 hover:text-foreground"
            }`}
          >
            <Download className="size-4" />
            Privacy & Data
          </button>
        </div>

        {/* Content Area */}
        <div className="flex-1 min-w-0">
          {activeTab === "security" && <SecurityTab />}
          {activeTab === "notifications" && <NotificationsTab user={user} />}
          {activeTab === "privacy" && <PrivacyTab />}
        </div>
      </div>
    </div>
  );
}

function SecurityTab() {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [busy, setBusy] = useState(false);

  async function handleSave(e) {
    e.preventDefault();
    if (form.newPassword !== form.confirmPassword) {
      return toast.error("New passwords do not match");
    }
    setBusy(true);
    try {
      await authApi.updateSettings({
        currentPassword: form.currentPassword,
        newPassword: form.newPassword
      });
      toast.success("Password updated successfully!");
      setForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
    } catch (err) {
      toast.error(err.message || "Failed to update password");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-panel p-6 sm:p-8">
      <h3 className="font-display text-lg font-bold mb-6">Change Password</h3>
      <form onSubmit={handleSave} className="space-y-4 max-w-sm">
        <div className="space-y-2">
          <Label>Current Password</Label>
          <Input 
            type="password" 
            value={form.currentPassword} 
            onChange={e => setForm(p => ({ ...p, currentPassword: e.target.value }))}
            required 
          />
        </div>
        <div className="space-y-2">
          <Label>New Password</Label>
          <Input 
            type="password" 
            value={form.newPassword} 
            onChange={e => setForm(p => ({ ...p, newPassword: e.target.value }))}
            required 
            minLength={6}
          />
        </div>
        <div className="space-y-2">
          <Label>Confirm New Password</Label>
          <Input 
            type="password" 
            value={form.confirmPassword} 
            onChange={e => setForm(p => ({ ...p, confirmPassword: e.target.value }))}
            required 
            minLength={6}
          />
        </div>
        <Button type="submit" variant="hero" className="w-full mt-2" disabled={busy}>
          {busy ? "Updating..." : "Update Password"}
        </Button>
      </form>
    </div>
  );
}

function NotificationsTab({ user }) {
  const [prefs, setPrefs] = useState({
    emailAlerts: true,
    smsAlerts: false,
    marketing: false
  });
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (user?.notificationPreferences) {
      setPrefs(user.notificationPreferences);
    }
  }, [user]);

  async function handleSave() {
    setBusy(true);
    try {
      await authApi.updateSettings({ notificationPreferences: prefs });
      toast.success("Notification preferences saved!");
    } catch (err) {
      toast.error(err.message || "Failed to save preferences");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="surface-panel p-6 sm:p-8">
      <h3 className="font-display text-lg font-bold mb-6">Notification Preferences</h3>
      <div className="space-y-6">
        
        <div className="flex items-start gap-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Mail className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Email Alerts</h4>
            <p className="text-sm text-muted-foreground mt-0.5">Receive emails when you get new offers or messages.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={prefs.emailAlerts} onChange={e => setPrefs(p => ({...p, emailAlerts: e.target.checked}))} />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-start gap-4 border-t border-border pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <MessageSquare className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">SMS Alerts</h4>
            <p className="text-sm text-muted-foreground mt-0.5">Get text messages for urgent campaign updates.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={prefs.smsAlerts} onChange={e => setPrefs(p => ({...p, smsAlerts: e.target.checked}))} />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="flex items-start gap-4 border-t border-border pt-6">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-muted">
            <Megaphone className="size-5 text-muted-foreground" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-sm">Marketing & News</h4>
            <p className="text-sm text-muted-foreground mt-0.5">Receive tips, platform updates, and promotional content.</p>
          </div>
          <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" className="sr-only peer" checked={prefs.marketing} onChange={e => setPrefs(p => ({...p, marketing: e.target.checked}))} />
            <div className="w-11 h-6 bg-muted peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
          </label>
        </div>

        <div className="pt-4 flex justify-end">
          <Button onClick={handleSave} disabled={busy} variant="hero">
            <CheckCircle2 className="mr-2 size-4" />
            {busy ? "Saving..." : "Save Preferences"}
          </Button>
        </div>
      </div>
    </div>
  );
}

function PrivacyTab() {
  const [downloading, setDownloading] = useState(false);

  async function handleExport() {
    setDownloading(true);
    try {
      const blob = await authApi.exportData();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "influbrand_data_export.json";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
      toast.success("Data export complete!");
    } catch (err) {
      toast.error("Failed to export data");
    } finally {
      setDownloading(false);
    }
  }

  return (
    <div className="surface-panel p-6 sm:p-8">
      <h3 className="font-display text-lg font-bold mb-6">Privacy & Data</h3>
      <div className="space-y-4 max-w-md">
        <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900 rounded-xl p-5">
          <h4 className="font-semibold text-sm text-blue-900 dark:text-blue-100 flex items-center gap-2">
            <Download className="size-4" />
            Export My Data
          </h4>
          <p className="text-sm text-blue-800/80 dark:text-blue-200/80 mt-2">
            Download a copy of all the data associated with your account, including your profile, preferences, and activity. This file is in JSON format.
          </p>
          <Button onClick={handleExport} disabled={downloading} className="mt-4 w-full bg-blue-600 hover:bg-blue-700 text-white">
            {downloading ? "Generating File..." : "Request Data Export"}
          </Button>
        </div>
      </div>
    </div>
  );
}
