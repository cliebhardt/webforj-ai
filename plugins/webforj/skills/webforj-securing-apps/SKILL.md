---
name: webforj-securing-apps
description: "Use this skill for ANYTHING that protects routes in a webforJ app: login, logout, authentication, authorization, role-based access, public pages, admin-only pages, secure-by-default, ownership checks, SpEL rules, or custom security implementations. Trigger phrases: 'add login', 'add logout', 'protect this route', 'require authentication', 'admin only page', 'public landing page', 'role-based access', 'lock down /admin', 'check ownership', 'wire up Spring Security', 'secure-by-default', 'who is logged in', 'show username', 'check if user is admin', 'redirect to login', 'access denied page', 'custom security without Spring'. Routes through `@Route` annotations (`@AnonymousAccess`, `@PermitAll`, `@RolesAllowed`, `@DenyAll`, `@RouteAccess`, custom `@RegisteredEvaluator`s) and the route security framework (since 25.10). Prefers Spring Security when Spring Boot is on the classpath; otherwise implements the four core interfaces."
---

# Securing webforJ Apps

webforJ ships a route-level access-control framework (since 25.10). Two integration paths exist and they share the same annotations:

- **Spring Security integration (preferred)**: drop in `webforj-spring-boot-starter` + `spring-boot-starter-security`, configure with `WebforjSecurityConfigurer.webforj()`. Spring auto-discovers `@RegisteredEvaluator`s and registers built-in evaluators automatically.
- **Custom plain implementation**: implement `RouteSecurityConfiguration`, `RouteSecurityContext`, extend `AbstractRouteSecurityManager`, and register with `RouteSecurityObserver` from an `AppLifecycleListener`.

## Hard rules

1. **Prefer Spring Security if Spring Boot is on the classpath.** Only implement the custom path when the project is plain webforJ (no Spring Boot) or there is an explicit reason. Custom security is the architecture path; Spring is the default.
2. **Annotations are shared, packages are split.** `@AnonymousAccess` lives in `com.webforj.router.security.annotation`. `@PermitAll`, `@RolesAllowed`, `@DenyAll` come from `jakarta.annotation.security` (the standard Jakarta package, not webforJ). `@RouteAccess` and `@RegisteredEvaluator` are Spring-only and live in `com.webforj.spring.security.annotation`.
3. **`@AnonymousAccess` and `@PermitAll` are TERMINAL** -- they grant access immediately and stop the evaluator chain. They cannot be composed with custom evaluators. `@RolesAllowed` is COMPOSABLE -- it delegates to the chain after the role check, so it stacks with custom evaluators like `@RequireOwnership`.
4. **Secure-by-default is ON by default.** In Spring projects, the `webforj.security.secure-by-default` property defaults to `true` -- you do NOT have to set it to enable it. Set it to `false` only to opt out (early development). The `RouteSecurityConfiguration.isSecureByDefault()` interface default also returns `true`; custom plain implementations override to `false` if they want unannotated routes to be public. With it on, every route requires authentication unless explicitly marked `@AnonymousAccess`.
5. **Custom evaluators use priority >= 10.** Priorities 0-9 are reserved for framework evaluators. Spring logs a warning if you register below 10.
6. **Do not invent.** Every annotation, class, method, and property in this skill comes from the documented webforJ security framework, the canonical Spring sample, or the canonical plain sample. If a name is not listed here or in the references, it does not exist.

## Routing decision

| Project type | Path |
|---|---|
| Spring Boot app (most apps) | [Spring Security integration](#spring-security-integration) |
| Plain webforJ (no Spring Boot) | [Custom plain implementation](#custom-plain-implementation) |
| Already on Spring, but want a custom evaluator (ownership, subscription, IP, time-window) | Spring + `@RegisteredEvaluator` -- see [`references/custom-evaluators.md`](references/custom-evaluators.md) |
| Authorize purely with a boolean expression of roles/authorities | Spring + `@RouteAccess("...")` SpEL -- see [`references/spel.md`](references/spel.md) |
| Read the current user inside a view | [`references/accessing-user.md`](references/accessing-user.md) |
| Decide which annotation goes on which route | [`references/annotations.md`](references/annotations.md) |

## Authoritative facts

| What | Value |
|---|---|
| Available since | webforJ 25.10 |
| Spring dependency | `org.springframework.boot:spring-boot-starter-security` |
| Spring configurer entry point | `WebforjSecurityConfigurer.webforj()` (in `com.webforj.spring.security`) |
| webforJ-only annotation | `com.webforj.router.security.annotation.AnonymousAccess` |
| Jakarta annotations (any path) | `jakarta.annotation.security.PermitAll`, `RolesAllowed`, `DenyAll` |
| Spring-only annotation (SpEL) | `com.webforj.spring.security.annotation.RouteAccess` |
| Spring-only annotation (custom evaluators) | `com.webforj.spring.security.annotation.RegisteredEvaluator` |
| Custom-evaluator interface | `com.webforj.router.security.RouteSecurityEvaluator` |
| Decision factory | `com.webforj.router.security.RouteAccessDecision` (`grant()`, `deny(reason)`, `denyAuthentication()`) |
| Custom-impl base class | `com.webforj.router.security.AbstractRouteSecurityManager` |
| Navigation interceptor | `com.webforj.router.security.RouteSecurityObserver` |
| Built-in evaluator package | `com.webforj.router.security.evaluator.*` (`DenyAllEvaluator`, `AnonymousAccessEvaluator`, `PermitAllEvaluator`, `RolesAllowedEvaluator`, `AuthenticationRequiredEvaluator`) |
| Spring secure-by-default property | `webforj.security.secure-by-default` (defaults to `true`) in `application.properties` |
| Logout helper (Spring) | `com.webforj.spring.security.SpringSecurityFormSubmitter.logout("/logout").submit()` |
| Read user (Spring) | `org.springframework.security.core.context.SecurityContextHolder.getContext().getAuthentication()` |

## Built-in evaluator priorities

Spring-managed `SpringRouteSecurityManager` registers these:

| Priority | Evaluator | Annotation | Behavior |
|---|---|---|---|
| 1 | `DenyAllEvaluator` | `@DenyAll` | Always deny, terminal |
| 2 | `AnonymousAccessEvaluator` | `@AnonymousAccess` | Always grant, terminal |
| 3 | `AuthenticationRequiredEvaluator` | -- | Ensures auth before role checks |
| 4 | `PermitAllEvaluator` | `@PermitAll` | Grant if authenticated, terminal |
| 5 | `RolesAllowedEvaluator` | `@RolesAllowed` | Check role then delegate (composable) |
| 6 | `SpringRouteAccessEvaluator` | `@RouteAccess` | Evaluate SpEL then delegate (composable) |
| 10+ | Custom `@RegisteredEvaluator` | user-defined | User logic |

A custom plain implementation registers only what the app needs (the canonical plain sample uses 0/1/2/3 for `DenyAllEvaluator`, `AnonymousAccessEvaluator`, `PermitAllEvaluator`, `RolesAllowedEvaluator`). Specific numbers do not matter beyond ordering, but stay below 10 for built-ins.

## Spring Security integration

Use this when the project has `webforj-spring-boot-starter` and `spring-boot-starter-security`. Auto-configuration registers built-in evaluators, scans for `@RegisteredEvaluator` beans, and attaches `RouteSecurityObserver` to the router. You write the `SecurityConfig` and the views.

```
- [ ] 1. Add spring-boot-starter-security to pom.xml
- [ ] 2. Write SecurityConfig (filter chain + UserDetailsService + PasswordEncoder)
- [ ] 3. Write LoginView (@AnonymousAccess + Login component + setAction)
- [ ] 4. Write AccessDenyView (any view, mapped to the configured access-denied URL)
- [ ] 5. Annotate views with @AnonymousAccess / @PermitAll / @RolesAllowed / @DenyAll / @RouteAccess
- [ ] 6. (Optional) Override secure-by-default in application.properties
- [ ] 7. (Optional) Add a logout button using SpringSecurityFormSubmitter
```

### 1. Add the Spring Security starter

```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-security</artifactId>
</dependency>
```

The version is managed by the Spring Boot parent POM.

### 2. Write `SecurityConfig`

```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

  @Bean
  SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    return http
        .with(WebforjSecurityConfigurer.webforj(), configurer -> configurer
            .loginPage(LoginView.class)
            .accessDeniedPage(AccessDenyView.class)
            .logout())
        .build();
  }

  @Bean
  PasswordEncoder passwordEncoder() {
    return new BCryptPasswordEncoder();
  }

  @Bean
  UserDetailsService userDetailsService(PasswordEncoder passwordEncoder) {
    UserDetails user = User.builder()
        .username("user")
        .password(passwordEncoder.encode("password"))
        .roles("USER")
        .build();

    UserDetails admin = User.builder()
        .username("admin")
        .password(passwordEncoder.encode("admin"))
        .roles("USER", "ADMIN")
        .build();

    return new InMemoryUserDetailsManager(user, admin);
  }

  @Bean
  AuthenticationManager authenticationManager(
      UserDetailsService userDetailsService,
      PasswordEncoder passwordEncoder) {
    DaoAuthenticationProvider authenticationProvider = new DaoAuthenticationProvider(userDetailsService);
    authenticationProvider.setPasswordEncoder(passwordEncoder);

    return new ProviderManager(authenticationProvider);
  }
}
```

`WebforjSecurityConfigurer.webforj()`:

- `.loginPage(LoginView.class)` -- pass the view class. webforJ resolves the URL from `@Route` automatically. There is also a `String` overload (`.loginPage("/signin")`) and a two-arg form for separate display and processing URLs (`.loginPage("/signin", "/authenticate")`).
- `.accessDeniedPage(AccessDenyView.class)` -- same shape; also accepts a string URL.
- `.logout()` -- enables `/logout`. Overloads: `.logout("/custom-logout")`, `.logout("/custom-logout", "/login?logout")`.

### 3. Write `LoginView`

```java
@Route("/signin")
@AnonymousAccess
public class LoginView extends Composite<Login> implements DidEnterObserver {
  private final Login self = getBoundComponent();

  public LoginView() {
    self.setAction("/signin");
    whenAttached().thenAccept(c -> self.open());
  }

  @Override
  public void onDidEnter(DidEnterEvent event, ParametersBag params) {
    ParametersBag queryParams = event.getLocation().getQueryParameters();

    if (queryParams.containsKey("error")) {
      Toast.show("Invalid username or password. Please try again.", Theme.DANGER);
    }

    if (queryParams.containsKey("logout")) {
      Toast.show("You have been logged out successfully.", Theme.GRAY);
    }
  }
}
```

Critical:

- `@AnonymousAccess` is required. Without it, secure-by-default redirects unauthenticated users away from the login page itself, creating an infinite loop.
- `setAction(...)` must match the `@Route(...)` path (or the `loginProcessingUrl` if you used the two-arg `loginPage(...)` overload). The Login component POSTs credentials to this URL; Spring intercepts the POST.
- `?error` and `?logout` are query-parameter signals Spring adds after a failed login or successful logout. Read them in `onDidEnter`.

### 4. Write `AccessDenyView`

```java
@Route(value = "/access-denied", outlet = MainLayout.class)
public class AccessDenyView extends Composite<Div> {
  private final Div self = getBoundComponent();

  public AccessDenyView() {
    Paragraph message = new Paragraph("Oops! This area is VIP only.");
    Paragraph subMessage = new Paragraph(
        "Looks like you tried to sneak into the executive lounge! Either grab better credentials or head back to the public areas where the coffee is free anyway.");

    self.add(message, subMessage);
  }
}
```

Authenticated users with insufficient permissions land here. Unauthenticated users are sent to the login page instead.

### 5. Annotate routes

```java
// Public
@Route("/about")
@AnonymousAccess
public class AboutView extends Composite<Div> { }

// Any authenticated user
@Route(value = "/", outlet = MainLayout.class)
@PermitAll
public class InboxView extends Composite<FlexLayout> { }

// Specific role
@Route(value = "/teams", outlet = MainLayout.class)
@RolesAllowed("ADMIN")
public class TeamsView extends Composite<FlexLayout> { }

// Multiple roles -- ANY of them grants access
@Route(value = "/settings", outlet = MainLayout.class)
@RolesAllowed({"ADMIN", "MANAGER"})
public class SettingsView extends Composite<FlexLayout> { }

// Block everyone
@Route(value = "/maintenance", outlet = MainLayout.class)
@DenyAll
public class MaintenanceView extends Composite<FlexLayout> { }
```

See [`references/annotations.md`](references/annotations.md) for full annotation semantics.

### 6. (Optional) Override secure-by-default

The property defaults to `true` -- you only set it explicitly to be self-documenting, or to opt out:

```properties
# application.properties

# Default behavior, unannotated routes require authentication
webforj.security.secure-by-default=true

# Opt out, unannotated routes are public (early development only)
# webforj.security.secure-by-default=false
```

With it on (the default), routes WITHOUT any security annotation behave like `@PermitAll` (require authentication). Only `@AnonymousAccess` routes stay public.

### 7. (Optional) Logout button

```java
import com.webforj.component.icons.FeatherIcon;
import com.webforj.component.icons.IconButton;
import com.webforj.spring.security.SpringSecurityFormSubmitter;

IconButton logout = new IconButton(FeatherIcon.LOG_OUT.create());
logout.onClick(e -> SpringSecurityFormSubmitter.logout("/logout").submit());
```

Submits a hidden form to Spring's `/logout` endpoint, which invalidates the session and redirects to the login page with `?logout`.

### Reading the current user

```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;

Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
String username = authentication.getName();

boolean isAdmin = authentication.getAuthorities().stream()
    .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
```

Note that Spring prefixes role-based authorities with `ROLE_`. `@RolesAllowed("ADMIN")` matches `ROLE_ADMIN` in the granted authorities. The `hasRole('ADMIN')` SpEL helper applies the same prefix. See [`references/accessing-user.md`](references/accessing-user.md) for conditional rendering and view-level usage.

### SpEL rules with `@RouteAccess`

For purely role-or-authority logic, use SpEL instead of writing a custom evaluator:

```java
@Route(value = "/admin", outlet = MainLayout.class)
@RouteAccess("hasRole('ADMIN')")
public class AdminView extends Composite<Div> { }

@Route(value = "/reports/advanced", outlet = MainLayout.class)
@RouteAccess("hasRole('ADMIN') or (hasRole('ANALYST') and hasAuthority('REPORTS:ADVANCED'))")
public class AdvancedReportsView extends Composite<Div> { }
```

`@RouteAccess` is composable (delegates to the chain after the SpEL passes), so you can stack it with `@RolesAllowed` or a custom evaluator. Available functions: `hasRole`, `hasAnyRole`, `hasAuthority`, `hasAnyAuthority`, `isAuthenticated`. Available variables: `authentication`, `principal`, `routeClass`, `context`, `securityContext`. See [`references/spel.md`](references/spel.md).

### Custom evaluator (Spring)

Implement `RouteSecurityEvaluator`, annotate with `@RegisteredEvaluator(priority = 10)`, and Spring component-scans it automatically. Example for ownership checks:

```java
@Target(ElementType.TYPE)
@Retention(RetentionPolicy.RUNTIME)
public @interface RequireOwnership {
  String value() default "userId";
}
```

```java
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

    String requestedUserId = context.getRouteParameters().get(paramName).orElse(null);

    if (currentUserId != null && currentUserId.equals(requestedUserId)) {
      return chain.evaluate(routeClass, context, securityContext);
    }

    return RouteAccessDecision.deny("You can only access your own resources");
  }
}
```

Compose with `@RolesAllowed` because that one delegates:

```java
@Route(value = "/users/:userId/edit", outlet = MainLayout.class)
@RolesAllowed("USER")
@RequireOwnership("userId")
public class EditProfileView extends Composite<Div> { }
```

Do NOT compose with `@PermitAll` or `@AnonymousAccess` -- they are terminal and your evaluator never runs. See [`references/custom-evaluators.md`](references/custom-evaluators.md).

## Custom plain implementation

Use this only for plain webforJ projects without Spring Boot. You implement four interfaces and wire them at startup. The annotations (`@AnonymousAccess`, `@PermitAll`, `@RolesAllowed`, `@DenyAll`) work identically; SpEL (`@RouteAccess`) and `@RegisteredEvaluator` do NOT -- they are Spring-only.

```
- [ ] 1. SecurityConfiguration implements RouteSecurityConfiguration (enabled, secure-by-default, locations)
- [ ] 2. SecurityContext implements RouteSecurityContext (isAuthenticated, getPrincipal, hasRole, hasAuthority)
- [ ] 3. SecurityManager extends AbstractRouteSecurityManager (provide context + configuration; add login/logout helpers)
- [ ] 4. SecurityRegistrar implements AppLifecycleListener (create manager, register evaluators, attach RouteSecurityObserver)
- [ ] 5. Register the listener in META-INF/services/com.webforj.AppLifecycleListener
- [ ] 6. Write LoginView and AccessDenyView (use the SecurityManager.login()/logout() helpers)
```

The full walkthrough with verbatim source from the canonical plain sample lives in [`references/custom-implementation.md`](references/custom-implementation.md). The shape is:

```java
public class SecurityManager extends AbstractRouteSecurityManager {
  @Override public RouteSecurityConfiguration getConfiguration() { return new SecurityConfiguration(); }
  @Override public RouteSecurityContext getSecurityContext() { return new SecurityContext(); }
  // plus app-specific login()/logout() helpers
}

@AppListenerPriority(1)
public class SecurityRegistrar implements AppLifecycleListener {
  @Override public void onWillRun(App app) {
    SecurityManager mgr = new SecurityManager();
    mgr.saveCurrent(mgr);

    mgr.registerEvaluator(new DenyAllEvaluator(), 0);
    mgr.registerEvaluator(new AnonymousAccessEvaluator(), 1);
    mgr.registerEvaluator(new PermitAllEvaluator(), 2);
    mgr.registerEvaluator(new RolesAllowedEvaluator(), 3);

    RouteSecurityObserver observer = new RouteSecurityObserver(mgr);
    Router router = Router.getCurrent();
    if (router != null) {
      router.getRenderer().addObserver(observer);
    }
  }
}
```

Register the listener so webforJ runs it on startup:

```text
# src/main/resources/META-INF/services/com.webforj.AppLifecycleListener
com.example.security.SecurityRegistrar
```

## Verify (agent checks)

```bash
mvn clean compile
```

Then audit:

- For Spring projects:
  - `pom.xml` declares `spring-boot-starter-security`.
  - A `@Configuration @EnableWebSecurity` class exposes a `SecurityFilterChain` bean built with `WebforjSecurityConfigurer.webforj()`.
  - The login view has `@AnonymousAccess` AND uses `setAction(...)` with a path that matches its `@Route` (or the `loginProcessingUrl`).
  - `grep -rn "@RegisteredEvaluator" src/main/java` -- every match is on a class implementing `RouteSecurityEvaluator`, with `priority >= 10`.
  - If `@RouteAccess`, `@RegisteredEvaluator`, or `SpringSecurityFormSubmitter` appear in plain (non-Spring) sources, that is wrong -- they are Spring-only.
- For plain projects:
  - `META-INF/services/com.webforj.AppLifecycleListener` lists the registrar's FQCN, one per line.
  - The registrar registers `DenyAllEvaluator`, `AnonymousAccessEvaluator`, `PermitAllEvaluator`, `RolesAllowedEvaluator` and attaches a `RouteSecurityObserver` to `Router.getCurrent().getRenderer()`.
  - `grep -rn "spring-boot\|org.springframework" src/main` returns nothing.
- Universal:
  - `@PermitAll`, `@RolesAllowed`, `@DenyAll` imports come from `jakarta.annotation.security` (NOT Spring's `org.springframework.security.access` annotations).
  - `@AnonymousAccess` import is `com.webforj.router.security.annotation.AnonymousAccess`.
  - No route stacks `@PermitAll` or `@AnonymousAccess` with a custom evaluator -- those are terminal and the custom evaluator would never run; recommend `@RolesAllowed` for composition.
  - Custom evaluator priorities are `>= 10`.

Manual checks (ask the user, do NOT claim them): hit a public page anonymously and confirm it loads; hit a protected page anonymously and confirm the redirect to login; log in as the user without the role and hit a `@RolesAllowed` page, confirm the redirect to access denied; log out and confirm `?logout` appears.

## Quick reference

| Need | Where |
|---|---|
| Public page (login, landing) | `@AnonymousAccess` |
| Any authenticated user | `@PermitAll` (or no annotation, since `secure-by-default=true` by default) |
| Specific role | `@RolesAllowed("ADMIN")` |
| Any of several roles | `@RolesAllowed({"ADMIN", "MANAGER"})` |
| Block everyone | `@DenyAll` |
| Boolean role/authority expression | `@RouteAccess("hasRole('ADMIN') or hasAuthority('PREMIUM')")` (Spring only) |
| Custom logic (ownership, subscription, IP, time) | `@RegisteredEvaluator(priority = 10)` + `RouteSecurityEvaluator` (Spring) or manual `registerEvaluator(...)` (plain) |
| Read current user | `SecurityContextHolder.getContext().getAuthentication()` (Spring) or `SecurityManager.getCurrent().getSecurityContext()` (plain) |
| Logout (Spring) | `SpringSecurityFormSubmitter.logout("/logout").submit()` |
| Logout (plain) | call your manager's `logout()` helper |
| Secure-by-default (Spring) | `webforj.security.secure-by-default` in `application.properties`, defaults to `true`; set to `false` to opt out |
| Secure-by-default (plain) | `RouteSecurityConfiguration.isSecureByDefault()`; the interface default returns `true`, override to `false` to opt out |
| Login page binding | `WebforjSecurityConfigurer.webforj().loginPage(LoginView.class)` |
| Access-denied page binding | `WebforjSecurityConfigurer.webforj().accessDeniedPage(AccessDenyView.class)` |

## Resources

- [`references/annotations.md`](references/annotations.md) -- per-annotation contract, packages, composition rules
- [`references/accessing-user.md`](references/accessing-user.md) -- read username/roles in views, conditional rendering
- [`references/spel.md`](references/spel.md) -- `@RouteAccess` SpEL functions, variables, error codes
- [`references/custom-evaluators.md`](references/custom-evaluators.md) -- custom annotations + evaluators, priority, composition
- [`references/custom-implementation.md`](references/custom-implementation.md) -- the four interfaces, full plain-webforJ wiring
