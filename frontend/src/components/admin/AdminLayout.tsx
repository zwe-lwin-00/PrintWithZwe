import { useState } from "react";
import { Link, NavLink, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, Calculator, LogOut, Package, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { useAdminAuth } from "@/context/AdminAuthProvider";

export function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const [signingOut, setSigningOut] = useState(false);

  const handleLogout = async () => {
    setSigningOut(true);
    setError(null);
    try {
      await logout();
      navigate("/admin/login", { replace: true });
    } catch {
      setError("Sign out failed. Please retry.");
    } finally {
      setSigningOut(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b border-border bg-card/40 pt-[env(safe-area-inset-top,0px)]">
        <Container className="flex h-16 items-center justify-between gap-2 sm:gap-3">
          <div className="flex min-w-0 items-center gap-2 sm:gap-3">
            <Link
              to="/"
              aria-label="Back to site"
              className="inline-flex h-11 min-h-11 w-11 min-w-11 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-muted/50 hover:text-foreground sm:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/15 text-primary">
              <Printer className="h-4 w-4" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">Print with Zwe Admin</p>
              <p className="truncate text-xs text-muted-foreground">Administration</p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              to="/"
              className="hidden items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground sm:inline-flex"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to site
            </Link>
            <Button variant="outline" size="default" disabled={signingOut} onClick={() => void handleLogout()}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-6 pb-[env(safe-area-inset-bottom,0px)] sm:py-10">
        <Container>
          <nav aria-label="Admin navigation" className="mb-8 flex gap-6 border-b border-border">
            <NavLink to="/admin/products" className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 border-b-2 pb-3 text-sm font-medium ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Package className="h-4 w-4" />Products
            </NavLink>
            <NavLink to="/admin/pricing" className={({ isActive }) => `inline-flex min-h-11 items-center gap-2 border-b-2 pb-3 text-sm font-medium ${isActive ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>
              <Calculator className="h-4 w-4" />Pricing
            </NavLink>
          </nav>
          {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
