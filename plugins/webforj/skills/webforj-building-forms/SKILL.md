---
name: webforj-building-forms
description: "Use this skill for ANY form work in a webforJ app: data-entry forms, binding to a Java bean, validating input, masking phones/IDs/currency/dates/times, formatting Table columns as currency or percentage, and responsive form layouts. Trigger phrases: 'build a form', 'bind to a bean', 'add validation', 'validate on submit', 'use Jakarta validation', 'phone input mask', 'currency input', 'credit card field', 'postal code', 'date input mask', 'format Table column as currency', 'percentage column', 'format a label as a date', 'two-column form', 'responsive form', 'auto-bind fields', 'submit-disabled until valid'. Routes through `BindingContext`, the four `Masked*Field` input components, the five `Table` mask/currency renderers, `MaskDecorator` for non-`Table` formatting, and `ColumnsLayout`."
---

# Building Forms in webforJ

Forms in webforJ are composed of three orthogonal pieces. Pick what each form actually needs; you do not have to use all three.

| Piece | What it does | Skip when |
|---|---|---|
| `BindingContext<Bean>` | Two-way sync between fields and a Java bean, validation lifecycle, Jakarta-validation integration | The form is one-shot and you will read values manually with `field.getValue()` |
| Masked field components (`MaskedTextField`, `MaskedNumberField`, `MaskedDateField`, `MaskedTimeField`) | Format-as-you-type, structured input (phone, IBAN, currency, date) | A plain `TextField` / `NumberField` / `DateField` is enough |
| `MaskDecorator` (utility) | Format/parse strings, numbers, dates, times for non-input, non-`Table` contexts (read-only labels, tooltips, exported reports, log lines) | The value will sit in a masked field, OR it will be displayed in a `Table` column (use a Table renderer instead, see below) |
| `ColumnsLayout` | Responsive multi-column form grid with breakpoints | A vertical `FlexLayout` is enough |

## Hard rules

1. **Auto-binding is the default.** Use `BindingContext.of(this, Bean.class, true)` and let the framework wire fields by name. Drop to manual `context.bind(component, "property").add()` only for things auto-bind annotations cannot express: custom getter / setter, inline lambda validators, custom reporter, per-binding `autoValidate(false)`, or `Supplier<String>` (locale-aware) messages. Static-message transformers and validators ARE supported in auto-bind via `@UseTransformer(value=..., message="...")` and `@UseValidator(value=..., message="...")`.
2. **One `BindingContext` per form.** Reuse the same instance for every field on the form. Never create a context per field.
3. **`bind(...)` returns a `BindingBuilder`. Always call `.add()`** at the end of the chain, otherwise the binding is configured but never registered, and the form silently does nothing.
4. **Pair `BindingContext.of(this, Bean.class, true)` with a Jakarta-Validation provider** (Hibernate Validator) on the classpath when the second arg is `true`. Without the implementation jar, `JakartaValidator` cannot start.
5. **Mask vs decorator vs validator**: masks shape input as the user types, decorators format values for display, validators reject invalid values on write. They compose; one does not replace the others. Specifically: do NOT add a `@Pattern` regex on the bean (or a `setPattern(...)` regex on the field) that re-validates the same shape a `Masked*Field` mask already enforces. The mask already guarantees the structure (a `MaskedTextField` with mask `"(000) 000-0000"` cannot accept anything else). Add `@Pattern` only when you need a constraint the mask cannot express, like exact length, character classes the mask doesn't have, or a more restrictive subset.
6. **Do not invent.** Every annotation, class, and method in this skill is part of webforJ's public API. If a name is not listed in this skill or its references, do not use it.

## Routing decision

| The form needs... | Use |
|---|---|
| Default form pattern: bean + matching field names + Jakarta annotations | `BindingContext.of(this, Bean.class, true)` (auto-bind), see [`references/binding.md`](references/binding.md) |
| UI field name doesn't match a bean property | `@UseProperty("beanProp")` on the field |
| Validate against `@NotEmpty` / `@Length` / `@Pattern` annotations on the bean | already on, the `true` flag in `BindingContext.of(this, Bean.class, true)` activates the Jakarta validator |
| Custom validator like email format, password strength | `Validator<T>` class + `@UseValidator(EmailValidator.class)` on the field |
| Convert between component type and bean type (e.g. component `LocalDate`, bean `String`) | `Transformer<C, M>` class + `@UseTransformer(DateTransformer.class)` on the field |
| Inline lambda validator with a contextual message | manual `context.bind(...).useValidator(predicate, "message").add()`, one of the few cases where you drop to manual |
| Custom reporter (paint errors somewhere unusual) | manual `context.bind(...).useReporter((result, binding) -> ...).add()` |
| Continuous validate-as-you-type (auto-disable submit until valid) | `context.observe(bean)` + `context.onValidate(...)` |
| Cross-field validation (start date < end date) | `context.getBinding("...").validate()` from one field's value-change listener, see [`references/validators.md`](references/validators.md) |
| Phone / coupon / ID / postal code input | `MaskedTextField`, see [`references/masked-fields.md`](references/masked-fields.md) |
| Currency / quantity / percentage / formatted number input | `MaskedNumberField`, see [`references/masked-fields.md`](references/masked-fields.md) |
| Date input with calendar picker | `MaskedDateField`, see [`references/masked-fields.md`](references/masked-fields.md) |
| Time input with picker | `MaskedTimeField`, see [`references/masked-fields.md`](references/masked-fields.md) |
| Format a value in a `Table` column (currency, percentage, masked number/date/text) | a `Table` renderer: `CurrencyRenderer<>(locale)`, `PercentageRenderer<>(theme, withBar)`, `MaskedNumberRenderer<>(mask, locale)`, `MaskedDateTimeRenderer<>(mask)`, `MaskedTextRenderer<>(mask)`, NOT `MaskDecorator` |
| Format a value in a read-only label, tooltip, exported report (no `Table` involved) | `MaskDecorator.forNumber/forDate/forTime/forDateTime/forString`, see [`references/mask-tokens.md`](references/mask-tokens.md) |
| Responsive 2/3/4 column grid that collapses on mobile | `ColumnsLayout` with `Breakpoint`, see [`references/layout.md`](references/layout.md) |

## Authoritative facts

| What | Value |
|---|---|
| Binding context | `com.webforj.data.binding.BindingContext<B>` |
| Constructors | `new BindingContext<>(Bean.class)`, `new BindingContext<>(Bean.class, useJakartaValidator)` |
| Auto-bind factory | `BindingContext.of(this, Bean.class)`, `BindingContext.of(this, Bean.class, useJakartaValidator)` |
| Builder return | `context.bind(component, "property")` returns `BindingBuilder`, always finish with `.add()` |
| Read bean to UI | `context.read(bean)` |
| Write UI to bean (with validation) | `ValidationResult result = context.write(bean); if (result.isValid()) { ... }` |
| Continuous write (UI -> bean on every change) | `context.observe(bean)`, unidirectional after initial read |
| Validate without writing | `context.validate()` |
| Listen to validation state | `context.addValidateListener(e -> { ... })` or `context.onValidate(e -> { ... })` |
| Validate one binding | `context.getBinding("propertyName").validate()` |
| Auto-focus first violation | `context.setAutoFocusFirstViolation(true)` |
| Disable per-keystroke validation globally | `context.setAutoValidate(false)` |
| Disable per-keystroke validation on one binding | `.autoValidate(false)` on the builder |
| Locale propagation | `context.setLocale(Locale.GERMAN)` |
| Validation result | `com.webforj.data.validation.server.ValidationResult`, `isValid()`, `getMessages()`, `valid()`, `invalid(message)` |
| Validator interface | `com.webforj.data.validation.server.validator.Validator<T>` |
| Jakarta validator adapter | `com.webforj.data.validation.server.validator.JakartaValidator` (auto-attached via `useJakartaValidator=true`) |
| Transformer interface | `com.webforj.data.transformation.transformer.Transformer<C, M>` (component-type, model-type) |
| Auto-bind annotations | `@UseProperty("name")`, `@UseValidator(EmailValidator.class)`, `@UseTransformer(DateTransformer.class)`, `@BindingReadOnly`, `@BindingRequired`, `@BindingExclude` (in `com.webforj.data.binding.annotation`) |
| Masked text field | `com.webforj.component.field.MaskedTextField` (since 24.10) |
| Masked number field | `com.webforj.component.field.MaskedNumberField` (since 24.10) |
| Masked date field | `com.webforj.component.field.MaskedDateField` (since 24.10), includes `getPicker()` `DatePicker` |
| Masked time field | `com.webforj.component.field.MaskedTimeField` (since 24.10), includes `getPicker()` `TimePicker` |
| Mask decorator (utility) | `com.webforj.MaskDecorator` (since 24.10), `forString`, `forNumber`, `forDate`, `forTime`, `forDateTime`, `parseDate`, `parseTime` |
| Spinner variants | `MaskedTextFieldSpinner`, `MaskedNumberFieldSpinner`, `MaskedDateFieldSpinner`, `MaskedTimeFieldSpinner` |
| Layout | `com.webforj.component.layout.columnslayout.ColumnsLayout` and `ColumnsLayout.Breakpoint`, `ColumnsLayout.Alignment` |
| Required-detection annotations (auto when `useJakarta=true`) | `@NotNull`, `@NotEmpty`, `@NotBlank`, `@Size` |

## Workflow

```
- [ ] 1. Define the bean: properties + setters/getters + Jakarta annotations for validation
- [ ] 2. Declare UI components as class fields, named to match the bean's property names
- [ ] 3. Pick field types: plain TextField / NumberField / DateField, OR Masked* if you need formatting
- [ ] 4. Lay out fields (FlexLayout vertical, OR ColumnsLayout for multi-column responsive)
- [ ] 5. Create context with BindingContext.of(this, Bean.class, true), auto-binds matching fields
- [ ] 6. Add @UseProperty / @UseValidator / @UseTransformer / @BindingReadOnly / @BindingExclude only where auto-bind needs guidance
- [ ] 7. context.read(bean) once at open / load
- [ ] 8. On submit, ValidationResult result = context.write(bean); branch on result.isValid()
- [ ] 9. (Optional) context.observe(bean) + context.onValidate(...) for live "submit disabled until valid"
```

### 1. The bean

Plain Java bean with setters and getters. Add Jakarta-Validation annotations on properties that need server-side validation:

```java
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Pattern;
import org.hibernate.validator.constraints.Length;

public class Hero {
  @NotEmpty(message = "Name cannot be empty")
  @Length(min = 3, max = 20)
  private String name;

  @NotEmpty(message = "Unspecified power")
  @Pattern(regexp = "Fly|Invisible|LaserVision|Speed|Teleportation",
           message = "Invalid power")
  private String power;

  public Hero(String name, String power) { this.name = name; this.power = power; }

  public String getName() { return name; }
  public void setName(String name) { this.name = name; }
  public String getPower() { return power; }
  public void setPower(String power) { this.power = power; }
}
```

`@NotEmpty`/`@NotNull`/`@NotBlank`/`@Size` also feed required-state detection, the framework marks the bound field as required automatically when the context is created with the Jakarta flag on.

### 2. The view, auto-binding (default)

Declare the UI components as class fields. Name them after the bean's properties. Then a single `BindingContext.of(this, Bean.class, true)` line binds everything:

```java
public class HeroForm extends Composite<FlexLayout> {
  // Field NAMES match Hero properties: name, power
  private TextField name = new TextField("Name");
  private ComboBox power = new ComboBox("Power");
  private Button submit = new Button("Submit");

  private BindingContext<Hero> context;

  public HeroForm() {
    power.insert("Fly", "Invisible", "LaserVision", "Speed", "Teleportation");

    // Auto-bind: walks `this`, finds UI fields that match Hero properties by name,
    // wires them up, and applies Jakarta annotations from Hero.
    context = BindingContext.of(this, Hero.class, true);

    Hero bean = new Hero("Superman", "Fly");
    context.read(bean);

    submit.onClick(e -> {
      ValidationResult result = context.write(bean);
      if (result.isValid()) {
        // persist bean
      }
    });

    getBoundComponent().add(name, power, submit);
  }
}
```

That's the whole binding setup. No `context.bind(...)` calls. No `.add()` boilerplate per field. Validation comes from the Jakarta annotations on the bean.

### 3. Auto-bind annotations, minor adjustments

When auto-bind needs guidance, annotate the UI fields:

```java
// UI field name doesn't match bean property
@UseProperty("name")
private TextField nameField = new TextField("Name");

// UI field type doesn't match bean type, attach a transformer
@UseProperty("date")
@UseTransformer(DateTransformer.class)
private DateField dateField = new DateField("Date");

// Add a non-Jakarta validator declaratively
@UseValidator(EmailValidator.class)
private TextField email = new TextField("Email");

// Mark the binding read-only / required from the view side
@BindingReadOnly
private TextField idField = new TextField("User ID");

@BindingRequired
private TextField requiredField = new TextField("Required");

// Don't auto-bind this field (handle manually or skip)
@BindingExclude
private Button cancelButton = new Button("Cancel");
```

These annotations live in `com.webforj.data.binding.annotation`. Reach for them only where auto-bind cannot infer the right behavior; bare auto-bind handles the common case.

### 4. Manual binding, escape hatch

Drop to manual `context.bind(...)` chains only when you need per-binding behavior that the auto-bind annotations cannot express. The annotations cover almost everything; the remaining gaps are:

- `useGetter(Function<B, BV>)`, custom read logic (no `@UseGetter` annotation exists)
- `useSetter(BiConsumer<B, BV>)`, custom write logic (no `@UseSetter`)
- `useValidator(predicate, "message")`, inline lambda validators (`@UseValidator` requires a `Validator` class)
- `useReporter((result, binding) -> ...)`, custom error rendering for one binding (no `@UseReporter`)
- `autoValidate(false)` per binding (no annotation)
- `Supplier<String>` (locale-aware) messages on transformers / validators (annotations take a static `String` only)

Static-message transformers and validators do NOT need manual binding, `@UseTransformer(value=DateTransformer.class, message="Bad date")` and `@UseValidator(value=EmailValidator.class, message="Bad email")` work in auto-bind.

```java
context = new BindingContext<>(Hero.class);
context.bind(nameField, "name")
  .useValidator(value -> !value.isEmpty(), "Name cannot be empty")
  .useValidator(value -> value.length() >= 3, "Name must be at least 3 characters long")
  .add();

context.bind(powerCombo, "power").add();
```

Every chain MUST end with `.add()`, without it the binding is configured but never registered.

You can also mix the two styles: start with `BindingContext.of(this, Bean.class, true)` to auto-bind most fields, then add a manual `context.bind(...)` for the one field that needs special treatment. The context can hold both.

### 5. Read and write

```java
context.read(bean);                            // bean -> fields (call when opening / loading)

ValidationResult result = context.write(bean); // fields -> bean (call on submit)
if (result.isValid()) {
  service.save(bean);
} else {
  // displayErrors(result.getMessages());      // default reporter already shows them per-field
}
```

`write` validates first; if any binding fails, the bean is not modified. The default reporter renders error messages on each component automatically.

### 6. Live validate (submit-disabled-until-valid)

```java
Hero bean = new Hero("", "");
BindingContext<Hero> context = BindingContext.of(this, Hero.class, true);
context.observe(bean);                         // unidirectional: UI -> bean on every change
context.onValidate(e -> submit.setEnabled(e.isValid()));

submit.onClick(e -> {
  ValidationResult result = context.validate();
  if (result.isValid()) {
    service.save(bean);
  }
});
```

`observe(bean)` does an initial `read` then registers a value-change listener on every binding; valid changes write to the bean immediately. Pair with `onValidate(...)` to drive UI state from the aggregate validity.

**Important caveat about `observe`:** the binding is unidirectional. UI changes flow to the bean automatically, but later changes to the bean from anywhere else (a service callback, a refresh, another tab) do NOT reflect back to the UI. If the bean state can change externally while the form is open, call `context.read(bean)` again to resync the fields. Use `read` + `write` (not `observe`) for forms where both sides need to stay in sync.

### 7. Cross-field validation

Each binding gets its own validators, but they can reach state on the view to validate against another field. After the user changes one field, manually re-validate the dependent one:

```java
context.bind(startDateField, "startDate")
    .useValidator(Objects::nonNull, "Start date is required")
    .useValidator(value -> endDate != null && value.isBefore(endDate),
        "Start date must be before end date")
    .add();

context.bind(endDateField, "endDate")
    .useValidator(Objects::nonNull, "End date is required")
    .useValidator(value -> startDate != null && value.isAfter(startDate),
        "End date must be after start date")
    .add();

startDateField.setValueChangeMode(ValueChangeMode.ON_BLUR);
startDateField.addValueChangeListener(event -> {
  startDate = event.getValue();
  context.getBinding("endDate").validate();
});

endDateField.setValueChangeMode(ValueChangeMode.ON_BLUR);
endDateField.addValueChangeListener(event -> {
  endDate = event.getValue();
  context.getBinding("startDate").validate();
});
```

`context.getBinding("endDate").validate()` revalidates that single binding against the latest peer value.

### 8. Layout

For a vertical stack, use `FlexLayout`. For a responsive grid that adapts to width, use `ColumnsLayout`:

```java
ColumnsLayout layout = new ColumnsLayout(firstName, lastName, email,
    password, passwordConfirm, address, states, zip, cancel, submit);

layout.setSpan(email, 2)        // email spans 2 columns at the active breakpoint
      .setSpan(address, 2);

layout.setBreakpoints(List.of(
    new ColumnsLayout.Breakpoint("default", 0, 1),
    new ColumnsLayout.Breakpoint("medium", "40em", 2),
    new ColumnsLayout.Breakpoint("large", "60em", 3)));
```

Spans and column placements can also be set per breakpoint, see [`references/layout.md`](references/layout.md).

## Masked input

Masked fields format input as the user types using a mask string. Use them when the value needs structural integrity (phone, postal code, IBAN, formatted currency).

```java
MaskedTextField account = new MaskedTextField("Account ID");
account.setMask("ZZZZ-0000")
  .setHelperText("Mask: ZZZZ-0000 - for example: SAVE-2025");

MaskedTextField phone = new MaskedTextField("Phone");
phone.setMask("(000) 000-0000");

MaskedNumberField billAmount = new MaskedNumberField("Bill Amount");
billAmount.setMask("$######.##").setValue(300d);

MaskedDateField meeting = new MaskedDateField("Meeting Date");
meeting.setMask("%Mz/%Dz/%Yz").setValue(LocalDate.now());

MaskedTimeField start = new MaskedTimeField("Start Time");
start.setMask("%Hz:%mz").setValue(LocalTime.of(9, 0));
```

Mask token tables for strings, numbers, dates, and times live in [`references/mask-tokens.md`](references/mask-tokens.md).

Field-specific features (picker auto-open, restore-value, spinners, `setAllowCustomValue(false)`, `setNegateable(false)`, min/max constraints, textual date parsing) live in [`references/masked-fields.md`](references/masked-fields.md).

## `Table` cell formatting, use a renderer, NOT `MaskDecorator`

`Table` columns format their cells through dedicated renderers wired with `column.setRenderer(...)`. Do NOT format values with `MaskDecorator` and pass the result to a `Table`, use the renderer that matches your data type. The renderers run in the browser per cell; the server only ships the raw value.

| Cell type | Renderer | Example |
|---|---|---|
| Currency, locale-aware | `CurrencyRenderer<>(Locale)` | `new CurrencyRenderer<>(Locale.US)` |
| Percentage with optional mini progress bar | `PercentageRenderer<>(Theme, boolean)` | `new PercentageRenderer<>(Theme.PRIMARY, true)` |
| Number with custom mask | `MaskedNumberRenderer<>(mask, Locale)` | `new MaskedNumberRenderer<>("###,##0.00", Locale.US)` |
| Date or time with custom mask | `MaskedDateTimeRenderer<>(mask)` | `new MaskedDateTimeRenderer<>("%Mz/%Dz/%Yz")` |
| String with character mask (SSN, phone, ID) | `MaskedTextRenderer<>(mask)` | `new MaskedTextRenderer<>("###-##-####")` |

```java
table.addColumn("price", Product::getPrice)
     .setRenderer(new CurrencyRenderer<>(Locale.US));

table.addColumn("released", MusicRecord::getReleaseDate)
     .setRenderer(new MaskedDateTimeRenderer<>("%Mz/%Dz/%Yz"));

table.addColumn("ssn", Employee::getSsn)
     .setRenderer(new MaskedTextRenderer<>("###-##-####"));
```

For value-only transforms that don't need DOM (e.g. `(price * 1.1)`, lowercasing, concatenation), use a value provider on `addColumn(...)` instead of a renderer, it's cheaper at render time.

## `MaskDecorator` for non-input, non-`Table` formatting

Use `MaskDecorator` when you need the mask syntax in places that have no `Table` renderer surface: read-only labels, tooltips, exported reports, log lines, the body of an email:

```java
String formatted = MaskDecorator.forNumber(1234567.89, "#,###,##0.00"); // "1,234,567.89"
String dateStr = MaskDecorator.forDate(LocalDate.of(2025, 7, 4), "%Mz/%Dz/%Yl"); // "07/04/2025"
LocalDate parsed = MaskDecorator.parseDate("07/04/2025", "%Mz/%Dz/%Yl");
```

`MaskDecorator` returns `null` when the input cannot be formatted/parsed, always null-check the result before using it. See [`references/mask-tokens.md`](references/mask-tokens.md).

Do NOT call `MaskDecorator` from inside a `Table` cell-value provider just to format the cell, use the `Table` renderer for that.

## Verify (agent checks)

```bash
mvn clean compile
```

Then audit:

- `grep -rn "BindingContext" src/main/java`, every use is followed by either `.read(...)`, `.write(...)`, or `.observe(...)` somewhere in the same class. Bindings declared but never read/written/observed never sync to the bean.
- `grep -rn "context.bind(" src/main/java`, every chain ends in `.add()`. A `bind()` call without `.add()` registers nothing.
- If `BindingContext.of(..., true)` (Jakarta) is used, a Bean-Validation implementation must be on the classpath. In Spring Boot apps, `spring-boot-starter-validation` (and most other Spring Boot starters) bring `org.hibernate.validator:hibernate-validator` and `org.glassfish.expressly:expressly` transitively, so do NOT add them explicitly unless the project has neither. In plain webforJ apps with no Spring starter, declare both in `pom.xml`. Without an implementation, the form throws on context creation.
- Jakarta annotations (`@NotEmpty`, `@Length`, `@Pattern`, `@Size`, `@NotNull`, `@NotBlank`) come from `jakarta.validation.constraints.*` (`@Length` is from `org.hibernate.validator.constraints`). NOT from `javax.validation`, that's the older Java EE package and the framework will not pick those up.
- `MaskedTextField`, `MaskedNumberField`, `MaskedDateField`, `MaskedTimeField` imports come from `com.webforj.component.field.*`. Do NOT confuse with the plain `TextField`/`NumberField`/`DateField`/`TimeField` in the same package.
- `MaskDecorator` import is `com.webforj.MaskDecorator` (not under `component.field`).
- `ColumnsLayout` import is `com.webforj.component.layout.columnslayout.ColumnsLayout`. `Breakpoint` and `Alignment` are static inner classes (`ColumnsLayout.Breakpoint`, `ColumnsLayout.Alignment`).
- Date masks use `%Y`, `%M`, `%D`; time masks use `%H` (24-hour), `%h` (12-hour), `%m`, `%s`, `%p`. Number masks use `0`, `#`, `,`, `.`, `$`, `-`, `+`, `(`, `)`. Anything else (e.g. `dd/MM/yyyy` Java `DateTimeFormatter` syntax) is wrong on these components.
- For `observe(...)` flows: make sure `submit.setEnabled(e.isValid())` (or equivalent) is wired in `onValidate(...)`. Otherwise `observe` quietly writes invalid values to the bean.

Manual checks (ask the user, do NOT claim them): open the form, type an invalid value, confirm the inline error appears; submit invalid, confirm `result.isValid()` returns `false` and the bean is not modified; submit valid, confirm the bean reflects the new values.

## Quick reference

| Need | Where |
|---|---|
| Bind a form to a bean (default) | `BindingContext.of(this, Bean.class, true)`, name UI fields to match bean properties |
| When auto-bind isn't enough | drop to `new BindingContext<>(Bean.class)` + `context.bind(component, "prop").useValidator(...).add()` |
| Sync UI from bean | `context.read(bean)` |
| Sync bean from UI + validate | `context.write(bean)` -> `result.isValid()` |
| Validate without writing | `context.validate()` |
| Live submit-disabled-until-valid | `context.observe(bean)` + `context.onValidate(e -> submit.setEnabled(e.isValid()))` |
| Cross-field validation | `context.getBinding("other").validate()` from a value-change listener |
| Custom validator inline | `.useValidator(predicate, "message")` on the builder |
| Custom validator class | implement `Validator<T>` |
| Jakarta annotations | constructor flag `useJakartaValidator=true` (or `BindingContext.of(this, Bean.class, true)`) |
| Auto-bind by field name | name UI fields the same as bean properties; use `@UseProperty` when they differ |
| Exclude a field from auto-bind | `@BindingExclude` |
| Mark binding read-only | `@BindingReadOnly` (annotation) or `.readOnly()` (builder) |
| Phone / IBAN / coupon code field | `MaskedTextField` with mask like `"(000) 000-0000"` or `"ZZZZ-0000"` |
| Currency / quantity / percentage | `MaskedNumberField` with mask like `"$###,##0.00"`, `"#,##0"`, `"###%"` |
| Date input + calendar picker | `MaskedDateField`; `getPicker().setAutoOpen(true)` to auto-open; `setAllowCustomValue(false)` to force picker-only |
| Time input + picker | `MaskedTimeField`; `getPicker().setStep(Duration.ofMinutes(15))` for 15-min slots |
| Format value for `Table` cell or label | `MaskDecorator.forNumber/forDate/forTime/forDateTime/forString` (null-check the result) |
| Spinner variants | `MaskedTextFieldSpinner`, `MaskedNumberFieldSpinner`, `MaskedDateFieldSpinner`, `MaskedTimeFieldSpinner` (`setOptions(...)`, `setStep(...)`, `setSpinField(...)`) |
| Multi-column responsive form | `ColumnsLayout` with `setBreakpoints(List.of(new Breakpoint(...)))`, `setSpan(field, n)`, `setColumn(field, n)` |

## Resources

- [`references/binding.md`](references/binding.md), `BindingContext`, manual + auto binding, transformers, read/write/observe lifecycle
- [`references/validators.md`](references/validators.md), inline validators, custom `Validator<T>`, Jakarta integration, triggers, reporters, cross-field, locale-aware messages
- [`references/masked-fields.md`](references/masked-fields.md), per-field features (pattern, restore, picker, spinner, min/max, negateable, textual date parsing)
- [`references/mask-tokens.md`](references/mask-tokens.md), string / number / date / time mask token tables and `MaskDecorator` recipes
- [`references/layout.md`](references/layout.md), `ColumnsLayout` breakpoints, spans, column placement, alignment, spacing
