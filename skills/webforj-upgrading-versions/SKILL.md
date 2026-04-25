---
name: webforj-upgrading-versions
description: "Upgrades a webforJ project to a newer major version using the OpenRewrite Maven plugin and the webforj-rewrite recipes shipped with webforJ 26+. Use when the user asks to upgrade webforJ, migrate to a new major, bump the webforJ version, run mvn rewrite:run on a webforJ project, or resolve TODO webforJ comments left by an upgrade recipe. Also covers the manual fallback for older targets that have no published recipe (for example 24 to 25)."
---

# Upgrading webforJ Versions

The official `webforj-rewrite` OpenRewrite recipes (introduced in webforJ 26) automate the bulk of an upgrade: they bump `<webforj.version>` and the Java release, rewrite renamed methods and types, and insert `TODO webforJ <major>:` comments at every removed API that needs a manual decision.

## Available recipes

Recipe names follow this pattern, one umbrella per major:

- Standard projects: `com.webforj.rewrite.v<major>.UpgradeWebforj`
- Spring Boot projects: `com.webforj.rewrite.v<major>.UpgradeWebforjSpring`

The list of published recipes is fetched live from upstream — do not hardcode a table from this skill. Run from the skill directory:

```bash
node scripts/list-recipes.mjs
```

Output is one fully-qualified recipe name per line, sorted. If the target major is not in the output, use the [manual fallback](#manual-fallback-no-recipe).

## Workflow

Copy this checklist:

```
Upgrade Progress:
- [ ] 1. Confirm source and target versions
- [ ] 2. Pick the recipe (standard vs Spring)
- [ ] 3. Add rewrite-maven-plugin to pom.xml
- [ ] 4. Dry run and review the diff
- [ ] 5. Apply the recipe
- [ ] 6. Resolve every TODO webforJ comment
- [ ] 7. Compile and run tests
- [ ] 8. Remove the plugin from pom.xml
```

### 1. Confirm versions

Call `webforj-mcp:get_versions` to list known majors. Read the source version from `<webforj.version>` in the user's `pom.xml`.

### 2. Pick the recipe

Run `node scripts/list-recipes.mjs` (see [Available recipes](#available-recipes)) and pick the umbrella for the target major:

- Project depends on `webforj-spring-boot-starter` -> the recipe ending in `UpgradeWebforjSpring`.
- Otherwise -> the recipe ending in `UpgradeWebforj`.

If no umbrella exists for the target major, jump to [Manual fallback](#manual-fallback-no-recipe).

Spring variants typically apply pom-level side effects that no TODO comment flags — removed properties, removed dependencies, upstream Spring Boot upgrades. After the dryRun in step 4, scan the pom section of the patch for these and surface them to the user before running the recipe for real.

### 3. Add the plugin

Add this block to `pom.xml` under `<build><plugins>`. Replace `TARGET_VERSION` (e.g. `26.00`) and `RECIPE_NAME` from step 2:

```xml
<plugin>
  <groupId>org.openrewrite.maven</groupId>
  <artifactId>rewrite-maven-plugin</artifactId>
  <version>6.36.0</version>
  <configuration>
    <activeRecipes>
      <recipe>RECIPE_NAME</recipe>
    </activeRecipes>
  </configuration>
  <dependencies>
    <dependency>
      <groupId>com.webforj</groupId>
      <artifactId>webforj-rewrite</artifactId>
      <version>TARGET_VERSION</version>
    </dependency>
  </dependencies>
</plugin>
```

### 4. Dry run

Run exactly:

```bash
mvn rewrite:dryRun
```

Do not add or remove flags. The diff appears at `target/rewrite/rewrite.patch`. Read it. Empty patch -> skip to step 8.

### 5. Apply

Run exactly:

```bash
mvn rewrite:run
```

Do not add or remove flags. Source files are rewritten in place. Renames, type swaps, and version bumps happen automatically; removed APIs get a comment of the form `/* TODO webforJ <major>: <reason and replacement> */`.

### 6. Resolve TODOs

```bash
grep -rn "TODO webforJ" src
```

Each TODO comment is self-describing: it names the removed API and gives the substitute. Read the comment, apply the substitution exactly as the comment writes it (do not paraphrase or refactor it into a different API shape — the text after the colon is canonical), then delete the TODO.

Two patterns to recognise:

- **"Use `<replacement>` instead"** — the comment names a direct Java substitute. Apply it.
- **"Configure elsewhere"** (e.g. *"Configure directly in the Admin Console"*) — there is no Java replacement. Do NOT delete the call. Leave the original call and its TODO comment in place, and report back to the user: list each affected call, the value it was passing, and where they need to apply the setting outside the codebase. The user decides when to delete the call.

If a TODO's substitution is unclear, or a symptom is at the pom level with no inline TODO, call `webforj-mcp:search_knowledge_base` with the original symbol and the target major, `type: "documentation"`.

### 7. Verify

```bash
mvn clean compile
mvn test
```

If compile fails on an unflagged webforJ symbol, call `webforj-mcp:search_knowledge_base` with the symbol name and target major. Apply, re-run.

### 8. Clean up

Remove the `rewrite-maven-plugin` block from `pom.xml`. The `webforj-rewrite` artifact is only needed during migration. Commit the pom change with the source rewrites.

## Manual fallback (no recipe)

For source-target pairs without a published recipe (most commonly 24 -> 25):

1. Bump `<webforj.version>` in `pom.xml` to the target.
2. Run `mvn clean compile`.
3. For each compile error, call `webforj-mcp:search_knowledge_base` with the failing symbol and the target major. Prefer `type: "documentation"` for upgrade notes; fall back to `type: "java"` for new API signatures.
4. Apply the documented migration. Repeat until the project compiles.
5. Run `mvn test`.

## Old patterns

<details>
<summary>Earlier upgrade workflows without OpenRewrite</summary>

Before webforJ 26 there was no `webforj-rewrite` artifact. Upgrades were entirely manual: bump the version, recompile, fix each compile error against the upgrade notes. The [Manual fallback](#manual-fallback-no-recipe) above documents that workflow because it is still required for source-target pairs without a recipe.

</details>
