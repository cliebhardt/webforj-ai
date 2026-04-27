# Accessing the Current User

How to read the authenticated user inside a webforJ view, conditionally render UI based on roles, and check authorities.

## Spring Security

Spring stores the authenticated user in `SecurityContextHolder`. It is thread-safe and available anywhere in your code, including view constructors.

```java
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.core.GrantedAuthority;

Authentication authentication = SecurityContextHolder.getContext().getAuthentication();

String username = authentication.getName();

Collection<? extends GrantedAuthority> authorities = authentication.getAuthorities();

boolean isAdmin = authorities.stream()
    .anyMatch(grantedAuthority -> grantedAuthority.getAuthority().equals("ROLE_ADMIN"));
```

Spring prefixes role-based authorities with `ROLE_`, the granted authority for `@RolesAllowed("ADMIN")` is `ROLE_ADMIN`. The SpEL helper `hasRole('ADMIN')` applies the same prefix automatically. When you compare strings yourself, include the prefix.

### Display the username in a view

```java
@Route("/dashboard")
@PermitAll
public class DashboardView extends Composite<Div> {
  private final Div self = getBoundComponent();

  public DashboardView() {
    Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
    String username = authentication.getName();

    H1 welcome = new H1("Welcome, " + username + "!");
    self.add(welcome);
  }
}
```

### Conditional rendering by role

```java
@Route("/dashboard")
@PermitAll
public class DashboardView extends Composite<Div> {
  private final Div self = getBoundComponent();

  public DashboardView() {
    Authentication auth = SecurityContextHolder.getContext().getAuthentication();

    boolean isAdmin = auth.getAuthorities().stream()
        .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

    if (isAdmin) {
      Button adminPanel = new Button("Admin Panel");
      adminPanel.onClick(e -> Router.getCurrent().navigate(AdminView.class));
      self.add(adminPanel);
    }
  }
}
```

UI-level role gating is presentation only, it hides links from non-admins. Real enforcement still happens at the route level via `@RolesAllowed`. Always pair conditional rendering with the matching annotation on the protected route.

### OAuth2 user attributes

When the user signs in via OAuth2, the principal is an `OAuth2User` with provider-specific attributes:

```java
import org.springframework.security.oauth2.core.user.OAuth2User;

Authentication auth = SecurityContextHolder.getContext().getAuthentication();
if (auth.getPrincipal() instanceof OAuth2User oauth2User) {
  String name = oauth2User.getAttribute("name");           // Google
  String login = oauth2User.getAttribute("login");          // GitHub
  String picture = oauth2User.getAttribute("picture");      // Google
  String avatarUrl = oauth2User.getAttribute("avatar_url"); // GitHub
}
```

Form-login users return a `UserDetails` from `auth.getPrincipal()`; OAuth2 users return an `OAuth2User`. Branch on `instanceof` when the same view supports both.

## Custom plain implementation

Use the security manager that the registrar created at startup. Its context implements `RouteSecurityContext`:

```java
RouteSecurityContext ctx = SecurityManager.getCurrent().getSecurityContext();

boolean loggedIn = ctx.isAuthenticated();
String username = ctx.getPrincipal().map(Object::toString).orElse(null);
boolean isAdmin = ctx.hasRole("ADMIN");
boolean canRead = ctx.hasAuthority("REPORTS:READ");
```

The contract:

| Method | Returns |
|---|---|
| `isAuthenticated()` | `true` if a principal exists |
| `getPrincipal()` | `Optional<Object>`, whatever the implementation stores (typically the username String) |
| `hasRole(String)` | role-based check |
| `hasAuthority(String)` | authority-based check |
| `getAttribute(String)` / `setAttribute(String, Object)` | custom security attributes |

How `getPrincipal()` is shaped depends on what the custom `SecurityContext` implementation chose to store, it could be a username String, a domain user object, JWT claims, etc. See [`custom-implementation.md`](custom-implementation.md).
