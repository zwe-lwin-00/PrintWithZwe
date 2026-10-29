# Print with Zwe

React + Vite frontend with an ASP.NET Core 10 API, ASP.NET Core Identity, EF Core,
and SQLite. Nginx serves the frontend and product images and proxies `/api/` to
a single loopback-only backend process. No Google or Netlify service is required.

## Repository layout

```text
frontend/    React source, public assets, environment example, Vite/TypeScript/Tailwind configuration
backend/     ASP.NET Core API, EF Core migrations, integration tests
deploy/      Nginx, systemd, and backup templates
```

The root npm package is a workspace entry point. Run `npm ci`, `npm run dev`,
and `npm run build` from the repository root as before. Frontend build output is
`frontend/dist/`; frontend environment files belong in `frontend/`. Keep the
single dependency lockfile at the repository root.

## Estimator pricing

Open `/admin/pricing` (the Pricing tab) after signing in. Administrators can edit
the MMK base fee, hourly machine rate, and per-gram rates for PLA, PETG, ABS, TPU,
and Multi-Color. Saving updates SQLite; it does not change listed product prices.
Rates must be non-negative. Zero is allowed. Printing fees are capped at
1,000,000,000 MMK and material rates at 1,000,000 MMK per gram.

The estimator reads `/api/pricing` on page load and when the browser window
regains focus. A save also refreshes rates in the current app. No rebuild or
server restart is needed for subsequent rate changes. If current rates cannot
be loaded, the estimator is disabled and offers a retry instead of using stale
static rates. Pricing values in `site-config.json` are initialization/display
fallbacks only; `VITE_PRICING_*` build overrides are no longer supported.

`GET /api/pricing` is public. `GET /api/admin/pricing` and
`PUT /api/admin/pricing` require an admin session; writes additionally require
CSRF validation and use the existing write limiter. Defaults match the original
estimator until the first save.

Open `/admin/settings` (the Site info tab) to change the public brand name,
tagline, hero badges, phone number, Telegram username, WhatsApp number, and
Messenger page ID. These values are stored in SQLite and are loaded publicly at
`/api/site-config`; they never contain passwords, authenticator keys, or other
secrets. The old `public/site-config.json` values remain safe fallbacks for
offline development only.

### Upgrade an existing production installation

This feature includes the additive `EstimatorPricing` EF migration. Deploy the
updated API before the frontend. The migration is applied at API startup and
does not recreate products, images or administrator accounts. Back up first.
Never copy your local development database over production.

After uploading and extracting a freshly built release to `/root/pzw-release`,
run on the VPS:

```bash
systemctl stop printwithzwe
umask 077
sqlite3 /var/lib/printwithzwe/catalog.db ".backup '/root/printwithzwe-before-pricing-$(date +%Y%m%d-%H%M%S).db'"
cp -a /opt/printwithzwe/api /root/printwithzwe-api-before-pricing-$(date +%Y%m%d-%H%M%S)
rsync -a /root/pzw-release/api/ /opt/printwithzwe/api/
chmod -R u=rwX,go=rX /opt/printwithzwe/api
systemctl start printwithzwe
curl -f http://127.0.0.1:5000/api/health
curl -f https://okayselling.shop/api/pricing
```

Stop if any command fails. Wait for startup before checking health. If startup
fails, inspect `journalctl -u printwithzwe -n 50 --no-pager` and keep the old
frontend intact. Once both checks succeed, back up and publish the frontend:

```bash
tar -czf /root/printwithzwe-web-before-pricing-$(date +%Y%m%d-%H%M%S).tar.gz -C /var/www printwithzwe
rsync -a --delete /root/pzw-release/dist/ /var/www/printwithzwe/
chmod -R u=rwX,go=rX /var/www/printwithzwe
```

Do not overwrite the active Nginx configuration: Certbot has already added TLS
settings. No Nginx change is required for this feature. Refresh the browser,
test a rate change in admin, and verify an estimate on the public page.

## Local development (Windows)

Install the .NET 10 SDK and Node.js 24 LTS. In the repository root:

```powershell
npm ci
dotnet restore backend/PrintWithZwe.Api/PrintWithZwe.Api.csproj
```

Create your first administrator in your own interactive terminal:

```powershell
dotnet run --project backend/PrintWithZwe.Api -- --create-admin admin@printwithzwe.com
```

Choose a unique password of at least 14 characters, including upper/lowercase,
a digit and a symbol. Add the displayed setup key to an authenticator app as
a time-based (TOTP), six-digit account with a 30-second period. Enter the current
code to complete setup. The key is a secret: do not send it to chat, include it in
screenshots, or commit it. Store a recovery copy in a password manager. There
is no default administrator, public registration, or email password-reset service.
If setup fails after creating the account, that new account is removed.

If an administrator's authenticator setup key is exposed or lost, rotate it from
your own interactive terminal:

```powershell
dotnet run --project backend/PrintWithZwe.Api -c Release -- --reset-admin-mfa admin@printwithzwe.com
```

This command immediately locks the administrator account, replaces its key, and
changes its security stamp. Add the new key to your authenticator app and enter
its current six-digit code to unlock the account. The password and products are
unchanged. If interrupted or verification fails, the account remains locked;
rerun the same reset command to generate another fresh key. Existing cookie
sessions are rejected at their next security-stamp validation (within five
minutes). Never share the setup key, password, or code. On the VPS, run the
published DLL with `--reset-admin-mfa` under the same service identity and
`Storage__Root` setting used for account creation.

Start the backend:

```powershell
dotnet run --project backend/PrintWithZwe.Api -- --environment Development
```

In a second terminal:

```powershell
npm run dev -- --host 127.0.0.1
```

Open the Vite URL and `/admin/login`. Vite proxies `/api` and `/uploads` to
`http://127.0.0.1:5000`. Development allows HTTP on localhost; production requires
HTTPS for every endpoint except `/api/health`. Do not expose Development mode to
the internet. Data defaults to `backend/PrintWithZwe.Api/data/`, outside Git.

## Security model

- Identity hashes passwords; admins must belong to the server-controlled Admin
  role. MFA is required by default, with no public account-provisioning endpoint.
- Authentication uses HttpOnly, SameSite=Strict cookies, Secure in production.
  Sessions have an absolute eight-hour expiry. Logout invalidates the current
  cookie and updates the security stamp; other sessions are revalidated within
  five minutes. Session tokens are not placed in browser storage or URLs.
- Every POST, PUT, and DELETE requires a framework antiforgery token from
  `/api/auth/csrf`, sent as `X-CSRF-TOKEN`. POST and PUT accept JSON only.
- Login has per-IP throttling and per-account lockout; writes are serialized
  and rejected with 429 when another write is running. SQLite uses WAL mode.
- Uploads accept 1-6 JPEG, PNG or WebP photos, at most 2 MiB each and 8 MiB total.
  Actual decoding, dimensions (maximum 2048 x 2048), animation checks, generated
  filenames, and WebP re-encoding are enforced on the server. Original metadata
  is not copied. One upload batch is processed at a time.
- External image URLs are not accepted. Edits may retain only that product's
  existing image URLs. Archived products disappear from public listing; already
  published image URLs remain public. Removed images are retained on disk for
  recovery, so storage usage needs monitoring and deliberate cleanup.
- Nginx forwards only the actual client address and scheme; ASP.NET Core trusts
  only its default loopback proxy networks. No wildcard CORS is enabled.
- Database, authentication keys and upload metadata are not public files.
  Data-protection keys and authenticator secrets depend on filesystem protection
  at rest; they are not automatically encrypted on the VPS disk. Encrypt backups
  and use provider disk encryption where available.
- This is a security baseline, not a guarantee of immunity. Protect provider,
  domain and GitHub accounts with MFA, keep OS/.NET/Node dependencies patched,
  restrict SSH, and use hosting-provider or edge protection for large DDoS attacks.

## Existing data

The new database starts empty. No Google Sheets, Drive or browser-local demo
products are automatically imported. The legacy Google scripts and demo catalog
have been removed. Export and back up any existing external catalog before
migrating it; this cleanup does not delete data hosted in Google or on your VPS.

## Product archive and restore

Admin Archive hides a product from the public catalog without deleting its
database row or image files. In the admin Products page, archived rows show a
Restore action. Restoring clears the archived flag and makes the existing
product and images public again. Archive and Restore require the authenticated
admin session, CSRF validation, and the write rate limiter.

Old `VITE_APPS_SCRIPT_URL`, `VITE_USE_MOCK`, and `VITE_MOCK_ADMIN_PASSWORD` settings
are no longer used. Never put administrator credentials or backend secrets in
`VITE_*`, since those values are public build inputs.

## Verification

```powershell
dotnet test backend/PrintWithZwe.Api.Tests/PrintWithZwe.Api.Tests.csproj
npm run build
npm audit
dotnet list backend/PrintWithZwe.Api/PrintWithZwe.Api.csproj package --vulnerable --include-transitive
```

Integration tests use isolated temporary SQLite databases. They cover MFA login,
CSRF, authorization, rate limits, valid/invalid uploads, updates, archiving, and
logout. Test accounts are not installed into your local or production database.

## Publish from Windows

Build the Linux backend locally to avoid SDK/build memory pressure on the VPS:

```powershell
npm ci
npm run build
dotnet publish backend/PrintWithZwe.Api -c Release -r linux-x64 --self-contained false -o artifacts/api
```

Upload to a staging directory, not directly over a running backend:

```powershell
ssh root@103.42.115.5 "mkdir -p /root/pzw-release/api /root/pzw-release/web /root/pzw-release/deploy"
scp -r ./artifacts/api/. root@103.42.115.5:/root/pzw-release/api/
scp -r ./frontend/dist/. root@103.42.115.5:/root/pzw-release/web/
scp -r ./deploy/. root@103.42.115.5:/root/pzw-release/deploy/
```

Alternatively, pull and build this repository on the VPS using the same build
commands with .NET 10 SDK installed there. `git pull` alone does not publish or
restart anything. Review changes and run tests before every deployment.

## First VPS installation (Ubuntu 24.04)

The following is a deployment procedure, not something automatically applied by
this repository. Run commands yourself on the VPS after reviewing the templates.

Install Nginx, Certbot, SQLite and backup tools. Install the latest ASP.NET Core
10 runtime from a supported Ubuntu/Microsoft package source and verify it:

```bash
apt update
apt install nginx certbot python3-certbot-nginx sqlite3 restic rsync
apt install aspnetcore-runtime-10.0
dotnet --list-runtimes
```

If the runtime package is unavailable, follow Microsoft's .NET 10 installation
instructions for Ubuntu 24.04; do not install an older runtime or add random
package feeds. Linux native image processing may additionally need `libfontconfig1`
on some distributions. Check startup/upload logs on this VPS.

Create a restricted non-login service identity. This is not a personal deployment
account: you can keep your existing SSH workflow. Never run the API as root.

```bash
useradd --system --gid www-data --home-dir /var/lib/printwithzwe --shell /usr/sbin/nologin printwithzwe
install -d -o root -g root -m 0755 /opt/printwithzwe/api /var/www/printwithzwe
install -d -o printwithzwe -g www-data -m 0710 /var/lib/printwithzwe
install -d -o printwithzwe -g www-data -m 2750 /var/lib/printwithzwe/uploads
install -d -o printwithzwe -g www-data -m 0700 /var/lib/printwithzwe/keys
rsync -a /root/pzw-release/api/ /opt/printwithzwe/api/
rsync -a /root/pzw-release/web/ /var/www/printwithzwe/
chmod -R u=rwX,go=rX /opt/printwithzwe/api /var/www/printwithzwe
```

Skip `useradd` if this service identity already exists. The app code remains
root-owned; the service can write only its private state directory and temporary
files. Uploaded files are explicitly group-readable so Nginx can serve them.

Provision the administrator with private default permissions, then install the
service. Run setup in your terminal, not through an AI tool or a recorded session:

```bash
cd /opt/printwithzwe/api
umask 077
sudo -u printwithzwe env Storage__Root=/var/lib/printwithzwe dotnet PrintWithZwe.Api.dll --create-admin admin@printwithzwe.com
cp /root/pzw-release/deploy/printwithzwe.service /etc/systemd/system/
systemctl daemon-reload
systemctl enable --now printwithzwe
curl -f http://127.0.0.1:5000/api/health
journalctl -u printwithzwe -n 40 --no-pager
```

Migrations apply on startup. Back up before deploying any future schema changes.
The supplied service limits managed heap to 256 MiB and total process memory to
512 MiB. These are starting limits, not a guarantee under load; monitor RSS,
out-of-memory restarts, disk, latency, and upload failures.

### Domain and HTTPS

First verify both `okayselling.shop` and `www.okayselling.shop` resolve to your VPS
and no conflicting AAAA records point elsewhere. Replace the old Nginx default
configuration with the reviewed template (back it up first):

```bash
cp -a /etc/nginx/sites-available/default /root/nginx-before-pzw-$(date +%Y%m%d-%H%M%S)
cp /root/pzw-release/deploy/nginx.conf /etc/nginx/sites-available/default
nginx -t
```

Only after a successful test:

```bash
systemctl reload nginx
certbot --nginx -d okayselling.shop -d www.okayselling.shop --redirect
nginx -t
certbot renew --dry-run
```

Certbot will request an email and agreement to its terms. Do not use the admin
site until HTTPS works without certificate warnings. The template's CSP upgrades
HTTP resources to HTTPS, and production API requests over HTTP are rejected.
Confirm `/admin/login`, `/api/health`, actual photo uploads, and page refreshes.

Allow inbound HTTP/HTTPS and the verified SSH port at the provider firewall.
Before enabling UFW, explicitly allow your actual SSH port and test a second SSH
session with the provider console open. Do not expose port 5000 or any database
port. Add SSH keys before disabling password/root login; do not risk lockout.

For `printwithzwe.com` later, update DNS, Nginx's `server_name`, certificates,
and `AllowedHosts`. Because cookies are host-only, sign in again on the new domain.

### Future releases and rollback

Back up state and the current `/opt/printwithzwe/api` and `/var/www/printwithzwe`
directories first. Stop the API, copy the new published backend, restart it,
check health/logs, then publish the frontend. Never delete or overwrite
`/var/lib/printwithzwe`. If API startup fails, leave the prior frontend intact.
Restoring an old binary after a schema change may be unsafe; restore its matching
database backup too. Retain the previous frontend/backend until checks pass.

## Encrypted off-server backups

The supplied script briefly stops the API to capture a consistent SQLite backup,
upload directory and authentication keys. Nginx can still serve static files;
API requests may briefly fail. It restarts the API before transferring encrypted
data with restic. Backup files contain credentials and require strict protection.

Configure a restic repository on a DIFFERENT machine or object-storage provider.
In root-only `/etc/printwithzwe-backup.env`, set `RESTIC_REPOSITORY` and
`RESTIC_PASSWORD_FILE`, plus any provider credentials. Keep this file and the
password file mode 0600. Do not store credentials in Git, shell history, chat,
or the public website. Initialize the repository and verify access using restic's
provider documentation before enabling the timer.

```bash
install -m 0750 /root/pzw-release/deploy/backup.sh /usr/local/sbin/printwithzwe-backup
cp /root/pzw-release/deploy/printwithzwe-backup.service /etc/systemd/system/
cp /root/pzw-release/deploy/printwithzwe-backup.timer /etc/systemd/system/
systemctl daemon-reload
systemctl start printwithzwe-backup
journalctl -u printwithzwe-backup --no-pager
systemctl enable --now printwithzwe-backup.timer
```

Check failures and repository storage regularly. Configure retention only after
verifying your recovery needs; the script never deletes old snapshots.

Test restoration on a separate machine first. With the same restic configuration,
`restic restore latest --tag printwithzwe --target /root/pzw-restore` recreates
`/root/pzw-restore/var/cache/printwithzwe-backup/`. Run SQLite `PRAGMA integrity_check`
on its database, verify its images and keys, and test the matching application
version privately. For a real recovery stop the API, preserve current state,
restore that directory's contents into `/var/lib/printwithzwe`, fix ownership and
private permissions (database 0600, keys directory 0700, uploads group-readable),
then start the service and test login/catalog access. Retain backup credentials
outside the VPS so you can recover after losing the server.