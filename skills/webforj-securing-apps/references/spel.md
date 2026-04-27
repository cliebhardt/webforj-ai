# `@RouteAccess` and SpEL Expressions

`@RouteAccess` evaluates a Spring Expression Language (SpEL) string against the authenticated user. Spring-only, it does not exist in plain webforJ. Use it when authorization is purely a boolean expression of roles and authorities.

```java
import com.webforj.spring.security.annotation.RouteAccess;

@Route(value = "/admin", outlet = MainLayout.class)
@RouteAccess("hasRole('ADMIN')")
public class AdminView extends Composite<Div> { }
```

If the expression evaluates to `true`, access is granted and the chain continues (composable). If `false`, the user is redirected to the access-denied page.

## Built-in functions

Spring Security exposes these in the SpEL context:

| Function | Parameters | Description |
|---|---|---|
| `hasRole(role)` | `String` | User has the role (auto-prefixed with `ROLE_`, so `hasRole('ADMIN')` matches granted authority `ROLE_ADMIN`) |
| `hasAnyRole(roles...)` | `String...` | User has any of the listed roles |
| `hasAuthority(authority)` | `String` | Exact authority match (no prefix) |
| `hasAnyAuthority(authorities...)` | `String...` | Any of the listed authorities |
| `isAuthenticated()` | none | User is authenticated |

### Examples

```java
// Specific role
@Route("/admin")
@RouteAccess("hasRole('ADMIN')")
public class AdminView extends Composite<Div> { }

// Any of several roles
@Route("/staff")
@RouteAccess("hasAnyRole('ADMIN', 'MANAGER', 'SUPERVISOR')")
public class StaffView extends Composite<Div> { }

// Authority (no ROLE_ prefix)
@Route("/reports")
@RouteAccess("hasAuthority('REPORTS:READ')")
public class ReportsView extends Composite<Div> { }

// Just authentication
@Route("/profile")
@RouteAccess("isAuthenticated()")
public class ProfileView extends Composite<Div> { }
```

## Boolean operators

Combine expressions with `and`, `or`, `!`:

```java
// Both required
@RouteAccess("hasRole('MODERATOR') and hasAuthority('REPORTS:VIEW')")

// Either grants
@RouteAccess("hasRole('ADMIN') or hasRole('SUPPORT')")

// Negation
@RouteAccess("isAuthenticated() and !hasAuthority('PREMIUM')")

// Multi-line
@RouteAccess("""
  hasRole('ADMIN') or
  (hasRole('ANALYST') and hasAuthority('REPORTS:ADVANCED'))
  """)
```

## Composition

`@RouteAccess` delegates to the chain after the SpEL passes (priority 6). Stack it with other composable annotations:

```java
@Route("/team/admin")
@RolesAllowed("USER")
@RouteAccess("hasAuthority('TEAM:ADMIN')")
public class TeamAdminView extends Composite<Div> {
  // USER role AND TEAM:ADMIN authority required
}
```

Evaluation order:

1. `RolesAllowedEvaluator` (priority 5) checks `USER`, then delegates.
2. `SpringRouteAccessEvaluator` (priority 6) evaluates the SpEL, then delegates.
3. Custom evaluators (priority 10+) run last.

## Custom error code

By default the access-denied page receives `?reason=expression_denied`. Override:

```java
@Route("/premium/features")
@RouteAccess(
  value = "hasAuthority('PREMIUM')",
  code = "PREMIUM_SUBSCRIPTION_REQUIRED"
)
public class PremiumFeaturesView extends Composite<Div> { }
```

Read the code on the access-denied view via the location's query parameters.

## Available variables

| Variable | Type | Description |
|---|---|---|
| `authentication` | `org.springframework.security.core.Authentication` | Spring's authentication object |
| `principal` | `Object` | Authenticated principal (typically `UserDetails` or `OAuth2User`) |
| `routeClass` | `Class<? extends Component>` | The route component class being accessed |
| `context` | `com.webforj.router.NavigationContext` | webforJ navigation context |
| `securityContext` | `com.webforj.router.security.RouteSecurityContext` | webforJ route security context |

```java
@RouteAccess("authentication.name == 'superadmin'")
```

## SpEL vs custom evaluator

| Choose `@RouteAccess` SpEL when... | Choose a custom evaluator when... |
|---|---|
| Authorization is roles or authorities | Authorization depends on route parameters (ownership) |
| One-off route-specific logic | Reusable annotation across routes |
| Boolean combination of built-in functions | Complex business logic, Spring service injection |
