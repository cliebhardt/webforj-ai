# Validators

Validation runs per-binding. Each binding owns its validators; the context aggregates the results.

## Inline validators

Add a predicate plus a message:

```java
context.bind(nameTextField, "name")
  .useValidator(value -> !value.isEmpty(), "Name cannot be empty")
  .useValidator(value -> value.length() >= 3, "Name must be at least 3 characters long")
  .add();
```

Multiple validators apply in insertion order. The binding stops at the first violation.

For locale-aware messages (since 25.12), pass a `Supplier<String>`:

```java
context.bind(nameTextField, "name")
  .useValidator(value -> !value.isEmpty(),  () -> t("validation.name.required"))
  .useValidator(value -> value.length() >= 3, () -> t("validation.name.minLength"))
  .add();
```

The supplier is called each time validation fails, so the message resolves in the current locale.

## Custom reusable validators

Implement `Validator<T>`:

```java
import com.webforj.data.validation.server.ValidationResult;
import com.webforj.data.validation.server.validator.Validator;

public class EmailValidator implements Validator<String> {
  private static final String PATTERN = "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,6}$";

  @Override
  public ValidationResult validate(String value) {
    if (value.matches(PATTERN)) {
      return ValidationResult.valid();
    } else {
      return ValidationResult.invalid("Invalid email address");
    }
  }
}
```

Apply:

```java
context.bind(emailField, "email")
  .useValidator(new EmailValidator())
  .add();
```

Or via auto-bind annotation:

```java
@UseValidator(EmailValidator.class)
TextField email = new TextField("Email Address");
```

## Override a validator's message

`Validator.from(otherValidator, "custom message")` wraps an existing validator with a different failure message:

```java
context.bind(emailField, "email")
  .useValidator(Validator.from(new EmailValidator(),
      "Custom message for invalid email address"))
  .add();
```

`Validator.of(predicate, "message")` builds a one-off Validator from a predicate (handy when you want a `Validator<T>` instance, not just an inline predicate). Both `from` and `of` accept a `Supplier<String>` for locale-aware messages.

## Locale-aware custom validators

Implement `LocaleAware`. When `context.setLocale(...)` is called, the framework propagates the locale; the next validation run produces messages in that locale.

## Jakarta Validation

`BindingContext` integrates with Bean Validation through `JakartaValidator`. Activate by passing `true` as the second arg:

```java
BindingContext<Hero> context = BindingContext.of(this, Hero.class, true);
// or
BindingContext<Hero> context = new BindingContext<>(Hero.class, true);
```

Then annotate the bean:

```java
public class Hero {
  @NotEmpty(message = "Name cannot be empty")
  @Length(min = 3, max = 20)
  private String name;

  @NotEmpty(message = "Unspecified power")
  @Pattern(regexp = "Fly|Invisible|LaserVision|Speed|Teleportation",
           message = "Invalid power")
  private String power;

  // setters / getters
}
```

`@NotEmpty`, `@NotNull`, `@NotBlank`, `@Size`, `@Pattern` are all from `jakarta.validation.constraints`. `@Length` (a Hibernate-specific extension) is from `org.hibernate.validator.constraints`.

### Required Jakarta dependencies

Bean Validation needs a runtime implementation. The two libraries that satisfy it are `org.hibernate.validator:hibernate-validator` and `org.glassfish.expressly:expressly`.

**In Spring Boot apps**, you almost certainly already have them. `spring-boot-starter-validation` brings both transitively, and several other Boot starters depend on `spring-boot-starter-validation` directly, so a project with `spring-boot-starter-web` (or similar) typically has Bean Validation on the classpath without any extra POM changes. Do NOT pin explicit `hibernate-validator` and `expressly` versions on top of a Boot starter, that fights Boot's managed dependency versions.

**In plain webforJ apps** (no Spring starters), add both explicitly:

```xml
<dependency>
  <groupId>org.hibernate.validator</groupId>
  <artifactId>hibernate-validator</artifactId>
  <version>8.0.1.Final</version>
</dependency>
<dependency>
  <groupId>org.glassfish.expressly</groupId>
  <artifactId>expressly</artifactId>
  <version>5.0.0</version>
</dependency>
```

Either way, without an implementation on the classpath, `BindingContext.of(this, Bean.class, true)` will fail when the validator tries to start.

### Constraint placement

`JakartaValidator` reads constraints placed directly on bean properties (fields). Class-level or method-level constraints are NOT picked up.

### Locale-aware Jakarta messages

`JakartaValidator` implements `LocaleAware`. `context.setLocale(Locale.GERMAN)` automatically triggers Jakarta to resolve messages in German on the next run. In a `LocaleObserver`, forward the locale:

```java
@Override
public void onLocaleChange(LocaleEvent event) {
  context.setLocale(event.getLocale());
}
```

## Triggers (when validation runs)

By default, every value change re-validates the binding. To disable:

```java
context.setAutoValidate(false);                    // for the whole context
// or
context.bind(emailField, "email")
  .useValidator(new EmailValidator())
  .autoValidate(false)                              // for one binding
  .add();
```

With auto-validate off, validation runs only on explicit `context.write(...)` or `context.validate(...)`.

For a softer behavior (validate only when the user is done typing), set the field's value-change mode:

```java
emailField.setValueChangeMode(ValueChangeMode.ON_BLUR);
```

Now the binding revalidates on blur instead of on every keystroke.

## Manual revalidation

```java
context.validate();                            // validates everything; doesn't write
context.validate(emailField);                  // validates one component
context.validate("email");                     // validates one property
context.getBinding("email").validate();        // re-validate one binding (used in cross-field)
```

`validate(...)` returns a `ValidationResult` and triggers the configured reporter. Useful when you want to enable/disable features based on form validity without writing.

## Reporters

Reporters render validation outcomes to the user. Core webforJ components ship with `DefaultBindingReporter`, no setup needed. It shows errors inline below the field or as a popover.

To customize the rendering for one binding:

```java
context.bind(emailField, "email")
  .useValidator(Validator.from(new EmailValidator(),
      "Custom message for invalid email address"))
  .useReporter((validationResult, binding) -> {
    errors.setVisible(!validationResult.isValid());
    if (!validationResult.isValid()) {
      errors.setText(validationResult.getMessages().stream().findFirst().orElse(""));
    }
  })
  .add();
```

`useReporter((ValidationResult, Binding) -> { ... })` runs every time the binding validates. Use `validationResult.isValid()` to branch and `getMessages()` to read the failure list.

To force the default reporter back on a binding that was given a custom one earlier in a chain, call `.useDefaultReporter()`.

## Reading the result

```java
ValidationResult result = context.write(bean);

if (!result.isValid()) {
  for (String message : result.getMessages()) {
    // log, aggregate, surface in a banner, etc.
  }
} else {
  service.save(bean);
}
```

`ValidationResult` factory methods:

| Factory | Use case |
|---|---|
| `ValidationResult.valid()` | Everything passed |
| `ValidationResult.invalid("message")` | Single failure |
| `ValidationResult.invalid(List.of("a", "b"))` | Multiple failures |

## Aggregate validity (live)

```java
context.addValidateListener(event -> submit.setEnabled(event.isValid()));
// shorter
context.onValidate(event -> submit.setEnabled(event.isValid()));
```

`BindingContextValidateEvent#isValid()` is the AND of all bindings. Use this to drive submit-disabled-until-valid UIs, especially in combination with `context.observe(bean)`.
