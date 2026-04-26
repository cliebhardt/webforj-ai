# Security Annotations

Five annotations control route access. Four work in any setup; one is Spring-only.

| Annotation | Package | Path | Behavior |
|---|---|---|---|
| `@AnonymousAccess` | `com.webforj.router.security.annotation` | Both | Public, terminal grant |
| `@PermitAll` | `jakarta.annotation.security` | Both | Authenticated user, terminal grant |
| `@RolesAllowed` | `jakarta.annotation.security` | Both | Specific role(s), composable (delegates) |
| `@DenyAll` | `jakarta.annotation.security` | Both | Always deny, terminal |
| `@RouteAccess` | `com.webforj.spring.security.annotation` | Spring only | SpEL expression, composable |

## `@AnonymousAccess` -- public routes

Marks a route as publicly accessible. Anyone, authenticated or not, can reach it. Use for login pages, public landing pages, terms of service, registration, etc.

```java
@Route("/login")
@AnonymousAccess
public class LoginView extends Composite<Login> { }
```

The login page itself MUST carry `@AnonymousAccess` -- otherwise secure-by-default redirects unauthenticated users away from the login page, creating an infinite loop.

## `@PermitAll` -- any authenticated user

Requires the user to be logged in but does not require any specific role.

```java
@Route(value = "/", outlet = MainLayout.class)
@PermitAll
public class InboxView extends Composite<FlexLayout> { }
```

When `secure-by-default` is enabled, leaving a route unannotated is equivalent to `@PermitAll`. Use the explicit annotation to make the intent visible, or omit it and rely on the global setting.

## `@RolesAllowed` -- role-based access

Restricts access to users with at least one of the listed roles. Authenticated users without a matching role are redirected to the access-denied page.

Single role:

```java
@Route(value = "/teams", outlet = MainLayout.class)
@RolesAllowed("ADMIN")
public class TeamsView extends Composite<FlexLayout> { }
```

Multiple roles (ANY of them grants access):

```java
@Route(value = "/settings", outlet = MainLayout.class)
@RolesAllowed({"ADMIN", "MANAGER"})
public class SettingsView extends Composite<FlexLayout> { }
```

Role names use uppercase by convention (`ADMIN`, `USER`, `MANAGER`). With Spring Security, `@RolesAllowed("ADMIN")` matches the granted authority `ROLE_ADMIN` -- Spring strips/adds the `ROLE_` prefix automatically.

`@RolesAllowed` is composable: after granting, it delegates to the chain. Stack it with custom evaluators (`@RequireOwnership`, `@RequiresSubscription`, etc.) when you need additional checks.

## `@DenyAll` -- block all access

```java
@Route(value = "/maintenance", outlet = MainLayout.class)
@DenyAll
public class MaintenanceView extends Composite<FlexLayout> { }
```

Useful for temporary lockdowns and views still under development. For production, prefer removing the route or using proper role restrictions.

## `@RouteAccess` -- SpEL rule (Spring only)

```java
@Route(value = "/admin", outlet = MainLayout.class)
@RouteAccess("hasRole('ADMIN')")
public class AdminView extends Composite<Div> { }
```

See [`spel.md`](spel.md) for functions, variables, error codes, and composition with `@RolesAllowed` or custom evaluators.

## Composition rules

| Annotation | Terminal? | Stacks with custom evaluators? |
|---|---|---|
| `@AnonymousAccess` | YES | NO |
| `@PermitAll` | YES | NO |
| `@DenyAll` | YES | NO |
| `@RolesAllowed` | NO (delegates after grant) | YES |
| `@RouteAccess` | NO (delegates after pass) | YES |

A terminal annotation makes the chain stop the moment it grants or denies, so any custom evaluator stacked on the same route NEVER runs. If you need composition, use `@RolesAllowed` (or `@RouteAccess`) as the gate annotation:

```java
// WRONG -- @PermitAll grants and stops; @RequireOwnership never runs
@Route("/users/:userId/profile")
@PermitAll
@RequireOwnership("userId")
public class ProfileView extends Composite<Div> { }

// CORRECT -- @RolesAllowed delegates; @RequireOwnership runs after
@Route("/users/:userId/profile")
@RolesAllowed("USER")
@RequireOwnership("userId")
public class ProfileView extends Composite<Div> { }
```

## Secure-by-default

Routes WITHOUT any annotation behave according to the `secure-by-default` setting:

| Setting | Effect on unannotated routes |
|---|---|
| `true` (the default) | Require authentication (same as `@PermitAll`) |
| `false` (opt-out) | Public (anyone can reach the route) |

`secure-by-default` is ON by default. You do not have to enable it; you only set the property to opt out, or to be self-documenting.

Spring projects override it in `application.properties`:

```properties
# Opt out (early development only)
webforj.security.secure-by-default=false
```

Custom plain implementations override `RouteSecurityConfiguration.isSecureByDefault()` -- the interface default returns `true`, so omit the override unless you want unannotated routes to be public.

With `secure-by-default=true`, only `@AnonymousAccess` keeps a route public. Forgetting to annotate a sensitive route still leaves it protected -- this is the safer default and the reason it ships on.

## Imports cheat sheet

```java
// webforJ-only
import com.webforj.router.security.annotation.AnonymousAccess;

// Jakarta standard (work in Spring AND custom paths)
import jakarta.annotation.security.PermitAll;
import jakarta.annotation.security.RolesAllowed;
import jakarta.annotation.security.DenyAll;

// Spring-only
import com.webforj.spring.security.annotation.RouteAccess;
import com.webforj.spring.security.annotation.RegisteredEvaluator;
```

Do NOT import `@PermitAll` etc. from Spring's `org.springframework.security.access` package -- the framework looks for the Jakarta versions.
