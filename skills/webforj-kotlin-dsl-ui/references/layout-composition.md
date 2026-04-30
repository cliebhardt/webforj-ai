# Layout Composition Patterns

## FlexLayout

FlexLayout provides a powerful CSS Flexbox-based layout system. It's the most commonly used layout component in webforJ applications.

### Basic Configuration

```kotlin
flexLayout {
    // Default is ROW direction
    button("Left")
    button("Center")
    button("Right")
}

// Explicit column layout
flexLayout {
    direction = FlexDirection.COLUMN
    button("Top")
    button("Middle")
    button("Bottom")
}
```

### Direction Shortcuts

The DSL provides convenient shortcut functions:

```kotlin
flexLayout {
    // Horizontal (ROW) layout
    horizontal()
    button("Item 1")
    button("Item 2")
    
    // Vertical (COLUMN) layout
    vertical()
    button("Item 1")
    button("Item 2")
    
    // Reverse directions
    horizontalReverse()
    verticalReverse()
}
```

### Wrapping

```kotlin
flexLayout {
    // Enable wrapping
    wrap = FlexWrap.WRAP
    
    // Prevent wrapping (default)
    wrap = FlexWrap.NOWRAP
    
    // Wrap in reverse
    wrap = FlexWrap.WRAP_REVERSE
}
```

### Alignment and Justification

```kotlin
flexLayout {
    // Main axis justification
    justifyContent = FlexJustifyContent.START      // Left (row) or top (column)
    justifyContent = FlexJustifyContent.END         // Right (row) or bottom (column)
    justifyContent = FlexJustifyContent.CENTER     // Center
    justifyContent = FlexJustifyContent.BETWEEN     // Space between
    justifyContent = FlexJustifyContent.AROUND      // Space around
    justifyContent = FlexJustifyContent.EVENLY     // Evenly distributed
    
    // Cross axis alignment (for all items)
    alignment = FlexAlignment.START
    alignment = FlexAlignment.END
    alignment = FlexAlignment.CENTER
    alignment = FlexAlignment.BASELINE
    alignment = FlexAlignment.STRETCH  // Default - fill container
}
```

### Per-Item Alignment

```kotlin
flexLayout {
    justifyContent = FlexJustifyContent.BETWEEN
    
    // Different alignment per item
    button("Start") { alignSelf = FlexAlignment.START }
    button("Center") { alignSelf = FlexAlignment.CENTER }
    button("End") { alignSelf = FlexAlignment.END }
    button("Stretch") { alignSelf = FlexAlignment.STRETCH }
}
```

### Spacing

```kotlin
flexLayout {
    // Set spacing between items (CSS gap)
    spacing = 10.px
    spacing = "var(--dwc-space-m)"
    spacing = 1.rem
    
    // Margin on individual items
    button("Item 1") {
        margin = 5.px
    }
}
```

### Sizing

```kotlin
flexLayout {
    // Flex grow and shrink
    setFlexGrow(button("Grow"), 1)
    setFlexGrow(button("No grow"), 0)
    
    // Flex basis (initial size)
    setFlexBasis(button("Fixed basis"), 200.px)
}
```

### Responsive Patterns

```kotlin
// Responsive layout that switches from column to row
flexLayout {
    // Use media queries via CSS or component visibility
    // This is typically handled via CSS classes or breakpoints
    
    // Stack on mobile, row on desktop
    classNames += "responsive-layout"
}
```

## AppLayout

AppLayout provides a complete application shell with header, drawer, content, and footer areas.

### Basic Structure

```kotlin
appLayout {
    // Top app bar
    headerSlot {
        label("Application Title")
        button("Menu") {
            onClick { toggleDrawer() }
        }
    }
    
    // Side drawer (collapsible)
    drawerSlot {
        button("Dashboard")
        button("Settings")
        button("Profile")
    }
    
    // Main content area
    // Your main UI content here
    label("Welcome to the app!")
    
    // Optional footer
    footerSlot {
        label("© 2024 Company Name")
    }
}
```

### AppBar Configuration

```kotlin
appLayout {
    headerSlot {
        // Branding/title area
        label("My App") {
            styles["font-size"] = "20px"
            styles["font-weight"] = "bold"
        }
        
        // Action buttons in app bar
        button("Search") {
            iconSlot { icon("search") }
            onClick { /* Open search */ }
        }
        
        button("Settings") {
            iconSlot { icon("settings") }
            onClick { /* Open settings */ }
        }
        
        // User avatar/menu
        avatar("JD") {
            onClick { /* Open user menu */ }
        }
        
        // Fix to top
        fixed = true
    }
}
```

### Drawer Configuration

```kotlin
appLayout {
    drawerSlot {
        // Navigation items
        button("Dashboard") {
            iconSlot { icon("home") }
            onClick { navigateTo("dashboard") }
        }
        
        button("Projects") {
            iconSlot { icon("folder") }
            onClick { navigateTo("projects") }
        }
        
        button("Reports") {
            iconSlot { icon("chart") }
            onClick { navigateTo("reports") }
        }
        
        // Separator
        divider()
        
        button("Settings") {
            iconSlot { icon("settings") }
            onClick { navigateTo("settings") }
        }
        
        // Drawer footer
        flexLayout {
            alignSelf = FlexAlignment.END
            button("Logout") {
                iconSlot { icon("log-out") }
            }
        }
    }
}
```

### Content Area

```kotlin
appLayout {
   // Scrollable by default
   padding = 20.px
   
   // Main application content
   flexLayout(FlexDirection.COLUMN) {
       spacing = 20.px
       
       // Page header
       flexLayout {
           justifyContent = FlexJustifyContent.BETWEEN
           alignItems = FlexAlignment.CENTER
           
           label("Dashboard") {
               styles["font-size"] = 24.px
           }
           
           button("New Item", ButtonTheme.PRIMARY)
       }
       
       // Content cards or sections
       div {
           classNames += "card"
           // Card content
       }
   }
}
```

### Footer

```kotlin
appLayout {
    footerSlot {
        padding = "10px 20px"
        
        flexLayout {
            justifyContent = FlexJustifyContent.BETWEEN
            alignItems = FlexAlignment.CENTER
            
            label("© 2024 My Company")
            
            flexLayout {
                button("Privacy")
                button("Terms")
                button("Contact")
            }
        }
    }
}
```

### Drawer Toggle

```kotlin
appLayout {
    headerSlot {
        appDrawerToggle()
    }
}
```

## ColumnsLayout

ColumnsLayout provides a responsive grid system that adjusts columns based on breakpoints.

### Basic Usage

```kotlin
columnsLayout {
    // Default creates a responsive grid
    
    // Add columns
    column {
        textField("First Name")
    }
    column {
        textField("Last Name")
    }
    column {
        textField("Email")
    }
    column {
        textField("Phone")
    }
}
```

### Breakpoints

```kotlin
columnsLayout {
    // Define breakpoints for responsive behavior
    setBreakpoints(listOf(
        ColumnsLayout.Breakpoint("default", "0", 1),     // 1 column on mobile
        ColumnsLayout.Breakpoint("medium", "40em", 2),  // 2 columns on tablets
        ColumnsLayout.Breakpoint("large", "60em", 3),    // 3 columns on small desktops
        ColumnsLayout.Breakpoint("xlarge", "80em", 4)   // 4 columns on large screens
    ))
}
```

### Column Spanning

```kotlin
columnsLayout {
    // Default columns
    column { textField("Field 1") }
    column { textField("Field 2") }
    column { textField("Field 3") }
    column { textField("Field 4") }
    
    // Span columns (make a field wider)
    column {
        textArea("Description")
        setSpan(2)  // Span 2 columns
    }
    
    // Span at specific breakpoints
    // setSpan(field, columns, "medium") - breakpoint-specific
}
```

### Alignment

```kotlin
columnsLayout {
    // Horizontal alignment of all columns
    setAlignment(ColumnsLayout.Alignment.CENTER)
    // Options: START, CENTER, END, STRETCH
    
    // Vertical alignment
    // setVerticalAlignment(ColumnsLayout.VerticalAlignment.CENTER)
}
```

### Spacing

```kotlin
columnsLayout {
    // Gap between columns
    setSpacing("20px")
    setSpacing("var(--dwc-space-l)")
    
    // Gap between rows
    setRowGap("10px")
}
```

### Complex Form Layout

```kotlin
columnsLayout {
    setBreakpoints(listOf(
        ColumnsLayout.Breakpoint("default", "0", 1),
        ColumnsLayout.Breakpoint("medium", "40em", 2),
        ColumnsLayout.Breakpoint("large", "60em", 3)
    ))
    
    // Full width fields
    column {
        textField("Name")
        setSpan(3)  // Span all columns on large screens
    }
    
    // Two column fields
    column { textField("Email") }
    column { textField("Phone") }
    
    // Three column fields
    column { textField("City") }
    column { textField("State") }
    column { textField("Zip") }
    
    // Full width textarea
    column {
        textArea("Comments")
        setSpan(3)
    }
    
    // Buttons
    column {
        button("Cancel")
        setSpan(1)
    }
    column {
        button("Submit", ButtonTheme.PRIMARY)
        setSpan(2)
    }
}
```

## Splitter

Splitter allows creating resizable panels.

### Basic Usage

```kotlin
splitter {
    // First panel
    firstPanel {
        flexLayout(FlexDirection.COLUMN) {
            label("Left Panel")
            button("Option 1")
            button("Option 2")
        }
    }
    
    // Second panel
    secondPanel {
        flexLayout(FlexDirection.COLUMN) {
            label("Right Panel")
            // Main content
        }
    }
}
```

### Orientation

```kotlin
// Horizontal splitter (default - panels side by side)
splitter {
    orientation = SplitterOrientation.HORIZONTAL
    firstPanel { /* left panel */ }
    secondPanel { /* right panel */ }
}

// Vertical splitter (panels stacked)
splitter {
    orientation = SplitterOrientation.VERTICAL
    firstPanel { /* top panel */ }
    secondPanel { /* bottom panel */ }
}
```

### Constraints

```kotlin
splitter {
    // Set minimum sizes
    setMinSize(firstPanel, "200px")
    setMinSize(secondPanel, "300px")
    
    // Set maximum sizes
    setMaxSize(firstPanel, "50%")
    setMaxSize(secondPanel, "80%")
    
    // Initial position (percentage)
    setInitialPosition(30)  // 30% for first panel
}
```

### Nested Splitters

```kotlin
splitter {
    orientation = SplitterOrientation.HORIZONTAL
    
    firstPanel {
        // Left: Navigation panel
        flexLayout(FlexDirection.COLUMN) {
            button("Item 1")
            button("Item 2")
            button("Item 3")
        }
    }
    
    secondPanel {
        // Right: Vertical splitter for content and footer
        splitter {
            orientation = SplitterOrientation.VERTICAL
            
            firstPanel {
                // Main content area
                label("Main Content")
            }
            
            secondPanel {
                // Footer
                label("Footer Info")
            }
        }
    }
}
```

## Nested Layouts Best Practices

### When to Nest

```kotlin
// Good: Logical grouping
flexLayout(FlexDirection.COLUMN) {
    // Header section
    flexLayout {
        justifyContent = FlexJustifyContent.BETWEEN
        label("Page Title")
        button("Action")
    }
    
    // Content section
    flexLayout(FlexDirection.ROW) {
        // Sidebar
        flexLayout(FlexDirection.COLUMN) {
            button("Option 1")
            button("Option 2")
        }
        
        // Main content
        flexLayout(FlexDirection.COLUMN) {
            // Content items
        }
    }
    
    // Footer section
    flexLayout {
        justifyContent = FlexJustifyContent.CENTER
        label("Footer")
    }
}
```

### When to Flatten

```kotlin
// Avoid: Unnecessary nesting
flexLayout {
    flexLayout {
        flexLayout {
            button("Deeply nested")
        }
    }
}

// Better: Flatten the structure
flexLayout {
    button("Not nested")
    spacing = "10px"
}
```

### Layout Performance Tips

1. **Prefer fewer containers**: Each layout component adds overhead
2. **Use spacing instead of nested spacers**: `spacing = "10px"` is better than adding spacer divs
3. **Avoid layout thrashing**: Don't repeatedly read and write layout properties
4. **Use CSS classes for common patterns**: Define frequently used layouts in CSS
5. **Consider visibility toggling**: Show/hide instead of add/remove for frequently used panels
