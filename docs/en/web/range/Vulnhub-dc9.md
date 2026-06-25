---
title: Vulnhub-dc9
---

# Vulnhub-dc9

## Target VM Information

### Download Link

[https://www.vulnhub.com/entry/dc-9,412/](https://www.vulnhub.com/entry/dc-9,412/)

### Goal

Obtain root privileges and the flag.

### Runtime Environment

Target VM: NAT mode. The target VM obtains an IP automatically.
Attacker machine: windows10, kali linux2021.1

## Information Gathering

### Target Discovery

```shell
arp-scan -l
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(19).png)

### Port and Service Identification

Use `nmap` to scan all ports from `1` to `65535`, perform service fingerprinting, and save the scan results to a `.txt` file:

```shell
nmap -p1-65535 -A 192.168.160.200 -oN dc9.txt
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(18).png)

Target host ports and services found:

```shell
PORT   STATE    SERVICE VERSION
22/tcp filtered ssh
80/tcp open     http    Apache httpd 2.4.38 ((Debian))
|_http-server-header: Apache/2.4.38 (Debian)
|_http-title: Example.com - Staff Details - Welcome
```

After scanning, port `22` is detected but filtered, indicating that SSH does exist but something is blocking it internally. Port `80` and the Apache httpd service are open.

## Vulnerability Discovery

Start with port `80` and access it in the browser. The homepage is shown below.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(17).png)

Visit the homepage menu items one by one. Nothing useful is found, but a search box is discovered.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(16).png)

SQL injection may exist. To test SQL injection in this search box, enter anything in the search form and send the request by clicking the search button. Intercept the request packet with Burp Suite.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(15).png)

Copy the intercepted POST request into a text file and name it `sql.txt`. This is done so the intercepted request can be used with `sqlmap`. Use `sqlmap` to check whether the search form is vulnerable to SQL injection. If SQL injection exists, it will dump the target's databases.

```shell
sqlmap -r sql.txt --dbs --batch
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(14).png)

The databases `information_schema`, `Staff`, and `user` are successfully dumped, confirming SQL injection. Next, continue using SQLmap to dump database contents. Because `sqlmap` does not allow multiple databases to be used at the same time, first enumerate the `Staff` database.

```shell
sqlmap -r sql.txt -D Staff --dump-all --batch
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(13).png)

The staff database contains two tables. The first table consists of email IDs, phone numbers, first names, last names, and user positions. The second table consists of usernames and password hashes. The username is "**admin**", which suggests this may be an important account.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(12).png)

Before cracking the hash, enumerate the other database as well: the `users` database. Use `sqlmap` in a similar way as before, changing the database name in the `-D` parameter:

```python
sqlmap -r sql.txt -D users --dump-all --batch
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(11).png)

Return to the hash and decrypt it directly at [https://hashes.com/en/decrypt/hash](https://hashes.com/en/decrypt/hash).

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(10).png)

The cracked password is `transorbital1`.

Now that we have the administrator password, there is an admin tab containing a login verification page. Enter the newly cracked password. After logging in, management and record-adding functions appear. What catches the eye is the footer: it now says "file does not exist". This means a file included in the footer is now missing or misplaced, which suggests a file inclusion vulnerability may exist here.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(9).png)

Test it with the most common file inclusion URL parameter. Insert a test parameter in the URL followed by the `welcome.php` file. Add `?file=` so it points to a local file on the server. Try finding the `/etc/passwd` file, and it is accessible. This proves that a file inclusion vulnerability exists.

```
?file=../../../../../../../etc/passwd
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(8).png)

Use the file inclusion vulnerability to read different files on the target machine. Eventually, `knockd.conf` is found. This means port knocking is involved. An `openSSH` sequence is configured there. Record this sequence and knock the SSH ports in this order to bring SSH up.

Use `nc` for port knocking. Be sure to knock in order.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(6).png)

Now that SSH is available, a password is needed to enter. Try the same credentials used on the web service, but they do not work. Use the user database dumped by `sqlmap` earlier to create two dictionaries for SSH brute forcing: `user.txt` and `pass.txt`.

After creating the `user.txt` and `pass.txt` dictionaries, use Hydra to brute-force the SSH service on the target machine. After a few attempts, user `janitor` is found to have SSH access.

```
hydra -L user.txt -P pass.txt 192.168.160.200 ssh
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(5).png)

After logging in successfully, inspect directory files and their permissions. A hidden directory named "**secrets-for-putin**" is found.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(4).png)

Use `cd` to enter the newly discovered hidden directory. List everything in this directory again and find a text file named `passwords-found-on-post-it-notes.txt`. Use `cat` to read the `.txt` file and obtain a list of passwords.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(3).png)

Edit the `pass.txt` file above and append the newly found passwords to it. Run Hydra brute force again. This time, some additional valid login accounts and passwords are found.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(2).png)

```
fredf:B4-Tru3-001
```

After logging in as user `fredf`, check what sudo privileges this user has. It can run a program named `test` as root without entering any password.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(1).png)

Inspect the `test` program. It is a simple data append program. It takes two files as arguments, then appends the contents of the first file to the second file.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1 (22).png)

## Privilege Escalation

To escalate privileges, create a new user with root access and use the `test` file to create that user's ID in `/etc/passwd`. First create a user and its password hash. This can be done with `openssl`. First create a user named `ckc` with a blank password and obtain the hash.

```shell
openssl passwd -1 -salt ckc
```

Add the username, a colon (`:`), and `:0:0::` to create an ID that can act as the root user. After that, use the `echo` command to create a file named `getflag` in `/tmp`. Then use the `test` program found earlier to append the user hash we just created in `getflag` to `/etc/passwd`. After that, log in as the user `ckc` we created. Because the password was set to blank, just press Enter.

```shell
echo 'ckc:$1$ckc$GVTd2x3Qys1gVqT2FSw6Z/:0:0::/root:/bin/bash' >> /tmp/getflag
sudo ./test /tmp/getflag /etc/passwd
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(21).png)

Privilege escalation succeeds and the flag is obtained.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/vulnhub-dc9-1%20(20).png)
