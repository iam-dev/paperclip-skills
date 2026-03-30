# Adversarial Review: auth.py Login Endpoint

---

# Stage 1: Finder Report

**Scope**: 1 file changed (`auth.py`)
**Issues found**: 8

## Issues

### F-001: [Security] — SQL Injection via string interpolation
- **File**: `auth.py:11`
- **Severity**: BLOCKER
- **Category**: security
- **Evidence**: `query = f"SELECT * FROM users WHERE username='{username}' AND ..."` — user-supplied `username` is interpolated directly into the SQL string via f-string. An attacker can submit `' OR 1=1 --` as the username to bypass authentication entirely.
- **Why it matters**: Full authentication bypass. Attacker gains access to any account. Potential for data exfiltration, table drops, or arbitrary SQL execution.

### F-002: [Security] — MD5 used for password hashing
- **File**: `auth.py:11`
- **Severity**: BLOCKER
- **Category**: security
- **Evidence**: `hashlib.md5(password.encode()).hexdigest()` — MD5 is cryptographically broken. It is fast to brute-force (billions of hashes/second on modern GPUs), has known collision attacks, and is explicitly unsuitable for password storage.
- **Why it matters**: If the database is compromised, all passwords can be cracked in minutes. Industry standard requires bcrypt, scrypt, or argon2 with per-password salts.

### F-003: [Security] — No password salting
- **File**: `auth.py:11`
- **Severity**: BLOCKER
- **Category**: security
- **Evidence**: The MD5 hash is computed directly from the password with no salt: `hashlib.md5(password.encode()).hexdigest()`. Identical passwords produce identical hashes, enabling rainbow table attacks.
- **Why it matters**: Rainbow tables for unsalted MD5 are freely available. Every user with the same password shares the same hash, making bulk cracking trivial.

### F-004: [Security] — Predictable/forgeable authentication token
- **File**: `auth.py:13`
- **Severity**: BLOCKER
- **Category**: security
- **Evidence**: `hashlib.md5(username.encode()).hexdigest()` — the auth token is simply the MD5 hash of the username. An attacker who knows any username can forge a valid token without authenticating.
- **Why it matters**: Complete authentication bypass. Any user's session can be hijacked by computing `md5(username)`. Tokens should be cryptographically random (e.g., `secrets.token_hex()`) or use a signed JWT.

### F-005: [Security] — Unvalidated user input (no input sanitization)
- **File**: `auth.py:7-8`
- **Severity**: WARNING
- **Category**: security
- **Evidence**: `username = request.form['username']` and `password = request.form['password']` — no validation of input length, type, or character set. No check that the keys exist (will raise 400 on missing key, but with a raw traceback).
- **Why it matters**: Missing keys cause unhandled `KeyError` (500 error with stack trace leak). No length limits enable abuse (extremely long inputs for DoS or buffer-related issues).

### F-006: [Logic] — Database connection never closed
- **File**: `auth.py:9-12`
- **Severity**: WARNING
- **Category**: logic
- **Evidence**: `conn = sqlite3.connect('app.db')` is opened but `conn.close()` is never called, nor is a context manager (`with`) used. On repeated requests, connections accumulate.
- **Why it matters**: Connection leak. Under sustained load, the process exhausts available file descriptors or SQLite connection limits, causing the endpoint to fail.

### F-007: [Logic] — Passwords stored/compared as plaintext hashes in DB
- **File**: `auth.py:11`
- **Severity**: WARNING
- **Category**: logic
- **Evidence**: The query compares `password='{hashlib.md5(...)}'` directly in SQL. This implies passwords are stored as unsalted MD5 hashes in the database. This is both a storage design issue and means the comparison happens in the query rather than in application code.
- **Why it matters**: Doing the hash comparison in SQL rather than application code makes timing attacks easier and prevents migration to proper password hashing (bcrypt) without a database migration.

### F-008: [Performance] — New database connection per request
- **File**: `auth.py:9`
- **Severity**: SUGGESTION
- **Category**: performance
- **Evidence**: `conn = sqlite3.connect('app.db')` creates a brand new connection on every login request. No connection pooling.
- **Why it matters**: Connection creation has overhead. Under high login traffic, this becomes a bottleneck. Should use a connection pool or Flask's `g` object.

---

# Stage 2: Adversary Report

**Findings reviewed**: 8
**Killed**: 0
**Survived**: 7
**Disputed**: 1

## Challenges

### F-001: SURVIVE
**Reason**: This is a textbook SQL injection vulnerability. The f-string directly interpolates user input into the query with no parameterization, no escaping, and no ORM. There is no upstream validation, no WAF mentioned, and no framework-level protection — Flask does not sanitize form inputs. This is unambiguously exploitable.

### F-002: SURVIVE
**Reason**: MD5 is categorically unsuitable for password hashing. This is not debatable — NIST, OWASP, and every security standard prohibit MD5 for passwords. There is no context in which MD5 password hashing is acceptable in 2026.

### F-003: SURVIVE
**Reason**: The lack of salting is a separate, compounding issue from the choice of MD5. Even if they switched to SHA-256 (still not ideal), the lack of salt would remain a vulnerability. This is a distinct finding.
**Note**: Severity is correct at BLOCKER given the combined impact with F-002.

### F-004: SURVIVE
**Reason**: The token being `md5(username)` is deterministic and publicly derivable. Usernames are often public information (displayed in UI, in URLs, in emails). Any observer can forge any user's token. There is no signing, no expiry, no server-side session validation mentioned. This is a complete auth bypass.

### F-005: DISPUTED
**Finder's argument**: No input validation on username/password. Missing keys cause unhandled KeyError with stack trace exposure.
**Adversary's counter**: Flask returns a 400 Bad Request automatically when `request.form['key']` raises a KeyError in debug=False mode (production). The stack trace leak only occurs in debug mode, which should never be enabled in production. Input length limits are a hardening concern, not a vulnerability per se — the SQL injection (F-001) is the real issue with input handling.
**Key question**: Is the lack of explicit input validation a WARNING-level issue when Flask already handles the missing-key case in production mode, and the real input-handling vulnerability is already captured by F-001?

### F-006: SURVIVE
**Reason**: The connection leak is real. There is no `conn.close()`, no `with` block, no `finally` clause. While Python's garbage collector may eventually close the connection, relying on GC for resource cleanup is a well-known anti-pattern, especially in long-running web servers.
**Note**: Agree with WARNING severity — it will cause issues under load but is not an immediate security hole.

### F-007: SURVIVE
**Reason**: Doing the password comparison in SQL is genuinely problematic. It prevents adopting proper password hashing (bcrypt/argon2 do not produce the same hash twice for the same input, so SQL comparison is impossible with proper hashing). It also leaks timing information through the database engine.
**Note**: Consider downgrading to SUGGESTION — the core hashing issues are already captured by F-002 and F-003. This is more about design than an independent vulnerability.

### F-008: SURVIVE
**Reason**: The connection-per-request pattern is a real performance concern, though SQLite is somewhat unique in that connections are lightweight (it is a file, not a network connection). However, the Finder correctly rated it as SUGGESTION, which is appropriate.
**Note**: Agree with SUGGESTION severity.

## Summary
- Finder accuracy: 7/8 = 87.5% (confirmed real, pending dispute)
- False positive rate: 0/8 = 0%

---

# Stage 3: Referee Verdict

**Total findings reviewed**: 8 (from Finder)
**Adversary killed**: 0
**Adversary survived**: 7
**Disputed to referee**: 1

## Disputed Rulings

### F-005: REAL ISSUE — severity downgraded to SUGGESTION
**Finder said**: No input validation; missing keys cause unhandled KeyError with stack trace; no length limits.
**Adversary said**: Flask handles missing keys with 400 in production mode; stack trace only leaks in debug mode; length limits are hardening, not vulnerability; real input issue is captured by F-001.
**Referee ruling**: REAL ISSUE, but the Adversary's points are substantially correct. Flask does return 400 on missing form keys in production. The stack trace concern is valid only in debug mode. However, the complete absence of input validation (length limits, character restrictions, type checking) is still a legitimate concern — it represents defense-in-depth failure and makes the endpoint fragile. A principal engineer would comment on this but would not block the PR for it alone (the SQL injection is the blocker).
**Final severity**: SUGGESTION

## Spot-Check: Survived Issues

**F-002 (MD5 for passwords)**: Confirmed. MD5 is unsuitable for password hashing — this is universally agreed upon in the security community. BLOCKER is the correct severity.

**F-006 (Connection leak)**: Confirmed. No close, no context manager. WARNING is appropriate — it is a real resource leak but not a security vulnerability.

## Severity Adjustments

### F-005: WARNING → SUGGESTION
**Reason**: Flask handles the missing-key case in production, and the primary input handling vulnerability is captured by F-001. The remaining concern (length limits, character validation) is defense-in-depth hardening, not a standalone vulnerability.

### F-007: WARNING → SUGGESTION
**Reason**: The Adversary's point is valid — the core password hashing issues are captured by F-002 and F-003. The SQL-comparison pattern is a design smell that blocks migration to proper hashing, but it is not an independent security vulnerability beyond what F-002/F-003 already describe. A principal engineer would note it as a design improvement, not block on it separately.

## Final Issue List

The definitive list of real issues that must be addressed:

| ID | File | Severity | Category | Description |
|----|------|----------|----------|-------------|
| F-001 | auth.py:11 | BLOCKER | security | SQL injection via f-string interpolation of user input |
| F-002 | auth.py:11 | BLOCKER | security | MD5 used for password hashing — cryptographically broken |
| F-003 | auth.py:11 | BLOCKER | security | No password salting — enables rainbow table attacks |
| F-004 | auth.py:13 | BLOCKER | security | Auth token is md5(username) — deterministic and forgeable |
| F-005 | auth.py:7-8 | SUGGESTION | security | No input validation (length, type, character set) |
| F-006 | auth.py:9 | WARNING | logic | Database connection never closed (resource leak) |
| F-007 | auth.py:11 | SUGGESTION | logic | Password comparison in SQL prevents migration to proper hashing |
| F-008 | auth.py:9 | SUGGESTION | performance | New database connection per request, no pooling |

## Verdict: NEEDS CHANGES

**BLOCKERS**: 4
**WARNINGS**: 1
**SUGGESTIONS**: 3

This endpoint has critical security vulnerabilities that make it unsafe to deploy. The four blockers (SQL injection, MD5 hashing, no salting, forgeable tokens) each independently represent a severe security flaw. Together, they indicate the authentication system needs to be redesigned from the ground up using established security practices:

1. **Parameterized queries** (or an ORM) to eliminate SQL injection
2. **bcrypt/argon2** with per-password salts for password hashing
3. **Cryptographically random tokens** (e.g., `secrets.token_hex()`) or signed JWTs for session management
4. **Connection management** via context managers or connection pooling

## Debate Metrics

- **Finder accuracy**: 8/8 = 100% (all findings confirmed as real issues)
- **False positive rate**: 0/8 = 0%
- **Adversary accuracy**: 8/8 = 100% (0 incorrect kills, 7 correct survives, 1 correct dispute)
- **Severity adjustments**: 2 (F-005 WARNING→SUGGESTION, F-007 WARNING→SUGGESTION)
