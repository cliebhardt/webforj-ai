# Mask Tokens and `MaskDecorator`

The same mask syntax powers the masked field components, the `Table` mask renderers, AND the `MaskDecorator` utility. Pick by the surface: input field, `Table` column, or one-off formatting in arbitrary code.

## When to use which

| Scenario | Tool |
|---|---|
| User types into the form | `MaskedTextField` / `MaskedNumberField` / `MaskedDateField` / `MaskedTimeField` |
| Render a value inside a `Table` column | a `Table` renderer: `MaskedTextRenderer<>(mask)`, `MaskedNumberRenderer<>(mask, locale)`, `MaskedDateTimeRenderer<>(mask)`, `CurrencyRenderer<>(locale)`, `PercentageRenderer<>(theme, withBar)`. Wire with `column.setRenderer(...)`. NEVER call `MaskDecorator` from inside a Table cell. |
| Render a value in a non-`Table` surface (read-only label, tooltip, exported report, log line) | `MaskDecorator.forString/forNumber/forDate/forTime/forDateTime` |
| Parse a string that came from somewhere else back into `LocalDate` / `LocalTime` | `MaskDecorator.parseDate` / `parseTime` |

## String mask tokens

| Char | Meaning |
|---|---|
| `X` | Any printable character |
| `a` | Any alphabetic character |
| `A` | Any alphabetic; lowercase converted to uppercase |
| `0` | Any digit (0-9) |
| `z` | Any digit or letter |
| `Z` | Any digit or letter; lowercase converted to uppercase |

Anything else is a literal, inserted as-is.

```java
MaskDecorator.forString("1234567890", "(000) 000-0000");  // "(123) 456-7890"
MaskDecorator.forString("a1b2c3",     "A0A 0A0");          // "A1B 2C3"
MaskDecorator.forString("abc123",     "AAA-000");          // "ABC-123"
MaskDecorator.forString("1234",       "ZZZZ-0000");        // "1234-    " (padded)
```

Invalid characters in input are silently ignored. Short input is right-padded with spaces. Long input is truncated.

## Number mask tokens

| Char | Meaning |
|---|---|
| `0` | Always replaced by a digit |
| `#` | Suppresses leading zeros. Replaced by fill character (left of decimal) or space/zero (right of decimal) |
| `,` | Grouping separator. Becomes fill character if no digits precede it; otherwise comma |
| `.` | Decimal point |
| `-` | Minus sign for negatives, fill character for positives |
| `+` | `+` for positive, `-` for negative |
| `$` | Dollar sign (literal) |
| `(` `)` | Wrap negatives in parens; fill for positive |
| `CR` | `CR` for negative; two spaces for positive |
| `DR` | `CR` for negative; `DR` for positive |
| `*` | Always inserts `*` |
| `B` | Always becomes a space |

`-`, `+`, `$`, `(` are FLOATING, the first occurrence is moved to the last position where a `#` or `,` was replaced by the fill character.

```java
MaskDecorator.forNumber(1234.5,    "###,##0.00");   // "  1,234.50"
MaskDecorator.forNumber(-9876.0,   "###,##0.00-");  // "  9,876.00-"
MaskDecorator.forNumber(42.0,      "$###,##0.00");  // "     $42.00"
MaskDecorator.forNumber(0.5,       "#0.000");        // " 0.500"
MaskDecorator.forNumber(1234567.89, "#,###,##0.00");// "1,234,567.89"
```

> `MaskDecorator.forNumber` ROUNDS to the mask's decimal precision. `MaskedNumberField` does NOT round (display truncates).

## Date mask tokens

Format indicators always start with `%` and a single letter:

| Format | Meaning |
|---|---|
| `%Y` | Year |
| `%M` | Month |
| `%D` | Day |

Modifiers (one letter directly after the format):

| Modifier | Meaning |
|---|---|
| `z` | Zero-fill (`%Mz` for `01`-`12`) |
| `s` | Short text (`%Ms` for `Jan`-`Dec`, `%Ds` for `Mon`-`Sun`) |
| `l` | Long text (`%Ml` for `January`, `%Dl` for `Monday`, `%Yl` for 4-digit year) |
| `p` | Packed number |
| `d` | Decimal (default) |

```java
LocalDate d = LocalDate.of(2025, 3, 5);

MaskDecorator.forDate(d, "%Mz/%Dz/%Yl");    // "03/05/2025"
MaskDecorator.forDate(d, "%Dz.%Mz.%Yz");    // "05.03.25"
MaskDecorator.forDate(d, "%Dl, %Ml %Dz");   // "Wednesday, March 05"
MaskDecorator.forDate(d, "%Yl-%Mz-%Dz");    // "2025-03-05"
```

Parse back:

```java
LocalDate parsed = MaskDecorator.parseDate("07/04/2025", "%Mz/%Dz/%Yl");
LocalDate parsed = MaskDecorator.parseDate("07/04/2025", "%Mz/%Dz/%Yl", Locale.US);
```

The locale-aware overload is useful for masks containing week numbers or text-based modifiers.

## Time mask tokens

| Format | Meaning |
|---|---|
| `%H` | Hour (24-hour) |
| `%h` | Hour (12-hour) |
| `%m` | Minute |
| `%s` | Second |
| `%p` | am/pm |

Modifiers are the same as date masks (`z`, `s`, `l`, `p`, `d`).

```java
LocalTime t = LocalTime.of(9, 5, 30);

MaskDecorator.forTime(t, "%Hz:%mz:%sz");    // "09:05:30"
MaskDecorator.forTime(t, "%hz:%mz %p");     // "09:05 am"
MaskDecorator.forTime(t, "%Hz%mz");         // "0905"
```

Parse back:

```java
LocalTime parsed = MaskDecorator.parseTime("14:30", "%Hz:%mz");
LocalTime parsed = MaskDecorator.parseTime("02:30 pm", "%hz:%mz %p", Locale.US);
```

The locale-aware overload is needed when the mask contains localized AM/PM tokens.

## Date-time

`forDateTime` accepts any combination of date and time tokens:

```java
LocalDateTime dt = LocalDateTime.of(2025, 7, 4, 14, 30, 0);

MaskDecorator.forDateTime(dt, "%Mz/%Dz/%Yl %Hz:%mz");      // "07/04/2025 14:30"
MaskDecorator.forDateTime(dt, "%Mz/%Dz/%Yl %Hz:%mz:%sz");  // "07/04/2025 14:30:00"
MaskDecorator.forDateTime(dt, "%Dz.%Mz.%Yz %hz:%mz %p");   // "04.07.25 02:30 pm"
```

## Null-handling

All `for*()` and `parse*()` methods return `null` if the input cannot be formatted/parsed. ALWAYS null-check before using the result:

```java
String formatted = MaskDecorator.forDate(date, "%Mz/%Dz/%Yl");
if (formatted != null) {
  label.setText(formatted);
}
```

Returning `null` rather than throwing is intentional. It's safe to call from any surface where invalid data should produce blank output rather than an exception, like a label or a generated report.

## Common recipes

| Need | Mask |
|---|---|
| US phone | `(000) 000-0000` |
| Canadian postal code | `A0A 0A0` |
| Credit card | `0000-0000-0000-0000` |
| US ZIP | `00000` |
| Coupon code | `ZZZZ-0000` |
| Account ID | `AA-00-0000` |
| Currency, USD | `$###,##0.00` |
| Currency, negative-suffix | `###,##0.00-` |
| Percentage | `###%` |
| US date | `%Mz/%Dz/%Yl` |
| EU date | `%Dz/%Mz/%Yl` |
| ISO date | `%Yl-%Mz-%Dz` |
| Long-form date | `%Dl, %Ml %Dz` |
| 24-hour time | `%Hz:%mz` |
| 12-hour time with AM/PM | `%hz:%mz %p` |
| Time with seconds | `%Hz:%mz:%sz` |
| Compact time (no separator) | `%Hz%mz` |

## Wrong syntaxes (do NOT use on these components)

| Wrong | Reason |
|---|---|
| `dd/MM/yyyy` (Java `DateTimeFormatter`) | webforJ uses `%Mz/%Dz/...`, not `DateTimeFormatter` patterns |
| `MM/DD/YYYY` (no `%`) | Format indicators must start with `%` |
| `HH:mm:ss` (Java) | webforJ uses `%Hz:%mz:%sz` |
| `9999.99` for number masks | Use `0` (always digit) or `#` (suppress leading zeros) |

If you need `DateTimeFormatter` syntax (e.g. integrating with code that already uses it), do the formatting outside the mask and feed the result into a plain `TextField`, OR write a `Transformer<LocalDate, String>` that does the conversion, see [`binding.md`](binding.md).
