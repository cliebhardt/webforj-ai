# Spring `@Async` services

When a webforJ Spring app moves a long task to a Spring service, the service runs on a Spring-managed background thread. Every UI update from inside the service callbacks must wrap in `Environment.runLater(...)`. Direct component access from `@Async` methods always fails.

## Imports

```java
import com.webforj.Environment;
import org.springframework.context.annotation.Configuration;
import org.springframework.scheduling.annotation.Async;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.stereotype.Service;
import java.util.concurrent.CompletableFuture;
```

## Activate Spring async

Activate Spring's async infrastructure on the app class:

```java
@SpringBootApplication
@EnableAsync
@Routify(packages = { "com.example.views" })
public class Application {

  public static void main(String[] args) {
    SpringApplication.run(Application.class, args);
  }
}
```

## Async service

A service method marked `@Async` returns `CompletableFuture` and accepts a progress callback that is invoked from the background thread:

```java
@Service
public class BackgroundService {

  @Async
  public CompletableFuture<String> performLongRunningTask(Consumer<Integer> progressCallback) {
    try {
      for (int i = 0; i <= 10; i++) {
          // Report progress
          int progress = i * 10;
          if (progressCallback != null) {
              progressCallback.accept(progress);
          }

          // Simulate work
          Thread.sleep(500);
      }

      return CompletableFuture.completedFuture(
        "Task completed successfully from background service!");
    } catch (InterruptedException e) {
      Thread.currentThread().interrupt();
      return CompletableFuture.failedFuture(e);
    }
  }
}
```

## View wiring

In the view, every UI update inside callbacks (the progress callback AND `whenComplete`) wraps in `Environment.runLater(...)`:

```java
@Route("/")
public class HelloWorldView extends Composite<FlexLayout> {
  private Button asyncBtn = new Button("Start Background Task");
  private ProgressBar progressBar = new ProgressBar();
  private CompletableFuture<String> currentTask;

  public HelloWorldView(BackgroundService backgroundService) {
    // Service is injected by Spring
    asyncBtn.addClickListener(e -> {
      currentTask = backgroundService.performLongRunningTask(progress -> {
        Environment.runLater(() -> {
          progressBar.setValue(progress);
        });
      });
    });
  }
}
```

## Completion handling

The `whenComplete` callback also runs on a background thread, so the same rule applies:

```java
currentTask.whenComplete((result, error) -> {
  Environment.runLater(() -> {
    asyncBtn.setEnabled(true);
    progressBar.setVisible(false);
    if (error != null) {
      Toast.show("Task failed: " + error.getMessage(), Theme.DANGER);
    } else {
      Toast.show(result, Theme.SUCCESS);
    }
  });
});
```

Without `Environment.runLater`, webforJ throws because background threads can't access UI components.

## Cancellation on destroy

Cancel any running task when the view is destroyed. `cancel(true)` interrupts the worker thread, which causes blocking calls like `Thread.sleep` to throw `InterruptedException` so the service can exit cleanly:

```java
@Override
protected void onDestroy() {
  // Cancel the task if view is destroyed
  if (currentTask != null && !currentTask.isDone()) {
    currentTask.cancel(true);
  }
}
```
