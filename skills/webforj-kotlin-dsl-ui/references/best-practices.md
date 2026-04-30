# Best Practices

## Performance

### Avoid Deep Nesting

```kotlin
// Bad: Deeply nested layouts
flexLayout {
    flexLayout {
        flexLayout {
            flexLayout {
                button("Deep")
            }
        }
    }
}

// Good: Flat structure with spacing
flexLayout {
    button("Level 1")
    button("Level 2")
    button("Level 3")
    spacing = "10px"
}
```

### Use CSS for Animations

```kotlin
// Bad: JavaScript-based animation
button("Animate me") {
    onClick {
        // This causes layout recalculation
        setProperty("transform", "scale(1.1)")
    }
}

// Good: CSS transitions
button("Animate me") {
    // Set up CSS class for hover state
    classNames += "transition-button"
}

// CSS:
// .transition-button {
//   transition: transform 0.2s ease;
// }
// .transition-button:hover {
//   transform: scale(1.1);
// }
```

### Lazy Initialization

```kotlin
// Only create heavy components when needed
class DashboardView : Composite<FlexLayout>() {
    private var heavyChart: GoogleChart? = null
    
    init {
        self.build {
            button("Show Chart") {
                onClick {
                    if (heavyChart == null) {
                        heavyChart = googleChart { /* configure */ }
                        add(heavyChart!!)
                    } else {
                        heavyChart!!.isVisible = true
                    }
                }
            }
        }
    }
}
```

### Cache Component References

```kotlin
class FormView : Composite<FlexLayout>() {
    // Cache references to components you'll access later
    private lateinit var nameField: TextField
    private lateinit var submitButton: Button
    private lateinit var errorLabel: Label
    
    init {
        self.build {
            // First pass: create components
            nameField = textField("Name") {
                isRequired = true
            }
            
            errorLabel = label("") {
                styles["color"] = "var(--dwc-color-danger)"
                isVisible = false
            }
            
            submitButton = button("Submit") {
                onClick { handleSubmit() }
            }
        }
    }
    
    private fun handleSubmit() {
        // Direct access to cached references
        if (nameField.value.isBlank()) {
            errorLabel.text = "Name is required"
            errorLabel.isVisible = true
            return
        }
        // Process form
    }
}
```

## Accessibility

### ARIA Labels

```kotlin
// Button with icon but no text - provide ARIA label
iconButton(icon("search")) {
    ariaLabel = "Search"
    onClick { performSearch() }
}

// Form fields should have labels
textField("Email Address") {
    ariaRequired = true
    ariaDescribedBy = "email-helper"
}

label("") {
    id = "email-helper"
    text = "We'll never share your email."
    styles["font-size"] = "12px"
    styles["color"] = "var(--dwc-color-gray-text)"
}

// Status announcements
div {
    ariaLive = "polite"  // Screen reader will announce changes
    role = "status"
    label("Form submitted successfully")
}
```

### Keyboard Navigation

```kotlin
// Ensure buttons can be activated with Enter and Space
button("Submit") {
    // Default behavior - ensure no focus trap
    
    onKeyDown { event ->
        // Handle specific keyboard shortcuts
        if (event.key == Key.ENTER) {
            submitForm()
            true
        } else {
            false
        }
    }
}

// Use proper tab order
flexLayout {
    // Logical tab order: top to bottom, left to right
    textField("First Name")  // Tab 1
    textField("Last Name")   // Tab 2
    textField("Email")       // Tab 3
    button("Submit")         // Tab 4
}

// Skip links for navigation
anchor("Skip to main content") {
    href = "#main-content"
    classNames += "sr-only"  // CSS: .sr-only { position: absolute; ... }
}
```

### Screen Reader Support

```kotlin
// Semantic HTML elements
anchor("Visit homepage") {
    href = "/"
    // Better than div with onclick
    
paragraph("Important info") {
    role = "note"  // Supplementary content
}

// Form error association
textField("Email") {
    ariaInvalid = true  // Will be announced as invalid
    ariaDescribedBy = "email-error"
}

label("") {
    id = "email-error"
    role = "alert"  // Immediately announced
    text = "Please enter a valid email"
}
```

### Focus Management

```kotlin
// Set initial focus
textField("Username") {
    focus()  // On view load
}

// Focus after action
button("Add Item") {
    onClick {
        inputField.focus()  // Focus the new element
    }
}

// Restore focus after modal close
dialog("Confirm") {
    onClose {
        confirmButton.focus()  // Return focus to triggering element
    }
}
```

## Code Organization

### View Structure

```kotlin
@Route("dashboard")
@FrameTitle("Dashboard")
class DashboardView : Composite<FlexLayout>() {
    private val self = boundComponent
    
    // Section 1: Data sources (if using data binding)
    private val viewModel = DashboardViewModel()
    
    // Section 2: Component references
    private lateinit var titleLabel: Label
    private lateinit var dataTable: Table
    private lateinit var refreshButton: Button
    
    init {
        self.build {
            // Layout configuration
            direction = FlexDirection.COLUMN
            padding = "var(--dwc-space-l)"
            spacing = "var(--dwc-space-m)"
            
            // Build the UI - organized by sections
            buildHeader()
            buildContent()
            buildFooter()
            
            // Initialize data
            loadData()
        }
    }
    
    private fun FlexLayout.buildHeader() {
        flexLayout {
            justifyContent = FlexJustifyContent.BETWEEN
            alignItems = FlexAlignment.CENTER
            
            titleLabel = label("Dashboard") {
                styles["font-size"] = "24px"
                styles["font-weight"] = "bold"
            }
            
            refreshButton = button("Refresh") {
                iconSlot { icon("refresh") }
                onClick { refreshData() }
            }
        }
    }
    
    private fun FlexLayout.buildContent() {
        dataTable = table {
            // Table configuration
        }
    }
    
    private fun FlexLayout.buildFooter() {
        label("Last updated: ${LocalDateTime.now()}") {
            styles["font-size"] = "12px"
            styles["color"] = "var(--dwc-color-gray-text)"
        }
    }
    
    private fun loadData() {
        // Data loading logic
    }
}
```

### Reusable Component Functions

```kotlin
// Create utility functions for common patterns

// Form field with label
fun HasComponents.labeledField(
    labelText: String,
    fieldBlock: TextField.() -> Unit
): TextField {
    return flexLayout(FlexDirection.COLUMN) {
        spacing = "var(--dwc-space-xs)"
        
        label(labelText) {
            styles["font-weight"] = "500"
        }
        
        textField {
            width = 100.percent
            fieldBlock()
        }
    }
}

// Card component
fun HasComponents.card(
    title: String,
    content: String,
    actionLabel: String? = null,
    actionBlock: (() -> Unit)? = null
): FlexLayout {
    return flexLayout(FlexDirection.COLUMN) {
        padding = "var(--dwc-space-m)"
        spacing = "var(--dwc-space-s)"
        classNames += "card"
        
        label(title) {
            styles["font-weight"] = "bold"
            styles["font-size"] = "18px"
        }
        
        paragraph(content)
        
        actionLabel?.let { label ->
            button(label) {
                onClick { actionBlock?.invoke() }
            }
        }
    }
}

// Usage
flexLayout {
    labeledField("Name") {
        isRequired = true
    }
    
    card("Welcome", "This is a card content", "Learn More") {
        navigateTo("about")
    }
}
```

### Consistent Styling

```kotlin
// Use CSS variables throughout
flexLayout {
    // Good: Use design tokens
    padding = "var(--dwc-space-m)"
    margin = "var(--dwc-space-l)"
    spacing = "var(--dwc-space-s)"
    borderRadius = "var(--dwc-radius-m)"
}

// Use semantic colors
button("Primary") {
    theme = ButtonTheme.PRIMARY
}

label("Error") {
    styles["color"] = "var(--dwc-color-danger)"
}

label("Success") {
    styles["color"] = "var(--dwc-color-success)"
}
```

### Error Handling

```kotlin
class SafeView : Composite<FlexLayout>() {
    init {
        self.build {
            try {
                // Risky operation
                setupUI()
            } catch (e: Exception) {
                // Show error state
                flexLayout {
                    label("An error occurred") {
                        styles["color"] = "var(--dwc-color-danger)"
                    }
                    button("Retry") {
                        onClick { /* Retry logic */ }
                    }
                }
            }
        }
    }
}
```

## State Management

### Simple State with Properties

```kotlin
class CounterView : Composite<FlexLayout>() {
    // Use component properties for state
    private val counter = mutableStateOf(0)
    private lateinit var label: Label
    
    init {
        self.build {
            alignment = FlexAlignment.CENTER
            spacing = "var(--dwc-space-m)"
            
            label = label("Count: 0") {
                id = "counter-label"
            }
            
            button("Increment") {
                onClick {
                    counter.value++
                    updateLabel()
                }
            }
            
            button("Decrement") {
                onClick {
                    counter.value--
                    updateLabel()
                }
            }
        }
    }
    
    private fun updateLabel() {
        // Update the label with current count
        label.text = "Count: ${counter.value}"
    }
}
```

### Observable Patterns

```kotlin
class DataView : Composite<FlexLayout>() {
    private val items = mutableStateOf<List<String>>(emptyList())
    private val loading = mutableStateOf(false)
    
    init {
        self.build {
            // Loading state
            loading.subscribe { isLoading ->
                if (isLoading) {
                    spinner()
                } else {
                    // Show data
                }
            }
            
            // Data changes
            items.subscribe { itemList ->
                renderItems(itemList)
            }
        }
    }
}
```

### Cleanup

```kotlin
class CleanupView : Composite<FlexLayout>() {
    private val subscriptions = mutableListOf<Disposable>()
    
    init {
        self.build {
            // Subscribe and track
            val sub = someEvent.subscribe { event ->
                handleEvent(event)
            }
            subscriptions.add(sub)
        }
    }
    
    override fun onDetach() {
        super.onDetach()
        // Clean up all subscriptions
        subscriptions.forEach { it.dispose() }
        subscriptions.clear()
    }
}
```
