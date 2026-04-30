# Kotlin DSL Fundamentals

## Marker Annotation (@WebforjDsl)

The `@WebforjDsl` annotation is a compile-time marker that ensures DSL functions are only called in appropriate scopes. It prevents incorrect nesting by limiting the implicit receiver scope.

```kotlin
@Target(AnnotationTarget.TYPE, AnnotationTarget.CLASS, AnnotationTarget.TYPE_PARAMETER, AnnotationTarget.TYPEALIAS)
@Retention(AnnotationRetention.BINARY)
@DslMarker
annotation class WebforjDsl
```

## The `init` Function

The core function that handles component creation and initialization:

```kotlin
fun <T: Component> (@WebforjDsl HasComponents).init(component: T, block: (@WebforjDsl T).() -> Unit): T {
    add(component)        // Add component to parent
    component.block()     // Execute initialization block
    return component      // Return the configured component
}
```

## The `build` Function

Provides a way to configure a component within its own scope:

```kotlin
fun <T: Component> @WebforjDsl T.build(block: @WebforjDsl T.() -> Unit) {
    block()               // Execute initialization block on the component
}
```

## Component Creation Pattern

All component creators follow this pattern:

```kotlin
fun @WebforjDsl HasComponents.componentName(
    // Parameters for initial configuration
    block: @WebforjDsl ComponentType.() -> Unit = {} // Optional initialization block
): ComponentType {
    // Create component instance
    val component = ComponentType(/* parameters */)
    
    // Initialize and return
    return init(component, block)
}
```

## Extension Functions

DSL functions are extension functions on `HasComponents`, which is implemented by layout components and composite views.

This allows chaining:
```kotlin
flexLayout {
    button("Button 1") {
        // Button configuration
    }
    textField("Field 1") {
        // TextField configuration
    }
}
```
