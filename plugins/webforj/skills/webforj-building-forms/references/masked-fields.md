# Masked Field Components

Four masked field components, all in `com.webforj.component.field`, all since 24.10. Each one combines an input with format-as-you-type rules; date and time fields also expose a built-in picker.

| Component | Value type | Picker | Mask syntax |
|---|---|---|---|
| `MaskedTextField` | `String` | none | character mask (`X a A 0 z Z`) |
| `MaskedNumberField` | `Double` | none | number mask (`0 # , . - + $ ( ) CR DR * B`) |
| `MaskedDateField` | `LocalDate` | `DatePicker` (calendar) | date mask (`%Y %M %D` + modifiers) |
| `MaskedTimeField` | `LocalTime` | `TimePicker` | time mask (`%H %h %m %s %p` + modifiers) |

Mask token tables are in [`mask-tokens.md`](mask-tokens.md). This page covers the per-component features.

## `MaskedTextField`

Structured strings: phone numbers, postal codes, IDs, coupon codes, IBANs.

```java
MaskedTextField account = new MaskedTextField("Account ID");
account.setMask("ZZZZ-0000")
  .setHelperText("Mask: ZZZZ-0000 - for example: SAVE-2025");
```

A mask of all `X` accepts any printable input, equivalent to a plain `TextField` plus the masked-field surface (restore, spinner subtype, etc.).

### Pattern (RegExp)

`setPattern(...)` adds a regex check on top of the mask. Use it ONLY when you need a constraint the mask itself cannot express, e.g. exact length, hex / UUID / Base64 character classes, or a more restrictive subset of what the mask allows.

```java
field.setPattern("[A-Za-z0-9]{10}");                 // 10-char alphanumeric
```

The pattern uses JavaScript `RegExp` syntax (the HTML `pattern` attribute). Native HTML pattern semantics apply.

**Do NOT add `setPattern` (or a Jakarta `@Pattern` on the bound bean property) that re-validates the same shape the mask already enforces.** A `MaskedTextField` with mask `"(000) 000-0000"` cannot produce anything other than `(NNN) NNN-NNNN`. Adding `@Pattern(regexp = "\\(\\d{3}\\) \\d{3}-\\d{4}")` on the bean is dead code, the mask has already filtered the input.

### Restore value

```java
field.setRestoreValue("ABC123");
field.restoreValue();                                 // programmatic
// the user can also press ESC by default
```

If `setRestoreValue(...)` was never called, ESC reverts to the value the field had when first rendered.

### `MaskedTextFieldSpinner`

Cycles through a fixed list of valid options:

```java
MaskedTextFieldSpinner spinner = new MaskedTextFieldSpinner();
spinner.setOptions(List.of("Option A", "Option B", "Option C"));
spinner.spinUp();          // next
spinner.spinDown();        // previous
spinner.setOptionIndex(1);
int current = spinner.getOptionIndex();
```

Inherits everything from `MaskedTextField`.

## `MaskedNumberField`

Currency, percentages, quantities. Value is `Double`.

```java
MaskedNumberField bill = new MaskedNumberField("Bill Amount");
bill.setMask("$######.##").setValue(300d);

MaskedNumberField tip = new MaskedNumberField("Tip Percentage (%)");
tip.setMask("###%").setValue(15d);
```

### Group and decimal characters (locale)

```java
field.setGroupCharacter(".");                        // 1.000.000
field.setDecimalCharacter(",");                      // 123,45
```

Defaults follow the app's current locale. Override per field when needed.

### Negateable

```java
field.setNegateable(false);                          // disallow negative numbers
```

### Min / max

```java
field.setMin(10.0);
field.setMax(100.0);
```

Values outside the range are flagged invalid.

### Restore value

```java
field.setRestoreValue(1500.00);
field.restoreValue();
```

ESC also restores by default.

> Mask formatting in a field does NOT round. `12.34567` in a field with mask `###0.00` displays `12.34`, not `12.35`. `MaskDecorator.forNumber(...)` DOES round.

### `MaskedNumberFieldSpinner`

Step controls for incremental editing (quantity, rating):

```java
MaskedNumberFieldSpinner spinner = new MaskedNumberFieldSpinner();
spinner.setStep(5.0);
```

Inherits masks, group/decimal characters, min/max, restore.

## `MaskedDateField`

Date input with calendar picker. Value is `LocalDate`.

```java
MaskedDateField field = new MaskedDateField("Meeting Date");
field.setMask("%Mz/%Dz/%Yz")                          // MM/DD/YY
     .setValue(LocalDate.now());
```

### Locale

```java
field.setLocale(Locale.FRANCE);                       // adjusts parsing and display
```

### Parsing

The field accepts numeric input with or without delimiters and parses based on the mask order. For example, with mask `%Mz/%Dz/%Yz` (US-style MDY):

| Input | Parsed as (today = Sep 15, 2012) |
|---|---|
| `1` | September 1, 2012 (1 digit = day in current month) |
| `12` | September 12, 2012 |
| `112` | January 12, 2012 (1-digit month + 2-digit day) |
| `1004` | October 4, 2012 (MMDD) |
| `020304` | February 3, 2004 (MMDDYY for US ordering) |
| `06122004` | June 12, 2004 (MMDDYYYY) |
| `12/6` | December 6, 2012 |

Parsing rules differ for ISO (`%Yz%Mz%Dz`) and EU (`%Dz%Mz%Yz`) mask orders. See the docs for full table.

### Textual date parsing (since 25.11)

```java
field.setTextualDateParsing(true);
```

Then mask modifiers `%Ms` and `%Ml` accept short / long month names; `%Ds` and `%Dl` accept short / long day-of-week names (decorative only, you must still include `%Dz` for the actual day number).

```java
field.setMask("%Ms/%Dz/%Yz");                         // accepts "Sep/01/25"
field.setMask("%Dl %Mz/%Dz/%Yz");                     // accepts "Monday 09/01/25"
```

Case-insensitive. Locale-aware, French locale expects `septembre`, German expects `Montag`.

### Min / max

```java
field.setMin(LocalDate.of(2020, 1, 1));
field.setMax(LocalDate.of(2030, 12, 31));
```

### Restore value

```java
field.setRestoreValue(LocalDate.of(2025, 1, 1));
field.restoreValue();
```

### Date picker

```java
DatePicker picker = field.getPicker();
picker.setIconVisible(true);
picker.setAutoOpen(true);                             // open on click / Enter / arrow keys
picker.setShowWeeks(true);
picker.open();                                        // or picker.show()
```

Force picker-only entry (block typing):

```java
field.setAllowCustomValue(false);
field.getPicker().setAutoOpen(true);
```

### Pattern (RegExp)

```java
field.setPattern("^\\d{2}/\\d{2}/\\d{4}$");
```

> `setPattern` is structural only. `99/99/9999` matches the regex but is not a real date, always also rely on `LocalDate` parsing or a Jakarta `@PastOrPresent` / range validator for semantic checks.

### `MaskedDateFieldSpinner`

```java
MaskedDateFieldSpinner spinner = new MaskedDateFieldSpinner();
spinner.setSpinField(MaskedDateFieldSpinner.SpinField.WEEK);  // DAY, WEEK, MONTH, YEAR
```

## `MaskedTimeField`

Time input with picker. Value is `LocalTime`.

```java
MaskedTimeField field = new MaskedTimeField("Start Time");
field.setMask("%Hz:%mz").setValue(LocalTime.of(9, 0));
```

### Parsing

| Input | Mask | Parsed as |
|---|---|---|
| `900` | `%Hz:%mz` | 09:00 |
| `1345` | `%Hz:%mz` | 13:45 |
| `0230` | `%hz:%mz %p` | 02:30 AM |
| `1830` | `%hz:%mz %p` | 06:30 PM |

### Locale

```java
field.setLocale(Locale.GERMANY);                      // affects AM/PM, separators, parsing
```

### Min / max

```java
field.setMin(LocalTime.of(8, 0));
field.setMax(LocalTime.of(18, 0));
```

### Restore value

```java
field.setRestoreValue(LocalTime.of(12, 0));
field.restoreValue();
```

### Time picker

```java
TimePicker picker = field.getPicker();
picker.setIconVisible(true);
picker.setAutoOpen(true);
picker.setStep(Duration.ofMinutes(15));               // 15-minute slots
picker.open();
```

`setStep(...)` must evenly divide an hour or a full day; otherwise it throws.

Force picker-only:

```java
field.setAllowCustomValue(false);
field.getPicker().setAutoOpen(true);
```

### Pattern (RegExp)

```java
field.setPattern("^\\d{2}:\\d{2}$");
```

Same caveat as date: structural only. `99:99` matches but isn't a real time.

### `MaskedTimeFieldSpinner`

```java
MaskedTimeFieldSpinner spinner = new MaskedTimeFieldSpinner();
spinner.setSpinField(MaskedTimeFieldSpinner.SpinField.MINUTE);   // HOUR, MINUTE, SECOND, MILLISECOND
```

## Picker-only entry, recipe

For a date field where users MUST pick from the calendar:

```java
field.setAllowCustomValue(false);
field.getPicker().setAutoOpen(true);
```

Same shape for `MaskedTimeField`. This is the documented way to eliminate parsing edge cases on typed input.

## Composing with `BindingContext`

Bind masked fields just like plain fields. The bean property type follows the field's value type:

```java
public class Booking {
  private LocalDate date;        // matches MaskedDateField
  private Double amount;         // matches MaskedNumberField
  private LocalTime startTime;   // matches MaskedTimeField
  private String accountId;      // matches MaskedTextField
  // setters / getters
}

context.bind(dateField,    "date").add();
context.bind(amountField,  "amount").add();
context.bind(timeField,    "startTime").add();
context.bind(accountField, "accountId").add();
```

If the bean uses a different type (e.g. `String accountIdRaw`), bind through a transformer, see [`binding.md`](binding.md).
