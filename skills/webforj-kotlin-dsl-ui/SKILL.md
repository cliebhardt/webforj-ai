---
name: webforj-kotlin-dsl-ui
description: "Create webforJ user interfaces using the Kotlin DSL for concise, type-safe UI construction. Covers component creation, layout composition, event handling, and integration with webforJ's core features. Use when asked to build UIs with Kotlin DSL syntax, create Kotlin DSL components, or write webforJ Kotlin code."
---

# Building UIs with Kotlin DSL in webforJ

The webforJ Kotlin DSL provides a concise, type-safe way to build user interfaces using Kotlin's builder pattern and extension functions. This skill covers the fundamentals of the DSL, component creation patterns, layout composition, and best practices for building webforJ applications.

## Why Use Kotlin DSL?

- **Concise syntax**: Reduce boilerplate code with extension functions and trailing lambdas
- **Type safety**: Compile-time checking of component properties and event handlers
- **IDE support**: Excellent autocompletion and refactoring capabilities
- **DSL markers**: Prevent incorrect nesting of components through compile-time checks
- **Familiar patterns**: Similar to other Kotlin DSLs like Anko or Jetpack Compose

## Core Concepts

### DSL Marker Annotation

The `@WebforjDsl` annotation ensures that DSL functions are only called in the correct scope:

```kotlin
@Target(AnnotationTarget.TYPE, AnnotationTarget.CLASS, AnnotationTarget.TYPE_PARAMETER, AnnotationTarget.TYPEALIAS)
@Retention(AnnotationRetention.BINARY)
@DslMarker
annotation class WebforjDsl
```

### Component Creation Functions

Components are created using extension functions on `HasComponents`:

```kotlin
fun @WebforjDsl HasComponents.button(
    text: String? = null,
    theme: ButtonTheme? = null,
    block: @WebforjDsl Button.() -> Unit = {}
): Button {
    val button = if (theme != null && text != null) {
        Button(text, theme)
    } else if (text != null) {
        Button(text)
    } else {
        Button().apply { theme?.let { setTheme(it) } }
    }
    return init(button, block)
}
```

### The `init` Function

The `init` function handles adding components and executing initialization blocks:

```kotlin
fun <T: Component> (@WebforjDsl HasComponents).init(component: T, block: (@WebforjDsl T).() -> Unit): T {
    add(component)
    component.block()
    return component
}
```

### The `build` Function

For fluent initialization of a component within its own scope:

```kotlin
fun <T: Component> @WebforjDsl T.build(block: @WebforjDsl T.() -> Unit) {
    block()
}
```

**Usage in Composite views (recommended pattern):**

```kotlin
class MyView : Composite<FlexLayout>() {
    private val self = boundComponent
    
    init {
        self.build {
            direction = FlexDirection.COLUMN
            // DSL components here
        }
    }
}
```

Note: While the `build { }` pattern is preferred, you may also see `self.apply { }` in older examples. Both work, but `build` is the recommended approach as it provides better DSL scope safety.

## Required Imports

When using the Kotlin DSL, ensure you have the proper imports:

```kotlin
// Core DSL imports
import com.webforj.kotlin.dsl.*
import com.webforj.kotlin.dsl.component.button.button
import com.webforj.kotlin.dsl.component.field.textField
import com.webforj.kotlin.dsl.component.layout.flexlayout.flexLayout
import com.webforj.concern.HasComponents

// Extension imports (for styles, classNames, etc.)
import com.webforj.kotlin.extension.styles
import com.webforj.kotlin.extension.classNames
import com.webforj.kotlin.extension.px
import com.webforj.kotlin.extension.percent
```

## Component Creation Patterns

### Basic Components

```kotlin
// Simple button
button("Click me")

// Button with theme
button("Primary", ButtonTheme.PRIMARY)

// Button with initialization block
button("Submit") {
    onClick { /* handle click */ }
    isEnabled = true
}

// Text field with label and value
textField("Name", "John Doe")

// Text field with configuration
textField("Email", placeholder = "Enter email") {
    isRequired = true
}

// Text field with type
textField("Email", type = TextField.Type.EMAIL) {
    placeholder = "Enter email"
    isRequired = true
}

// Checkbox
checkBox("Subscribe to newsletter")

// Radio button group
radioButtonGroup {
    radioButton("Male")
    radioButton("Female")
    radioButton("Other")
}
```

### Container Components

```kotlin
// Flex layout with direction
flexLayout(FlexDirection.COLUMN) {
    // Vertical layout
    button("Top")
    button("Bottom")
}

// Horizontal flex layout using helper
flexLayout {
    horizontal() // Sets direction to ROW
    button("Left")
    button("Right")
}

// App layout with slots (headerSlot, drawerSlot, footerSlot)
appLayout {
    headerSlot {
        label("My App")
        button("Settings")
    }
    drawerSlot {
        button("Dashboard")
        button("Reports")
        button("Settings")
    }
    footerSlot {
        label("© 2026 My Company")
    }
}

// Columns layout (responsive)
columnsLayout {
    column {
        label("Column 1")
    }
    column {
        label("Column 2")
    }
}
```

## Layout Composition

### FlexLayout Patterns

```kotlin
// Column layout (default)
flexLayout {
    direction = FlexDirection.COLUMN
    button("Item 1")
    button("Item 2")
}

// Row layout
flexLayout {
    direction = FlexDirection.ROW
    button("Left")
    button("Center")
    button("Right")
}

// Wrapping layout
flexLayout {
    wrap = FlexWrap.WRAP
    repeat(10) { button("Item $it") }
}

// Alignment and justification
flexLayout {
    alignment = FlexAlignment.CENTER
    justifyContent = FlexJustifyContent.BETWEEN
    button("Left")
    button("Right")
}
```

### AppLayout Patterns

The AppLayout uses slot-based DSL functions: `headerSlot`, `footerSlot`, `drawerSlot`, `drawerTitleSlot`, `drawerHeaderActionsSlot`, and `drawerFooterSlot`.

```kotlin
appLayout {
    // Header slot configuration
    headerSlot {
        label("Application Title")
        button("Menu")
    }
    
    // Drawer slot configuration
    drawerSlot {
        button("Dashboard")
        button("Reports")
        button("Settings")
    }
    
    // Footer slot configuration
    footerSlot {
        label("© 2026 My Company")
    }
}
```

## Event Handling

### Basic Event Handlers

```kotlin
button("Click me") {
    onClick {
        // Handle click event
        toast("Button clicked!")
    }
}

button("Double click me") {
    onDoubleClick {
        // Handle double click
        toast("Double clicked!")
    }
}

textField("Search") {
    onValueChange {
        // Handle text changes
        toast("Text changed to: ${it.value}")
    }
}
```

### Form Events

```kotlin
flexLayout {
    direction = FlexDirection.COLUMN
    
    textField("Username") {
        onBlur {
            // Validate when field loses focus
            if (it.value.isBlank()) {
                it.helperText = "Username is required"
            }
        }
        
        onFocus {
            // Clear helper text when focused
            it.helperText = ""
        }
    }
    
    button("Submit") {
        onClick {
            // Handle form submission
            submitForm()
        }
    }
}
```

## Advanced Patterns

### Slot Usage (for components with prefixes/suffixes/icons)

```kotlin
button("With Icon") {
    // Prefix slot (before text)
    prefixSlot {
        icon("user")
    }
    
    // Suffix slot (after text)
    suffixSlot {
        badge("5", BadgeTheme.DANGER)
    }
    
    // Icon slot (replaces text with icon)
    iconSlot {
        icon("settings")
    }
}
```

### Component Extension

```kotlin
// Extending existing components with custom properties
fun @WebforjDsl HasComponents.customButton(
    text: String? = null,
    iconName: String? = null,
    block: @WebforjDsl Button.() -> Unit = {}
): Button {
    val button = button(text) {
        iconName?.let { iconSlot { icon(it) } }
        block()
    }
    return button
}

// Usage
customButton("Action", "star") {
    onClick { /* handle click */ }
}
```

### Reusable UI Components

```kotlin
// Creating a custom form field component
fun @WebforjDsl HasComponents.labeledTextField(
    labelText: String,
    placeholder: String? = null,
    block: @WebforjDsl TextField.() -> Unit = {}
): TextField {
    var textField: TextField? = null
    flexLayout(FlexDirection.COLUMN) {
        spacing = "4px"
        label(labelText)
        textField = textField("", placeholder = placeholder) {
            block()
        }
    }
    return textField!!
}

// Usage
labeledTextField("Email", "Enter your email") {
    isRequired = true
    type = TextField.Type.EMAIL
}
```

## Styling Components

### Using styles Extension

```kotlin
button("Styled") {
    styles["background-color"] = "#007bff"
    styles["color"] = "white"
    styles["padding"] = "12px 24px"
    styles["border-radius"] = "4px"
}
```

### Using CSS Classes

```kotlin
button("Primary Action") {
    classNames += "btn-primary"
}
```

### Using Theme Values

```kotlin
button("Primary Action") {
    theme = ButtonTheme.PRIMARY
    margin = "var(--dwc-space-m)"
    padding = "var(--dwc-space-s) var(--dwc-space-m)"
}
```

## Integration with webforJ Features

### Routing and Navigation

```kotlin
@Route("users")
@FrameTitle("User Management")
class UserView : Composite<FlexLayout>() {
    private val self = boundComponent
    
    init {
        self.build {
            direction = FlexDirection.COLUMN
            padding = 20.px
            
            flexLayout {
                justifyContent = FlexJustifyContent.BETWEEN
                alignItems = FlexAlignment.CENTER
                width = 100.percent
                
                label("User Management")
                button("Add User", ButtonTheme.PRIMARY) {
                    onClick {
                        navigator.navigateTo("add-user")
                    }
                }
            }
        }
    }
}
```

### State Management

```kotlin
class CounterView : Composite<FlexLayout>() {
    private val count = mutableStateOf(0)
    private val self = boundComponent
    
    init {
        self.build {
            alignment = FlexAlignment.CENTER
            justifyContent = FlexJustifyContent.CENTER
            
            label("Count: ") {
                // Observe state changes
                subscribe(count) { value ->
                    this.text = "Count: $value"
                }
            }
            
            button("Increment") {
                onClick {
                    count.value++
                }
            }
        }
    }
}
```

## Best Practices

### 1. Use build Pattern

Prefer `self.build { }` over `self.apply { }` for configuring the bound component:

```kotlin
// Recommended:
init {
    self.build {
        direction = FlexDirection.COLUMN
        button("Click me")
    }
}

// Acceptable (older pattern):
init {
    self.apply {
        direction = FlexDirection.COLUMN
        button("Click me")
    }
}
```

### 2. Accessibility

Always provide meaningful labels and accessible components:

```kotlin
button("Submit Form") {
    ariaLabel = "Submit the form"
}

// For icons, always provide accessibility labels
button {
    iconSlot { icon("search") }
    ariaLabel = "Search"
}
```

### 3. Performance Considerations

Avoid deeply nested layouts when possible:

```kotlin
// Prefer this:
flexLayout {
    // Flat structure is better for performance
    button("Item 1")
    button("Item 2")
    button("Item 3")
    
    // Use spacing and alignment properties
    spacing = "8px"
    alignment = FlexAlignment.CENTER
}
```

### 4. Code Organization

Organize DSL code for readability:

```kotlin
appLayout {
    // Header
    headerSlot {
        label("My App")
    }
    
    // Drawer
    drawerSlot {
        button("Home")
        button("Profile")
        button("Settings")
    }
    
    // Footer
    footerSlot {
        label("© 2026 My Company")
    }
}
```

## Common Pitfalls to Avoid

### 1. Incorrect Scope Usage

```kotlin
// Wrong: Calling button() outside of HasComponents scope
flexLayout {
    button("Button 1") {
        // Inside button scope, we can only call Button methods
        isEnabled = true
        // textField() would be wrong here - not in HasComponents scope
    }
}
```

### 2. Forgetting to Return Components

```kotlin
// Wrong: Not returning the created component
fun createButton(): Button {
    button("Click me") { // This creates but doesn't return the button
        onClick { /* handler */ }
    }
    // Need to return the button!
}

// Correct:
fun createButton(): Button {
    return button("Click me") {
        onClick { /* handler */ }
    }
}
```

### 3. Overusing Nesting

```kotlin
// Avoid deeply nested structures when flat would suffice
flexLayout {
    flexLayout { // Unnecessary nesting
        button("Deeply nested")
    }
}

// Prefer:
flexLayout {
    button("Flat structure")
    spacing = "10px"
}
```

## Reference Components

### Buttons
- `button()` - Basic button
- `iconButton()` - Icon-only button
- `toggleButton()` - Stateful button

### Fields
- `textField()` - Text input (supports `label`, `value`, `placeholder`, `type` parameters)
- `passwordField()` - Password input
- `textArea()` - Multi-line text
- `numberField()` - Numeric input
- `dateField()` - Date picker
- `timeField()` - Time picker
- `checkBox()` - Boolean input
- `radioButton()` / `radioButtonGroup()` - Single selection
- `comboBox()` / `listBox()` - Dropdown selection

### Layouts
- `flexLayout()` - Flexbox container
- `appLayout()` - Application layout with header/drawer/footer slots
- `columnsLayout()` - Responsive grid layout
- `splitter()` - Resizable panels

### Containers
- `dialog()` - Modal dialog
- `accordion()` / `accordionPanel()` - Collapsible panels
- `tabbedPane()` / `tab()` - Tabbed interface

### Display
- `label()` - Text display
- `paragraph()` - Paragraph text
- `image()` / `img()` - Image display
- `icon()` - Icon display
- `badge()` - Status indicator
- `toast()` - Temporary notification
- `progressBar()` - Progress indicator
- `slider()` - Range selection
- `spinner()` - Loading indicator

### Navigation
- `button()` with `onClick` - Basic navigation
- `anchor()` - Hyperlink
- `appNav()` - Application navigation

### HTML Elements
- `div()`, `span()` - Generic containers
- `h1()` through `h6()` - Headers
- `p()` - Paragraph

## Verification

To verify your Kotlin DSL code:

1. **Syntax Check**: Ensure your IDE shows no syntax errors
2. **Compilation**: Run `mvn compile` to verify the code compiles
3. **Runtime Testing**: Run the application to verify UI behavior
4. **Accessibility Testing**: Verify screen reader compatibility
5. **Responsive Testing**: Test at different screen sizes

## Troubleshooting

### Compilation Errors
- **"Unresolved reference"**: Make sure you have the proper imports from `com.webforj.kotlin.dsl.*`
- **"Type mismatch"**: Check that you're using the correct parameter types
- **"Invalid scope"**: Ensure you're calling DSL functions in the correct context (inside `HasComponents`)

### Runtime Issues
- **Component not showing**: Check that you're adding components to a container
- **Events not firing**: Verify event listeners are properly set up
- **Layout issues**: Check flex properties and container sizes

### Performance Problems
- **Slow rendering**: Avoid deeply nested layouts
- **Memory leaks**: Properly clean up subscriptions and listeners
- **Janky animations**: Use CSS transforms instead of property animations
