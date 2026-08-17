import { FormEvent, useState } from "react";
import { Link, Navigate, useLocation, useNavigate } from "react-router-dom";
import { Lock, Mail, Printer } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Container } from "@/components/layout/Container";
import { useAdminAuth } from "@/context/AdminAuthProvider";
import { getMockAdminPassword, useMockCatalog } from "@/api/catalogClient";

export function AdminLoginPage() {
  const { isAuthenticated, login } = useAdminAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState("admin@printwithzwe.com");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const isMock = useMockCatalog();

  const redirectTo =
    (location.state as { from?: string } | null)?.from ?? "/admin/products";

  if (isAuthenticated) {
    return <Navigate to={redirectTo} replace />;
  }

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

    const ok = await login(email, password);
    setSubmitting(false);

    if (!ok) {
      setError("Invalid email or password.");
      return;
    }

    navigate(redirectTo, { replace: true });
  };

  return (
    <div className="flex min-h-[100dvh] items-center justify-center bg-background px-4 py-10 pt-[calc(2.5rem+env(safe-area-inset-top,0px))] pb-[calc(2.5rem+env(safe-area-inset-bottom,0px))]">
      <Container className="max-w-md">
        <div className="rounded-2xl border border-border bg-card/50 p-6 shadow-elevated sm:p-8">
          <div className="mb-6 flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
              <Printer className="h-5 w-5" />
            </span>
            <div>
              <h1 className="text-xl font-bold">Admin login</h1>
              <p className="text-sm text-muted-foreground">
                Manage products in Google Sheets + Drive
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="admin-email" className="mb-2 block text-sm font-medium">
                Email
              </label>
              <div className="relative">
                <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="admin-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-base outline-none ring-primary transition focus:ring-2 sm:text-sm"
                  autoComplete="username"
                  required
                />
              </div>
            </div>

            <div>
              <label htmlFor="admin-password" className="mb-2 block text-sm font-medium">
                Password
              </label>
              <div className="relative">
                <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  id="admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  className="w-full rounded-lg border border-border bg-background py-2.5 pl-10 pr-3 text-base outline-none ring-primary transition focus:ring-2 sm:text-sm"
                  autoComplete="current-password"
                  required
                />
              </div>
            </div>

            {error && (
              <p className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </p>
            )}

            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Signing in..." : "Sign in"}
            </Button>
          </form>

          <p className="mt-5 text-center text-xs leading-relaxed text-muted-foreground">
            {isMock ? (
              <>
                Mock mode is on. Use password from{" "}
                <code className="rounded bg-muted px-1 py-0.5">VITE_MOCK_ADMIN_PASSWORD</code>
                {getMockAdminPassword() ? "" : " (not set in .env)"}.
              </>
            ) : (
              <>
                Credentials are stored in Google Apps Script properties (
                <code className="rounded bg-muted px-1 py-0.5">ADMIN_EMAIL</code>,{" "}
                <code className="rounded bg-muted px-1 py-0.5">ADMIN_PASSWORD</code>).
              </>
            )}
          </p>

          <p className="mt-4 text-center text-sm">
            <Link to="/" className="text-primary hover:underline">
              Back to website
            </Link>
          </p>
        </div>
      </Container>
    </div>
  );
}
