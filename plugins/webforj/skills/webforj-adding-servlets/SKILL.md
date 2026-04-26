---
name: webforj-adding-servlets
description: "Adds custom HTTP endpoints to a webforJ app for REST APIs, webhooks, third-party servlet integrations, or any non-UI HTTP path. Use whenever the user asks to add a REST endpoint, REST API, custom servlet, HTTP endpoint, webhook handler, `/api/` route, integrate a third-party servlet (Swagger UI, Spring Web, etc.), or any non-UI HTTP path that should NOT be routed through webforJ's UI engine. Covers the three documented approaches: in Spring Boot apps (since 25.03) use `webforj.exclude-urls` plus a standard Spring `@RestController`, in any project remap `WebforjServlet` to a sub-path, or in plain webforJ proxy through `webforj.conf`'s `webforj.servlets` list."
---

# Adding Servlets to a webforJ App

webforJ routes all requests through `WebforjServlet`, which is mapped to `/*` in `web.xml` by default. To add a non-UI HTTP endpoint (REST API, webhook, third-party library servlet), the URL has to come out from under `/*`. Three documented mechanisms do that.

## Authoritative facts

| What | Value |
|---|---|
| `WebforjServlet` fully-qualified name | `com.webforj.servlet.WebforjServlet` |
| Default URL pattern | `/*` |
| Plain project descriptor | `src/main/webapp/WEB-INF/web.xml` |
| Plain project HOCON config | `src/main/resources/webforj-dev.conf` (and `webforj-prod.conf`) |
| Spring config | `src/main/resources/application.properties` |
| Spring property: keep webforJ at `/*` and bypass it for some URLs | `webforj.exclude-urls` (List of Ant patterns, since 25.03) |
| Spring property: remap webforJ to a sub-path | `webforj.servlet-mapping` |
| HOCON property: register a proxied servlet (plain webforJ) | `webforj.servlets[n].className`, `webforj.servlets[n].name`, `webforj.servlets[n].config.<key>` |
| Servlet API package (Jakarta EE 9+) | `jakarta.servlet.http.HttpServlet` (NOT `javax.servlet`, that's the legacy package) |

## Pick your approach

| Project | Goal | Approach |
|---|---|---|
| Spring Boot | Add a REST API, webhook, or any non-UI URL pattern, keep webforJ at `/*` | [Approach 1: Spring `webforj.exclude-urls`](#approach-1-spring-webforjexclude-urls) |
| Plain or Spring | Move the entire webforJ UI to a sub-path so the rest of `/*` is free for any servlet | [Approach 2: Remap `WebforjServlet`](#approach-2-remap-webforjservlet) |
| Plain webforJ | Add a custom servlet, keep `WebforjServlet` at `/*`, and let webforJ proxy to the custom servlet | [Approach 3: Proxy through `webforj.conf`](#approach-3-proxy-through-webforjconf) |

**Default for Spring projects: Approach 1.** It is the simplest and most idiomatic, you write a normal Spring `@RestController` (or any Spring MVC handler) and add one line of config. webforJ does not move.

**Default for plain webforJ: Approach 2.** A direct servlet declaration in `web.xml` is less indirection than the proxy.

## Approach 1: Spring `webforj.exclude-urls`

Spring Boot apps (since 25.03) can keep `WebforjServlet` at `/*` and tell webforJ to NOT consume specific URL patterns. Excluded patterns fall through to Spring MVC, where any `@RestController`, `@Controller`, or `ServletRegistrationBean` handles them normally.

```
- [ ] 1. Implement the endpoint as a standard Spring @RestController (or @Controller)
- [ ] 2. Add webforj.exclude-urls=<pattern> to application.properties
- [ ] 3. Verify
```

### 1. Implement the endpoint

Just Spring. Nothing webforJ-specific:

```java
@RestController
@RequestMapping("/api/customers")
public class CustomerRestController {

    @Autowired
    private CustomerRepository customerRepository;

    /**
     * REST API for getting all customers
     *
     * GET http://localhost:8080/api/customers
     */
    @GetMapping
    public List<Customer> getAllCustomers() {
        return customerRepository.findAll();
    }

    /**
     * REST API for getting a single customer by ID
     *
     * GET http://localhost:8080/api/customers/{id}
     */
    @GetMapping("/{id}")
    public ResponseEntity<Customer> getCustomerById(@PathVariable Long id) {
        Optional<Customer> customer = customerRepository.findById(id);
        return customer.map(ResponseEntity::ok)
                      .orElse(ResponseEntity.notFound().build());
    }
}
```

For a raw servlet (third-party servlet drop-in, legacy code), use a `ServletRegistrationBean` instead:

```java
@Bean
ServletRegistrationBean<MyServlet> myServlet() {
  return new ServletRegistrationBean<>(new MyServlet(), "/api/legacy/*");
}
```

### 2. Exclude the pattern from webforJ

`src/main/resources/application.properties`:

```properties
# Used to exclude REST endpoints from being handled by webforJ router
webforj.exclude-urls=/api/**
```

Multiple patterns are comma-separated:

```properties
webforj.exclude-urls=/api/**,/webhook/**,/static/**
```

Patterns use Ant-style matching (`/foo/*` matches one segment, `/foo/**` matches any depth).

After this:

- `WebforjServlet` stays at `/*`.
- Requests matching `webforj.exclude-urls` are forwarded to Spring MVC.
- All other requests (including the webforJ UI routes) go to webforJ.

This is the path the canonical Spring sample uses. No `web.xml` is involved. webforJ's URL does not change.

### 3. Verify

- `GET /api/customers` returns the controller's response.
- `GET /` (or wherever the home route is) renders the webforJ UI.
- No URL pattern that webforJ owns has changed.

## Approach 2: Remap `WebforjServlet`

Move `WebforjServlet` from `/*` to a sub-path like `/ui/*`. The custom servlet keeps its own URL pattern. No proxy mechanism, the servlet container routes directly. Works for both plain webforJ and Spring.

```
- [ ] 1. Implement the servlet class
- [ ] 2. Remap WebforjServlet (web.xml for plain, webforj.servlet-mapping for Spring)
- [ ] 3. Declare the custom servlet (web.xml for plain, standard Spring for Spring)
- [ ] 4. Verify
```

### 1. Implement the servlet

For plain webforJ, a standard Jakarta servlet:

```java
import jakarta.servlet.http.HttpServlet;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;

public class HelloWorldServlet extends HttpServlet {
  @Override
  protected void doGet(HttpServletRequest req, HttpServletResponse resp) throws IOException {
    resp.setContentType("text/plain");
    resp.getWriter().write("hello");
  }
}
```

For Spring, a `@RestController` or `ServletRegistrationBean` is the natural form (see Approach 1).

### 2a. Remap in `web.xml` (plain webforJ)

Change `WebforjServlet`'s URL pattern from `/*` to a sub-path like `/ui/*`. Add the custom servlet declaration alongside.

```xml
<web-app>
  <!-- WebforjServlet remapped to handle only /ui/* -->
  <servlet>
    <servlet-name>WebforjServlet</servlet-name>
    <servlet-class>com.webforj.servlet.WebforjServlet</servlet-class>
    <load-on-startup>1</load-on-startup>
  </servlet>
  <servlet-mapping>
    <servlet-name>WebforjServlet</servlet-name>
    <url-pattern>/ui/*</url-pattern>
  </servlet-mapping>
  
  <!-- Custom servlet with its own URL pattern -->
  <servlet>
    <servlet-name>HelloWorldServlet</servlet-name>
    <servlet-class>com.example.HelloWorldServlet</servlet-class>
  </servlet>
  <servlet-mapping>
    <servlet-name>HelloWorldServlet</servlet-name>
    <url-pattern>/hello-world</url-pattern>
  </servlet-mapping>
</web-app>
```

After this:

- webforJ components are accessible under `/ui/`.
- The custom servlet handles `/hello-world` directly.
- No proxy is involved, requests go straight to the servlet container's routing table.

### 2b. Remap in `application.properties` (Spring Boot)

Spring projects do not have a `web.xml`. Set the property instead:

```properties
webforj.servlet-mapping=/ui/*
```

Do not include quotes around the value, they will be interpreted as part of the URL pattern.

### 3. Declare the custom servlet

For plain webforJ, the custom servlet is declared in `web.xml` (already shown in step 2a).

For Spring, register through standard Spring mechanics: `@RestController`, `@Controller`, or a `ServletRegistrationBean`. No webforJ-specific glue is required.

### 4. Verify

- `GET /ui/` (or wherever the home route is) renders the webforJ UI.
- `GET /hello-world` returns the custom servlet's response.
- Existing webforJ URLs that previously worked under `/foo` now require `/ui/foo`.

## Approach 3: Proxy through `webforj.conf`

For plain webforJ projects only. Keep `WebforjServlet` at `/*`. `WebforjServlet` intercepts all requests and proxies matching patterns to the registered custom servlets. Custom servlets are listed in `webforj.conf`.

```
- [ ] 1. Implement the servlet class
- [ ] 2. Keep WebforjServlet mapped to /*
- [ ] 3. Declare the custom servlet in web.xml
- [ ] 4. Register the custom servlet in webforj.conf under webforj.servlets
- [ ] 5. Verify
```

### 1. Implement the servlet

Same as in Approach 2 (plain).

### 2 & 3. Standard `web.xml` configuration

Leave `WebforjServlet` on `/*` and add the custom servlet declaration:

```xml
<servlet>
  <servlet-name>WebforjServlet</servlet-name>
  <servlet-class>com.webforj.servlet.WebforjServlet</servlet-class>
  <load-on-startup>1</load-on-startup>
</servlet>
<servlet-mapping>
  <servlet-name>WebforjServlet</servlet-name>
  <url-pattern>/*</url-pattern>
</servlet-mapping>

<!-- Custom servlet with its own URL pattern -->
<servlet>
  <servlet-name>HelloWorldServlet</servlet-name>
  <servlet-class>com.example.HelloWorldServlet</servlet-class>
</servlet>
<servlet-mapping>
  <servlet-name>HelloWorldServlet</servlet-name>
  <url-pattern>/hello-world</url-pattern>
</servlet-mapping>
</web-app>
```

### 4. Register the servlet in `webforj.conf`

`WebforjServlet` only proxies servlets that are listed under `webforj.servlets` in `webforj.conf`. Without this entry, requests to `/hello-world` are intercepted by `WebforjServlet` and never reach the custom servlet.

The property reference (`webforj.servlets[n].*`) gives three keys per entry:

| Key | Type | Purpose |
|---|---|---|
| `className` | String | Fully qualified class name of the servlet |
| `name` | String | Servlet name (uses class name if not specified) |
| `config.<key>` | Map<String,String> | Servlet initialization parameters |

```hocon
webforj.servlets = [
  {
    className = "com.example.HelloWorldServlet"
    name = "hello-world"
    config = {
      foo = "bar"
      baz = "bang"
    }
  }
]
```

The optional `config` map is delivered to the servlet as initialization parameters (`ServletConfig.getInitParameter(...)`). Omit it when no init params are needed.

### 5. Verify

- `GET /` renders the webforJ UI as before.
- `GET /hello-world` returns the custom servlet's response, proxied through `WebforjServlet`.
- The custom servlet receives any `config` entries via `ServletConfig.getInitParameter(...)`.

## Verify (agent checks)

```bash
mvn clean compile
```

Then audit:

- `grep -n "javax.servlet" src` should return nothing. Modern webforJ projects use `jakarta.servlet`. Any `javax.servlet` import is wrong on Jakarta EE 9+.
- For Approach 1 (Spring + exclude-urls): `application.properties` has a `webforj.exclude-urls=` line whose pattern covers the new endpoint, AND a Spring `@RestController` (or `ServletRegistrationBean`) handles the matching URL. `WebforjServlet`'s mapping is unchanged.
- For Approach 2 plain: `web.xml` has `WebforjServlet` mapped to a sub-path (NOT `/*`).
- For Approach 2 Spring: `application.properties` has `webforj.servlet-mapping=/ui/*` (or another sub-path) and there is no leftover `webforj.servlet-mapping=/*`.
- For Approach 3 plain: `web.xml` has `WebforjServlet` on `/*` AND a custom-servlet declaration; `webforj.conf` has a matching entry under `webforj.servlets` with `className` matching the custom servlet's fully qualified class name.
- For all approaches that write a raw servlet: it extends `jakarta.servlet.http.HttpServlet`.

Manual checks (ask the user, do NOT claim them): hit the custom URL with a browser or `curl`, confirm the servlet's response. Then hit a webforJ route, confirm the UI still loads.

## Quick reference

| Need | Where |
|---|---|
| Spring Boot, keep webforJ at `/*`, add a REST endpoint | `webforj.exclude-urls=/api/**` in `application.properties` plus a standard Spring `@RestController` |
| Multiple exclusion patterns | `webforj.exclude-urls=/api/**,/webhook/**` (comma-separated, Ant-style) |
| Spring Boot, move webforJ to a sub-path | `webforj.servlet-mapping=/ui/*` in `application.properties` |
| Plain webforJ, move webforJ to a sub-path | `<url-pattern>/ui/*</url-pattern>` in `web.xml` |
| Default webforJ URL pattern | `/*` |
| Plain webforJ, proxy a custom servlet | declare in `web.xml`, register in `webforj.conf` under `webforj.servlets` with `className`, `name`, and optional `config` |
| Pass init parameters to a proxied servlet | `config = { key = "value" }` inside the `webforj.servlets` entry |
| Servlet base class | `jakarta.servlet.http.HttpServlet` |
| Wrong base class (legacy, do not use on Jakarta EE 9+) | `javax.servlet.http.HttpServlet` |
