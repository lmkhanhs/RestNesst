# Repository Guidelines

## Project Structure & Module Organization

- `airbnb_service/`: Java 17, Spring Boot backend. Code lives in `src/main/java/com/pbl5cnpm/airbnb_service/`, organized into `controller`, `service`, `mapper`, `repository`, `entity`, and `dto`. Resources include configuration, static files, and Thymeleaf templates; tests live in `src/test/java/`.
- `frontend/`: React 18/Vite frontend. App composition lives in `src/app`, business features in `src/features`, and reusable UI/config/assets in `src/shared`. Public assets live in `public/`. Use the `@/` alias for cross-directory imports.

## Build, Test, and Development Commands

Use Java 17 and installed Maven; the checked-in wrapper lacks `.mvn` configuration.

From `airbnb_service/`:

- `mvn spring-boot:run`: start the backend.
- `mvn test`: run backend tests.
- `mvn clean package`: test and build the executable JAR.

For frontend setup, run `npm ci` in `frontend/`. From that directory:

- `npm run dev`: start Vite.
- `npm run lint`: run ESLint with zero warnings allowed.
- `npm run build`: build production assets.
- `npm run check:imports`: validate every source import and declared dependency.
- `npm run preview`: preview the production build.

## Coding Style & Naming Conventions

Follow surrounding formatting: four spaces for Java, two for JSX. Use PascalCase for classes/components and camelCase for methods, variables, and hooks. Keep controllers thin, business logic in services, persistence in repositories, and conversions in MapStruct mappers. Follow `.eslintrc.cjs`; preserve existing API names unless deliberately migrating callers.

## Testing Guidelines

Backend tests use JUnit 5 and Spring Boot Test; name classes `*Test` or `*Tests`. Current coverage includes a context-load test; no coverage threshold is configured. Add focused regression tests for booking, payment, and authentication changes. Context tests require configured services. No frontend test script exists; run lint/build and manually verify affected guest, host, and admin flows.

## Commit & Pull Request Guidelines

History contains informal messages without a consistent convention. Use descriptive, scoped messages, such as `booking: validate checkout date`. PRs should explain behavior changes, link relevant issues, report validation, document schema/configuration changes, and include screenshots for UI changes.

## Security & Configuration

Keep credentials out of commits. Configure local MySQL/MongoDB and required integrations. Align Axios URLs, Vite proxies, WebSocket endpoints, and VNPay callbacks with the intended environment.

## MySQL dev through MCP Toolbox

- Use the project `restnesst_mysql` MCP only for Docker MySQL at `127.0.0.1:3306`, database `johunter11`, account `codex_dev`. Never substitute backend/root credentials.
- Use the predefined parameterized tools in `tools/database-toolbox/tools.yaml`. Add a separate reviewed SQL tool for each new business operation; never expose arbitrary SQL, dynamic identifiers, DDL, or bulk writes.
- Before any UPDATE or DELETE, require an explicit record ID, call `countries-get-by-id` (or the matching preview tool for that business operation), show the actual row and proposed change to the user, and wait for their confirmation. Then use the returned `row_version`. If the row changed or zero rows were affected, read and show it again before requesting fresh confirmation.
- A tool approval or a `row_version` alone does not replace showing the row to the user. Never invent IDs or preview tokens. Read the same row again after a write to verify the result.
- INSERT requires the user's instruction for that concrete record. Testing writes requires explicit consent to create, update, and delete one identified test record. Do not treat account provisioning as consent to test business data.
- Keep passwords in the ignored `tools/database-toolbox/.local/credentials.json` (mode 0600) or the process environment. Never print passwords, read the secret files into model context, commit them, or pass passwords on a command line. Do not use the local administrator setup SQL as a runtime credential source.

<!-- CODEGRAPH_START -->
## CodeGraph

When `.codegraph/` exists, use `codegraph_explore` or `codegraph explore "<symbols or question>"` before searching or reading code. Include file/symbol names to obtain current source and dependency paths. When changing Booking or User/Auth Entity/DTO structures, trace controllers, services, mappers, repositories, and native SQL. If `.codegraph/` is absent, skip CodeGraph; do not initialize it automatically.
<!-- CODEGRAPH_END -->
