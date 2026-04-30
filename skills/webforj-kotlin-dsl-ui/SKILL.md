---
name: webforj-kotlin-dsl-ui
description: "Create webforJ user interfaces using the Kotlin DSL for concise, type-safe UI construction. Covers component creation, layout composition, event handling, and integration with webforJ's core features. Use when asked to build UIs with Kotlin DSL syntax."
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
    // Implementation
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
    setEnabled(true)
}

// Text field
textField("Name", "John Doe")

// Text field with configuration
textField("Email") {
    placeholder = "Enter email"
    isRequired = true
}

// Checkbox
checkBox("Subscribe to newsletter")

// Radio button group
radioButtonGroup("Gender") {
    radioButton("Male")
    radioButton("Female")
    radioButton("Other")
}
```

### Container Components

```kotlin
// Flex layout
flexLayout(FlexDirection.COLUMN) {
    // Vertical layout
    button("Top")
    button("Bottom")
}

// Horizontal flex layout
flexLayout {
    horizontal() // Sets direction to ROW
    button("Left")
    button("Right")
}

// App layout
appLayout {
    appBar {
        label("My App")
    }
    drawer {
        button("Menu Item 1")
        button("Menu Item 2")
    }
    content {
        label("Main content")
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

```kotlin
appLayout {
    // App bar configuration
    appBar {
        label("Application Title")
        button("Settings") {
            iconSlot { icon("settings") }
        }
    }
    
    // Navigation drawer
    drawer {
        button("Dashboard")
        button("Reports")
        button("Settings")
    }
    
    // Main content area
    content {
        flexLayout {
            label("Welcome to the application")
            button("Get Started")
        }
    }
    
    // Footer (optional)
    footer {
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
```

### Form Events

```kotlin
form {
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
            if (validateForm()) {
                submitForm()
            }
        }
    }
}
```

## Advanced Patterns

### Slot Usage

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
    label: String,
    placeholder: String? = null,
    block: @WebforjDsl TextField.() -> Unit = {}
): TextField {
    return flexLayout(FlexDirection.COLUMN) {
        label(label)
        textField(placeholder) {
            block()
        }
    }.components.last()
}

// Usage
labeledTextField("Email", "Enter your email") {
    isRequired = true
    type = TextField.Type.EMAIL
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
            
            // User table or list would go here
            flexLayout {
                // User data display
            }
        }
    }
}
```

### Dependency Injection

```kotlin
@Component
class UserView @Inject constructor(
    private val userService: UserService
) : Composite<FlexLayout>() {
    // View implementation using injected service
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

### 1. Consistent Styling
Use CSS variables and theme values for consistent styling:

```kotlin
button("Primary Action") {
    theme = ButtonTheme.PRIMARY
    margin = "var(--dwc-space-m)"
    padding = "var(--dwc-space-s) var(--dwc-space-m)"
}
```

### 2. Accessibility
Always provide meaningful labels and accessible components:

```kotlin
button("Submit Form") {
    ariaLabel = "Submit the form"
    // Or use text that describes the action
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
// Instead of deeply nested flex layouts
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
    // App bar
    appBar {
        label("My App")
        button("Settings") {
            // Settings button configuration
        }
    }
    
    // Drawer
    drawer {
        // Navigation items
        button("Home")
        button("Profile")
        button("Settings")
    }
    
    // Main content
    content {
        // Tabbed interface
        tabbedPane {
            tab("Dashboard") {
                // Dashboard content
            }
            tab("Reports") {
                // Reports content
            }
            tab("Settings") {
                // Settings content
            }
        }
    }
}
```

## Common Pitfalls to Avoid

### 1. Incorrect Scope Usage
```kotlin
// Wrong: Calling button() outside of HasComponents scope
flexLayout {
    button("Button 1")
    // This works because flexLayout returns HasComponents
    
    // But this would be wrong if we tried to call button() on a non-HasComponents object
    // someNonComponent.button() // Compilation error due to @WebforjDsl
}

// Correct:
flexLayout {
    button("Button 1") {
        // Inside button scope, we can only call Button methods
        setEnabled(true)
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
        flexLayout { // Even more unnecessary
            button("Deeply nested")
        }
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
- `textField()` - Text input
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
- `appLayout()` - Application layout with header/drawer/footer
- `columnsLayout()` - Responsive grid layout
- `splitter()` - Resizable panels

### Containers
- `dialog()` - Modal dialog
- `drawer()` - Side panel
- `tabbedPane()` - Tabbed interface
- `accordion()` - Collapsible panels

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

## Verification

To verify your Kotlin DSL code:

1. **Syntax Check**: Ensure your IDE shows no syntax errors
2. **Compilation**: Run `mvn compile` to verify the code compiles
3. **Runtime Testing**: Run the application to verify UI behavior
4. **Accessibility Testing**: Verify screen reader compatibility
5. **Responsive Testing**: Test at different screen sizes

## Troubleshooting

### Compilation Errors
- **"Unresolved reference"**: Make sure you have the proper imports
- **"Type mismatch"**: Check that you're using the correct parameter types
- **"Invalid scope"**: Ensure you're calling DSL functions in the correct context

### Runtime Issues
- **Component not showing**: Check that you're adding components to a container
- **Events not firing**: Verify event listeners are properly set up
- **Layout issues**: Check flex properties and container sizes

### Performance Problems
- **Slow rendering**: Avoid deeply nested layouts
- **Memory leaks**: Properly clean up subscriptions and listeners
- **Janky animations**: Use CSS transforms instead of property animations
