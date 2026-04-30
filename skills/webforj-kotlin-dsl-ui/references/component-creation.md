# Component Creation Patterns

## Basic Components

### Buttons

```kotlin
// Simple button
button("Click me")

// Button with theme
button("Primary Action", ButtonTheme.PRIMARY)

// Button with initialization block
button("Submit") {
    onClick { /* handle click */ }
    setEnabled(true)
    theme = ButtonTheme.SUCCESS
}

// Icon-only button
iconButton(Icon("search")) {
    onClick { /* handle search */ }
}

// Toggle button
toggleButton("Enable Feature") {
    isChecked = true
    onCheckedChange { checked ->
        // Handle toggle state change
    }
}
```

### Text Fields

```kotlin
// Simple text field
textField("Label")

// Text field with initial value
textField("Name", "John Doe")

// Text field with placeholder
textField("Email", placeholder = "Enter email")

// Configured text field
textField("Password") {
    placeholder = "Enter password"
    isPassword = true
    isRequired = true
    type = TextField.Type.PASSWORD
}

// Text area (multi-line)
textArea("Bio") {
    placeholder = "Tell us about yourself..."
    rows = 5
    maxLength = 500
}
```

### Selection Controls

```kotlin
// Checkbox
checkBox("Subscribe to newsletter") {
    isChecked = true
    onCheckedChange { checked ->
        // Handle checkbox state change
    }
}

// Radio button group
radioButtonGroup("Gender") {
    radioButton("Male")
    radioButton("Female")
    radioButton("Other", enabled = false) // Disabled option
    
    // Optional: get selected value
    // val selected = selectedOption.text
}

// Combo box (dropdown)
comboBox("Select country") {
    placeholder = "Choose a country"
    items = listOf("USA", "Canada", "UK", "Germany", "France")
    onSelectionChange { index, item ->
        // Handle selection change
    }
}

// List box (multi-select capable)
listBox("Select interests") {
    items = listOf("Sports", "Music", "Reading", "Travel", "Cooking")
    isMultipleSelection = true
    onSelectionChange { indices, items ->
        // Handle multi-selection change
    }
}
```

## Display Components

### Labels and Text

```kotlin
// Simple label
label("Hello World")

// Label with styling
label("Important Notice") {
    styles["font-weight"] = "bold"
    styles["color"] = "var(--dwc-color-danger)"
}

// Paragraph
paragraph("This is a longer text that explains something in detail.") {
    styles["text-align"] = "justify"
}

// Formatted text (supports HTML-like formatting)
formattedText {
    text = """
    This is
    formmatted text
    """.trimIndent()
}
```

### Icons and Images

```kotlin
// Icon
icon("user") {
    size = 24.px
    color = "var(--dwc-color-primary)"
}

// Image (from resources)
image("images/logo.png") {
    width = 200.px
    height = 50.px
    altText = "Company Logo"
}

// Image (from URL)
img("https://example.com/photo.jpg") {
    width = 100.percent
    maxWidth = 400.px
}
```

### Badges and Status Indicators

```kotlin
// Simple badge
badge("5")

// Themed badge
badge("New", BadgeTheme.SUCCESS)

// Badge with dot indicator
badge("") {
    isDot = true
    theme = BadgeTheme.WARNING
}
```

### Progress Indicators

```kotlin
// Progress bar
progressBar(75) { // 75% progress
    theme = ProgressBarTheme.PRIMARY
    showValue = true
}

// Spinner (loading indicator)
spinner() {
    theme = SpinnerTheme.LARGE
}

// Toggle switch (alternative to checkbox)
toggleSwitch("Enable notifications") {
    isChecked = true
}
```

## Data Display Components

### Tables (Basic usage - see data binding for advanced usage)

```kotlin
// Simple table
table {
    // Headers
    columnHeader("Name")
    columnHeader("Age")
    columnHeader("Email")
    repository = loadRepository() // external repository
}
```

### Trees

```kotlin
// Simple tree
tree {
    // Root items
    treeNode("Folder 1") {
        treeNode("File 1.txt")
        treeNode("File 2.txt")
    }
    treeNode("Folder 2") {
        treeNode("Subfolder") {
            treeNode("Nested File.txt")
        }
    }
}
```

## Navigation Components

### Links and Navigation

```kotlin
// Anchor (hyperlink)
anchor("Visit webforj.com") {
    href = "https://webforj.com"
    targetAnchor = AnchorTargetAnchor.BLANK // Open in new tab
}

// Button navigation (common pattern)
button("Go to Profile") {
    onClick {
        navigator.navigateTo("profile")
    }
}

// App navigation (see AppLayout section)
appNav {
    // Navigation items would go here
}
```
