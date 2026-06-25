---
title: Vulnhub—LazySysAdmin1
---

# Vulnhub—LazySysAdmin1

## Target VM Information

### Download Link

https://download.vulnhub.com/lazysysadmin/Lazysysadmin.zip

### VM Description

The story of a lonely and lazy sysadmin who cries himself to sleep

### Goal

Obtain root privileges and the flag.

### Runtime Environment

Target VM: NAT connection. The target VM obtains an IP automatically.

Attacker machine: Widows11, kali linux2021.1

### Hints

- Enumeration is key
- Try Harder
- Look in front of you
- Tweet @togiemcdogie if you need more hints

## Information Gathering

### Target Discovery and Port/Service Identification

```shell
# Determine the target VM IP
arp-scan -l
# Determine open ports and service versions on the target VM
nmap -p1-65535 -sV -A -oN lazy1.txt 192.168.160.191
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(2).png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(1).png)

According to the scan results, the target has ports `22`, `80`, `139`, `445`, `3306`, and `6667` open, and its IP is `192.168.160.201`.

Visit the web service page. It is a static page and does not contain any useful information.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(3).png)

Use `dirb` to brute-force directories on the target:

```shell
dirb http://192.168.100.200
```

The target articles use WordPress, and phpMyAdmin and a phpinfo page are also present.

Visit `http://192.168.100.200/wordpress` and find that the username hint is `togie`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(4).png)

`/phpmyadmin`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(5).png)

`/phpinfo`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(6).png)

## Vulnerability Discovery

`wpscan` scanning and username enumeration/brute forcing did not reveal anything useful.

Gather target site information:

```shell
enum4linux 192.168.160.201
```

At this point things felt rather stuck. It looked like there were no vulnerabilities, so brute forcing seemed like the only option. Then I remembered the target had Samba enabled and tried anonymous access. Nice, it worked.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(7).png)

View the folders:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(8).png)

Connect directly and inspect each file, or pull the files out for code auditing.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(9).png)

Credentials were found. Based on the WordPress username discovered earlier, the likely credentials are `togie:12345`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(10).png)

Try logging in over SSH. Success!

Try privilege escalation with `sudo -i`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(11).png)

Success.

View the flag:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Lazysysadmin%20(12).png)

That's it???

At this point, penetration of the target VM is complete.
