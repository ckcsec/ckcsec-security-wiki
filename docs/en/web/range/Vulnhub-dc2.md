---
title: Vulnhub-dc2
---

# Vulnhub-DC2

## Target VM Information

### Download Link

[https://download.vulnhub.com/dc/DC-2.zip](https://download.vulnhub.com/dc/DC-2.zip)

### Target VM Introduction

Very similar to DC-1, DC-2 is another purpose-built vulnerable lab designed to help people gain experience in penetration testing. Like the original DC-1, it was designed with beginners in mind. Linux skills, familiarity with the Linux command line, and experience with some basic penetration testing tools are required. Just like DC-1, there are five flags, including the final flag. Once again, just like DC-1, the flags are important for beginners, but not so important for experienced people.

### Goal

Boot to root

### Runtime Environment

Target VM: NAT mode. The target VM obtains an IP automatically.

Attacker machine: Windows10, kali linux2021.1

## Information Gathering

### Target Discovery

```bash
arp-scan-l
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(11).png)

The target VM IP is successfully found: `192.168.160.193`.

### Port and Service Identification

Use `nmap` to scan all ports from `1` to `65535`, perform service fingerprinting, and save the scan results to a `.txt` file:

```shell
nmap -p1-65535 -A 172.20.10.7 -oN dc2.txt
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(12).png)

Target VM ports and services found:

```shell
# Port protocol backend service
TCP 80 HTTP APache httpd 2.4.10(debian)
tcp 7744 SSH Openssh 6.7p1
```

### Homepage Information Gathering

Try visiting port `80`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(7).png)

The entered IP address changes into a domain name, so this is initially guessed to be domain redirection. Open `/etc/hosts`, configure it, and add the following content.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(1).png)

Visit again, and the target homepage is successfully accessed.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(77).png)

A page titled `Flag` is found. Click it, successfully find the first flag, and get a hint to use CeWL. CeWL is a tool that crawls a specified URL to collect words, which can be added to a password dictionary to improve the success rate of password cracking tools.

<img src="https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(18).png" alt="" style="zoom:50%;" />

### Directory Scanning

```shell
dirb http://dc-2
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(4).png)

Try visiting multiple discovered directories and find the WordPress backend login page: `http://dc-2/wp-admin`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(3).png)

## Penetration Phase

### Generate a Dictionary with CeWL

Based on the previous hint to use `cewl`, scan directly and generate a dictionary: `pass.dic`

```shell
cewl http://dc-2/ -w pass.dic
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(17).png)

### wpscan Enumeration and Brute Force

The password dictionary has been obtained. Because the target VM uses WordPress, use `wpscan` directly to enumerate usernames, obtain a username dictionary, and then brute-force the backend page found above.

```bash
wpscan --url http://dc-2/ -e u
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(5).png)

Enumeration succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(14).png)

Write the three enumerated usernames into `user.dic`, the username dictionary, and use `wpscan` to brute-force:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(16).png)

```bash
wpscan --url http://dc-2/ -U user.dic -P pass.dic
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(19).png)

The brute force succeeds, obtaining two usernames and passwords:

```bash
jerry / adipiscing
tom / parturient
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(20).png)

Log in to the website backend with users `jerry` and `tom`. User `jerry` logs in successfully; `Tom` does not. After logging in successfully, the second flag is found.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(10).png)

The hint says using exploits against WordPress is impossible and asks us to find another path.

### SSH Login

Try logging in to SSH on port `7744` using the usernames and passwords obtained earlier. Eventually, `Tom` logs in successfully.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(8).png)

### rbash Restriction Bypass

View the files in the current directory and find the third flag, but shell commands are restricted, so it cannot be viewed.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(2).png)

This is an `rbash` restriction and needs to be bypassed.

> There are many different restricted shells to choose from. Some are just ordinary shells with a few simple common restrictions and are not really configurable, such as rbash (restricted Bash), rzsh, and rksh (Korn Shell in restricted mode), all of which are very easy to bypass. Others have a full configuration set that can be redesigned to meet administrator needs, such as lshell (Limited Shell) and rssh (Restricted Secure Shell).
> Once configuration can be tightened by administrators, configurable shells are harder to bypass. Bypass techniques on these shells usually rely on the fact that administrators are somewhat forced to provide normal users with certain unsafe commands. If allowed without proper security configuration, these commands provide attackers with tools to escalate privileges and sometimes even escalate to root.
> Another reason is that administrators are sometimes Linux system administrators rather than true security professionals, so from a penetration tester's perspective they do not really understand attacker techniques and end up allowing too many dangerous commands.

After some searching, I found a fairly comprehensive bypass method. Reference: [https://fireshellsecurity.team/restricted-linux-shell-escaping-techniques/](https://fireshellsecurity.team/restricted-linux-shell-escaping-techniques/)

Bypass:

```bash
# Assign /bin/bash to variable a to bypass the initial shell
BASH_CMDS[a]=/bin/sh;a
# Use and add an environment variable, exporting /bin as a PATH environment variable
export PATH=$PATH:/bin/ 
# Export /usr/bin as a PATH environment variable
export PATH=$PATH:/usr/bin
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(15).png)

The bypass succeeds. View `flag3.txt` and obtain the third flag.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(6).png)

The hint says we need to use `su` to switch users.

Switch to user `jerry`, enter `jerry`'s directory, inspect the files, and find the fourth flag.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(13).png)

The hint says this is not the final flag and points to `git`. Check the sudo configuration with `sudo l` and find that `git` can be run as root without a password. Search for Git privilege escalation.

## Git Privilege Escalation

Use `sudo git -p help`. When the output cannot fit on one page, enter `!/bin/bash` at the bottom to complete privilege escalation.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(22).png)

`cd` into the `root` directory, view the files, find the final flag, and view it.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/Vulnhub-dc2%20(23).png)

At this point, penetration of the DC-2 target VM is complete.
