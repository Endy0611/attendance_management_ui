@AGENTS.md

# attendance-university-ui — Project Context (Frontend)

Read this fully before editing. It reflects decisions already made — don't
re-ask about anything in §1–§3 below, they're settled. §4 lists what's still
genuinely open and worth confirming with the person before assuming.

---

## 1. Data-flow architecture (settled — apply to every resource)

Strict one-direction layering, no exceptions:

```
page.tsx (Server Component)
   → getXAction()                    [actions/x.action.ts]
       → xService.list()             [service/x.service.ts]
           → fetch backend            (token from HttpOnly cookie via lib/server-auth.ts)
   → passes data down to <XManager>  (client component)
       → user interacts (create/edit/delete)
           → calls createXAction / updateXAction / deleteXAction
               → Zod-validated → xService → backend
               → revalidatePath(...)
       → manager re-runs getXAction() to refresh
```

Rules:
- **Components never import `service/*` directly.** Only `actions/*.action.ts`
  files are allowed to call a service.
- **Components never import `lib/api.ts`** for anything new. That file is the
  legacy localStorage-based client kept for pages not yet migrated (see §4) —
  don't extend it, don't copy its pattern into new work.
- **`service/*.service.ts` files never read cookies or localStorage.** They take
  a `token` argument explicitly and are pure fetch wrappers, so they work
  identically whether called from a Server Action or (hypothetically) elsewhere.
  Mirrors the existing `service/auth.service.ts`.
- **`actions/*.action.ts` files are `"use server"`.** They: pull the token via
  `getTokens()` from `lib/server-auth.ts`, Zod-validate any write payload, call
  the matching service function, wrap the result in
  `{ ok: true, data } | { ok: false, error }`, and call `revalidatePath()` after
  a successful mutation. Mirrors the existing `actions/auth.action.ts`.
- **Pages are async Server Components.** They call `requireUser()` (redirect to
  `/login` if not authenticated), do a second role check
  (`if (user.role !== "ADMIN") redirect("/dashboard")`) even though `proxy.ts`
  already redirects at the edge — defense in depth, not redundant.
  Then they call the `get*Action()` for initial data and hand it to a client
  "Manager" component as a prop.
- **"Manager" client components** (`components/<resource>/<resource>-manager.tsx`)
  own search/filter state, the create/edit dialog, delete confirmation, toasts,
  and a `refresh()` that re-calls the get-action after a mutation.
- **Form dialogs** (`components/<resource>/<resource>-form-dialog.tsx`) are
  separate components, take `(item | null, onClose, onSaved)`, call the
  create/update actions directly, surface `result.error` inline on failure.

**Reference implementation — Courses** (build every other resource exactly like
this, same file names/roles, different resource name):
- `types/course-types.ts`
- `service/course.service.ts`
- `actions/course.action.ts`
- `components/courses/course-form-dialog.tsx`
- `components/courses/course-manager.tsx`
- `app/(dashboard)/dashboard/courses/page.tsx`

Still to build the same way: Groups, Zones, Users, Sessions. Attendance flows
(check-in, live session, absent list, override) will need custom UI beyond this
CRUD template but should still follow the service → action → component chain
for any data they read or write.

---

## 2. Role checking (settled)

- `lib/roles.ts` — `hasRole()` / `isAdmin()` / etc., and the single
  `ROUTE_POLICY` table mapping `/dashboard/*` prefixes to allowed roles. Edit
  this table when access rules change — nothing else.
- `proxy.ts` — edge-level redirect using `ROUTE_POLICY` + a decoded (unverified)
  JWT from the `accessToken` cookie. First line of defense, UX only.
- Server Component pages — `requireUser()` + explicit role check + `redirect()`.
  Second line of defense, still not the real security boundary.
- `components/role-guard.tsx` — `<RoleGuard allow={["ADMIN"]}>` for gating a
  whole client-rendered section, `<IfRole allow={["ADMIN"]}>` for hiding a
  single element (button, nav item) without a redirect.
- The backend's `JwtAuthFilter`/`SecurityConfig` is the actual security
  boundary. Everything above is routing/UX convenience, not a substitute for
  backend authorization checks.

---

## 3. Design system (settled, established during the dashboard redesign)

- Accent navy `#1C4D8D` for primary buttons/active states (arbitrary Tailwind
  value `bg-[#1C4D8D]`/`style={{backgroundColor:"#1C4D8D"}}` — not yet promoted
  to a CSS variable, do that if it starts appearing more than a few times more).
  Category accents: sky `#0EA5E9`, violet `#7C3AED`, emerald `#10B981`, rose
  `#E11D48`, amber `#F59E0B`.
- `rounded-2xl border bg-card p-5` for card containers, `rounded-lg` for
  buttons/inputs.
- Headings use `font-[family-name:var(--font-display)]` (Space Grotesk),
  timestamps/codes/IDs use `font-[family-name:var(--font-mono)]` (JetBrains
  Mono) — both loaded via `next/font/google` in `app/(dashboard)/dashboard/page.tsx`.
  If a new page needs them and isn't a child of that layout, load the fonts
  the same way at the top of the page file.
- Toasts: fixed bottom-right, `bg-foreground text-background`, self-dismiss
  after 3s — see `CourseManager` for the reference pattern.

---

## 4. Still open — confirm with the person, don't assume

- **Does the login flow actually call `setAuthCookies()`?** The new
  service/action/component pattern depends entirely on the `accessToken`
  HttpOnly cookie being set at login. If `components/auth/login-component.tsx`
  is still only writing to `localStorage`/Zustand (the legacy pattern — see the
  auth-split note below), every new Server Action will silently fail
  authentication. This needs a direct check before building more resources on
  top of it, not an assumption either way.
- **What happens to the legacy localStorage-based pages** (`hooks/use-auth.tsx`,
  `lib/api.ts`, and any dashboard page still calling it directly, e.g. the
  original `AdminDashboard`/`InstructorDashboard`/`StudentDashboard` in
  `app/(dashboard)/dashboard/page.tsx`)? Options: migrate them to the new
  pattern too, or leave them as-is until a dedicated auth-consolidation pass.
  Don't silently migrate them as a side effect of an unrelated task — ask first,
  it's a big enough change to warrant a heads-up.
- **`faceApi`/`notificationApi`/`reportApi` still have no backend controller**
  (documented in the backend `CLAUDE.md`). Don't build a Manager/action/service
  layer for these until the backend side exists, or the actions will just wrap
  404s.
- **Whether `/dashboard/attendance/me/page.ts` should be `.tsx`** — flagged
  earlier, not yet fixed. Fix it if you're touching that file for another
  reason; don't go out of your way for it alone.
- **Order of remaining resources** (Groups → Zones → Users → Sessions vs. some
  other order) — go in that order unless told otherwise, but it's worth a
  one-line confirmation if a differently-shaped resource (e.g. Sessions, which
  has more relations) comes up before its turn.