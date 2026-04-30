# Event Handling Patterns

## Basic Event Handlers

### Mouse Events

```kotlin
button("Click me") {
    onClick {
        // Handle left mouse click
        toast("Button clicked!")
    }
}
```

### Keyboard Events

```kotlin
textField("Search") {
    onValueChange { valueChangeEvent ->
         // Perform search
         performSearch(valueChangeEvent.value)
    }
}
```

### Form Events

```kotlin
form {
    textField("Username") {
        onValueChange {
            // Handle text changes (fires on every keystroke)
            validateUsername(it.value)
        }
        
        onBlur {
            // Handle losing focus
            if (it.value.isBlank()) {
                it.setHelperText("Username is required")
            }
        }
        
        onFocus {
            // Handle gaining focus
            it.setHelperText("") // Clear helper text
        }
    }
    
    checkbox("Terms and Conditions") {
        onToggle { checked ->
            // Enable/disable submit button based on checkbox
            submitButton.isEnabled = checked
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
```

### Component-Specific Events

```kotlin
// Slider events
slider(0, 100) {
    onValueChange { value ->
        // Handle slider value changes
        valueLabel.text = "Value: $value"
    }
}

// ComboBox events
comboBox("Select option") {
    onSelectionChange { index, item ->
        // Handle selection changes
        selectedValueLabel.text = "Selected: $item"
    }
    
    onOpen {
        // Handle dropdown opening
    }
    
    onClose {
        // Handle dropdown closing
    }
}

// TabbedPane events
tabbedPane {
    tab("Tab 1") {
        // Tab 1 content
    }
    tab("Tab 2") {
        // Tab 2 content
    }
    
    onSelectionChange { index, tab ->
        // Handle tab selection changes
        statusLabel.text = "Selected tab: ${tab.title}"
    }
}

// Dialog events
dialog("Confirm Action") {
    label("Are you sure you want to proceed?")
    
    onOpen {
        // Handle dialog opening
        // Could set focus to a specific field
    }
    
    onClose {
        // Handle dialog closing
    }
    
    onConfirm {
        // Handle confirmation button click
    }
    
    onCancel {
        // Handle cancellation
    }
}
```

## Event Modifiers and Filtering

### Event Delegation

```kotlin
// Handling events on dynamically added components
flexLayout {
    // Container for dynamically added buttons
    
    // Add buttons dynamically
    repeat(5) { index ->
        button("Button $index") {
            onClick {
                // Handle click for this specific button
                toast("Button $index clicked")
            }
        }
    }
    
    // Or handle events at container level (event delegation)
    // Note: This would require manual event handling in webforJ
}
```

### Working with Event Data

```kotlin
// Mouse events with coordinates
button("Click me") {
    onClick { mouseEvent ->
        val x = mouseEvent.clientX
        val y = mouseEvent.clientY
        tooltip("Clicked at ($x, $y)") {
            showAt(x, y)
        }
    }
}

// Keyboard events with modifier keys
textField("Shortcuts") {
    onValueChange { keyEvent ->
        when {
            keyEvent.controlDown && keyEvent.key == Key.C -> {
                // Handle Ctrl+C (copy)
                copyToClipboard()
                true // Prevent default
            }
            keyEvent.controlDown && keyEvent.key == Key.V -> {
                // Handle Ctrl+V (paste)
                pasteFromClipboard()
                true // Prevent default
            }
            else -> false // Let other keys proceed normally
        }
    }
}
```


## Best Practices for Event Handling

### 1. Keep Handlers Lightweight

```kotlin
// Good: Delegate heavy work to separate functions
button("Process Data") {
    onClick {
        // Quick UI update, then delegate
        setLoading(true)
        // Use async processing to avoid blocking UI thread
        executor.submit {
            val result = processHeavyData()
            // Update UI on main thread
            uiHandler.post {
                setLoading(false)
                displayResult(result)
            }
        }
    }
}

// Avoid: Long-running operations on UI thread
button("Process Data") {
    onClick {
        // DON'T DO THIS - blocks UI thread
        val result = processHeavyData() // Could take seconds
        displayResult(result)
    }
}
```

### 2. Prevent Memory Leaks

```kotlin
class DashboardView : Composite<FlexLayout>() {
    private val self = boundComponent
    private var resizeListener: () -> Unit = { }
    
    init {
        self.build {
            // Register listener
            resizeListener = {
                // Handle resize
                updateLayout()
            }
            
            // Add listener to window or container
            // (Implementation depends on webforJ specifics)
            addResizeListener(resizeListener)
        }
    }
    
    override fun onDetach() {
        super.onDetach()
        // Always remove listeners
        removeResizeListener(resizeListener)
    }
}
```

### 3. Use Appropriate Event Types

```kotlin
// Use specific event types when available
textField("Search") {
    // Good: Specific to value changes
    onValueChange {
        // Handle text changes
    }
    
    // Avoid: Using generic handlers when specific ones exist
    // onBlur { ... } // Use onBlur if available, or understand the difference
}

// For mouse events, use the most specific handler
button("Click me") {
    // Good: Specific to clicks
    onClick {
        // Handle click
    }
    
    // Avoid: Using mouse down for clicks unless you need press behavior
    // onMouseDown { ... } // Only use if you need button-down behavior
}
```

### 4. Handle Edge Cases

```kotlin
button("Submit") {
    onClick {
        // Guard against rapid double clicks
        isEnabled = false // Disable button immediately
        
        try {
            submitForm()
        } finally {
            // Re-enable after delay or based on result
            uiHandler.postDelayed({
                isEnabled = true
            }, 1000) // Re-enable after 1 second
        }
    }
}
```

## Advanced Patterns

### Event Batching

```kotlin
// For rapid-fire events (like slider changes)
slider(0, 100) {
    private var lastUpdateTime = 0L
    private val UPDATE_DELAY = 16 // ~60fps
    
    onValueChange { value ->
        val now = System.currentTimeMillis()
        if (now - lastUpdateTime >= UPDATE_DELAY) {
            // Update UI immediately
            valueLabel.text = "Value: $value"
            lastUpdateTime = now
        } else {
            // Skip update to maintain performance
            // Could store latest value for next update
        }
    }
}
```

### Event Transformation

```kotlin
// Transform event data before processing
textField("Phone Number") {
    onValueChange { textField ->
        // Transform input as user types
        val rawValue = textField.value
        val cleaned = rawValue.replace(Regex("[^0-9]"), "") // Keep only digits
        
        // Format as phone number: (123) 456-7890
        val formatted = when (cleaned.length) {
            in 1..3 -> "($cleaned"
            in 4..6 -> "(${cleaned.substring(0, 3)}) ${cleaned.substring(3)}"
            in 7..10 -> "(${cleaned.substring(0, 3)}) ${cleaned.substring(3, 6)}-${cleaned.substring(6)}"
            else -> cleaned // Fallback
        }
        
        // Update field without triggering another event
        textField.value = formatted
    }
}
```
