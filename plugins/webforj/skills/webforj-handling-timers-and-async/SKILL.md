---
name: webforj-handling-timers-and-async
description: "Schedules timers, periodic intervals, debounced actions, and background async work in a webforJ app, using the framework's thread-safe primitives (`Interval`, `Debouncer`, `Environment.runLater`, `PendingResult`) instead of raw `java.util.Timer` or new threads. Use whenever the user asks for periodic tasks, polling, scheduled updates, debouncing, search-as-you-type, throttling, background jobs, async work, long-running tasks, progress bars updated from a worker thread, Spring `@Async`, or any time the user reaches for `java.util.Timer`, `javax.swing.Timer`, plain `Thread`, `ExecutorService`, or `CompletableFuture` from inside a webforJ component. Use this skill BEFORE introducing any raw timer or thread, threads created outside the webforJ `Environment` cannot touch UI components and throw `IllegalStateException` at runtime."
---

# Handling Timers and Async in webforJ

webforJ runs on a single UI thread. Anything that touches a UI component (set text, set value, open a dialog, append a child) must run on that thread. Naive Java timers (`java.util.Timer`, `javax.swing.Timer`) and threads created outside the framework do NOT inherit the webforJ `Environment` context, attempts to update the UI from them throw `IllegalStateException`. Use the four documented primitives below instead.

## Authoritative imports

```java
import com.webforj.Debouncer;
import com.webforj.Environment;
import com.webforj.Interval;
import com.webforj.PendingResult;
```

For Spring async work, also see [references/spring-async.md](references/spring-async.md).

## Banned mechanisms

These are NOT alternatives to the documented primitives, they fail at runtime in webforJ component code:

| Banned | Why |
|---|---|
| `java.util.Timer` / `TimerTask` | Runs on its own thread, no `Environment` context, calling `Environment.runLater` from inside throws `IllegalStateException` |
| `javax.swing.Timer` | Swing event dispatch thread, no `Environment` context |
| `new Thread(...)` from a static initializer or any code path that did not start inside an `Environment` thread | No context to inherit |
| External library callbacks that resume on their own thread pool (e.g. `httpClient.sendAsync(...).thenAccept(...)`) | Callback thread has no `Environment` context |

If the user's prompt or existing code uses any of the above to drive UI work, rewrite the work onto one of the four primitives in the next section. None of the banned mechanisms can update the UI safely.

## Pick your primitive

| Need | Primitive | Section |
|---|---|---|
| Repeating action at a fixed cadence (poll, refresh, rotate, inactivity check) | `Interval` | [Periodic tasks](#periodic-tasks-interval) |
| Single action after a quiet period (search-as-you-type, validation) | `Debouncer` | [Debouncing](#debouncing-debouncer) |
| Long CPU or I/O work that updates the UI as it runs | `Environment.runLater` from a managed `ExecutorService` | [Worker thread updates](#worker-thread-updates-environmentrunlater) |
| Long task hosted by a Spring `@Service` | Spring `@Async` + `Environment.runLater` in callbacks | [references/spring-async.md](references/spring-async.md) |
| Pure client-side debounce on a DOM event (no server round-trip) | `ElementEventOptions.setDebounce(ms)` | inside [Debouncing](#debouncing-debouncer) |

## Periodic tasks: `Interval`

Use for: polling, live data refresh, content rotation, inactivity dialogs. `Interval` runs on the UI thread, so listener bodies can touch components directly.

Steps:

```
- [ ] 1. Construct with the delay in seconds (float) and the elapsed listener
- [ ] 2. Call interval.start() to activate
- [ ] 3. (Optional) add more listeners or change the delay
- [ ] 4. Stop in onDestroy / onDidDestroy
```

### 1. Construct

```java
float dealy = 2f;

EventListener<Interval.ElapsedEvent> firstListener = (e -> {
// Executable code
});

Interval interval = new Interval(delay, firstListener);
```

The delay is in seconds and accepts fractional values. Very small delays produce a flood of events faster than the program can handle, keep the delay above a few hundred milliseconds unless you have a measured reason.

### 2. Start

`Interval` does NOT auto-start. Call `start()` once you are ready for it to fire:

```java
interval.start();
```

Stop with `stop()`, restart with `restart()`.

### 3. Optional: extra listeners and dynamic delay

Attach more listeners with `addElapsedListener(...)`:

```java
EventListener<Interval.ElapsedEvent> secondListener = (e -> {
// Executable code
});

interval.addElapsedListener(secondListener);
```

Change the delay with `setDelay(float)`, the new value applies after a stop or restart:

```java
//Changing the Delay
Interval.setDelay(2f);
Interval.restart();
```

### 4. Stop on destroy

Call `interval.stop()` from the view's destroy hook (`onDestroy` for routes, `onDidDestroy` for `Composite`). The same `stop()` API documented for stopping the timer at any time applies here.

`Interval` is the documented choice for recurring work in a webforJ app. A `java.util.Timer`, `javax.swing.Timer`, or a new `Thread` per user does not scale across many concurrent sessions and cannot update the UI safely.

## Debouncing: `Debouncer`

Use for: search-as-you-type, save-after-typing, validation, any action that should fire only after a burst of input settles. `Debouncer` runs on the UI thread via `Interval`, so the action body can touch components directly without `Environment.runLater(...)`.

Steps:

```
- [ ] 1. Construct with the delay in seconds (float)
- [ ] 2. Call debouncer.run(() -> action) from the event handler
- [ ] 3. (Optional) flush(), cancel(), isPending()
- [ ] 4. Cancel pending action in onDidDestroy
```

### 1. Construct

```java
Debouncer debounce = new Debouncer(0.3f);
```

The delay is in SECONDS as a float. `0.3f` for 300 ms, `1.5f` for 1.5 s. Not milliseconds, not int.

### 2. Trigger from the event handler

Each `run(...)` cancels the previous pending action and restarts the timer, so rapid input does not produce repeated work:

```java
textField.onModify(e -> {
  debounce.run(() -> search(textField.getText()));
});
```

### 3. Optional control

Force the pending action to run immediately:

```java
submitButton.onClick(e -> {
  debounce.flush();
  if (isValid()) {
    submitForm();
  }
});
```

Drop a pending action without running it:

```java
debounce.cancel();
```

Check whether an action is queued:

```java
if (debounce.isPending()) {
  statusLabel.setText("Processing...");
}
```

### 4. Cancel on destroy

```java
public class SearchPanel extends Composite<Div> {
  private final Debouncer debounce = new Debouncer(0.3f);

  @Override
  protected void onDidDestroy() {
    debounce.cancel();
  }
}
```

### Client-side alternative: `ElementEventOptions.setDebounce`

For a simple debounce on a single DOM event with no server round-trip, debounce client-side instead. The unit is milliseconds (int) and the handler is throttled in the browser:

```java
// Using ElementEventOptions for client-side debouncing
ElementEventOptions options = new ElementEventOptions();
options.setDebounce(300);

element.addEventListener("input", e -> {
  // This handler is debounced on the client
}, options);
```

Use `Debouncer` (server-side, programmatic, full control) when you need to cancel or flush from elsewhere. Use `ElementEventOptions.setDebounce` when you just want to throttle a DOM event.

## Worker thread updates: `Environment.runLater`

Use for: long CPU/IO work inside a view that needs to update the UI as it runs. `Environment.runLater(...)` is the only safe way to update the UI from a background thread.

Two overloads:

```java
// Schedule a task with no return value
public static PendingResult<Void> runLater(Runnable task)

// Schedule a task that returns a value
public static <T> PendingResult<T> runLater(Supplier<T> supplier)
```

Both return a `PendingResult` for tracking and cancellation.

Steps:

```
- [ ] 1. Declare a per-view single-thread daemon ExecutorService
- [ ] 2. Track pending UI updates and a volatile cancellation flag
- [ ] 3. Submit work that inherits Environment context
- [ ] 4. Wrap every UI mutation inside the worker in Environment.runLater(...)
- [ ] 5. Cooperatively check the cancellation flag and handle InterruptedException
- [ ] 6. Cancel and shut down on view destroy
- [ ] 7. Guard component access on the cancellation path with isDestroyed()
```

### 1. Per-view executor

Use a single-thread daemon executor. Daemon threads do not prevent JVM shutdown. A single-thread executor avoids resource exhaustion when many sessions run the same view.

```java
private final ExecutorService executor = Executors.newSingleThreadExecutor(r -> {
  Thread t = new Thread(r, "LongTaskView-Worker");
  t.setDaemon(true);
  return t;
});
```

### 2. Track pending state

```java
private CompletableFuture<Void> currentTask = null;
private final List<PendingResult<?>> pendingUIUpdates = new ArrayList<>();
private volatile boolean isCancelled = false;
```

### 3. Submit work

Submit from inside the view, this is what gives the worker thread an inherited `Environment` context. The runAsync wrapper from the documented case study (and the matching sample):

```java
currentTask = CompletableFuture.runAsync(() -> {
  // ... cancellation check, blocking call with InterruptedException, runLater UI updates ...
}, executor);
```

The body is shown verbatim in steps 4 and 5.

Threads with no inherited `Environment` context cannot use `runLater(...)`, all of these throw `IllegalStateException`:

```java
// Static initializer - no Environment context
static {
  new Thread(() -> {
    Environment.runLater(() -> {});  // Throws IllegalStateException
  }).start();
}

// System timer threads - no Environment context  
Timer timer = new Timer();
timer.schedule(new TimerTask() {
  public void run() {
    Environment.runLater(() -> {});  // Throws IllegalStateException
  }
}, 1000);

// External library threads - no Environment context
httpClient.sendAsync(request, responseHandler)
  .thenAccept(response -> {
    Environment.runLater(() -> {});  // Throws IllegalStateException
  });
```

### 4. Wrap every UI mutation

Inside the worker, never touch components directly. Every UI op goes through `Environment.runLater(...)`. Capture the returned `PendingResult` and append to `pendingUIUpdates`:

```java
final int progress = i;
PendingResult<Void> updateResult = Environment.runLater(() -> {
  progressBar.setValue(progress);
  statusField.setValue("Processing... " + progress + "%");
});
pendingUIUpdates.add(updateResult);
```

When `runLater(...)` is called from the UI thread (an event handler), it executes synchronously and immediately. When called from a background thread, it queues for asynchronous execution. Multiple background submissions execute in strict FIFO order.

### 5. Cooperative cancellation

Each iteration checks the flag and emits a final UI update that flips the buttons back, then returns:

```java
if (isCancelled) {
  PendingResult<Void> cancelUpdate = Environment.runLater(() -> {
    statusField.setValue("Task cancelled!");
    progressBar.setValue(0);
    resultField.setValue("");
    startButton.setEnabled(true);
    cancelButton.setEnabled(false);
    showToast("Task was cancelled", Theme.GRAY);
  });
  pendingUIUpdates.add(cancelUpdate);
  return;
}
```

Any blocking call handles `InterruptedException` by restoring the interrupt flag and returning:

```java
try {
  Thread.sleep(100); // 10 seconds total
} catch (InterruptedException e) {
  // Thread was interrupted - exit immediately
  Thread.currentThread().interrupt(); // Restore interrupted status
  return;
}
```

### 6. Cancel and shut down on destroy

`onDestroy` cancels the task, the queued UI updates, and the executor:

```java
@Override
protected void onDestroy() {
  super.onDestroy();

  // Cancel any running task and pending UI updates
  cancelTask();

  // Clear task reference
  currentTask = null;

  // Shutdown the instance executor gracefully
  executor.shutdown();
}
```

The cancel helper:

```java
private void cancelTask() {
  if (currentTask != null && !currentTask.isDone()) {
    // Set the cancelled flag
    isCancelled = true;

    // Cancel the main task (interrupts the thread)
    currentTask.cancel(true);

    // Cancel all pending UI updates
    for (PendingResult<?> pending : pendingUIUpdates) {
      if (!pending.isDone()) {
        pending.cancel();
      }
    }

    if (!statusField.isDestroyed() && !cancelButton.isDestroyed()) {
      statusField.setValue("Cancelling task...");
      cancelButton.setEnabled(false);

      showToast("Cancellation requested", Theme.GRAY);
    }
  }
}
```

### 7. Guard component access on the cancellation path

A late-firing cancel handler can still try to write to components after the view tears down. Guard the access with `isDestroyed()`:

```java
private void showToast(String message, Theme theme) {
  if (!globalToast.isDestroyed()) {
    globalToast.setText(message);
    globalToast.setTheme(theme);
    globalToast.open();
  }
}
```

Same rule for any helper that can be reached from a teardown path: `if (!component.isDestroyed()) { ... }` around the body.

## Spring `@Async` services

Spring Boot apps often move long work into a `@Service` annotated `@Async`. The service runs on a Spring-managed background thread, every UI update inside its callbacks must wrap in `Environment.runLater(...)`.

See [references/spring-async.md](references/spring-async.md) for the full pattern: `@EnableAsync` activation, `@Async` service signature returning `CompletableFuture<T>`, view constructor injection, completion handling via `whenComplete`, and lifecycle cancellation with `cancel(true)`.

## Verify

### Agent checks

Run these. They catch the regressions this skill exists to prevent:

```bash
mvn clean compile
```

Then grep the modified files for banned mechanisms. Any match is broken and must be rewritten onto the documented primitives:

```bash
grep -nE "java\.util\.Timer|javax\.swing\.Timer|new Thread\(|new TimerTask\(" src
```

```bash
grep -nE "thenAccept|thenApply|thenRun" src
```

For every `thenAccept` / `thenApply` / `thenRun` hit, read the body. If it touches UI components without wrapping the access in `Environment.runLater(...)`, it is broken.

For every `Interval`, `Debouncer`, `PendingResult`, `CompletableFuture`, and per-view `ExecutorService` declared on a view, confirm by reading the source that `onDestroy` (or `onDidDestroy` for `Composite`) calls the matching teardown (`stop()`, `cancel()`, `pendingResult.cancel()`, `cancel(true)`, `executor.shutdown()`).

### Manual checks (ask the user to run these, do NOT claim them)

- Run the app, exercise the feature, confirm the UI updates without freezing and no `IllegalStateException` appears in the console.
- Trigger the cancellation path (navigate away mid-task, press cancel). Confirm no exceptions fire after the view is gone.
- Confirm the worker thread (if any) exits when the task completes or is cancelled.

## Quick reference

| Need | API |
|---|---|
| Periodic events at a fixed delay | `new Interval(seconds, listener)`, then `interval.start()` |
| Stop / restart / change delay | `interval.stop()`, `interval.restart()`, `interval.setDelay(s)` then `restart()` |
| Add another listener | `interval.addElapsedListener(listener)` |
| Debounce a server-side action | `new Debouncer(seconds)`, then `debouncer.run(action)` |
| Cancel / force / inspect a debounce | `debouncer.cancel()`, `debouncer.flush()`, `debouncer.isPending()` |
| Client-side debounce on a DOM event | `ElementEventOptions.setDebounce(ms)` |
| Update UI from a worker thread | `Environment.runLater(() -> { /* UI work */ })` |
| Get a value back from a UI-thread task | `Environment.runLater(supplier)` -> `PendingResult<T>` |
| Cancel a queued UI update | `pendingResult.cancel()` |
| Spring async setup | see [references/spring-async.md](references/spring-async.md) |
| Cancel a Spring async task | `currentTask.cancel(true)` from `onDestroy` |
| Guard a component access on a teardown path | wrap the call in `if (!component.isDestroyed()) { ... }` |
| Shut down a per-view executor | `executor.shutdown()` inside `onDestroy` after cancelling the task |
| Banned: do not use any of these from a webforJ component | `java.util.Timer`, `javax.swing.Timer`, `new Thread(...)` outside an Environment thread, third-party async callbacks that resume on their own thread |
