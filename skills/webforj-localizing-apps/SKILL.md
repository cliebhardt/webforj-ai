---
name: webforj-localizing-apps
description: "Adds locale and translation support to a webforJ app using the built in translation system from version 25.12 (BundleTranslationResolver, HasTranslation, LocaleObserver, custom TranslationResolver). Use when the user asks to add i18n, internationalization, l10n, localization, locale support, translation, multi-language, language switcher, message bundles, `messages.properties`, set up supported locales, switch language at runtime, auto-detect the user's browser language, or translate component labels."
---

# Localizing webforJ Apps

webforJ ships a built in translation system in 25.12. It consists of a `TranslationResolver` (default `BundleTranslationResolver` reads Java `ResourceBundle` files), a `HasTranslation` concern that gives components a `t()` helper, `App.getTranslation(...)` for direct access, browser locale auto-detection, and pluggable custom resolvers.

## Authoritative imports

Every type referenced in this skill, with its fully qualified name. Use these exact packages, do not infer alternatives:

```java
import com.webforj.App;
import com.webforj.AppLifecycleListener;
import com.webforj.concern.HasTranslation;
import com.webforj.i18n.TranslationResolver;
import com.webforj.i18n.BundleTranslationResolver;
import com.webforj.i18n.LocaleObserver;
import com.webforj.i18n.event.LocaleEvent;
```

Spring projects also use:

```java
import com.webforj.spring.SpringConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
```

There is no `com.webforj.environment.namespace.*` package for any of these types. If a candidate import lands under `environment.namespace`, it is wrong.

## Workflow

```
Localization Progress:
- [ ] 1. Confirm scope (locales, default, where translations live)
- [ ] 2. Detect Spring vs plain
- [ ] 3. Configure locale properties
- [ ] 4. Provide translations (default ResourceBundle, or custom resolver)
- [ ] 5. Translate component text via t() (implements HasTranslation)
- [ ] 6. React to locale changes via LocaleObserver
- [ ] 7. Change the locale at runtime
- [ ] 8. Verify
```

### 1. Confirm scope

Ask the user (or read from the spec):

- Which locales must be supported? List BCP 47 tags: `en`, `en-US`, `de`, `fr`, `de-DE`, `fr_CA`.
- Should the app auto-detect the browser language at startup?
- Where do translations live? Default Java ResourceBundle property files in `src/main/resources/`, or a custom backend (database, REST). Default is correct for most apps.

### 2. Detect Spring vs plain

Look at `pom.xml`:

- Dependency on `com.webforj:webforj-spring-boot-starter` (or `org.springframework.boot:*`) means Spring. Configure via `application.properties`. Wire custom resolvers as `@Bean`.
- No Spring dependencies means plain. Configure via `webforj.conf` (HOCON). Wire custom resolvers via an `AppLifecycleListener`.

The Java code that uses `t(...)`, `LocaleObserver`, and `App.setLocale(...)` is identical between the two.

### 3. Configure locale properties

Three properties apply:

| Property | Type | Behavior |
|---|---|---|
| `webforj.locale` | String | The locale used at startup when auto-detect is off or no supported locale matches. Falls back to the server's JVM default when not set. |
| `webforj.i18n.supported-locales` (since 25.12) | List | Supported locales as BCP 47 tags, e.g. `"en"`, `"en-US"`, `"fr"`, `"de-DE"`. The first entry is the default fallback when matching fails. |
| `webforj.i18n.auto-detect` (since 25.12) | Boolean | When `true`, the app locale is set from the browser's preferred language at startup, matched against `supported-locales`. When `false` or `supported-locales` is empty, the app uses `webforj.locale`. Default `false`. |

Auto-detect requires `supported-locales` to be set. Without it, auto-detect has no effect.

#### Plain (HOCON in `webforj.conf`)

```hocon
webforj.i18n {
  supported-locales = ["en", "de"]
  auto-detect = true
}
```

#### Spring (`application.properties`)

```properties
webforj.i18n.supported-locales=en,de
webforj.i18n.auto-detect=true
```

### 4. Provide translations

#### Default: ResourceBundle property files

`BundleTranslationResolver` is the default. It loads translations from `src/main/resources` using the standard Java `ResourceBundle` naming convention:

```text
messages.properties        # Default/fallback translations
messages_en.properties     # English
messages_de.properties     # German
messages_fr_CA.properties  # French (Canada)
```

Each file holds key-value pairs. Use `MessageFormat` placeholders (`{0}`, `{1}`) for dynamic values:

```properties title="messages.properties"
app.title=Mailbox
menu.inbox=Inbox
menu.outbox=Outbox
greeting=Hello {0}, you have {1} new messages
```

```properties title="messages_de.properties"
app.title=Postfach
menu.inbox=Posteingang
menu.outbox=Postausgang
greeting=Hallo {0}, Sie haben {1} neue Nachrichten
```

The resolver delegates to Java's standard `ResourceBundle` resolution chain, which handles locale matching and fallback automatically. Missing keys return the key itself (a warning is logged), so the app does not crash on a missing translation.

In a Spring Boot app with no custom resolver bean, Spring auto-configuration provides a default `BundleTranslationResolver` configured with the supported locales from `application.properties`.

#### Custom resolver

Implement `TranslationResolver` to load translations from a different source (database, REST, JSON):

```java title="DatabaseTranslationResolver.java"
public class DatabaseTranslationResolver implements TranslationResolver {
  private final TranslationRepository repository;
  private final List<Locale> supportedLocales;

  public DatabaseTranslationResolver(TranslationRepository repository,
      List<Locale> supportedLocales) {
    this.repository = repository;
    this.supportedLocales = List.copyOf(supportedLocales);
  }

  @Override
  public String resolve(String key, Locale locale, Object... args) {
    String value = repository
        .findByKeyAndLocale(key, locale.getLanguage())
        .map(Translation::getValue)
        .orElse(key);

    if (args != null && args.length > 0) {
      value = new MessageFormat(value, locale).format(args);
    }

    return value;
  }

  @Override
  public List<Locale> getSupportedLocales() {
    return supportedLocales;
  }
}
```

##### Plain webforJ: register via `AppLifecycleListener`

Set the resolver before the app starts. The `onWillRun` hook on `AppLifecycleListener` runs before `app.run()` executes, which is the correct slot for "configure services":

```java
@AutoService(AppLifecycleListener.class)
public class TranslationResolverInstaller implements AppLifecycleListener {
  @Override
  public void onWillRun(App app) {
    App.setTranslationResolver(new DatabaseTranslationResolver(repository, supportedLocales));
  }
}
```

Without `@AutoService`, register the listener manually by adding its fully qualified class name to `src/main/resources/META-INF/services/com.webforj.AppLifecycleListener`.

##### Spring: expose as a `@Bean`

```java title="MessageSourceConfig.java"
@Configuration
public class MessageSourceConfig {

  @Bean
  TranslationResolver translationResolver(TranslationRepository repository,
      SpringConfigurationProperties properties) {
    List<Locale> supportedLocales = properties.getI18n().getSupportedLocales().stream()
        .map(Locale::forLanguageTag)
        .toList();
    return new DatabaseTranslationResolver(repository, supportedLocales);
  }
}
```

The supported locale list is read from `properties.getI18n().getSupportedLocales()` so it stays in sync with `application.properties` without duplicating the list.

### 5. Translate component text via `t()`

A component gets the `t()` method by implementing the `HasTranslation` concern interface. Components do not inherit it from `Composite` automatically, the implements clause is required.

```java
public class MainLayout extends Composite<AppLayout> implements HasTranslation {

  public MainLayout() {
    // Simple translation
    String title = t("app.title");

    // Translation with MessageFormat parameters
    String greeting = t("greeting", userName, messageCount);

    // Translation for a specific locale
    String germanTitle = t(Locale.GERMAN, "app.title");
  }
}
```

You can also use `App.getTranslation()` directly anywhere without implementing the interface:

```java
String title = App.getTranslation("app.title");
```

If a translation key is missing, `t()` returns the key as a literal and logs a warning, the app does not throw.

### 6. React to locale changes via `LocaleObserver`

Components that hold translated text should also implement `LocaleObserver`. Set the initial text with `t(...)` in the constructor, re-apply the same `t(...)` calls in `onLocaleChange(...)`. Registration and unregistration are automatic.

```java title="MainLayout.java"
@Route
public class MainLayout extends Composite<AppLayout>
    implements HasTranslation, LocaleObserver {

  private final AppLayout self = getBoundComponent();
  private AppNavItem inboxItem;
  private AppNavItem outboxItem;

  public MainLayout() {
    inboxItem = new AppNavItem(t("menu.inbox"), InboxView.class, TablerIcon.create("inbox"));
    outboxItem = new AppNavItem(t("menu.outbox"), OutboxView.class, TablerIcon.create("send-2"));

    AppNav appNav = new AppNav();
    appNav.addItem(inboxItem);
    appNav.addItem(outboxItem);

    self.addToDrawer(appNav);
  }

  @Override
  public void onLocaleChange(LocaleEvent event) {
    inboxItem.setText(t("menu.inbox"));
    outboxItem.setText(t("menu.outbox"));
  }
}
```

`LocaleEvent` exposes:

| Method | Returns | Description |
|---|---|---|
| `getLocale()` | `Locale` | The new locale that was set |
| `getSource()` | `Object` | The component that received the event |

#### Tip: deduplicate keys with a private apply method

The pattern above lists each `t("key")` twice, once at construction and once in `onLocaleChange`. For small components that is fine. Past ~3 translated strings, extract a single private method and call it from both places, each key then appears exactly once and a new translated element cannot drift out of sync:

```java
@Route
public class MainLayout extends Composite<AppLayout>
    implements HasTranslation, LocaleObserver {

  private final AppLayout self = getBoundComponent();
  private AppNavItem inboxItem;
  private AppNavItem outboxItem;

  public MainLayout() {
    inboxItem = new AppNavItem("", InboxView.class, TablerIcon.create("inbox"));
    outboxItem = new AppNavItem("", OutboxView.class, TablerIcon.create("send-2"));

    AppNav appNav = new AppNav();
    appNav.addItem(inboxItem);
    appNav.addItem(outboxItem);
    self.addToDrawer(appNav);

    applyTranslations();
  }

  @Override
  public void onLocaleChange(LocaleEvent event) {
    applyTranslations();
  }

  private void applyTranslations() {
    inboxItem.setText(t("menu.inbox"));
    outboxItem.setText(t("menu.outbox"));
  }
}
```

This is plain Java refactoring of the same `t(...)` calls, no new framework API.

#### Manual updates for non observer components

Some components, like Masked Fields, read `App.getLocale()` once at construction to configure locale-sensitive formatting and do NOT implement `LocaleObserver`. Update them explicitly inside your own `onLocaleChange(...)`:

```java
public class OrderForm extends Composite<FlexLayout> implements LocaleObserver {
  private MaskedDateField dateField = new MaskedDateField("Date");
  private MaskedTimeField timeField = new MaskedTimeField("Time");

  @Override
  public void onLocaleChange(LocaleEvent event) {
    Locale newLocale = event.getLocale();
    dateField.setLocale(newLocale);
    timeField.setLocale(newLocale);
  }
}
```

### 7. Change the locale at runtime

Call `App.setLocale(...)`. This updates the locale for the entire app and notifies every `LocaleObserver`. The UI updates without a page reload.

```java
App.setLocale(Locale.GERMAN);
App.setLocale(Locale.forLanguageTag("fr"));
```

`App.getLocale()` reads the current locale at any time. To list which locales the app actually supports (the same list the resolver was configured with), call `App.getTranslationResolver().getSupportedLocales()`.

### 8. Verify

```bash
mvn clean compile
mvn jetty:run        # plain
# or
mvn spring-boot:run  # Spring
```

Manual checks:

- Open the app. With `auto-detect = true` and a browser language matching a supported locale, that locale renders.
- Trigger `App.setLocale(...)` from any user interaction. Translated text updates without a page reload.
- Confirm a missing key shows the key string (and a warning is logged), not an exception.

If a translated string still shows the previous locale's value after switching, the component holding it is missing `LocaleObserver` (or its `onLocaleChange` does not re-apply that string).

If `auto-detect` does not pick a locale, confirm `supported-locales` is set, the user's `Accept-Language` overlaps the supported list, and the app is reading the right config file.

## Quick reference

| Need | API |
|---|---|
| Set locale at runtime | `App.setLocale(Locale)` |
| Read current locale | `App.getLocale()` |
| Translate inside a component | `t("key", args...)` (requires `implements HasTranslation`) |
| Translate for a specific locale | `t(Locale, "key", args...)` |
| Translate without `HasTranslation` | `App.getTranslation("key", args...)` |
| List supported locales | `App.getTranslationResolver().getSupportedLocales()` |
| Custom translation backend | implement `TranslationResolver` |
| React to a locale change | implement `LocaleObserver`, override `onLocaleChange(LocaleEvent)` |
| Manual update for non-observer components | call `setLocale(newLocale)` from your `onLocaleChange` |
| Register a custom resolver in plain | `App.setTranslationResolver(...)` from `AppLifecycleListener.onWillRun` |
| Register a custom resolver in Spring | expose as `@Bean TranslationResolver` |

## Going deeper

For specifics not covered here (per component i18n classes such as `LoginI18n`, `FileChooserI18n`, `FileUploadI18n`, locale-aware data binding for validators and transformers, formatting hooks on date or number fields), call `webforj-mcp:search_knowledge_base` with the symbol or topic and pick `type: "documentation"`.
