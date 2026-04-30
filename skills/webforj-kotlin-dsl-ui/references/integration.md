# Integration with webforJ Features

This document covers how the Kotlin DSL integrates with other webforJ capabilities and skills.

## Integration with Forms (webforj-building-forms)

### Using BindingContext with DSL

The Kotlin DSL works seamlessly with webforJ's binding system:

```kotlin
@Route("user-form")
class UserFormView : Composite<FlexLayout>() {
    // Declare fields as properties - they can be auto-bound
    private lateinit var firstName: TextField
    private lateinit var lastName: TextField
    private lateinit var email: TextField
    private lateinit var submitButton: Button
    
    private lateinit var bindingContext: BindingContext<User>
    
    init {
        self.build {
            direction = FlexDirection.COLUMN
            spacing = "var(--dwc-space-m)"
            
            // Create form fields
            firstName = textField("First Name")
            lastName = textField("Last Name")
            email = textField("Email") {
                type = TextField.Type.EMAIL
            }
            
            // Button
            submitButton = button("Submit", ButtonTheme.PRIMARY) {
                onClick { handleSubmit() }
            }
            
            // Setup binding context
            bindingContext = BindingContext.of(this, User::class.java, true)
            
            // Load initial data
            val user = User("John", "Doe", "john@example.com")
            bindingContext.read(user)
        }
    }
    
    private fun handleSubmit() {
        val user = User()
        val result = bindingContext.write(user)
        
        if (result.isValid()) {
            Toast.show("User saved successfully!", Theme.SUCCESS)
            // Save user...
        } else {
            Toast.show("Please fix the errors", Theme.DANGER)
        }
    }
}

// Data class
data class User(
    var firstName: String = "",
    var lastName: String = "",
    var email: String = ""
)
```

### Manual Binding with DSL

```kotlin
class ManualBindView : Composite<FlexLayout>() {
    private lateinit var bindingContext: BindingContext<Person>
    
    init {
        self.build {
            // Create context manually
            bindingContext = BindingContext(Person::class.java)
            
            // Bind fields with custom configuration
            bindingContext.bind(textField("Name"), "name")
                .useValidator({ it.isNotBlank() }, "Name is required")
                .add()
            
            bindingContext.bind(textField("Age"), "age")
                .useValidator({ it.toIntOrNull() != null && it.toInt() > 0 }, "Invalid age")
                .add()
            
            bindingContext.bind(textField("Email"), "email")
                .add()
            
            button("Save") {
                onClick { save() }
            }
        }
    }
}
```

### Form Validation Feedback

```kotlin
class ValidatedFormView : Composite<FlexLayout>() {
    private lateinit var context: BindingContext<FormData>
    
    init {
        self.build {
            // Enable live validation feedback
            context = BindingContext.of(this, FormData::class.java, true)
            
            // Subscribe to validation state
            context.onValidate { event ->
                // Enable/disable submit button based on validity
                submitButton.isEnabled = event.isValid()
            }
            
            textField("Username") {
                onValueChange {
                    // Manual validation trigger
                    context.validate()
                }
            }
            
            submitButton = button("Submit") {
                isEnabled = false  // Start disabled
                onClick { handleSubmit() }
            }
        }
    }
}
```

## Integration with Components (webforj-creating-components)

### Using Custom Components with DSL

```kotlin
// Assume you have a custom component from webforj-creating-components skill
// import com.myapp.components.UserCard

class DashboardView : Composite<FlexLayout>() {
    init {
        self.build {
            flexLayout {
                direction = FlexDirection.ROW
                wrap = FlexWrap.WRAP
                spacing = "var(--dwc-space-m)"
                
                // Add custom component - still uses DSL
                userCard("John Doe", "Developer") {
                    onUserClick { userId ->
                        navigateTo("/user/$userId")
                    }
                }
                
                userCard("Jane Smith", "Designer") {
                    onUserClick { userId ->
                        navigateTo("/user/$userId")
                    }
                }
            }
        }
    }
}
```

### Creating DSL Extensions for Custom Components

```kotlin
// Extend your custom component with DSL support
fun @WebforjDsl HasComponents.userCard(
    name: String? = null,
    role: String? = null,
    block: @WebforjDsl UserCard.() -> Unit = {}
): UserCard {
    val card = UserCard()
    name?.let { card.name = it }
    role?.let { card.role = it }
    return init(card, block)
}
```

### Wrapping Java Components in DSL

```kotlin
class WrapperView : Composite<FlexLayout>() {
    // Java component without DSL support
    private val javaComponent = JavaFlexComponent()
    
    init {
        self.build {
            // Add Java component to DSL layout
            init(javaComponent) {
              // Configure Java component
              javaComponent.direction = FlexDirection.COLUMN
              javaComponent.spacing = 10.px
            }
            
            // Use DSL components alongside Java components
            button("Add to Java component") {
                onClick {
                    javaComponent.addItem("New Item")
                }
            }
        }
    }
}
```

## Routing with @Route

```kotlin
import com.webforj.router.annotation.Route
import com.webforj.router.annotation.FrameTitle

@Route("users")
@FrameTitle("User Management")
class UserListView : Composite<FlexLayout>() {
    init {
        self.build {
            direction = FlexDirection.COLUMN
            padding = "var(--dwc-space-l)"
            
            flexLayout {
                justifyContent = FlexJustifyContent.BETWEEN
                alignItems = FlexAlignment.CENTER
                
                label("Users") { styles["font-size"] = "24px" }
                
                button("Add User", ButtonTheme.PRIMARY) {
                    onClick { navigateTo("/users/new") }
                }
            }
            
            // Table of users
            table { /* ... */ }
        }
    }
}

// Navigation from DSL
button("Go") {
    onClick {
        // Navigate to route
        navigateTo("target-route")
        
        // Or use URL
        navigateTo("https://example.com/page")
    }
}
```

## Styling Integration (webforj-styling-apps)

### CSS Classes

```kotlin
button("Styled Button") {
    // Add CSS class for styling
    classNames += "my-custom-button"
    classNames += "hover-effect"
    
    // Add multiple classes at once
    classNames + "btn" + "btn-primary" + "rounded"
}
```

### Inline Styles

```kotlin
div {
    styles["background-color"] = "#f0f0f0"
    styles["padding"] = "16px"
    styles["border-radius"] = "8px"
    styles["box-shadow"] = "0 2px 4px rgba(0,0,0,0.1)"
}
```

### Theme Integration

```kotlin
// Use theme variables
div {
    styles["color"] = "var(--dwc-color-primary)"
    styles["background"] = "var(--dwc-color-surface)"
    styles["border"] = "1px solid var(--dwc-color-border)"
}

// Component themes
button("Themed", ButtonTheme.SUCCESS)
checkBox("Checked", CheckBoxTheme.SUCCESS)
```

### CSS Units Extension

The DSL provides convenient extension properties:

```kotlin
import com.webforj.kotlin.extension.px
import com.webforj.kotlin.extension.percent
import com.webforj.kotlin.extension.rem

button {
    width = 100.px      // 100px
    height = 50.percent // 50%
    fontSize = 1.5.rem  // 1.5rem
    padding = 10.px     // 10px
}
```

## State and Lifecycle Integration

### Component Lifecycle

```kotlin
class LifecycleView : Composite<FlexLayout>() {
    override fun onAttach() {
        super.onAttach()
        // View attached to DOM - initialize data
        loadData()
    }
    
    override fun onDetach() {
        super.onDetach()
        // View detached - cleanup
        cancelPendingRequests()
    }
    
    override fun onDettach() {
        super.onDettach()
        // Called when removed from DOM entirely
    }
}
```

### Persistence

```kotlin
class PersistentView : Composite<FlexLayout>() {
    init {
        self.build {
            // Load persisted state
            val savedState = Page.getCurrent().getAttribute("view-state")
            savedState?.let { restoreState(it) }
            
            // Save state on changes
            textField("Notes") {
                onValueChange {
                    saveState()
                }
            }
        }
    }
    
    private fun saveState() {
        Page.getCurrent().setAttribute("view-state", collectState())
    }
}
```

## Event System Integration

### Standard webforJ Events

```kotlin
button("Click me") {
    // These work with the DSL naturally
    onClick { /* handle */ }
    onDoubleClick { /* handle */ }
    onMouseEnter { /* handle */ }
    onMouseLeave { /* handle */ }
}

textField("Type here") {
    onValueChange { /* handle */ }
    onFocus { /* handle */ }
    onBlur { /* handle */ }
}
```

### Custom Events

```kotlin
// In a custom component
class NotificationComponent : FlexLayout() {
    fun show(message: String) {
        // Fire custom event
        fireEvent(NotificationEvent::class.java, message)
    }
}

// Using custom events in DSL
notificationComponent {
    onNotification { message ->
        Toast.show(message)
    }
}
```

## Data Loading Patterns

### Async Data Loading

```kotlin
class AsyncDataView : Composite<FlexLayout>() {
    private var loadingIndicator: Spinner? = null
    private var dataContainer: FlexLayout? = null
    
    init {
        self.build {
            direction = FlexDirection.COLUMN
            
            // Loading state
            loadingIndicator = spinner(Theme.PRIMARY)
            
            // Data container - initially hidden
            dataContainer = flexLayout {
                isVisible = false
            }
        }
    }
    
    fun loadData() {
        loadingIndicator?.isVisible = true
        dataContainer?.isVisible = false
        
        // Async load
        executor.submit {
            val data = fetchDataFromService()
            
            // Update UI on main thread
            uiHandler.post {
                renderData(data)
                loadingIndicator?.isVisible = false
                dataContainer?.isVisible = true
            }
        }
    }
}
```

### Error Handling

```kotlin
class ErrorHandlingView : Composite<FlexLayout>() {
    init {
        self.build {
            // Error display area
            flexLayout {
                id = "error-container"
                isVisible = false
                styles["color"] = "var(--dwc-color-danger)"
                
                label("Error: ") {
                    id = "error-message"
                }
                
                button("Retry") {
                    onClick { retryLoad() }
                }
            }
        }
    }
    
    private fun handleError(ex: Exception) {
        find<FlexLayout>("error-container").ifPresent {
            it.isVisible = true
        }
        find<Label>("error-message").ifPresent {
            it.text = ex.message ?: "Unknown error"
        }
    }
}
```

## Combining Multiple Skills

### Complete Example: Form with Validation, Routing, and Styling

```kotlin
@Route("register")
@FrameTitle("Register")
class RegistrationView : Composite<FlexLayout>() {
    private lateinit var bindingContext: BindingContext<RegistrationForm>
    private lateinit var submitButton: Button
    
    init {
        self.build {
            direction = FlexDirection.COLUMN
            spacing = "var(--dwc-space-m)"
            padding = "var(--dwc-space-l)"
            classNames += "registration-form"
            
            // Header
            label("Create Account") {
                styles["font-size"] = "28px"
                styles["font-weight"] = "bold"
            }
            
            // Form fields
            val firstName = textField("First Name") { isRequired = true }
            val lastName = textField("Last Name") { isRequired = true }
            val email = textField("Email") {
                type = TextField.Type.EMAIL
                isRequired = true
            }
            val password = passwordField("Password") {
                isRequired = true
            }
            
            // Terms checkbox
            val termsCheck = checkBox("I agree to the Terms and Conditions") {
                isRequired = true
            }
            
            // Submit button
            submitButton = button("Create Account", ButtonTheme.PRIMARY) {
                isEnabled = false
                onClick { handleSubmit() }
            }
            
            // Back link
            anchor("Already have an account? Login") {
                href = "/login"
            }
            
            // Binding setup
            bindingContext = BindingContext.of(this, RegistrationForm::class.java, true)
            
            // Live validation
            bindingContext.onValidate { result ->
                submitButton.isEnabled = result.isValid()
            }
        }
    }
    
    private fun handleSubmit() {
        val form = RegistrationForm()
        val result = bindingContext.write(form)
        
        if (result.isValid()) {
            navigateTo("/dashboard")
            Toast.show("Account created!", Theme.SUCCESS)
        } else {
            Toast.show("Please fix the errors", Theme.DANGER)
        }
    }
}
```

## Dependencies

When using this DSL skill with other webforJ features, ensure these dependencies are in your pom.xml:

```xml
<dependency>
    <groupId>com.webforj</groupId>
    <artifactId>webforj-kotlin</artifactId>
    <version>${project.version}</version>
</dependency>
<dependency>
    <groupId>com.webforj</groupId>
    <artifactId>webforj</artifactId>
    <version>${project.version}</version>
</dependency>
```

Import DSL functions:

```kotlin
import com.webforj.kotlin.dsl.component.button.button
import com.webforj.kotlin.dsl.component.field.textField
import com.webforj.kotlin.dsl.component.layout.flexlayout.flexLayout
import com.webforj.kotlin.extension.*
```
