# Testing Patterns

## Test Class Structure

Use `@Nested` inner classes with `@DisplayName`:

```java
class MyButtonTest {
  MyButton component;

  @BeforeEach
  void setUp() { component = new MyButton(); }

  @Nested @DisplayName("Properties API")
  class PropertiesApi { ... }

  @Nested @DisplayName("Slots API")
  class SlotsApi { ... }

  @Nested @DisplayName("Events API")
  class EventsApi { ... }
}
```

## PropertyDescriptorTester

Automatically validates all PropertyDescriptor fields — scans for `is`/`get`
getters and `set` setters, verifies round-trip consistency:

```java
@Test
void shouldSetGetProperties() {
  PropertyDescriptorTester.run(MyButton.class, component);
}
```

### Filter Callback

Skip descriptors that need special handling:

```java
@Test
void shouldSetGetProperties() {
  PropertyDescriptorTester.run(MyButton.class, component,
      descriptor -> !Arrays.asList("opened", "value")
          .contains(descriptor.getName()));
}
```

### Annotations

- `@PropertyExclude` on a descriptor field — PropertyDescriptorTester skips it
- `@PropertyMethods(getter = "isOpen", setter = "setOpen")` — custom names
- `@PropertyMethods(targetClass = MyComp.class)` — when getter/setter is inherited

## getOriginalElement()

Package-private method on the component for test access to the underlying Element:

```java
// In the component class
Element getOriginalElement() {
  return getElement();
}
```

Used in tests to verify slot operations and element state:

```java
component.addToHeader(mockComp);
assertEquals(mockComp,
    component.getOriginalElement().getFirstComponentInSlot("header"));
```

## Slot Tests

```java
@Nested @DisplayName("Slots API")
class SlotsApi {
  @Test
  void shouldAddToHeader() {
    Component mock = mock(Component.class);
    component.addToHeader(mock);
    assertEquals(mock,
        component.getOriginalElement().getFirstComponentInSlot("header"));
  }

  @Test
  void shouldAddToDefaultSlot() {
    Component mock = mock(Component.class);
    component.add(mock);
    assertTrue(
        component.getOriginalElement().getComponentsInSlot("").contains(mock));
  }
}
```

## Event Tests

Verify both listener registration methods:

```java
@Nested @DisplayName("Events API")
class EventsApi {
  @Test
  void shouldAddShowListener() {
    component.onShow(event -> {});
    assertEquals(1,
        component.getEventListeners(ShowEvent.class).size());
  }

  @Test
  void shouldAddShowListenerViaAdd() {
    component.addShowListener(event -> {});
    assertEquals(1,
        component.getEventListeners(ShowEvent.class).size());
  }
}
```
