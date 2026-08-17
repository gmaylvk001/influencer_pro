import { useEffect, useState } from "react";
import { X, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { admin } from "@/lib/api";
import { toast } from "sonner";

export default function AdminUserEdit({ userId, onClose, onUpdated }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    city: ""
  });

  useEffect(() => {
    admin.getUserDetails(userId)
      .then(res => {
        setUser(res.account);
        setFormData({
          fullName: res.account.fullName || "",
          email: res.account.email || "",
          phone: res.account.phone || "",
          city: res.account.city || ""
        });
      })
      .catch(err => {
        toast.error("Failed to fetch user details");
        onClose();
      })
      .finally(() => setLoading(false));
  }, [userId, onClose]);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    try {
      await admin.editUser(userId, formData);
      toast.success("User updated successfully");
      onUpdated();
      onClose();
    } catch (err) {
      toast.error(err.message || "Failed to update user");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm p-4">
      <div className="surface-panel w-full max-w-md p-6 relative animate-in zoom-in-95 duration-200">
        <button 
          onClick={onClose} 
          className="absolute right-4 top-4 text-muted-foreground hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        
        <h3 className="font-display text-2xl font-bold mb-6">Edit User Info</h3>
        
        {loading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="size-8 animate-spin text-primary" />
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Full Name</label>
              <Input 
                value={formData.fullName} 
                onChange={e => setFormData({ ...formData, fullName: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Email Address</label>
              <Input 
                type="email" 
                value={formData.email} 
                onChange={e => setFormData({ ...formData, email: e.target.value })} 
                required 
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">Phone Number</label>
              <Input 
                value={formData.phone} 
                onChange={e => setFormData({ ...formData, phone: e.target.value })} 
              />
            </div>
            <div>
              <label className="text-sm font-semibold mb-1.5 block">City</label>
              <Input 
                value={formData.city} 
                onChange={e => setFormData({ ...formData, city: e.target.value })} 
              />
            </div>
            
            <div className="pt-4 flex justify-end gap-3">
              <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving ? <Loader2 className="size-4 animate-spin mr-2" /> : null}
                Save Changes
              </Button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
