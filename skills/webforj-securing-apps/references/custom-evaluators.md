# Custom Evaluators

Custom evaluators add domain-specific access logic that the built-in annotations cannot express, ownership checks, subscription gates, IP restrictions, time windows, license checks. The pattern is: define a custom annotation, write an evaluator that handles routes carrying that annotation, and let the framework auto-discover (Spring) or manually register (plain) the evaluator.

## When you need one

`@RolesAllowed("USER")` grants any authenticated user; it cannot tell whether the URL parameter `:userId` matches the logged-in user. Anything that depends on route parameters, request context, business state, or external services needs a custom evaluator.

Example scenario: user `123` is logged in and navigates to `/users/456/edit`. They should NOT be allowed in, they can only edit `/users/123/edit`. Roles do not solve this because the requested user ID is in the URL.

## Define the annotation

```java
import java.lang.annotation.ElementType;
import java.lang.annotation.Retention;
import java.lang.annotation.RetentionPolicy;
import java.lang.annotation.Target;

@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireOwnership {
  String value() default "userId";
}
```

Use it on routes that need the check:

```java
@Route(value = "/users/:userId/edit", outlet = MainLayout.class)
@RolesAllowed("USER")
@RequireOwnership("userId")
public class EditProfileView extends Composite<Div> { }
```

`@RolesAllowed` here is doing the authentication-and-role gate; `@RequireOwnership` adds the per-resource check. They compose because `@RolesAllowed` delegates to the chain after granting.

## Implement the evaluator (Spring)

```java
import org.springframework.security.core.userdetails.UserDetails;

import com.webforj.router.NavigationContext;
import com.webforj.router.security.RouteAccessDecision;
import com.webforj.router.security.RouteSecurityContext;
import com.webforj.router.security.RouteSecurityEvaluator;
import com.webforj.router.security.SecurityEvaluatorChain;
import com.webforj.spring.security.annotation.RegisteredEvaluator;

@RegisteredEvaluator(priority = 10)
public class OwnershipEvaluator implements RouteSecurityEvaluator {

  @Override
  public boolean supports(Class<?> routeClass) {
    return routeClass.isAnnotationPresent(RequireOwnership.class);
  }

  @Override
  public RouteAccessDecision evaluate(Class<?> routeClass, NavigationContext context,
      RouteSecurityContext securityContext, SecurityEvaluatorChain chain) {

    if (!securityContext.isAuthenticated()) {
      return RouteAccessDecision.denyAuthentication();
    }

    RequireOwnership annotation = routeClass.getAnnotation(RequireOwnership.class);
    String paramName = annotation.value();

    String currentUserId = securityContext.getPrincipal()
        .filter(p -> p instanceof UserDetails)
        .map(p -> ((UserDetails) p).getUsername())
        .orElse(null);

    String requestedUserId = context.getRouteParameters()
        .get(paramName)
        .orElse(null);

    if (currentUserId != null && currentUserId.equals(requestedUserId)) {
      return chain.evaluate(routeClass, context, securityContext);
    }

    return RouteAccessDecision.deny("You can only access your own resources");
  }
}
```

`@RegisteredEvaluator` is itself meta-annotated with `@Component`, Spring's component scan picks it up automatically. No manual registration. The `priority` defaults to `10`; raise it to push the evaluator later in the chain.

## Implement the evaluator (plain)

The `RouteSecurityEvaluator` interface is identical. Drop the `@RegisteredEvaluator` (Spring-only) and register manually in your `AppLifecycleListener`:

```java
mgr.registerEvaluator(new OwnershipEvaluator(), 10);
```

## The two methods

### `supports(Class<?> routeClass)`

Returns `true` if this evaluator should run for this route. Cheap predicate, the framework calls it before every `evaluate(...)`. Filtering on `routeClass.isAnnotationPresent(...)` is the typical implementation.

### `evaluate(routeClass, context, securityContext, chain)`

The body. Return one of:

- `RouteAccessDecision.grant()`, terminal. Allow access and stop the chain.
- `RouteAccessDecision.deny(reason)`, terminal. Block, redirect to access-denied.
- `RouteAccessDecision.denyAuthentication()` (or `denyAuthentication(reason)`), terminal. Redirect to login.
- `chain.evaluate(routeClass, context, securityContext)`, delegate. Pass control to the next evaluator in priority order.

Custom evaluators that should compose with later ones MUST call `chain.evaluate(...)` after their own check passes. Returning `grant()` ends the chain immediately and any later evaluator is skipped.

## Priorities

| Range | Owner |
|---|---|
| 0-9 | Reserved for framework evaluators (Spring also reserves 6 for `@RouteAccess`). Do NOT use unless you are intentionally replacing a built-in. |
| 10+ | Custom evaluators |

The framework logs a warning if a `@RegisteredEvaluator` declares a priority `< 10`. Pick `10` unless you specifically need ordering between multiple custom evaluators.

## Composition

Stack custom evaluators with composable framework annotations:

```java
// Composes (RolesAllowed delegates)
@Route("/team/:teamId/admin")
@RolesAllowed("ADMIN")
@RequireMembership("teamId")
public class TeamAdminView extends Composite<Div> { }

// Composes (RouteAccess delegates)
@Route("/admin/users/:userId/edit")
@RouteAccess("hasRole('ADMIN')")
@RequireOwnership("userId")
public class AdminEditUserView extends Composite<Div> { }
```

Do NOT combine with terminal annotations:

```java
// WRONG, @PermitAll grants and stops; @RequireOwnership never runs
@Route("/users/:userId/profile")
@PermitAll
@RequireOwnership("userId")
public class ProfileView extends Composite<Div> { }
```

For "every authenticated user PLUS my custom check", use `@RolesAllowed("USER")` instead of `@PermitAll`.

## Multiple custom evaluators

Each custom annotation gets its own evaluator. Run order is by priority (lower first). Use different priorities to enforce ordering when one check should run before another:

```java
@RegisteredEvaluator(priority = 10)
public class SubscriptionEvaluator implements RouteSecurityEvaluator { /* ... */ }

@RegisteredEvaluator(priority = 11)
public class IpAllowListEvaluator implements RouteSecurityEvaluator { /* ... */ }
```

`SubscriptionEvaluator` runs first; if it delegates, `IpAllowListEvaluator` runs next.
