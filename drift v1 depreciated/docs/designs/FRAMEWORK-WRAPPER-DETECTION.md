# Framework Wrapper Detection

## Executive Summary

Automatically detect custom abstractions built on top of framework primitives across all supported languages. This enables Drift to surface patterns like "custom React hooks", "FastAPI dependency wrappers", "Spring bean factories", "Laravel service providers", etc. without requiring manual configuration.

**Key Insight:** Every framework has ~20-50 "primitives" that developers wrap to create project-specific abstractions. By detecting these wrapper relationships semantically via the call graph, we can identify and cluster custom patterns automatically.

**Novel Contribution:** No existing static analysis tool does this. ESLint/SonarQube check for rule violations. Dependency analyzers track imports. But nobody automatically discovers the abstraction layers teams build on top of frameworks and clusters them into learnable patterns.

---

## Problem Statement

A Reddit user asked: "Are you planning to add support for detecting custom hook patterns? Most of my React stuff has some weird internal patterns that would be sick to auto-detect."

This is a universal problem across all frameworks and languages:
- **React/TypeScript**: Custom hooks wrapping `useState`, `useEffect`, `useQuery`
- **FastAPI/Python**: Custom dependencies wrapping `Depends()`, `Security()`
- **Django/Python**: Custom decorators wrapping `login_required`, `permission_required`
- **Spring/Java**: Custom beans wrapping `@Autowired`, repository patterns
- **ASP.NET/C#**: Custom middleware wrapping `IMiddleware`, service extensions
- **Laravel/PHP**: Custom service providers wrapping facades, repository patterns

Currently, Drift detects framework usage but not the **abstraction layers** teams build on top.

---

## Solution: Semantic Wrapper Detection

### Core Concepts

| Term | Definition |
|------|------------|
| **Primitive** | A framework-provided function/class that is commonly wrapped (e.g., `useState`, `Depends`, `@Autowired`) |
| **Direct Wrapper** | A function that directly calls one or more primitives |
| **Transitive Wrapper** | A function that calls other wrappers (wrapper of wrapper) |
| **Wrapper Depth** | How many layers removed from primitives (1 = direct, 2+ = transitive) |
| **Primitive Signature** | The set of primitives a wrapper ultimately depends on |
| **Wrapper Cluster** | A group of wrappers with the same primitive signature |

### Core Algorithm

```
1. Identify framework primitives (bootstrap + dynamic discovery)
2. Build transitive call graph from all functions
3. Find functions that call primitives (direct wrappers, depth=1)
4. Find functions that call wrappers (transitive wrappers, depth=2+)
5. Compute primitive signature for each wrapper (transitive closure)
6. Cluster wrappers by primitive signature
7. Score confidence and surface as discoverable patterns
```


### Architecture

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                       Wrapper Detection Engine                               │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌──────────────────────┐    ┌──────────────────────┐                      │
│  │   Primitive          │    │   Call Graph         │                      │
│  │   Identifier         │───▶│   Analyzer           │                      │
│  │                      │    │                      │                      │
│  │ - Bootstrap registry │    │ - Transitive closure │                      │
│  │ - Import discovery   │    │ - Depth calculation  │                      │
│  │ - Frequency inference│    │ - Reverse edges      │                      │
│  │ - Decorator detection│    │ - Cross-file linking │                      │
│  └──────────────────────┘    └──────────┬───────────┘                      │
│                                         │                                   │
│                                         ▼                                   │
│                    ┌─────────────────────────────────┐                     │
│                    │   Wrapper Classifier            │                     │
│                    │                                 │                     │
│                    │ - Direct vs transitive          │                     │
│                    │ - Primitive signature compute   │                     │
│                    │ - Return shape analysis         │                     │
│                    │ - Parameter pattern analysis    │                     │
│                    │ - Factory function detection    │                     │
│                    └────────────┬────────────────────┘                     │
│                                 │                                          │
│                                 ▼                                          │
│                    ┌─────────────────────────────────┐                     │
│                    │   Pattern Clusterer             │                     │
│                    │                                 │                     │
│                    │ - Group by primitive signature  │                     │
│                    │ - Group by return shape         │                     │
│                    │ - Confidence scoring            │                     │
│                    │ - Naming inference              │                     │
│                    └─────────────────────────────────┘                     │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Framework Primitive Registry

### TypeScript/JavaScript

#### React Core
```typescript
const REACT_PRIMITIVES = {
  // State management
  state: ['useState', 'useReducer'],
  
  // Side effects
  effect: ['useEffect', 'useLayoutEffect', 'useInsertionEffect'],
  
  // Context
  context: ['useContext', 'createContext'],
  
  // Refs
  ref: ['useRef', 'useImperativeHandle', 'forwardRef'],
  
  // Memoization
  memo: ['useMemo', 'useCallback', 'memo'],
  
  // React 18+ Concurrent
  concurrent: ['useTransition', 'useDeferredValue', 'useId'],
  external: ['useSyncExternalStore'],
  
  // React 19+ Actions
  actions: ['useActionState', 'useFormStatus', 'useOptimistic', 'use'],
};
```

#### React Ecosystem Libraries
```typescript
const REACT_ECOSYSTEM = {
  // Data fetching
  'tanstack-query': ['useQuery', 'useMutation', 'useInfiniteQuery', 'useQueryClient', 'useSuspenseQuery'],
  'swr': ['useSWR', 'useSWRMutation', 'useSWRInfinite', 'useSWRConfig'],
  'apollo': ['useQuery', 'useMutation', 'useLazyQuery', 'useSubscription', 'useApolloClient'],
  'urql': ['useQuery', 'useMutation', 'useSubscription', 'useClient'],
  'rtk-query': ['useGetQuery', 'useLazyGetQuery', 'useMutation'],
  
  // State management
  'redux': ['useSelector', 'useDispatch', 'useStore'],
  'zustand': ['useStore', 'create', 'createStore'],
  'jotai': ['useAtom', 'useAtomValue', 'useSetAtom', 'atom'],
  'recoil': ['useRecoilState', 'useRecoilValue', 'useSetRecoilState', 'useRecoilCallback'],
  'valtio': ['useSnapshot', 'useProxy'],
  'mobx-react': ['useObserver', 'useLocalObservable'],
  
  // Forms
  'react-hook-form': ['useForm', 'useWatch', 'useFieldArray', 'useFormContext', 'useController'],
  'formik': ['useFormik', 'useField', 'useFormikContext'],
  
  // Routing
  'react-router': ['useNavigate', 'useParams', 'useLocation', 'useSearchParams', 'useMatch', 'useOutlet'],
  'next': ['useRouter', 'usePathname', 'useSearchParams', 'useParams', 'useSelectedLayoutSegment'],
  
  // Animation
  'framer-motion': ['useAnimation', 'useMotionValue', 'useTransform', 'useSpring', 'useScroll'],
  'react-spring': ['useSpring', 'useSprings', 'useTrail', 'useTransition', 'useChain'],
  
  // UI
  'radix-ui': ['useControllableState', 'useCallbackRef', 'useComposedRefs'],
  'headless-ui': ['useTransition', 'useId'],
};
```

#### Vue
```typescript
const VUE_PRIMITIVES = {
  // Reactivity
  reactivity: ['ref', 'reactive', 'computed', 'watch', 'watchEffect', 'watchPostEffect', 'watchSyncEffect'],
  
  // Lifecycle
  lifecycle: ['onMounted', 'onUpdated', 'onUnmounted', 'onBeforeMount', 'onBeforeUpdate', 'onBeforeUnmount'],
  
  // Dependency injection
  di: ['provide', 'inject'],
  
  // Composition
  composition: ['defineComponent', 'defineProps', 'defineEmits', 'defineExpose', 'defineSlots'],
  
  // Router (vue-router)
  router: ['useRouter', 'useRoute', 'useLink'],
  
  // State (pinia)
  pinia: ['defineStore', 'storeToRefs', 'useStore'],
};
```

#### Svelte
```typescript
const SVELTE_PRIMITIVES = {
  // Stores
  stores: ['writable', 'readable', 'derived', 'get'],
  
  // Lifecycle
  lifecycle: ['onMount', 'onDestroy', 'beforeUpdate', 'afterUpdate', 'tick'],
  
  // Context
  context: ['setContext', 'getContext', 'hasContext', 'getAllContexts'],
  
  // Motion
  motion: ['tweened', 'spring'],
};
```

#### Angular
```typescript
const ANGULAR_PRIMITIVES = {
  // Dependency injection
  di: ['inject', 'Injectable', 'Inject', 'Optional', 'Self', 'SkipSelf', 'Host'],
  
  // Signals (Angular 16+)
  signals: ['signal', 'computed', 'effect'],
  
  // Lifecycle
  lifecycle: ['OnInit', 'OnDestroy', 'OnChanges', 'AfterViewInit', 'AfterContentInit'],
  
  // HTTP
  http: ['HttpClient', 'HttpInterceptor'],
  
  // Router
  router: ['Router', 'ActivatedRoute', 'RouterLink'],
  
  // Forms
  forms: ['FormBuilder', 'FormGroup', 'FormControl', 'Validators'],
};
```

#### Node.js/Express
```typescript
const EXPRESS_PRIMITIVES = {
  // Middleware
  middleware: ['use', 'Router', 'express.json', 'express.urlencoded', 'express.static'],
  
  // Request handling
  request: ['req.body', 'req.params', 'req.query', 'req.headers', 'req.cookies'],
  
  // Response
  response: ['res.json', 'res.send', 'res.status', 'res.redirect', 'res.render'],
};
```

#### Testing (JavaScript)
```typescript
const JS_TESTING_PRIMITIVES = {
  // Jest/Vitest
  jest: ['describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach', 'beforeAll', 'afterAll', 'jest.fn', 'jest.mock', 'jest.spyOn'],
  vitest: ['describe', 'it', 'test', 'expect', 'beforeEach', 'afterEach', 'vi.fn', 'vi.mock', 'vi.spyOn'],
  
  // React Testing Library
  rtl: ['render', 'screen', 'fireEvent', 'waitFor', 'within', 'act'],
  
  // Cypress
  cypress: ['cy.visit', 'cy.get', 'cy.contains', 'cy.click', 'cy.type', 'cy.intercept'],
  
  // Playwright
  playwright: ['page.goto', 'page.click', 'page.fill', 'page.locator', 'expect'],
};
```


### Python

#### FastAPI
```typescript
const FASTAPI_PRIMITIVES = {
  // Dependency injection
  di: ['Depends', 'Security'],
  
  // Parameter extraction
  params: ['Query', 'Path', 'Body', 'Header', 'Cookie', 'Form', 'File', 'UploadFile'],
  
  // Auth
  auth: ['HTTPBearer', 'HTTPBasic', 'OAuth2PasswordBearer', 'OAuth2PasswordRequestForm', 'APIKeyHeader', 'APIKeyCookie'],
  
  // Background
  background: ['BackgroundTasks'],
  
  // Response
  response: ['Response', 'JSONResponse', 'HTMLResponse', 'StreamingResponse', 'FileResponse', 'RedirectResponse'],
  
  // WebSocket
  websocket: ['WebSocket', 'WebSocketDisconnect'],
};
```

#### Django
```typescript
const DJANGO_PRIMITIVES = {
  // Views
  views: ['View', 'TemplateView', 'ListView', 'DetailView', 'CreateView', 'UpdateView', 'DeleteView'],
  
  // Shortcuts
  shortcuts: ['get_object_or_404', 'get_list_or_404', 'redirect', 'render', 'reverse'],
  
  // Decorators
  decorators: ['login_required', 'permission_required', 'user_passes_test', 'require_http_methods', 'csrf_exempt'],
  
  // DB
  db: ['transaction.atomic', 'connection.cursor', 'F', 'Q', 'Prefetch', 'Count', 'Sum', 'Avg'],
  
  // Cache
  cache: ['cache.get', 'cache.set', 'cache.delete', 'cache_page', 'cache_control'],
  
  // Signals
  signals: ['Signal', 'receiver', 'post_save', 'pre_save', 'post_delete', 'pre_delete'],
  
  // Forms
  forms: ['Form', 'ModelForm', 'formset_factory', 'modelformset_factory'],
  
  // REST Framework
  drf: ['APIView', 'ViewSet', 'ModelViewSet', 'serializers.Serializer', 'serializers.ModelSerializer', 'permissions.IsAuthenticated'],
};
```

#### Flask
```typescript
const FLASK_PRIMITIVES = {
  // Core
  core: ['Flask', 'Blueprint', 'request', 'g', 'session', 'current_app'],
  
  // Decorators
  decorators: ['route', 'before_request', 'after_request', 'errorhandler', 'context_processor'],
  
  // Response
  response: ['jsonify', 'make_response', 'redirect', 'url_for', 'render_template', 'send_file'],
  
  // Extensions
  'flask-login': ['login_required', 'current_user', 'login_user', 'logout_user'],
  'flask-wtf': ['FlaskForm', 'CSRFProtect'],
  'flask-sqlalchemy': ['SQLAlchemy', 'db.session', 'db.Model'],
};
```

#### SQLAlchemy
```typescript
const SQLALCHEMY_PRIMITIVES = {
  // Session
  session: ['Session', 'sessionmaker', 'scoped_session'],
  
  // Query
  query: ['select', 'insert', 'update', 'delete', 'join', 'outerjoin'],
  
  // ORM
  orm: ['relationship', 'backref', 'column_property', 'hybrid_property', 'validates'],
  
  // Types
  types: ['Column', 'Integer', 'String', 'Boolean', 'DateTime', 'ForeignKey', 'Table'],
};
```

#### Celery
```typescript
const CELERY_PRIMITIVES = {
  // Tasks
  tasks: ['task', 'shared_task', 'Task'],
  
  // Execution
  execution: ['delay', 'apply_async', 'signature', 'chain', 'group', 'chord'],
  
  // Scheduling
  scheduling: ['periodic_task', 'crontab', 'schedule'],
};
```

#### Pydantic
```typescript
const PYDANTIC_PRIMITIVES = {
  // Models
  models: ['BaseModel', 'Field', 'validator', 'root_validator', 'model_validator'],
  
  // Settings
  settings: ['BaseSettings', 'SettingsConfigDict'],
  
  // Types
  types: ['constr', 'conint', 'confloat', 'EmailStr', 'HttpUrl', 'SecretStr'],
};
```

#### Testing (Python)
```typescript
const PYTHON_TESTING_PRIMITIVES = {
  // pytest
  pytest: ['fixture', 'mark.parametrize', 'mark.skip', 'mark.asyncio', 'raises', 'approx', 'monkeypatch'],
  
  // unittest
  unittest: ['TestCase', 'setUp', 'tearDown', 'mock.patch', 'mock.MagicMock', 'mock.Mock'],
  
  // hypothesis
  hypothesis: ['given', 'strategies', 'settings', 'example'],
};
```


### Java

#### Spring Framework
```typescript
const SPRING_PRIMITIVES = {
  // Dependency Injection
  di: ['@Autowired', '@Inject', '@Resource', '@Qualifier', '@Value', 'getBean', 'getBeanProvider'],
  
  // Stereotypes
  stereotypes: ['@Component', '@Service', '@Repository', '@Controller', '@RestController', '@Configuration'],
  
  // Web MVC
  web: ['@RequestMapping', '@GetMapping', '@PostMapping', '@PutMapping', '@DeleteMapping', '@PatchMapping'],
  params: ['@RequestBody', '@PathVariable', '@RequestParam', '@RequestHeader', '@CookieValue', '@ModelAttribute'],
  response: ['ResponseEntity', '@ResponseBody', '@ResponseStatus'],
  
  // Data/JPA
  data: ['@Transactional', '@Query', '@Modifying', '@EntityGraph', '@Lock'],
  jpa: ['JpaRepository', 'CrudRepository', 'PagingAndSortingRepository', 'save', 'findById', 'findAll', 'delete', 'deleteById'],
  
  // AOP
  aop: ['@Aspect', '@Before', '@After', '@Around', '@AfterReturning', '@AfterThrowing', 'ProceedingJoinPoint'],
  
  // Security
  security: ['@PreAuthorize', '@PostAuthorize', '@Secured', '@RolesAllowed', 'SecurityContextHolder', 'Authentication'],
  
  // Async
  async: ['@Async', '@EnableAsync', 'CompletableFuture', '@Scheduled', '@EnableScheduling'],
  
  // Validation
  validation: ['@Valid', '@Validated', '@NotNull', '@NotBlank', '@Size', '@Min', '@Max', '@Pattern'],
  
  // Caching
  caching: ['@Cacheable', '@CacheEvict', '@CachePut', '@Caching', '@EnableCaching'],
};
```

#### Spring Boot
```typescript
const SPRING_BOOT_PRIMITIVES = {
  // Configuration
  config: ['@SpringBootApplication', '@EnableAutoConfiguration', '@ConfigurationProperties', '@ConditionalOnProperty'],
  
  // Actuator
  actuator: ['@Endpoint', '@ReadOperation', '@WriteOperation', 'HealthIndicator'],
  
  // Testing
  testing: ['@SpringBootTest', '@WebMvcTest', '@DataJpaTest', '@MockBean', '@SpyBean', 'TestRestTemplate'],
};
```

#### Testing (Java)
```typescript
const JAVA_TESTING_PRIMITIVES = {
  // JUnit 5
  junit5: ['@Test', '@BeforeEach', '@AfterEach', '@BeforeAll', '@AfterAll', '@DisplayName', '@Nested', '@ParameterizedTest', '@ValueSource'],
  
  // Mockito
  mockito: ['@Mock', '@InjectMocks', '@Spy', '@Captor', 'when', 'verify', 'doReturn', 'doThrow', 'ArgumentCaptor'],
  
  // AssertJ
  assertj: ['assertThat', 'assertThatThrownBy', 'assertThatCode'],
};
```

### C# / .NET

#### ASP.NET Core
```typescript
const ASPNET_PRIMITIVES = {
  // Dependency Injection
  di: ['GetService', 'GetRequiredService', 'AddScoped', 'AddSingleton', 'AddTransient', 'AddHostedService'],
  attributes: ['[FromServices]', '[FromBody]', '[FromQuery]', '[FromRoute]', '[FromHeader]', '[FromForm]'],
  
  // Middleware
  middleware: ['IMiddleware', 'RequestDelegate', 'Use', 'UseMiddleware', 'Map', 'MapWhen', 'UseWhen'],
  
  // MVC/API
  mvc: ['[HttpGet]', '[HttpPost]', '[HttpPut]', '[HttpDelete]', '[HttpPatch]', '[Route]', '[ApiController]', 'ControllerBase'],
  results: ['Ok', 'BadRequest', 'NotFound', 'Created', 'NoContent', 'Unauthorized', 'Forbid'],
  
  // Auth
  auth: ['[Authorize]', '[AllowAnonymous]', 'IAuthorizationService', 'ClaimsPrincipal', '[RequiresClaim]'],
  
  // Validation
  validation: ['[Required]', '[StringLength]', '[Range]', '[RegularExpression]', '[Compare]', 'ModelState'],
  
  // Configuration
  config: ['IConfiguration', 'IOptions', 'IOptionsSnapshot', 'IOptionsMonitor', 'Configure'],
  
  // Logging
  logging: ['ILogger', 'ILoggerFactory', 'LogInformation', 'LogWarning', 'LogError', 'LogDebug'],
};
```

#### Entity Framework Core
```typescript
const EFCORE_PRIMITIVES = {
  // DbContext
  context: ['DbContext', 'DbSet', 'SaveChanges', 'SaveChangesAsync'],
  
  // Querying
  query: ['Include', 'ThenInclude', 'Where', 'Select', 'OrderBy', 'GroupBy', 'Join', 'AsNoTracking'],
  
  // Raw SQL
  raw: ['FromSqlRaw', 'FromSqlInterpolated', 'ExecuteSqlRaw', 'ExecuteSqlInterpolated'],
  
  // Transactions
  transactions: ['BeginTransaction', 'CommitTransaction', 'RollbackTransaction', 'Database.BeginTransactionAsync'],
};
```

#### Testing (C#)
```typescript
const CSHARP_TESTING_PRIMITIVES = {
  // xUnit
  xunit: ['[Fact]', '[Theory]', '[InlineData]', '[ClassData]', '[MemberData]', 'Assert'],
  
  // NUnit
  nunit: ['[Test]', '[TestCase]', '[SetUp]', '[TearDown]', '[TestFixture]', 'Assert'],
  
  // Moq
  moq: ['Mock', 'Setup', 'Returns', 'Verify', 'It.IsAny', 'It.Is', 'Callback'],
  
  // FluentAssertions
  fluent: ['Should', 'BeEquivalentTo', 'Contain', 'HaveCount', 'Throw'],
};
```


### PHP

#### Laravel
```typescript
const LARAVEL_PRIMITIVES = {
  // Facades
  facades: ['Auth::', 'Cache::', 'DB::', 'Log::', 'Queue::', 'Storage::', 'Event::', 'Mail::', 'Notification::', 'Gate::'],
  
  // Dependency Injection
  di: ['app()', 'resolve()', 'make()', '$this->app->bind', '$this->app->singleton', '$this->app->instance'],
  
  // Eloquent ORM
  eloquent: ['Model::query', 'where', 'with', 'find', 'first', 'get', 'save', 'create', 'update', 'delete'],
  relations: ['hasMany', 'belongsTo', 'hasOne', 'belongsToMany', 'morphTo', 'morphMany', 'morphToMany', 'hasManyThrough'],
  scopes: ['scopeActive', 'scopePublished', 'scopeRecent'],
  
  // Request/Response
  request: ['$request->input', '$request->validated', '$request->user', '$request->file', '$request->has', '$request->only'],
  response: ['response()->json', 'redirect()', 'view()', 'back()', 'abort()'],
  
  // Middleware
  middleware: ['$next($request)', 'handle()', 'terminate()'],
  
  // Validation
  validation: ['Validator::make', '$request->validate', 'Rule::unique', 'Rule::exists', 'Rule::in'],
  
  // Events
  events: ['event()', 'Event::dispatch', 'Listener', 'ShouldQueue'],
  
  // Jobs/Queues
  jobs: ['dispatch()', 'dispatchSync()', 'Bus::dispatch', 'Bus::chain'],
  
  // Auth
  auth: ['Auth::user', 'Auth::check', 'Auth::attempt', 'Gate::allows', 'Gate::denies', '$this->authorize'],
};
```

#### Symfony
```typescript
const SYMFONY_PRIMITIVES = {
  // Dependency Injection
  di: ['#[Autowire]', '#[Required]', 'ContainerInterface', 'ServiceSubscriberInterface'],
  
  // Routing
  routing: ['#[Route]', '#[Get]', '#[Post]', '#[Put]', '#[Delete]'],
  
  // Forms
  forms: ['FormBuilderInterface', 'createForm', 'handleRequest', 'isSubmitted', 'isValid'],
  
  // Doctrine
  doctrine: ['EntityManagerInterface', 'persist', 'flush', 'remove', 'getRepository'],
  
  // Security
  security: ['#[IsGranted]', 'Security', 'UserInterface', 'PasswordHasherInterface'],
  
  // Events
  events: ['EventDispatcherInterface', 'EventSubscriberInterface', '#[AsEventListener]'],
};
```

#### Testing (PHP)
```typescript
const PHP_TESTING_PRIMITIVES = {
  // PHPUnit
  phpunit: ['TestCase', 'setUp', 'tearDown', 'assertEquals', 'assertTrue', 'assertFalse', 'expectException', 'createMock'],
  
  // Pest
  pest: ['test', 'it', 'expect', 'beforeEach', 'afterEach', 'uses'],
  
  // Laravel Testing
  laravel: ['RefreshDatabase', 'WithFaker', 'actingAs', 'assertDatabaseHas', 'assertDatabaseMissing', 'mock'],
};
```

---

## Detection Algorithm

### Phase 1: Primitive Identification

```typescript
interface PrimitiveSource {
  type: 'bootstrap' | 'import' | 'frequency' | 'decorator';
  confidence: number;
}

interface DetectedPrimitive {
  name: string;
  framework: string;
  category: string;
  source: PrimitiveSource;
  importPath?: string;
  usageCount: number;
  language: 'typescript' | 'python' | 'java' | 'csharp' | 'php';
}

function identifyPrimitives(
  callGraph: CallGraph,
  imports: ImportMap,
  decorators: DecoratorMap
): DetectedPrimitive[] {
  const primitives: DetectedPrimitive[] = [];
  
  // 1. Bootstrap from known frameworks (highest confidence)
  for (const [framework, categories] of Object.entries(FRAMEWORK_PRIMITIVES)) {
    if (isFrameworkUsed(imports, framework)) {
      for (const [category, names] of Object.entries(categories)) {
        for (const name of names) {
          primitives.push({
            name,
            framework,
            category,
            source: { type: 'bootstrap', confidence: 1.0 },
            usageCount: countUsages(callGraph, name),
            language: detectLanguage(framework),
          });
        }
      }
    }
  }
  
  // 2. Discover from imports (e.g., useX from 'some-library')
  for (const [source, imported] of imports) {
    if (isExternalPackage(source)) {
      for (const name of imported) {
        if (looksLikePrimitive(name, source)) {
          primitives.push({
            name,
            framework: source,
            category: 'discovered',
            source: { type: 'import', confidence: 0.8 },
            importPath: source,
            usageCount: countUsages(callGraph, name),
            language: detectLanguageFromImport(source),
          });
        }
      }
    }
  }
  
  // 3. Decorator/Annotation discovery (Python, Java, C#, PHP 8+)
  for (const [decoratorName, usages] of decorators) {
    if (isFrameworkDecorator(decoratorName)) {
      primitives.push({
        name: decoratorName,
        framework: inferFrameworkFromDecorator(decoratorName),
        category: 'decorator',
        source: { type: 'decorator', confidence: 0.9 },
        usageCount: usages.length,
        language: detectLanguageFromDecorator(decoratorName),
      });
    }
  }
  
  // 4. Frequency-based discovery (high usage = likely primitive)
  const highUsageFunctions = findHighUsageFunctions(callGraph, threshold: 15);
  for (const func of highUsageFunctions) {
    if (!primitives.some(p => p.name === func.name)) {
      // Only if it looks like a utility/primitive (short name, generic)
      if (looksLikeUtilityFunction(func)) {
        primitives.push({
          name: func.name,
          framework: 'project',
          category: 'inferred',
          source: { type: 'frequency', confidence: 0.6 },
          usageCount: func.usageCount,
          language: func.language,
        });
      }
    }
  }
  
  return primitives;
}

// Heuristics for primitive detection
function looksLikePrimitive(name: string, source: string): boolean {
  // React hooks
  if (name.startsWith('use') && name.length > 3) return true;
  
  // Common primitive patterns
  if (['create', 'make', 'build', 'get', 'set', 'with'].some(p => name.startsWith(p))) return true;
  
  // Decorators/annotations
  if (name.startsWith('@') || name.startsWith('#[')) return true;
  
  // Known library patterns
  if (source.includes('react') || source.includes('vue') || source.includes('angular')) return true;
  
  return false;
}

function looksLikeUtilityFunction(func: FunctionInfo): boolean {
  // Short, generic names are more likely primitives
  if (func.name.length < 20 && func.parameterCount <= 3) return true;
  
  // Exported from a utils/helpers/lib directory
  if (func.file.match(/\/(utils|helpers|lib|common|shared)\//)) return true;
  
  return false;
}
```


### Phase 2: Wrapper Detection

```typescript
interface WrapperFunction {
  name: string;
  qualifiedName: string;
  file: string;
  line: number;
  language: string;
  
  // What primitives does this wrap?
  directPrimitives: string[];      // Directly called
  transitivePrimitives: string[];  // Called through other wrappers
  
  // Primitive signature (sorted, deduplicated)
  primitiveSignature: string[];
  
  // Wrapper depth (1 = direct, 2+ = transitive)
  depth: number;
  
  // What other wrappers does this call?
  callsWrappers: string[];
  
  // Who calls this wrapper?
  calledBy: string[];
  
  // Additional metadata
  isFactory: boolean;              // Returns a function
  isHigherOrder: boolean;          // Takes function as parameter
  isDecorator: boolean;            // Python/TS decorator pattern
  isAsync: boolean;                // Async function
  returnType?: string;             // Inferred return type
  parameterSignature?: string[];   // Parameter types/names
}

function detectWrappers(
  callGraph: CallGraph,
  primitives: DetectedPrimitive[]
): WrapperFunction[] {
  const primitiveNames = new Set(primitives.map(p => p.name));
  const wrappers: Map<string, WrapperFunction> = new Map();
  
  // Pass 1: Find direct wrappers (depth 1)
  for (const func of callGraph.functions) {
    const calledPrimitives = func.calls
      .filter(c => primitiveNames.has(c.calleeName))
      .map(c => c.calleeName);
    
    if (calledPrimitives.length > 0) {
      wrappers.set(func.qualifiedName, {
        name: func.name,
        qualifiedName: func.qualifiedName,
        file: func.file,
        line: func.startLine,
        language: func.language,
        directPrimitives: [...new Set(calledPrimitives)],
        transitivePrimitives: [],
        primitiveSignature: [...new Set(calledPrimitives)].sort(),
        depth: 1,
        callsWrappers: [],
        calledBy: [],
        isFactory: detectFactoryPattern(func),
        isHigherOrder: detectHigherOrderPattern(func),
        isDecorator: detectDecoratorPattern(func),
        isAsync: func.isAsync,
        returnType: func.returnType,
        parameterSignature: func.parameters?.map(p => p.type || p.name),
      });
    }
  }
  
  // Pass 2+: Find transitive wrappers (depth 2+)
  let changed = true;
  let currentDepth = 1;
  const MAX_DEPTH = 10;
  
  while (changed && currentDepth < MAX_DEPTH) {
    changed = false;
    currentDepth++;
    
    for (const func of callGraph.functions) {
      if (wrappers.has(func.qualifiedName)) continue;
      
      const calledWrappers = func.calls
        .filter(c => wrappers.has(c.calleeName))
        .map(c => c.calleeName);
      
      if (calledWrappers.length > 0) {
        // Collect transitive primitives from all called wrappers
        const transitive = new Set<string>();
        for (const wrapperName of calledWrappers) {
          const wrapper = wrappers.get(wrapperName)!;
          wrapper.directPrimitives.forEach(p => transitive.add(p));
          wrapper.transitivePrimitives.forEach(p => transitive.add(p));
        }
        
        // Also check if this function directly calls any primitives
        const directPrimitives = func.calls
          .filter(c => primitiveNames.has(c.calleeName))
          .map(c => c.calleeName);
        
        const allPrimitives = new Set([...transitive, ...directPrimitives]);
        
        wrappers.set(func.qualifiedName, {
          name: func.name,
          qualifiedName: func.qualifiedName,
          file: func.file,
          line: func.startLine,
          language: func.language,
          directPrimitives: [...new Set(directPrimitives)],
          transitivePrimitives: [...transitive],
          primitiveSignature: [...allPrimitives].sort(),
          depth: currentDepth,
          callsWrappers: calledWrappers,
          calledBy: [],
          isFactory: detectFactoryPattern(func),
          isHigherOrder: detectHigherOrderPattern(func),
          isDecorator: detectDecoratorPattern(func),
          isAsync: func.isAsync,
          returnType: func.returnType,
          parameterSignature: func.parameters?.map(p => p.type || p.name),
        });
        
        changed = true;
      }
    }
  }
  
  // Pass 3: Build reverse edges (calledBy)
  for (const func of callGraph.functions) {
    for (const call of func.calls) {
      const wrapper = wrappers.get(call.calleeName);
      if (wrapper && !wrapper.calledBy.includes(func.qualifiedName)) {
        wrapper.calledBy.push(func.qualifiedName);
      }
    }
  }
  
  return [...wrappers.values()];
}

// Pattern detection helpers
function detectFactoryPattern(func: FunctionInfo): boolean {
  // Returns a function
  if (func.returnType?.includes('=>') || func.returnType?.includes('Function')) return true;
  
  // Has "factory", "create", "make", "build" in name
  if (/factory|create|make|build/i.test(func.name)) return true;
  
  // Returns a hook (React pattern)
  if (func.returnType?.startsWith('use')) return true;
  
  return false;
}

function detectHigherOrderPattern(func: FunctionInfo): boolean {
  // Takes a function as parameter
  if (func.parameters?.some(p => 
    p.type?.includes('=>') || 
    p.type?.includes('Function') ||
    p.type?.includes('Callable') ||
    p.name?.includes('callback') ||
    p.name?.includes('handler') ||
    p.name?.includes('fn')
  )) return true;
  
  return false;
}

function detectDecoratorPattern(func: FunctionInfo): boolean {
  // Python decorator: takes function, returns function
  if (func.language === 'python') {
    if (func.parameters?.length === 1 && 
        func.returnType?.includes('Callable')) return true;
  }
  
  // TypeScript decorator
  if (func.language === 'typescript') {
    if (func.decorators?.length > 0) return true;
  }
  
  return false;
}
```


### Phase 3: Pattern Clustering

```typescript
interface WrapperCluster {
  id: string;
  name: string;
  description: string;
  
  // What primitives define this cluster?
  primitiveSignature: string[];
  
  // Members of this cluster
  wrappers: WrapperFunction[];
  
  // Confidence that this is a real pattern
  confidence: number;
  
  // Suggested category
  category: WrapperCategory;
  
  // Cluster metadata
  avgDepth: number;
  maxDepth: number;
  totalUsages: number;
  fileSpread: number;  // How many files contain wrappers in this cluster
  
  // Naming suggestions
  suggestedNames: string[];
}

type WrapperCategory = 
  | 'state-management'
  | 'data-fetching'
  | 'side-effects'
  | 'authentication'
  | 'authorization'
  | 'validation'
  | 'dependency-injection'
  | 'middleware'
  | 'testing'
  | 'logging'
  | 'caching'
  | 'error-handling'
  | 'async-utilities'
  | 'form-handling'
  | 'routing'
  | 'factory'
  | 'decorator'
  | 'utility'
  | 'other';

function clusterWrappers(
  wrappers: WrapperFunction[],
  primitives: DetectedPrimitive[]
): WrapperCluster[] {
  // Group by primitive signature
  const bySignature = new Map<string, WrapperFunction[]>();
  
  for (const wrapper of wrappers) {
    const signature = wrapper.primitiveSignature.join('+');
    
    if (!bySignature.has(signature)) {
      bySignature.set(signature, []);
    }
    bySignature.get(signature)!.push(wrapper);
  }
  
  // Convert to clusters
  const clusters: WrapperCluster[] = [];
  
  for (const [signature, members] of bySignature) {
    // Need at least 2 wrappers for a pattern (or 1 if heavily used)
    const totalUsages = members.reduce((sum, m) => sum + m.calledBy.length, 0);
    if (members.length < 2 && totalUsages < 5) continue;
    
    const primitiveList = signature.split('+');
    const category = inferCategory(primitiveList, primitives);
    const files = new Set(members.map(m => m.file));
    
    clusters.push({
      id: generateClusterId(signature),
      name: generateClusterName(primitiveList, category, members),
      description: generateDescription(primitiveList, members, category),
      primitiveSignature: primitiveList,
      wrappers: members,
      confidence: calculateConfidence(members, primitiveList, totalUsages, files.size),
      category,
      avgDepth: members.reduce((sum, m) => sum + m.depth, 0) / members.length,
      maxDepth: Math.max(...members.map(m => m.depth)),
      totalUsages,
      fileSpread: files.size,
      suggestedNames: generateNameSuggestions(primitiveList, category, members),
    });
  }
  
  return clusters.sort((a, b) => b.confidence - a.confidence);
}

function inferCategory(
  primitives: string[],
  allPrimitives: DetectedPrimitive[]
): WrapperCategory {
  const primSet = new Set(primitives);
  
  // React-specific patterns
  if (primSet.has('useState') || primSet.has('useReducer')) {
    if (primSet.has('useEffect')) return 'side-effects';
    return 'state-management';
  }
  if (primSet.has('useEffect') || primSet.has('useLayoutEffect')) return 'side-effects';
  if (primSet.has('useQuery') || primSet.has('useSWR') || primSet.has('useMutation')) return 'data-fetching';
  if (primSet.has('useForm') || primSet.has('useFormik')) return 'form-handling';
  if (primSet.has('useNavigate') || primSet.has('useRouter')) return 'routing';
  
  // Cross-framework patterns
  const categories = primitives.map(p => {
    const prim = allPrimitives.find(ap => ap.name === p);
    return prim?.category;
  }).filter(Boolean);
  
  if (categories.includes('auth') || primitives.some(p => /auth|login|session|token/i.test(p))) {
    return 'authentication';
  }
  if (categories.includes('security') || primitives.some(p => /permission|role|authorize|grant/i.test(p))) {
    return 'authorization';
  }
  if (categories.includes('di') || primitives.some(p => /inject|autowired|depends|resolve/i.test(p))) {
    return 'dependency-injection';
  }
  if (categories.includes('middleware') || primitives.some(p => /middleware|interceptor|filter/i.test(p))) {
    return 'middleware';
  }
  if (categories.includes('validation') || primitives.some(p => /valid|schema|assert/i.test(p))) {
    return 'validation';
  }
  if (primitives.some(p => /cache|memo/i.test(p))) return 'caching';
  if (primitives.some(p => /log|trace|debug/i.test(p))) return 'logging';
  if (primitives.some(p => /error|exception|catch|throw/i.test(p))) return 'error-handling';
  if (primitives.some(p => /async|await|promise|future|task/i.test(p))) return 'async-utilities';
  if (primitives.some(p => /test|mock|spy|stub|fixture/i.test(p))) return 'testing';
  if (primitives.some(p => /factory|create|make|build/i.test(p))) return 'factory';
  
  return 'utility';
}

function calculateConfidence(
  members: WrapperFunction[],
  primitives: string[],
  totalUsages: number,
  fileSpread: number
): number {
  let confidence = 0.5; // Base confidence
  
  // More members = higher confidence
  if (members.length >= 5) confidence += 0.2;
  else if (members.length >= 3) confidence += 0.1;
  
  // More usages = higher confidence
  if (totalUsages >= 20) confidence += 0.15;
  else if (totalUsages >= 10) confidence += 0.1;
  else if (totalUsages >= 5) confidence += 0.05;
  
  // Spread across files = higher confidence (not just one file)
  if (fileSpread >= 3) confidence += 0.1;
  else if (fileSpread >= 2) confidence += 0.05;
  
  // Consistent naming = higher confidence
  const namingPatterns = detectNamingPatterns(members);
  if (namingPatterns.length > 0) confidence += 0.1;
  
  // Known primitives = higher confidence
  const knownPrimitiveRatio = primitives.filter(p => 
    isKnownPrimitive(p)
  ).length / primitives.length;
  confidence += knownPrimitiveRatio * 0.1;
  
  return Math.min(confidence, 1.0);
}

function detectNamingPatterns(members: WrapperFunction[]): string[] {
  const patterns: string[] = [];
  const names = members.map(m => m.name);
  
  // Check for common prefixes
  const prefixes = ['use', 'with', 'create', 'make', 'get', 'fetch', 'load', 'handle'];
  for (const prefix of prefixes) {
    const matching = names.filter(n => n.toLowerCase().startsWith(prefix.toLowerCase()));
    if (matching.length >= members.length * 0.5) {
      patterns.push(`${prefix}*`);
    }
  }
  
  // Check for common suffixes
  const suffixes = ['Hook', 'Query', 'Mutation', 'Handler', 'Service', 'Provider', 'Factory'];
  for (const suffix of suffixes) {
    const matching = names.filter(n => n.endsWith(suffix));
    if (matching.length >= members.length * 0.5) {
      patterns.push(`*${suffix}`);
    }
  }
  
  return patterns;
}

function generateClusterName(
  primitives: string[],
  category: WrapperCategory,
  members: WrapperFunction[]
): string {
  // Try to infer from member names
  const namingPatterns = detectNamingPatterns(members);
  if (namingPatterns.length > 0) {
    return `${namingPatterns[0]} Pattern`;
  }
  
  // Fall back to category + primitives
  const categoryName = category.split('-').map(w => 
    w.charAt(0).toUpperCase() + w.slice(1)
  ).join(' ');
  
  if (primitives.length <= 2) {
    return `${categoryName} (${primitives.join(' + ')})`;
  }
  
  return `${categoryName} Wrappers`;
}

function generateNameSuggestions(
  primitives: string[],
  category: WrapperCategory,
  members: WrapperFunction[]
): string[] {
  const suggestions: string[] = [];
  
  // Based on primitives
  if (primitives.includes('useState') && primitives.includes('useEffect')) {
    suggestions.push('Stateful Effect Hooks');
  }
  if (primitives.includes('useQuery')) {
    suggestions.push('Data Query Hooks');
  }
  
  // Based on naming patterns
  const patterns = detectNamingPatterns(members);
  for (const pattern of patterns) {
    if (pattern.startsWith('use')) suggestions.push('Custom Hooks');
    if (pattern.endsWith('Service')) suggestions.push('Service Layer');
    if (pattern.endsWith('Repository')) suggestions.push('Repository Pattern');
  }
  
  // Based on category
  suggestions.push(`${category} Pattern`);
  
  return [...new Set(suggestions)];
}
```


---

## Advanced Detection Patterns

### Decorator/Annotation Wrapper Detection

Decorators and annotations are a special form of wrapper that modify function behavior without explicit calls.

```typescript
// Python decorator wrapper
@login_required          // Primitive
@rate_limit(100)         // Wrapper around rate limiting primitive
def my_endpoint():
    pass

// Java annotation wrapper
@Transactional           // Primitive
@Audited                 // Wrapper that adds audit logging
public void saveUser() {}

// C# attribute wrapper
[Authorize]              // Primitive
[RequiresTenant]         // Wrapper that adds tenant check
public IActionResult Get() {}
```

```typescript
interface DecoratorWrapper {
  name: string;
  wrappedDecorators: string[];  // What decorators does this compose?
  appliedTo: string[];          // What functions use this decorator?
  isParameterized: boolean;     // Does it take arguments?
}

function detectDecoratorWrappers(
  decorators: DecoratorUsage[],
  primitives: DetectedPrimitive[]
): DecoratorWrapper[] {
  const decoratorWrappers: DecoratorWrapper[] = [];
  
  // Find decorators that are always used with certain primitives
  const coOccurrence = new Map<string, Map<string, number>>();
  
  for (const usage of decorators) {
    const decoratorsOnFunction = usage.decorators;
    for (const dec of decoratorsOnFunction) {
      if (!coOccurrence.has(dec)) {
        coOccurrence.set(dec, new Map());
      }
      for (const other of decoratorsOnFunction) {
        if (dec !== other) {
          const count = coOccurrence.get(dec)!.get(other) || 0;
          coOccurrence.get(dec)!.set(other, count + 1);
        }
      }
    }
  }
  
  // Decorators that always appear with primitives are likely wrappers
  for (const [decorator, others] of coOccurrence) {
    const primitiveCoOccurrences = [...others.entries()]
      .filter(([name]) => primitives.some(p => p.name === name))
      .sort((a, b) => b[1] - a[1]);
    
    if (primitiveCoOccurrences.length > 0) {
      decoratorWrappers.push({
        name: decorator,
        wrappedDecorators: primitiveCoOccurrences.map(([name]) => name),
        appliedTo: decorators
          .filter(u => u.decorators.includes(decorator))
          .map(u => u.functionName),
        isParameterized: decorator.includes('('),
      });
    }
  }
  
  return decoratorWrappers;
}
```

### Higher-Order Function Detection

Functions that return functions (factories) or take functions as arguments.

```typescript
// React: Hook factory
function createQueryHook(endpoint: string) {
  return function useGeneratedQuery() {
    return useQuery({ queryKey: [endpoint], queryFn: () => fetch(endpoint) });
  };
}

// Python: Decorator factory
def require_permission(permission: str):
    def decorator(func):
        @wraps(func)
        def wrapper(*args, **kwargs):
            if not has_permission(permission):
                raise PermissionError()
            return func(*args, **kwargs)
        return wrapper
    return decorator

// Java: Bean factory
@Bean
public DataSource createDataSource(Environment env) {
    return DataSourceBuilder.create()
        .url(env.getProperty("db.url"))
        .build();
}
```

```typescript
interface FactoryFunction {
  name: string;
  factoryType: 'hook-factory' | 'decorator-factory' | 'bean-factory' | 'service-factory';
  producedType: string;           // What type does it produce?
  primitiveSignature: string[];   // What primitives are in the produced function?
  usages: string[];               // Where is this factory called?
}

function detectFactoryFunctions(
  callGraph: CallGraph,
  wrappers: WrapperFunction[]
): FactoryFunction[] {
  const factories: FactoryFunction[] = [];
  
  for (const func of callGraph.functions) {
    // Check if function returns another function
    if (!returnsFunction(func)) continue;
    
    // Check if the returned function is a wrapper
    const returnedFunctions = findReturnedFunctions(func, callGraph);
    for (const returned of returnedFunctions) {
      const wrapper = wrappers.find(w => w.qualifiedName === returned);
      if (wrapper) {
        factories.push({
          name: func.name,
          factoryType: inferFactoryType(func, wrapper),
          producedType: wrapper.name,
          primitiveSignature: wrapper.primitiveSignature,
          usages: findFactoryUsages(func.qualifiedName, callGraph),
        });
      }
    }
  }
  
  return factories;
}
```

### Async Wrapper Detection

Wrappers around async primitives (Promises, async/await, RxJS, etc.)

```typescript
// TypeScript: Promise wrapper
async function withRetry<T>(fn: () => Promise<T>, retries = 3): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    if (retries > 0) return withRetry(fn, retries - 1);
    throw e;
  }
}

// Python: Async context manager wrapper
@asynccontextmanager
async def database_transaction():
    async with engine.begin() as conn:
        yield conn

// C#: Task wrapper
public async Task<T> WithTimeout<T>(Func<Task<T>> operation, TimeSpan timeout) {
    var task = operation();
    var completed = await Task.WhenAny(task, Task.Delay(timeout));
    if (completed != task) throw new TimeoutException();
    return await task;
}
```

```typescript
interface AsyncWrapper {
  name: string;
  asyncType: 'promise' | 'async-await' | 'observable' | 'task' | 'future';
  wrappedPrimitives: string[];
  errorHandling: 'retry' | 'timeout' | 'fallback' | 'circuit-breaker' | 'none';
  usages: string[];
}

function detectAsyncWrappers(
  wrappers: WrapperFunction[]
): AsyncWrapper[] {
  return wrappers
    .filter(w => w.isAsync || hasAsyncPrimitives(w))
    .map(w => ({
      name: w.name,
      asyncType: inferAsyncType(w),
      wrappedPrimitives: w.primitiveSignature,
      errorHandling: inferErrorHandlingPattern(w),
      usages: w.calledBy,
    }));
}
```

---

## What NOT to Detect (Negative Examples)

To avoid false positives, we explicitly exclude certain patterns:

### 1. Simple Utility Functions
```typescript
// NOT a wrapper - just a utility
function formatDate(date: Date): string {
  return date.toISOString();
}

// NOT a wrapper - no framework primitives
function calculateTotal(items: Item[]): number {
  return items.reduce((sum, item) => sum + item.price, 0);
}
```

### 2. Direct Framework Usage (No Abstraction)
```typescript
// NOT a wrapper - direct usage in component
function MyComponent() {
  const [count, setCount] = useState(0);  // Direct primitive usage
  return <button onClick={() => setCount(c => c + 1)}>{count}</button>;
}
```

### 3. One-Off Compositions
```typescript
// NOT a pattern - only used once
function useVerySpecificThingForOneComponent() {
  const [x, setX] = useState(0);
  useEffect(() => { /* very specific logic */ }, [x]);
  return x;
}
```

### 4. Test Helpers (Unless in Test Category)
```typescript
// Detected as 'testing' category, not general wrapper
function renderWithProviders(ui: React.ReactElement) {
  return render(<Providers>{ui}</Providers>);
}
```

### Exclusion Rules

```typescript
function shouldExcludeAsWrapper(func: FunctionInfo, context: AnalysisContext): boolean {
  // Exclude if no framework primitives called
  if (func.calls.every(c => !isPrimitive(c.calleeName))) return true;
  
  // Exclude if only used once (unless heavily nested)
  if (func.calledBy.length <= 1 && func.depth === 1) return true;
  
  // Exclude if in node_modules/vendor
  if (func.file.includes('node_modules') || func.file.includes('vendor')) return true;
  
  // Exclude if generated code
  if (func.file.includes('.generated.') || func.file.includes('.g.')) return true;
  
  // Exclude if test file (move to testing category instead)
  if (isTestFile(func.file)) {
    func.category = 'testing';
    return false; // Don't exclude, but categorize differently
  }
  
  return false;
}
```

---

## Output Formats

### CLI Output

```
drift wrappers

🔍 Framework Wrapper Analysis
═══════════════════════════════════════════════════════════════════════════

Detected Frameworks: React 18, TanStack Query v5, Zustand, React Hook Form

📦 Discovered Wrapper Patterns:

┌─────────────────────────────────────────────────────────────────────────┐
│ Data Fetching Hooks                                    95% confidence   │
├─────────────────────────────────────────────────────────────────────────┤
│ Primitives: useQuery + useState                                         │
│ Pattern: Query with local loading state                                 │
│ Members: 8 wrappers across 4 files                                      │
│                                                                         │
│   useUsers         src/hooks/useUsers.ts:12        → 15 usages         │
│   usePosts         src/hooks/usePosts.ts:8         → 12 usages         │
│   useComments      src/hooks/useComments.ts:15     → 8 usages          │
│   useProducts      src/hooks/useProducts.ts:5      → 7 usages          │
│   ... 4 more                                                            │
│                                                                         │
│ Common return shape: { data, isLoading, error, refetch }               │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Auth Context Hooks                                     92% confidence   │
├─────────────────────────────────────────────────────────────────────────┤
│ Primitives: useContext(AuthContext) + useCallback                       │
│ Pattern: Auth context with memoized actions                             │
│ Members: 3 wrappers across 2 files                                      │
│                                                                         │
│   useAuth          src/hooks/useAuth.ts:5          → 23 usages         │
│   usePermissions   src/hooks/usePermissions.ts:10  → 11 usages         │
│   useSession       src/hooks/useSession.ts:3       → 8 usages          │
│                                                                         │
│ Common return shape: { user, isAuthenticated, login, logout }          │
└─────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────┐
│ Form Hooks                                             88% confidence   │
├─────────────────────────────────────────────────────────────────────────┤
│ Primitives: useForm + useState + useCallback                            │
│ Pattern: Form state with validation and submission                      │
│ Members: 5 wrappers across 3 files                                      │
│                                                                         │
│   useLoginForm     src/forms/useLoginForm.ts:8     → 2 usages          │
│   useSignupForm    src/forms/useSignupForm.ts:12   → 2 usages          │
│   useProfileForm   src/forms/useProfileForm.ts:6   → 3 usages          │
│   ... 2 more                                                            │
└─────────────────────────────────────────────────────────────────────────┘

📊 Summary:
   Total wrappers detected: 24
   Wrapper clusters: 6
   Average wrapper depth: 1.4
   Most wrapped primitive: useQuery (12 wrappers)

💡 Commands:
   drift wrappers --cluster <id>     Show cluster details
   drift wrappers --wrapper <name>   Show wrapper call tree
   drift wrappers --export json      Export analysis
```


### MCP Tool Output

```typescript
// New MCP tool: drift_wrappers
interface WrapperAnalysisResult {
  frameworks: {
    name: string;
    version?: string;
    primitiveCount: number;
  }[];
  
  clusters: {
    id: string;
    name: string;
    confidence: number;
    category: WrapperCategory;
    primitives: string[];
    wrapperCount: number;
    totalUsages: number;
    fileSpread: number;
    wrappers: {
      name: string;
      file: string;
      line: number;
      depth: number;
      usageCount: number;
      calledBy: string[];
    }[];
    suggestedNames: string[];
  }[];
  
  summary: {
    totalWrappers: number;
    totalClusters: number;
    avgDepth: number;
    mostWrappedPrimitive: string;
    mostUsedWrapper: string;
  };
}

// Example response
{
  "frameworks": [
    { "name": "react", "version": "18.2.0", "primitiveCount": 12 },
    { "name": "tanstack-query", "version": "5.0.0", "primitiveCount": 5 }
  ],
  "clusters": [
    {
      "id": "data-fetching-usequery-usestate",
      "name": "Data Fetching Hooks",
      "confidence": 0.95,
      "category": "data-fetching",
      "primitives": ["useQuery", "useState"],
      "wrapperCount": 8,
      "totalUsages": 42,
      "fileSpread": 4,
      "wrappers": [
        {
          "name": "useUsers",
          "file": "src/hooks/useUsers.ts",
          "line": 12,
          "depth": 1,
          "usageCount": 15,
          "calledBy": ["UserList", "UserProfile", "AdminPanel"]
        }
      ],
      "suggestedNames": ["Data Query Hooks", "Custom Hooks"]
    }
  ],
  "summary": {
    "totalWrappers": 24,
    "totalClusters": 6,
    "avgDepth": 1.4,
    "mostWrappedPrimitive": "useQuery",
    "mostUsedWrapper": "useAuth"
  }
}
```

### JSON Export Format

```json
{
  "version": "1.0.0",
  "generatedAt": "2025-01-23T12:00:00Z",
  "project": "my-react-app",
  
  "primitives": [
    {
      "name": "useState",
      "framework": "react",
      "category": "state",
      "source": "bootstrap",
      "confidence": 1.0,
      "usageCount": 156
    }
  ],
  
  "wrappers": [
    {
      "name": "useUsers",
      "qualifiedName": "src/hooks/useUsers.ts:useUsers",
      "file": "src/hooks/useUsers.ts",
      "line": 12,
      "directPrimitives": ["useQuery"],
      "transitivePrimitives": [],
      "primitiveSignature": ["useQuery", "useState"],
      "depth": 1,
      "callsWrappers": [],
      "calledBy": ["UserList", "UserProfile", "AdminPanel"],
      "isFactory": false,
      "isHigherOrder": false,
      "isAsync": true
    }
  ],
  
  "clusters": [
    {
      "id": "data-fetching-usequery-usestate",
      "name": "Data Fetching Hooks",
      "primitiveSignature": ["useQuery", "useState"],
      "wrapperIds": ["src/hooks/useUsers.ts:useUsers", "..."],
      "confidence": 0.95,
      "category": "data-fetching"
    }
  ],
  
  "factories": [
    {
      "name": "createEntityHook",
      "factoryType": "hook-factory",
      "producedType": "useEntity*",
      "primitiveSignature": ["useQuery", "useMutation"],
      "usages": ["useUsers", "usePosts", "useComments"]
    }
  ]
}
```

---

## Implementation Plan

### Phase 1: Core Infrastructure (1.5 weeks)

| Task | Effort | Files |
|------|--------|-------|
| Create primitive registry with all frameworks | 2d | `wrappers/primitives/registry.ts` |
| Implement primitive discovery from imports | 1d | `wrappers/primitives/discovery.ts` |
| Add decorator/annotation primitive detection | 1d | `wrappers/primitives/decorators.ts` |
| Add frequency-based primitive inference | 0.5d | `wrappers/primitives/inference.ts` |
| Unit tests for primitive detection | 1d | `wrappers/primitives/__tests__/` |

### Phase 2: Wrapper Detection (1.5 weeks)

| Task | Effort | Files |
|------|--------|-------|
| Implement direct wrapper detection | 1d | `wrappers/detection/detector.ts` |
| Implement transitive wrapper detection | 1d | `wrappers/detection/transitive.ts` |
| Build reverse call graph (calledBy) | 0.5d | `wrappers/detection/reverse-graph.ts` |
| Add factory function detection | 1d | `wrappers/detection/factories.ts` |
| Add higher-order function detection | 0.5d | `wrappers/detection/higher-order.ts` |
| Add async wrapper detection | 0.5d | `wrappers/detection/async.ts` |
| Add decorator wrapper detection | 1d | `wrappers/detection/decorators.ts` |
| Unit tests for wrapper detection | 1d | `wrappers/detection/__tests__/` |

### Phase 3: Clustering & Confidence (1 week)

| Task | Effort | Files |
|------|--------|-------|
| Implement signature-based clustering | 1d | `wrappers/clustering/clusterer.ts` |
| Add category inference | 0.5d | `wrappers/clustering/categorizer.ts` |
| Implement confidence scoring | 1d | `wrappers/clustering/confidence.ts` |
| Add naming pattern detection | 0.5d | `wrappers/clustering/naming.ts` |
| Add exclusion rules | 0.5d | `wrappers/clustering/exclusions.ts` |
| Unit tests for clustering | 0.5d | `wrappers/clustering/__tests__/` |

### Phase 4: Output & Integration (1 week)

| Task | Effort | Files |
|------|--------|-------|
| CLI command implementation | 1d | `cli/commands/wrappers.ts` |
| MCP tool implementation | 1d | `mcp/tools/wrappers.ts` |
| JSON export format | 0.5d | `wrappers/export/json.ts` |
| Integration with existing pattern system | 1d | Various |
| Integration tests | 1d | `wrappers/__tests__/integration/` |
| Documentation | 0.5d | `docs/wrappers.md` |

### Phase 5: Polish & Optimization (0.5 weeks)

| Task | Effort | Files |
|------|--------|-------|
| Performance optimization | 1d | Various |
| Dashboard visualization | 1d | `dashboard/WrapperView.tsx` |
| Edge case handling | 0.5d | Various |

**Total: ~5.5 weeks**

---

## File Structure

```
drift/packages/core/src/
├── wrappers/
│   ├── index.ts                      # Public API
│   ├── types.ts                      # Type definitions
│   │
│   ├── primitives/
│   │   ├── index.ts
│   │   ├── registry.ts               # Bootstrap primitive definitions
│   │   ├── discovery.ts              # Import-based discovery
│   │   ├── decorators.ts             # Decorator/annotation detection
│   │   ├── inference.ts              # Frequency-based inference
│   │   └── __tests__/
│   │       ├── registry.test.ts
│   │       ├── discovery.test.ts
│   │       └── inference.test.ts
│   │
│   ├── detection/
│   │   ├── index.ts
│   │   ├── detector.ts               # Main wrapper detection
│   │   ├── transitive.ts             # Transitive closure computation
│   │   ├── reverse-graph.ts          # calledBy computation
│   │   ├── factories.ts              # Factory function detection
│   │   ├── higher-order.ts           # Higher-order function detection
│   │   ├── async.ts                  # Async wrapper detection
│   │   ├── decorators.ts             # Decorator wrapper detection
│   │   └── __tests__/
│   │       ├── detector.test.ts
│   │       ├── transitive.test.ts
│   │       └── factories.test.ts
│   │
│   ├── clustering/
│   │   ├── index.ts
│   │   ├── clusterer.ts              # Signature-based clustering
│   │   ├── categorizer.ts            # Category inference
│   │   ├── confidence.ts             # Confidence scoring
│   │   ├── naming.ts                 # Naming pattern detection
│   │   ├── exclusions.ts             # What NOT to detect
│   │   └── __tests__/
│   │       ├── clusterer.test.ts
│   │       ├── confidence.test.ts
│   │       └── exclusions.test.ts
│   │
│   └── export/
│       ├── index.ts
│       ├── json.ts                   # JSON export format
│       └── __tests__/

drift/packages/cli/src/commands/
├── wrappers.ts                       # CLI command

drift/packages/mcp/src/tools/
├── wrappers.ts                       # MCP tool

drift/packages/dashboard/src/
├── components/
│   └── WrapperView.tsx               # Dashboard visualization
```

---

## Success Metrics

| Metric | Target | Measurement |
|--------|--------|-------------|
| Primitive detection accuracy | 95%+ | Manual review of 100 samples |
| Wrapper detection recall | 90%+ | Compare to manual annotation |
| Cluster relevance | 80%+ | User approval rate |
| False positive rate | <10% | Manual review |
| Performance (10k functions) | <5s | Benchmark |
| Performance (50k functions) | <30s | Benchmark |
| Cross-language consistency | 90%+ | Same patterns detected in equivalent code |

---

## Future Enhancements

### Near-term (v1.1)
1. **Return shape analysis** - Cluster by what wrappers return, not just what they call
2. **Parameter pattern analysis** - Detect common parameter patterns across wrappers
3. **Wrapper evolution tracking** - Track how wrapper patterns change over time

### Medium-term (v1.2)
4. **Cross-project learning** - Learn common patterns from multiple projects
5. **AI-assisted naming** - Use LLM to suggest better names for discovered patterns
6. **Wrapper documentation generation** - Auto-generate docs for wrapper clusters

### Long-term (v2.0)
7. **Wrapper refactoring suggestions** - Suggest consolidating similar wrappers
8. **Breaking change detection** - Detect when wrapper signatures change
9. **Wrapper dependency graph** - Visualize wrapper-to-wrapper relationships
10. **Custom primitive registration** - Let users define their own primitives

---

## Appendix A: Language-Specific Considerations

### TypeScript/JavaScript
- Hook naming convention (`use*`) is a strong signal
- JSX component usage indicates wrapper consumption
- Module resolution affects import detection
- CommonJS vs ESM import syntax differences

### Python
- Decorator syntax (`@decorator`) is explicit
- `functools.wraps` indicates wrapper pattern
- Type hints help with return type analysis
- Async/await vs sync function distinction

### Java
- Annotation-based primitives (`@Autowired`)
- Interface implementation as wrapper indicator
- Proxy/AOP wrapper detection via Spring
- Generic type parameters affect signature

### C#
- Attribute-based primitives (`[FromServices]`)
- Extension method wrappers
- Async/await with `Task<T>` return types
- LINQ method chaining patterns

### PHP
- Facade static method calls (`Auth::user()`)
- Trait-based composition
- Magic method wrappers (`__call`)
- Laravel's service container patterns

---

## Appendix B: Confidence Calibration

### High Confidence (>90%)
- 5+ wrappers with same primitive signature
- Consistent naming pattern (e.g., all start with `use`)
- Used across 3+ files
- 20+ total usages
- Known framework primitives

### Medium Confidence (70-90%)
- 3-4 wrappers with same signature
- Some naming consistency
- Used across 2 files
- 10-20 total usages
- Mix of known and inferred primitives

### Low Confidence (50-70%)
- 2 wrappers with same signature
- No naming pattern
- Single file
- <10 total usages
- Mostly inferred primitives

### Excluded (<50%)
- Single wrapper
- No framework primitives
- Generated code
- Test-only code (unless testing category)
