# Repository Guidelines

## Project Structure & Module Organization

- `airbnb_service/`: Java 17, Spring Boot backend. Code lives in `src/main/java/com/pbl5cnpm/airbnb_service/`, organized into `controller`, `service`, `mapper`, `repository`, `entity`, and `dto`. Resources include configuration, static files, and Thymeleaf templates; tests live in `src/test/java/`.
- `web-ReactJs/tour-app-starter-main/`: React 18/Vite frontend. Use `src/pages`, `components`, `routes`, `api`, and `redux`. Assets live in `src/assets/` and `public/`.

## Build, Test, and Development Commands

Use Java 17 and installed Maven; the checked-in wrapper lacks `.mvn` configuration.

From `airbnb_service/`:

- `mvn spring-boot:run`: start the backend.
- `mvn test`: run backend tests.
- `mvn clean package`: test and build the executable JAR.

For frontend setup, run `npm install` in `web-ReactJs/`, then `npm ci` in `web-ReactJs/tour-app-starter-main/`. From that directory:

- `npm run dev`: start Vite.
- `npm run lint`: run ESLint with zero warnings allowed.
- `npm run build`: build production assets.
- `npm run preview`: preview the production build.

## Coding Style & Naming Conventions

Follow surrounding formatting: four spaces for Java, two for JSX. Use PascalCase for classes/components and camelCase for methods, variables, and hooks. Keep controllers thin, business logic in services, persistence in repositories, and conversions in MapStruct mappers. Follow `.eslintrc.cjs`; preserve existing API names unless deliberately migrating callers.

## Testing Guidelines

Backend tests use JUnit 5 and Spring Boot Test; name classes `*Test` or `*Tests`. Current coverage includes a context-load test; no coverage threshold is configured. Add focused regression tests for booking, payment, and authentication changes. Context tests require configured services. No frontend test script exists; run lint/build and manually verify affected guest, host, and admin flows.

## Commit & Pull Request Guidelines

History contains informal messages without a consistent convention. Use descriptive, scoped messages, such as `booking: validate checkout date`. PRs should explain behavior changes, link relevant issues, report validation, document schema/configuration changes, and include screenshots for UI changes.

## Security & Configuration

Keep credentials out of commits. Configure local MySQL/MongoDB and required integrations. Align Axios URLs, Vite proxies, WebSocket endpoints, and VNPay callbacks with the intended environment.

<!-- CODEGRAPH_START -->
## CodeGraph

When `.codegraph/` exists, use `codegraph_explore` or `codegraph explore "<symbols or question>"` before searching or reading code. Include file/symbol names to obtain current source and dependency paths. When changing Booking or User/Auth Entity/DTO structures, trace controllers, services, mappers, repositories, and native SQL. If `.codegraph/` is absent, skip CodeGraph; do not initialize it automatically.
<!-- CODEGRAPH_END -->
