# Binding with `BindingContext`

`BindingContext<B>` is the central object that links UI components to a Java bean. One context per form, reused for every field.

## Creating the context

| Form | Constructor / factory |
|---|---|
| Manual binding only | `new BindingContext<>(Bean.class)` |
| Manual binding + Jakarta validation | `new BindingContext<>(Bean.class, true)` |
| Auto-bind UI fields on `this` to bean by field name | `BindingContext.of(this, Bean.class)` |
| Auto-bind + Jakarta validation | `BindingContext.of(this, Bean.class, true)` |

`BindingContext.of(...)` scans the declared fields of the passed object and binds any UI component whose field name matches a bean property name. Override the match with `@UseProperty(...)`, exclude a field with `@BindingExclude`.

## Manual bind

```java
BindingContext<Hero> context = new BindingContext<>(Hero.class);

context.bind(nameTextField, "name").add();
context.bind(powerCombo, "power").add();
```

`bind(...)` returns `BindingBuilder<C, CV, B, BV>`. Configure on the builder, then call `.add()` to register. A chain that doesn't end in `.add()` registers nothing.

## `BindingBuilder` configuration

| Method | Effect |
|---|---|
| `.useGetter(bean -> ...)` | Custom read from the bean (compute, format, log) |
| `.useSetter((bean, value) -> ...)` | Custom write to the bean (transform, audit, side-effect) |
| `.useTransformer(transformer)` | Convert between component type and model type (e.g. `LocalDate` <-> `String`) |
| `.useTransformer(transformer, "message")` | Same with a static error message on transformation failure |
| `.useTransformer(transformer, () -> t("..."))` | Same with a `Supplier<String>` for locale-aware error messages |
| `.useValidator(Validator<T>)` | Add a reusable validator |
| `.useValidator(predicate, "message")` | Add an inline predicate validator with a static message |
| `.useValidator(predicate, () -> t("..."))` | Inline predicate with a `Supplier<String>` (locale-aware) |
| `.useValidatorsList(List<Validator<T>>)` | Add several validators at once |
| `.useJakartaValidator()` | Apply Jakarta annotations only to this binding (rarely needed if context-level is on) |
| `.useReporter((result, binding) -> ...)` | Custom reporter for this binding only |
| `.useDefaultReporter()` | Force the default reporter (overrides a higher-level custom reporter) |
| `.readOnly()` / `.readOnly(true)` | Skip writing this property back to the bean |
| `.required()` / `.required(true)` | Mark the component required (only if it implements `RequiredAware`) |
| `.autoValidate(false)` | Don't revalidate on every value change; only on `write()` / explicit `validate()` |
| `.add()` | Register the binding. Required. |

## Auto-bind annotations (on view fields)

| Annotation | Effect |
|---|---|
| `@UseProperty("beanProp")` | Bind this UI field to the named bean property when names differ |
| `@UseValidator(MyValidator.class)` | Apply this validator to the binding (multiple allowed; applied in order) |
| `@UseTransformer(MyTransformer.class)` | Apply this transformer to the binding |
| `@BindingReadOnly` | Mark the binding read-only |
| `@BindingRequired` | Mark the binding required |
| `@BindingExclude` | Skip this UI field during auto-bind |

All in `com.webforj.data.binding.annotation`.

## Read / write / observe / validate

```java
context.read(bean);                              // bean -> UI

ValidationResult result = context.write(bean);   // UI -> bean (validates, blocks invalid)
if (result.isValid()) {
  service.save(bean);
}

context.writeValidBindings(bean);                // UI -> bean for valid bindings only;
                                                 // invalid ones are skipped, not blocked

context.observe(bean);                           // initial read, then per-change writes (UI -> bean)
                                                 // unidirectional; bean changes don't sync back

ValidationResult result = context.validate();    // validate everything; doesn't write
ValidationResult one = context.validate(field);  // validate a single component
ValidationResult one = context.validate("prop"); // validate a single property
```

`write` performs validation first; if any binding is invalid, the bean is NOT modified at all (atomic). For partial writes, use `writeValidBindings`.

`observe` is unidirectional: changes flow UI -> bean automatically, but later updates to the bean don't reflect back to the UI. Don't use it when both sides need to sync; use `read` when the bean changes.

## Validation events

```java
context.addValidateListener(event -> {
  submit.setEnabled(event.isValid());
});

// Equivalent shorter form
context.onValidate(event -> submit.setEnabled(event.isValid()));
```

`BindingContextValidateEvent` fires whenever the context (re)validates. `event.isValid()` reflects the AGGREGATE state of all bindings. Use this to drive submit-button-enabled.

## Auto-focus first violation

```java
context.setAutoFocusFirstViolation(true);
```

After a failed `write(...)`, the framework focuses the first invalid component (only on components that implement `FocusAcceptorAware`).

## Globally disable per-keystroke validation

```java
context.setAutoValidate(false);
```

Per-binding override: `.autoValidate(false)` on the builder. With auto-validate off, validation runs only on explicit `write(...)` or `validate(...)`, not on each value-change.

## Locale propagation

```java
context.setLocale(Locale.GERMAN);
```

Propagates to validators that implement `LocaleAware` (e.g. `JakartaValidator` does, so do user-implemented locale-aware validators). Inline `Supplier<String>` messages re-resolve on the next validation run. Pair with the localizing-apps skill in apps that switch language at runtime.

## Cross-field validation

The framework validates each binding in isolation, but a validator can capture the view's state to cross-check:

```java
private LocalDateTime startDate;
private LocalDateTime endDate;

context.bind(startDateField, "startDate")
    .useValidator(value -> endDate != null && value.isBefore(endDate),
        "Start date must be before end date")
    .add();

context.bind(endDateField, "endDate")
    .useValidator(value -> startDate != null && value.isAfter(startDate),
        "End date must be after start date")
    .add();

startDateField.addValueChangeListener(event -> {
  startDate = event.getValue();
  context.getBinding("endDate").validate();      // re-check the dependent binding
});

endDateField.addValueChangeListener(event -> {
  endDate = event.getValue();
  context.getBinding("startDate").validate();
});
```

`context.getBinding("propertyName").validate()` runs the validators on a single binding. This is the documented pattern for cross-field validation, there is no built-in "validate together" mechanism.

## `ReadOnlyAware` and `RequiredAware`

- `.readOnly()` only affects the data path, it stops the binding from writing the UI value back to the bean. To also disable the UI, mark the COMPONENT read-only too (when it implements `ReadOnlyAware`).
- `.required()` sets the required state on the component (when it implements `RequiredAware`). It does not enforce the constraint by itself; the actual enforcement is via Jakarta `@NotEmpty`/`@NotNull`/`@NotBlank`/`@Size` on the bean, or an explicit `useValidator(...)`.

## Required-state auto-detection

When `useJakartaValidator=true`, the framework marks bound UI fields as required automatically if the corresponding bean property has any of: `@NotNull`, `@NotEmpty`, `@NotBlank`, `@Size`. No `.required()` call needed.

## Transformers

Use a transformer when the component value type and the bean property type differ. Implement `Transformer<C, M>` (component-type, model-type):

```java
public class DateTransformer implements Transformer<LocalDate, String> {
  private DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");

  @Override
  public LocalDate transformToComponent(String modelValue) {
    try {
      return LocalDate.parse(modelValue, formatter);
    } catch (Exception e) {
      throw new TransformationException("Invalid date format");
    }
  }

  @Override
  public String transformToModel(LocalDate componentValue) {
    return componentValue.format(formatter);
  }
}
```

Apply with `.useTransformer(new DateTransformer())` or `@UseTransformer(DateTransformer.class)`. When the component type and bean type differ, also pass the bean type to `bind`:

```java
context.bind(startDateField, "startDate", String.class)
  .useTransformer(new DateTransformer())
  .add();
```

For one-off transforms, use `Transformer.of(componentToModel, modelToComponent)`:

```java
context.bind(carRental, "carRental", String.class)
  .useTransformer(
      Transformer.of(
        bool -> Boolean.TRUE.equals(bool) ? "yes" : "no",
        str -> str.equals("yes")),
      "Checkbox must be checked")
  .add();
```

A transformer's exception message can be a static string or a `Supplier<String>` for locale-aware messages (since 25.12). Implement `LocaleAware` on a reusable transformer to react to `context.setLocale(...)`.
