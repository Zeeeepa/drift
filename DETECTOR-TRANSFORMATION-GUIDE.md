# Detector Transformation Guide

## The Problem

Current detectors have **hardcoded patterns** that enforce arbitrary conventions instead of **learning from the user's codebase**.

### Example of Hardcoded Logic (BAD)
```typescript
// Hardcoded list of "correct" plural resources
export const PLURAL_RESOURCES = new Set([
  'users', 'posts', 'comments', ...
]);

// Hardcoded "correct" casing
if (casing !== 'kebab-case') {
  violations.push(...);
}
```

### What Drift Should Do (GOOD)
```typescript
// Learn what the user actually uses
protected extractConventions(context, distributions) {
  for (const route of routes) {
    const casing = detectCasing(segment);
    distributions.get('urlCasing').add(casing, context.file);
  }
}

// Flag deviations from THEIR conventions
protected detectWithConventions(context, conventions) {
  const learnedCasing = conventions.conventions.urlCasing?.value;
  if (segmentCasing !== learnedCasing) {
    violations.push(...);
  }
}
```

---

## Transformation Complete! ✅

All detectors have been transformed to learning-based versions. Drift now learns patterns from the user's codebase and flags **inconsistencies**, not arbitrary "best practices."

---

## Progress Summary

### Completed Learning Detectors (90+ files)

#### API Category (7 files) - COMPLETE ✅
1. `api/route-structure-learning.ts`
2. `api/client-patterns-learning.ts`
3. `api/error-format-learning.ts`
4. `api/http-methods-learning.ts`
5. `api/pagination-learning.ts`
6. `api/response-envelope-learning.ts`
7. `api/retry-patterns-learning.ts`

#### Styling Category (8 files) - COMPLETE ✅
8. `styling/class-naming-learning.ts`
9. `styling/color-usage-learning.ts`
10. `styling/design-tokens-learning.ts`
11. `styling/responsive-learning.ts`
12. `styling/spacing-scale-learning.ts`
13. `styling/tailwind-patterns-learning.ts`
14. `styling/typography-learning.ts`
15. `styling/z-index-scale-learning.ts`

#### Errors Category (7 files) - COMPLETE ✅
16. `errors/error-codes-learning.ts`
17. `errors/exception-hierarchy-learning.ts`
18. `errors/error-logging-learning.ts`
19. `errors/try-catch-learning.ts`
20. `errors/async-errors-learning.ts`
21. `errors/circuit-breaker-learning.ts`
22. `errors/error-propagation-learning.ts`

#### Config Category (3 files) - COMPLETE ✅
23. `config/feature-flags-learning.ts`
24. `config/env-naming-learning.ts`
25. `config/config-validation-learning.ts`

#### Testing Category (7 files) - COMPLETE ✅
26. `testing/describe-naming-learning.ts`
27. `testing/test-structure-learning.ts`
28. `testing/mock-patterns-learning.ts`
29. `testing/fixture-patterns-learning.ts`
30. `testing/setup-teardown-learning.ts`
31. `testing/file-naming-learning.ts`
32. `testing/co-location-learning.ts`

#### Structural Category (8 files) - COMPLETE ✅
33. `structural/file-naming-learning.ts`
34. `structural/import-ordering-learning.ts`
35. `structural/barrel-exports-learning.ts`
36. `structural/module-boundaries-learning.ts`
37. `structural/directory-structure-learning.ts`
38. `structural/circular-deps-learning.ts`
39. `structural/co-location-learning.ts`
40. `structural/package-boundaries-learning.ts`

#### Logging Category (7 files) - COMPLETE ✅
41. `logging/log-levels-learning.ts`
42. `logging/metric-naming-learning.ts`
43. `logging/structured-format-learning.ts`
44. `logging/context-fields-learning.ts`
45. `logging/correlation-ids-learning.ts`
46. `logging/health-checks-learning.ts`
47. `logging/pii-redaction-learning.ts`

#### Components Category (7 files) - COMPLETE ✅
48. `components/component-structure-learning.ts`
49. `components/props-patterns-learning.ts`
50. `components/state-patterns-learning.ts`
51. `components/composition-learning.ts`
52. `components/duplicate-detection-learning.ts`
53. `components/near-duplicate-learning.ts`
54. `components/ref-forwarding-learning.ts`

#### Types Category (7 files) - COMPLETE ✅
55. `types/interface-vs-type-learning.ts`
56. `types/naming-conventions-learning.ts`
57. `types/utility-types-learning.ts`
58. `types/generic-patterns-learning.ts`
59. `types/any-usage-learning.ts`
60. `types/file-location-learning.ts`
61. `types/type-assertions-learning.ts`

#### Data-Access Category (7 files) - COMPLETE ✅
62. `data-access/repository-pattern-learning.ts`
63. `data-access/query-patterns-learning.ts`
64. `data-access/dto-patterns-learning.ts`
65. `data-access/transaction-patterns-learning.ts`
66. `data-access/connection-pooling-learning.ts`
67. `data-access/validation-patterns-learning.ts`
68. `data-access/n-plus-one-learning.ts`

#### Documentation Category (5 files) - COMPLETE ✅
69. `documentation/jsdoc-patterns-learning.ts`
70. `documentation/todo-patterns-learning.ts`
71. `documentation/deprecation-learning.ts`
72. `documentation/example-code-learning.ts`
73. `documentation/readme-structure-learning.ts`

#### Performance Category (6 files) - COMPLETE ✅
74. `performance/lazy-loading-learning.ts`
75. `performance/code-splitting-learning.ts`
76. `performance/debounce-throttle-learning.ts`
77. `performance/memoization-learning.ts`
78. `performance/caching-patterns-learning.ts`
79. `performance/bundle-size-learning.ts`

#### Security Category (7 files) - COMPLETE ✅
80. `security/input-sanitization-learning.ts`
81. `security/rate-limiting-learning.ts`
82. `security/csrf-protection-learning.ts`
83. `security/sql-injection-learning.ts`
84. `security/xss-prevention-learning.ts`
85. `security/csp-headers-learning.ts`
86. `security/secret-management-learning.ts`

#### Auth Category (6 files) - COMPLETE ✅
87. `auth/token-handling-learning.ts`
88. `auth/middleware-usage-learning.ts`
89. `auth/permission-checks-learning.ts`
90. `auth/rbac-patterns-learning.ts`
91. `auth/resource-ownership-learning.ts`
92. `auth/audit-logging-learning.ts`

#### Accessibility Category (6 files) - COMPLETE ✅
93. `accessibility/aria-roles-learning.ts`
94. `accessibility/keyboard-nav-learning.ts`
95. `accessibility/alt-text-learning.ts`
96. `accessibility/semantic-html-learning.ts`
97. `accessibility/focus-management-learning.ts`
98. `accessibility/heading-hierarchy-learning.ts`

---

## Key Design Principles

### 1. Learn, Don't Enforce
Drift learns what patterns the user's codebase actually uses, then flags deviations from those patterns.

### 2. All Detectors Are Learning-Based
Even security, auth, and accessibility detectors are learning-based because:
- Drift detects **inconsistencies**, not "best practices"
- If a team consistently uses a pattern, Drift learns it
- Deviations from the team's established patterns are flagged

### 3. No Hardcoded "Correct" Values
Instead of:
```typescript
if (casing !== 'kebab-case') { /* violation */ }
```

We do:
```typescript
const learnedCasing = conventions.conventions.urlCasing?.value;
if (currentCasing !== learnedCasing) { /* violation */ }
```

---

## Next Steps

1. ✅ Created learning infrastructure (`LearningDetector`, `LearningStore`)
2. ✅ Created proof-of-concept (`route-structure-learning.ts`)
3. ✅ Transformed ALL detectors to learning-based versions
4. 🔄 Update CLI to run learning phase before detection
5. 🔄 Add `drift learn` command to manually trigger learning
6. 🔄 Wire learning detectors into the main detection pipeline
