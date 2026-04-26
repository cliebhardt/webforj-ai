# Custom Plain Implementation

Use this when the project is plain webforJ -- no Spring Boot, no `webforj-spring-boot-starter`. You implement four small classes; the framework provides everything else.

The annotations (`@AnonymousAccess`, `@PermitAll`, `@RolesAllowed`, `@DenyAll`) work identically. The Spring-only annotations (`@RouteAccess`, `@RegisteredEvaluator`) are NOT available -- there is no SpEL evaluator and no auto-discovery.

## The four interfaces

| Interface / class | Responsibility |
|---|---|
| `RouteSecurityConfiguration` | Where to redirect, whether security is on, secure-by-default |
| `RouteSecurityContext` | Who is logged in, role/authority checks, custom attributes |
| `AbstractRouteSecurityManager` | Coordinator -- you extend this, providing the context and configuration |
| `AppLifecycleListener` | Wires the manager and observer at startup |

## Step 1 -- Configuration

```java
package com.example.security;

import com.webforj.router.history.Location;
import com.webforj.router.security.RouteSecurityConfiguration;
import java.util.Optional;

public class SecurityConfiguration implements RouteSecurityConfiguration {

  @Override
  public boolean isEnabled() {
    return true;
  }

  @Override
  public boolean isSecureByDefault() {
    return false;
  }

  @Override
  public Optional<Location> getAuthenticationLocation() {
    return Optional.of(new Location("/login"));
  }

  @Override
  public Optional<Location> getDenyLocation() {
    return Optional.of(new Location("/access-denied"));
  }
}
```

| Method | Purpose |
|---|---|
| `isEnabled()` | Master switch. `false` makes the framework grant every route without evaluating. |
| `isSecureByDefault()` | `true` (interface default) -- unannotated routes require auth. `false` -- unannotated routes are public. The canonical sample overrides to `false` to keep early development simple; production code typically leaves the default `true`. |
| `getAuthenticationLocation()` | Where unauthenticated users are sent (login page). |
| `getDenyLocation()` | Where authenticated-but-unauthorized users are sent (access-denied page). |

## Step 2 -- Context

The context answers "who is logged in" using whatever storage your app picked (HTTP session, JWT, database, LDAP). The canonical sample uses session storage:

```java
package com.example.security;

import com.webforj.Environment;
import com.webforj.router.security.RouteSecurityContext;
import java.util.HashMap;
import java.util.Map;
import java.util.Optional;
import java.util.Set;

public class SecurityContext implements RouteSecurityContext {
  private static final String SESSION_USER_KEY = "security.user";
  private static final String SESSION_ROLES_KEY = "security.roles";
  private static final String SESSION_ATTRS_KEY = "security.attributes";

  @Override
  public boolean isAuthenticated() {
    return getPrincipal().isPresent();
  }

  @Override
  public Optional<Object> getPrincipal() {
    return getSessionAttribute(SESSION_USER_KEY);
  }

  @Override
  public boolean hasRole(String role) {
    Optional<Object> rolesObj = getSessionAttribute(SESSION_ROLES_KEY);
    if (rolesObj.isPresent() && rolesObj.get() instanceof Set) {
      @SuppressWarnings("unchecked")
      Set<String> roles = (Set<String>) rolesObj.get();
      return roles.contains(role);
    }
    return false;
  }

  @Override
  public boolean hasAuthority(String authority) {
    return hasRole(authority);
  }

  @Override
  public Optional<Object> getAttribute(String name) {
    Optional<Object> attrsObj = getSessionAttribute(SESSION_ATTRS_KEY);
    if (attrsObj.isPresent() && attrsObj.get() instanceof Map) {
      @SuppressWarnings("unchecked")
      Map<String, Object> attrs = (Map<String, Object>) attrsObj.get();
      return Optional.ofNullable(attrs.get(name));
    }
    return Optional.empty();
  }

  @Override
  public void setAttribute(String name, Object value) {
    Environment.ifPresent(env -> {
      env.getSessionAccessor().ifPresent(accessor -> {
        accessor.access(session -> {
          @SuppressWarnings("unchecked")
          Map<String, Object> attrs =
              (Map<String, Object>) session.getAttribute(SESSION_ATTRS_KEY);
          if (attrs == null) {
            attrs = new HashMap<>();
            session.setAttribute(SESSION_ATTRS_KEY, attrs);
          }
          attrs.put(name, value);
        });
      });
    });
  }

  private Optional<Object> getSessionAttribute(String key) {
    final Object[] result = new Object[1];
    Environment.ifPresent(env -> {
      env.getSessionAccessor().ifPresent(accessor -> {
        accessor.access(session -> {
          result[0] = session.getAttribute(key);
        });
      });
    });
    return Optional.ofNullable(result[0]);
  }
}
```

`Environment.getSessionAccessor()` is the supported way to read/write the HTTP session from inside webforJ. For JWT or external stores, replace the `getSessionAttribute(...)` body.

## Step 3 -- Manager

Extend `AbstractRouteSecurityManager`. The base class handles the evaluator chain, secure-by-default fallback, redirect on denial, and pre-auth-location storage. You only provide the context and configuration plus app-specific helpers.

```java
package com.example.security;

import com.webforj.environment.ObjectTable;
import com.webforj.environment.SessionObjectTable;
import com.webforj.router.Router;
import com.webforj.router.security.AbstractRouteSecurityManager;
import com.webforj.router.security.RouteAccessDecision;
import com.webforj.router.security.RouteSecurityConfiguration;
import com.webforj.router.security.RouteSecurityContext;

import java.util.Set;

public class SecurityManager extends AbstractRouteSecurityManager {
  private static final String SESSION_USER_KEY = "security.user";
  private static final String SESSION_ROLES_KEY = "security.roles";

  @Override
  public RouteSecurityConfiguration getConfiguration() {
    return new SecurityConfiguration();
  }

  @Override
  public RouteSecurityContext getSecurityContext() {
    return new SecurityContext();
  }

  public RouteAccessDecision login(String username, String password) {
    if ("user".equals(username) && "password".equals(password)) {
      Set<String> roles = Set.of("USER");
      persistUser(username, roles);
      return RouteAccessDecision.grant();
    } else if ("admin".equals(username) && "admin".equals(password)) {
      Set<String> roles = Set.of("USER", "ADMIN");
      persistUser(username, roles);
      return RouteAccessDecision.grant();
    }

    return RouteAccessDecision.deny("Invalid username or password");
  }

  public void logout() {
    SessionObjectTable.clear(SESSION_USER_KEY);
    SessionObjectTable.clear(SESSION_ROLES_KEY);

    Router router = Router.getCurrent();
    if (router != null) {
      getConfiguration().getAuthenticationLocation()
          .ifPresent(location -> router.navigate(location));
    }
  }

  public static SecurityManager getCurrent() {
    String key = SecurityManager.class.getName();
    if (ObjectTable.contains(key)) {
      return (SecurityManager) ObjectTable.get(key);
    }

    SecurityManager instance = new SecurityManager();
    ObjectTable.put(key, instance);

    return instance;
  }

  void saveCurrent(SecurityManager manager) {
    String key = SecurityManager.class.getName();
    ObjectTable.put(key, manager);
  }

  private void persistUser(String username, Set<String> roles) {
    SessionObjectTable.put(SESSION_USER_KEY, username);
    SessionObjectTable.put(SESSION_ROLES_KEY, roles);
  }
}
```

`ObjectTable` (app-wide) and `SessionObjectTable` (per-session) are the documented webforJ storage primitives. `getCurrent()` returns a singleton scoped to the app.

The `login(...)` method here uses an in-memory two-user check for illustration. In a real app, swap in your authentication source (database, LDAP, OAuth callback, etc.).

## Step 4 -- Registrar

A startup hook that creates the manager, registers built-in evaluators, and attaches the navigation observer.

```java
package com.example.security;

import com.webforj.App;
import com.webforj.AppLifecycleListener;
import com.webforj.annotation.AppListenerPriority;
import com.webforj.router.Router;
import com.webforj.router.security.RouteSecurityObserver;
import com.webforj.router.security.evaluator.AnonymousAccessEvaluator;
import com.webforj.router.security.evaluator.DenyAllEvaluator;
import com.webforj.router.security.evaluator.PermitAllEvaluator;
import com.webforj.router.security.evaluator.RolesAllowedEvaluator;

@AppListenerPriority(1)
public class SecurityRegistrar implements AppLifecycleListener {

  @Override
  public void onWillRun(App app) {
    SecurityManager securityManager = new SecurityManager();
    securityManager.saveCurrent(securityManager);

    securityManager.registerEvaluator(new DenyAllEvaluator(), 0);
    securityManager.registerEvaluator(new AnonymousAccessEvaluator(), 1);
    securityManager.registerEvaluator(new PermitAllEvaluator(), 2);
    securityManager.registerEvaluator(new RolesAllowedEvaluator(), 3);

    RouteSecurityObserver securityObserver = new RouteSecurityObserver(securityManager);
    Router router = Router.getCurrent();
    if (router != null) {
      router.getRenderer().addObserver(securityObserver);
    }
  }
}
```

`@AppListenerPriority(1)` makes this run early -- before any view is rendered. The priority numbers here (`0`, `1`, `2`, `3`) order the evaluators in the chain; their absolute values do not matter as long as they stay below `10` (which is reserved for custom evaluators).

To add a custom evaluator, register it after the built-ins:

```java
securityManager.registerEvaluator(new OwnershipEvaluator(), 10);
```

## Step 5 -- Register the listener

webforJ discovers `AppLifecycleListener` via the standard Java SPI mechanism. Create:

```text
src/main/resources/META-INF/services/com.webforj.AppLifecycleListener
```

with one fully qualified class name per line:

```text
com.example.security.SecurityRegistrar
```

If the file is missing or the FQCN is wrong, the registrar never runs and the security framework is silently inactive.

## LoginView and AccessDenyView (plain)

The login view calls `SecurityManager.getCurrent().login(...)` directly -- there is no Spring auth endpoint to POST to.

```java
@Route("/login")
@AnonymousAccess
public class LoginView extends Composite<Login> {
  private Login self = getBoundComponent();

  public LoginView() {
    self.onSubmit(e -> {
      var result = SecurityManager.getCurrent().login(e.getUsername(), e.getPassword());
      if (result.isGranted()) {
        Router.getCurrent().navigate(new Location("/"));
      } else {
        self.setError(true);
        self.setEnabled(true);
      }
    });

    self.whenAttached().thenAccept(c -> self.open());
  }
}
```

Logout:

```java
IconButton logout = new IconButton(FeatherIcon.LOG_OUT.create());
logout.onClick(e -> SecurityManager.getCurrent().logout());
```

The access-denied view is the same shape as the Spring path -- a regular view at the URL the configuration returns from `getDenyLocation()`.

## What you do NOT do in plain mode

- Do NOT add `spring-boot-starter-security` -- there is no Spring `SecurityFilterChain` to wire.
- Do NOT use `@RouteAccess` -- it requires `SpringRouteAccessEvaluator` which is in `webforj-spring-integration`.
- Do NOT use `@RegisteredEvaluator` -- it relies on Spring component scanning. Register custom evaluators manually inside `SecurityRegistrar.onWillRun(...)`.
- Do NOT use `SpringSecurityFormSubmitter` -- there is no `/logout` endpoint to POST to. Call your `SecurityManager.logout()` directly.
- Do NOT use `SecurityContextHolder` from Spring -- it is empty. Use `SecurityManager.getCurrent().getSecurityContext()` instead.
