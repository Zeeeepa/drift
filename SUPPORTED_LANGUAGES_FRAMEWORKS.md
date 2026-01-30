# Drift 0.9.39 - Supported Languages, Frameworks & ORMs

## Languages (10)

All languages use tree-sitter for AST parsing with enterprise-grade feature extraction.

| Language | Parser | Enterprise Features |
|----------|--------|---------------------|
| TypeScript | tree-sitter-typescript | Decorators, parameters, return types, JSDoc, classes, interfaces |
| JavaScript | tree-sitter-typescript | Same as TypeScript |
| Python | tree-sitter-python | Decorators, parameters, docstrings, classes |
| Java | tree-sitter-java | Annotations (@Service, @GetMapping, etc.), Javadoc, classes |
| C# | tree-sitter-c-sharp | Attributes ([ApiController], [HttpGet], etc.), XML docs, classes |
| PHP | tree-sitter-php | Attributes (#[Route], #[Controller]), PHPDoc, classes |
| Go | tree-sitter-go | Struct tags, doc comments, interfaces |
| Rust | tree-sitter-rust | Attributes (#[derive], #[route], #[serde]), doc comments |
| C | tree-sitter-c | Function signatures, includes, structs |
| C++ | tree-sitter-cpp | Classes, methods, templates, namespaces |

---

## Web Frameworks (21)

### TypeScript / JavaScript (4)

| Framework | Detection Method |
|-----------|------------------|
| Next.js | `next` in package.json |
| Express | `express` in package.json |
| Fastify | `fastify` in package.json |
| NestJS | `@nestjs/core` in package.json |

### Java (1)

| Framework | Detection Method |
|-----------|------------------|
| Spring Boot | `spring-boot` in pom.xml or build.gradle |

### C# (1)

| Framework | Detection Method |
|-----------|------------------|
| ASP.NET Core | `Microsoft.AspNetCore` in .csproj |

### PHP (1)

| Framework | Detection Method |
|-----------|------------------|
| Laravel | `laravel/framework` in composer.json |

### Python (1)

| Framework | Detection Method |
|-----------|------------------|
| FastAPI | `@app.get`, `@app.post` decorators |

### Go (5)

| Framework | Detection Method |
|-----------|------------------|
| Gin | `gin.Context`, `gin.Engine` |
| Echo | `echo.Context`, `echo.Echo` |
| Fiber | `fiber.Ctx`, `fiber.App` |
| Chi | `chi.Router`, `chi.Mux` |
| net/http | `http.HandleFunc`, `http.ListenAndServe` |

### Rust (4)

| Framework | Detection Method |
|-----------|------------------|
| Actix Web | `#[actix_web::main]`, `#[get]`, `#[post]` |
| Axum | `axum::Router`, `axum::extract` |
| Rocket | `#[rocket::main]`, `#[get]`, `#[post]` |
| Warp | `warp::Filter`, `warp::path` |

### C++ (3)

| Framework | Detection Method |
|-----------|------------------|
| Crow | `crow::SimpleApp`, `CROW_ROUTE` |
| Boost.Beast | `boost::beast::http` |
| Qt Network | `QNetworkAccessManager`, `QHttpServer` |

---

## ORMs & Data Access (16)

### TypeScript / JavaScript (8)

| ORM | Detection Method | Patterns Detected |
|-----|------------------|-------------------|
| Supabase | `@supabase/supabase-js` | `.from()`, `.select()`, `.insert()`, `.update()`, `.delete()` |
| Prisma | `@prisma/client` | `prisma.model.findMany()`, `prisma.model.create()` |
| TypeORM | `typeorm` | `@Entity`, `getRepository()`, `Repository<T>` |
| Sequelize | `sequelize` | `Model.findAll()`, `Model.findOne()`, `Model.create()` |
| Drizzle | `drizzle-orm` | `db.select()`, `db.insert()`, `db.update()` |
| Knex | `knex` | `knex('table')`, `.where()`, `.insert()` |
| Mongoose | `mongoose` | `Schema`, `Model.find()`, `Model.findOne()` |
| Raw SQL | `pg`, `mysql2`, `better-sqlite3` | Direct SQL queries |

### Python (3)

| ORM | Detection Method | Patterns Detected |
|-----|------------------|-------------------|
| Django ORM | `django` | `Model.objects.filter()`, `Model.objects.get()` |
| SQLAlchemy | `sqlalchemy` | `session.query()`, `session.add()`, `session.commit()` |
| Supabase | `supabase` | Same as TypeScript Supabase |

### C# (2)

| ORM | Detection Method | Patterns Detected |
|-----|------------------|-------------------|
| Entity Framework Core | `Microsoft.EntityFrameworkCore` | `DbContext`, `.Where()`, `.ToList()`, `.SaveChanges()` |
| Dapper | `Dapper` | `connection.Query()`, `connection.Execute()` |

### Java (2)

| ORM | Detection Method | Patterns Detected |
|-----|------------------|-------------------|
| Spring Data JPA | `spring-data-jpa` | `JpaRepository`, `@Query`, `EntityManager` |
| Hibernate | `hibernate` | `Session`, `@Entity`, `@Table` |

### PHP (2)

| ORM | Detection Method | Patterns Detected |
|-----|------------------|-------------------|
| Eloquent | `laravel/framework` | `Model::where()`, `Model::find()`, `->save()` |
| Doctrine | `doctrine/orm` | `EntityManager`, `Repository`, `@ORM\Entity` |

---

## Framework-Specific Pattern Detectors

### ASP.NET Core / C# (11 categories)

- **Auth**: `[Authorize]`, `[AllowAnonymous]`, JWT Bearer, ASP.NET Identity, Policy-based auth
- **Data Access**: EF Core patterns, Repository pattern, Unit of Work
- **Errors**: Exception handling, Result pattern, ProblemDetails
- **Logging**: ILogger patterns, structured logging
- **Security**: Input validation, `[ValidateAntiForgeryToken]`
- **Testing**: xUnit patterns, `[Fact]`, `[Theory]`
- **Config**: Options pattern, `IOptions<T>`, `appsettings.json`
- **Types**: Record patterns, nullable reference types
- **Performance**: Async/await patterns, `ValueTask`
- **Structural**: DI registration, `AddScoped`, `AddTransient`
- **Documentation**: XML documentation comments

### Laravel / PHP (13 categories)

- **Auth**: Guards, Policies, Gates, `auth()->user()`
- **Data Access**: Eloquent models, relationships, scopes
- **Transactions**: `DB::transaction()`, `DB::beginTransaction()`
- **Errors**: Exception handlers, `abort()`, custom exceptions
- **Logging**: `Log::info()`, channels, context
- **Testing**: PHPUnit, `RefreshDatabase`, factories
- **Structural**: Service providers, facades, DI
- **Security**: CSRF, validation, sanitization
- **Config**: `config()`, `.env`, `Config::get()`
- **Performance**: Caching, queues, eager loading
- **API**: Resources, API routes, rate limiting
- **Async**: Jobs, Events, Listeners, Queues
- **Validation**: Form requests, `Validator::make()`

### Spring Boot / Java (12 categories)

- **Structural**: `@Component`, `@Service`, `@Repository`, `@Controller`
- **API**: `@RestController`, `@GetMapping`, `@PostMapping`, `@RequestBody`
- **Auth**: `@PreAuthorize`, `@Secured`, Spring Security config
- **Data**: `JpaRepository`, `@Query`, `@Entity`, `@Table`
- **DI**: `@Autowired`, `@Inject`, constructor injection
- **Config**: `@Value`, `@ConfigurationProperties`, `application.yml`
- **Validation**: `@Valid`, `@NotNull`, `@Size`, `BindingResult`
- **Errors**: `@ExceptionHandler`, `@ControllerAdvice`, `ResponseEntity`
- **Logging**: SLF4J, `@Slf4j`, MDC context
- **Testing**: `@SpringBootTest`, `@MockBean`, `@DataJpaTest`
- **Transactions**: `@Transactional`, propagation, isolation
- **Async**: `@Async`, `@Scheduled`, `CompletableFuture`

---

## Universal Pattern Detectors (101 base detectors)

These work across all supported languages:

| Category | Detectors | Examples |
|----------|-----------|----------|
| API | 7 | Route structure, HTTP methods, pagination, error format |
| Auth | 6 | Middleware, tokens, RBAC, permissions, ownership |
| Security | 7 | SQL injection, XSS, CSRF, input sanitization, secrets |
| Errors | 7 | Exception hierarchy, error codes, try-catch, circuit breaker |
| Logging | 7 | Structured format, log levels, correlation IDs, PII redaction |
| Testing | 7 | File naming, structure, mocks, fixtures, setup/teardown |
| Data Access | 7 | Query patterns, repository, transactions, N+1, DTOs |
| Config | 6 | Env naming, feature flags, validation, defaults |
| Types | 7 | Naming conventions, generics, utility types, any usage |
| Structural | 8 | File naming, imports, barrel exports, circular deps |
| Components | 8 | Structure, props, state, composition, ref forwarding |
| Styling | 8 | Design tokens, spacing, colors, Tailwind, responsive |
| Accessibility | 6 | Semantic HTML, ARIA, keyboard nav, focus management |
| Documentation | 5 | JSDoc, README, TODOs, deprecation, examples |
| Performance | 6 | Code splitting, lazy loading, memoization, caching |

---

## Summary

| Category | Count |
|----------|-------|
| **Languages** | 10 |
| **Web Frameworks** | 21 |
| **ORMs / Data Access** | 16 |
| **Base Pattern Detectors** | 101 |
| **Framework-Specific Detectors** | 36+ |

---

## Call Graph Analysis

All 10 languages support:
- Function/method extraction with line numbers
- Call site extraction with receivers
- Class indexing for constructor resolution (`new MyClass()`)
- Cross-file call resolution
- Transitive caller analysis

**Performance**: ~0.5 seconds for 600+ file codebase
