import { Link, Outlet, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { useAdminAuth } from "@/context/AdminAuthProvider";

export function AdminLayout() {
  const { logout } = useAdminAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/admin/login", { replace: true });
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
              <p className="truncate text-xs text-muted-foreground">Product catalog</p>
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
            <Button variant="outline" size="default" onClick={handleLogout}>
              <LogOut className="h-4 w-4" />
              <span className="hidden sm:inline">Logout</span>
            </Button>
          </div>
        </Container>
      </header>

      <main className="py-6 pb-[env(safe-area-inset-bottom,0px)] sm:py-10">
        <Container>
          <Outlet />
        </Container>
      </main>
    </div>
  );
}
