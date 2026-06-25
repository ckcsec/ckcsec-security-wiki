---
title: VulnHub-Kioptrix3
---

# VulnHub-Kioptrix3

## Target VM Information

### VM Introduction

This challenge is aimed at beginners. However, it is different. More steps have been added, and new skills are required. I should add that it is still in beginner territory. As with the others, there is more than one way to "pwn" this box. Some paths are easy, and some are not so easy. Remember that whether something feels "easy" or "hard" is always related to your own skill level. I have never said these machines are especially hard or especially difficult, but we all have to start somewhere. Let me tell you, creating these vulnerable VMs is not as easy as it looks...

### Download Link

[https://download.vulnhub.com/kioptrix/KVM3.rar](https://download.vulnhub.com/kioptrix/KVM3.rar)

### Runtime Environment

This target VM provides a `VMware` image. Download it from the link above, extract it, and run the `vmx` file.

Target VM: can be set to NAT
Attacker machine: Kali 2021.1, windows 11

### Goal

get-root

## Information Gathering

Target discovery and port/service identification:

```shell
# Determine the target IP
arp-scan -l
# Port scanning and service identification
nmap -A 192.168.160.131
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(33).png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(34).png)

Analyzing the scan results shows that ports `22` and `80` are open, corresponding to the SSH service and the web service (`http`).

```
22/tcp open  ssh     OpenSSH 4.7p1 Debian 8ubuntu1.2 (protocol 2.0)
80/tcp open  http    Apache httpd 2.2.8 ((Ubuntu) PHP/5.2.4-2ubuntu5.6 with Suhosin-Patch)
    OS details: Linux 2.6.9 - 2.6.33
```

Visit the homepage:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3-1.png)

### Directory Scanning

```shell
dirb 192.168.160.131
```

The `/phpmyadmin` directory is found. Visit it:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(35).png)

The backend login page `/index.php?system=Admin` is found.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(36).png)

Observation shows the site's CMS is `Lotus CMS`.

## Vulnerability Discovery

### File Inclusion Test

Visit the web service on port `80`. There seems to be something suspicious in the URL:

```http
http://192.168.160.131/index.php?system=Blog
```

Try `system=../../../../../etc/passwd`, but there is no response.

Try `%00` null-byte truncation, and `/etc/passwd` is successfully read.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(37).png)

However, there is no file upload point, so leave this aside for now.

From the earlier probing, the target `cms` is `Lotuscms`.

Use Kali to search for related exploitable vulnerabilities:

```shell
searchsploit LotusCMS
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(41).png)

Relevant vulnerabilities are found.

Use Metasploit directly:

```shell
# Use the module
use exploit/multi/http/lcms_php_exec
# View payload options
show options
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(42).png)

Set the payload and successfully obtain a shell.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(43).png)

## Privilege Escalation

Check related files:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(44).png)

Obtain an interactive shell:

```python
python -c 'import pty;pty.spawn("/bin/bash")'
```

Enter the `gallery` directory.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(45).png)

Probe in order and find the `gconfig.php` configuration file. Use `cat` to read it.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(46).png)

The database account and password are found successfully: `root:fuckeyou`.

Try logging in to phpMyAdmin, which was found during directory scanning, and the login succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(47).png)

Open the `dev_accounts` table and find usernames and passwords.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(48).png)

After cracking the MD5 values, the passwords are obtained.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(49).png)

```shell
dreg password:Mast3r
loneferret password: starwars
```

Use these SSH users to log in. After trying, `dreg` is found to have restricted access.

Then try logging in as `loneferret`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(50).png)

A company policy file is found. Open it:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(51).png)

After using it, an error appears. Search Google.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(52).png)

Find the following:

> ht is a text editor. We can modify files inside it to obtain privileges.

```shell
Just use export TERM=xterm in the terminal
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(53).png)

Run the `sudo ht` command again.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(54).png)

After running `sudo ht`, press `F3` to operate and open `/etc/sudoers`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(55).png)

Append `/bin/bash` to the end of the `loneferret` entry, save, exit with `F3`, then press `ctrl+z`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(3).jpg)

Use `sudo -l` to confirm that `/bin/bash` can now be used. Execute `sudo /bin/bash` to obtain root privileges.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(8).png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(9).png)

Is that the end? No. Let's try another method.

## Method 2: SQL Injection

Check the official hint:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(39).png)

Following the hint, edit `/etc/hosts`.

Point the target IP to the gallery domain:

192.168.160.131 kioptrix3.com

Visit it in the browser. I then clicked the `now` hyperlink and was redirected to the gallery page.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(1).png)

Try SQL injection and start `sqlmap`. It runs for a long time without results.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(10).png)

Click `home` and try `sqlmap`, but still no result. Continue probing the other linked subpages.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(11).png)

Enter `Ligoat Press Room`; there is still no response, but a sorting option is found here. I select `Photo id` because any `id` parameter is tempting.

Use `sqlmap` again:

```python
sqlmap -u "http://kioptrix3.com/gallery/gallery.php?id=1&sort=photoid#photos"
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(12).png)

This time, `sqlmap` determines that the `id` parameter may be injectable, and the backend database appears to be MySQL.

Continue identifying existing databases:

```python
sqlmap -u "http://kioptrix3.com/gallery/gallery.php?id=1&sort=photoid#photos" -dbs
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(13).png)

View the tables under the `gallery` database:

```python
sqlmap -u "http://kioptrix3.com/gallery/gallery.php?id=1&sort=photoid#photos" -D gallery --tables
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(14).png)

View the data in the table:

```python
sqlmap -u "http://kioptrix3.com/gallery/gallery.php?id=1&sort=photoid#photos" -D gallery -T dev_accounts --dump
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/VulnHub%20-Kioptrix3%20(15).png)

Usernames and passwords are obtained successfully. The later privilege escalation steps are the same as above, so they are not repeated here.

At this point, penetration of the target VM is complete.
