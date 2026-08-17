import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Plus, RotateCcw, Ban, Loader2, Layers, Tags } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { catalog } from "@/lib/api";
import { useAuth } from "@/lib/AuthContext";

function CatalogPanel({ title, icon: Icon, list, create, update, deactivate }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [togglingId, setTogglingId] = useState(null);

  function load() {
    setLoading(true);
    list()
      .then(setItems)
      .catch(() => setItems([]))
      .finally(() => setLoading(false));
  }

  useEffect(load, []);

  async function handleAdd(e) {
    e.preventDefault();
    if (!name.trim()) return;
    setBusy(true);
    try {
      await create({ name: name.trim() });
      setName("");
      toast.success(`${title.slice(0, -1)} added.`);
      load();
    } catch (err) {
      toast.error(err.message || "Failed to add.");
    } finally {
      setBusy(false);
    }
  }

  async function toggle(item) {
    setTogglingId(item._id);
    try {
      if (item.isActive) {
        await deactivate(item._id);
      } else {
        await update(item._id, { isActive: true });
      }
      load();
    } catch (err) {
      toast.error(err.message || "Failed to update.");
    } finally {
      setTogglingId(null);
    }
  }

  const activeCount = items.filter(i => i.isActive).length;

  return (
    <div className="surface-panel p-6 flex flex-col h-full">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Icon className="size-4" />
          </div>
          <h3 className="font-display text-xl font-semibold tracking-tight">{title}</h3>
        </div>
        {!loading && (
          <span className="flex items-center justify-center rounded-full bg-muted px-2.5 py-0.5 text-xs font-semibold text-muted-foreground">
            {activeCount} Active
          </span>
        )}
      </div>
      
      <p className="text-xs text-muted-foreground mb-6">
        Deactivating hides it from new selections without breaking existing references.
      </p>

      <form onSubmit={handleAdd} className="flex gap-2 mb-6">
        <Input 
          value={name} 
          onChange={(e) => setName(e.target.value)} 
          placeholder={`New ${title.toLowerCase().slice(0, -1)} name`} 
          className="bg-muted/30 focus-visible:ring-primary border-border"
        />
        <Button type="submit" variant="hero" size="sm" disabled={busy || !name.trim()} className="w-24">
          {busy ? <Loader2 className="size-4 animate-spin" /> : <><Plus className="size-4" /> Add</>}
        </Button>
      </form>

      <div className="flex-1 overflow-y-auto max-h-[400px] pr-2 space-y-2">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
            <Loader2 className="size-6 animate-spin mb-2 opacity-50" />
            <p className="text-sm">Loading {title.toLowerCase()}...</p>
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground rounded-xl border border-dashed border-border/60 bg-muted/20">
            <p className="text-sm">No {title.toLowerCase()} yet.</p>
          </div>
        ) : (
          items.map((item) => (
            <div 
              key={item._id} 
              className={`flex items-center justify-between p-3 rounded-lg border transition-all ${
                item.isActive 
                  ? "border-border/60 bg-card hover:border-border hover:shadow-sm" 
                  : "border-transparent bg-muted/40 opacity-75"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className={`text-sm font-medium ${item.isActive ? "text-foreground" : "text-muted-foreground line-through decoration-muted-foreground/50"}`}>
                  {item.name}
                </span>
                {!item.isActive && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-muted-foreground bg-muted/80 px-1.5 py-0.5 rounded">
                    Inactive
                  </span>
                )}
              </div>
              <button
                onClick={() => toggle(item)}
                disabled={togglingId === item._id}
                className={`inline-flex items-center justify-center size-8 rounded-full transition-colors ${
                  item.isActive 
                    ? "text-muted-foreground hover:bg-destructive/10 hover:text-destructive" 
                    : "text-muted-foreground hover:bg-primary/10 hover:text-primary"
                }`}
                title={item.isActive ? "Deactivate" : "Reactivate"}
              >
                {togglingId === item._id ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : item.isActive ? (
                  <Ban className="size-4" />
                ) : (
                  <RotateCcw className="size-4" />
                )}
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default function AdminCatalog() {
  const { accountType } = useAuth();

  if (accountType !== "admin") {
    return (
      <div className="surface-panel p-12 text-center">
        <p className="font-display text-lg">Admins only</p>
        <p className="mt-2 text-sm text-muted-foreground">
          This page manages the Platform and Niche lists used across signup, profiles and filters.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-3xl font-bold tracking-tight">Manage Catalog</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Configure the global categories and platforms available to creators.
        </p>
      </div>
      <div className="grid gap-6 md:grid-cols-2 items-start">
        <CatalogPanel
          title="Platforms"
          icon={Layers}
          list={catalog.listAllPlatforms}
          create={catalog.createPlatform}
          update={catalog.updatePlatform}
          deactivate={catalog.deactivatePlatform}
        />
        <CatalogPanel
          title="Niches"
          icon={Tags}
          list={catalog.listAllNiches}
          create={catalog.createNiche}
          update={catalog.updateNiche}
          deactivate={catalog.deactivateNiche}
        />
      </div>
    </div>
  );
}
