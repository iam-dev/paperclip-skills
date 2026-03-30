# Code Review: User Authentication Endpoint (`auth.py`)

## Critical Issues

### 1. SQL Injection Vulnerability
**Severity: Critical**

The query is built using an f-string with unsanitized user input:

```python
query = f"SELECT * FROM users WHERE username='{username}' AND password='{hashlib.md5(password.encode()).hexdigest()}'"
```

The `username` value is interpolated directly into the SQL string. An attacker can supply a crafted username such as `' OR '1'='1' --` to bypass authentication entirely. This must use parameterized queries instead:

```python
query = "SELECT * FROM users WHERE username=? AND password=?"
cursor.execute(query, (username, hashed_password))
```

### 2. Use of MD5 for Password Hashing
**Severity: Critical**

MD5 is cryptographically broken and unsuitable for password hashing. It is fast to compute, making brute-force and rainbow table attacks trivial. Passwords should be hashed with a purpose-built algorithm such as `bcrypt`, `argon2`, or `scrypt`, which include salting and configurable work factors.

```python
# Recommended: use bcrypt
from bcrypt import hashpw, checkpw, gensalt
hashed = hashpw(password.encode(), gensalt())
```

### 3. Passwords Stored as Unsalted Hashes
**Severity: Critical**

The code computes `md5(password)` and compares it directly against the database. This means passwords are stored without a per-user salt. Identical passwords produce identical hashes, and the entire table is vulnerable to precomputed rainbow table attacks.

### 4. Insecure Token Generation
**Severity: Critical**

The authentication token is generated as `md5(username)`. This is deterministic and publicly derivable -- anyone who knows a username can forge the token. Tokens should be generated using a cryptographically secure random source:

```python
import secrets
token = secrets.token_hex(32)
```

## High-Severity Issues

### 5. No Input Validation
**Severity: High**

`request.form['username']` and `request.form['password']` will raise a `KeyError` (resulting in a 400 error with a stack trace) if either field is missing. Use `request.form.get()` with validation, or handle the `KeyError`:

```python
username = request.form.get('username')
password = request.form.get('password')
if not username or not password:
    return jsonify({'status': 'error', 'message': 'Missing credentials'}), 400
```

### 6. Database Connection Never Closed
**Severity: High**

The `sqlite3` connection is opened but never closed, leading to resource leaks. Use a context manager:

```python
with sqlite3.connect('app.db') as conn:
    cursor = conn.cursor()
    # ...
```

### 7. No Rate Limiting or Brute-Force Protection
**Severity: High**

The endpoint has no mechanism to limit login attempts. An attacker can make unlimited requests to guess credentials. Consider adding rate limiting (e.g., `flask-limiter`) and account lockout after repeated failures.

## Medium-Severity Issues

### 8. Hardcoded Database Path
**Severity: Medium**

The database path `'app.db'` is hardcoded. This should be configurable via environment variables or application configuration to support different environments (development, testing, production).

### 9. No HTTPS Enforcement
**Severity: Medium**

There is no indication that HTTPS is required. Credentials submitted over plain HTTP are sent in cleartext and can be intercepted. The endpoint should reject non-HTTPS requests or the application should enforce TLS at the deployment layer.

### 10. Lack of Logging
**Severity: Medium**

Failed and successful login attempts are not logged. Authentication events should be logged (without logging passwords) for audit trails and intrusion detection.

### 11. Information Leakage via Timing
**Severity: Medium**

The query-based approach reveals whether a user exists based on response time differences. A constant-time comparison pattern would be more secure.

## Summary

This endpoint contains multiple critical security vulnerabilities that make it unsuitable for production use. The most urgent issues are the SQL injection vulnerability, the use of MD5 for password hashing, and the deterministic token generation. All three must be fixed before this code is deployed. Beyond those, the endpoint lacks fundamental defensive measures including input validation, rate limiting, connection management, and logging.
