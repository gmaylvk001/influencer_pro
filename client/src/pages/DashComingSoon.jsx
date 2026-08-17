export default function DashComingSoon({ title }) {
  return (
    <div className="surface-panel flex flex-col items-center gap-2 p-14 text-center">
      <p className="font-display text-lg font-bold">{title}</p>
      <p className="max-w-sm text-sm text-muted-foreground">
        This section hasn't been built out yet — send over what it should contain and it'll be
        added here.
      </p>
    </div>
  );
}