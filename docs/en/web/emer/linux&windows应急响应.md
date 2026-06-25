---
title: Linux and Windows Incident Response
---

## Incident Response Process

After receiving a customer's notification about a host infection incident, obtain SSH remote access to the infected host from the customer, or go onsite to perform investigation.

## Notes

```
1. Understand the security incident.
• What problem is being encountered now?
• When was it discovered? How was it discovered? Who discovered it?
• Is the server abnormal? What are the specific characteristics? Did security devices raise alerts?
• What system is it? What middleware is used? What development language is used? What is the business architecture? What does the network topology roughly look like? Has the device been restarted or shut down? Is there a log server?
• What do they need me to solve?
2. Preliminary incident judgment.
• Based on the information described by the customer, form a preliminary judgment, investigation direction, and emergency response idea.
• Determine whether you can handle it yourself; if not, determine whether another colleague can handle it.
3. Do not execute commands or operations that change file attributes.
• In specific environments, file attributes can be changed, and an attacker can even modify file content without changing file attributes.
• Keep the original attributes, permissions, and owner of the sample for tracing.
• After using cp, the business may go down during recovery, so pay attention to permissions.
4. On Linux, do not run rm -rf casually.
• -f can be used, but the -rf combination must be used carefully.
• Prefer mv to remove samples.
5. When collecting samples, move them into a folder with mv.
• mkdir $HOME/sample to create a sample folder.
• mv sample $HOME/sample
6. Linux bash records only 1000 lines by default; older entries are overwritten.
• It is recommended to back up $HOME/.bash_history first.
• Or harden history handling.
7. Linux interactive terminal shells are not only bash.
• zsh
• csh
```

## Investigation Ideas and Common Commands

### Linux

**View Processes**

```
ps aux
ps -ef
pstree -aup
top
1 status of each logical CPU
b highlight
x highlight sorting column
ps aux | grep pid
```

```
lsof -i:port
-i filter keyword, such as process name, PID, USER, IPv4/IPv6, TCP/UDP

pstree -aphn
-a show command-line parameters of the process
-p show pid
-h highlight current process and parent process
-n sort by pid
```

**Network Connections**

```bash
netstat -antlp
-a show all connections and ports
-n show IP and port numerically
-t show TCP
-l show listening services
-p show process name and PID for established connections
ESTABLISHED established connection, LISTENING listening state, TIME_WAIT connection timeout

ss –antpr
-a show all connections and ports
-n do not resolve service names
-t show TCP sockets
-l show listening ports
-p show process using the listening port
-r resolve IPs to domain names

tcpdump –i eht0 -w eee.pcap
-i network interface to capture
-w filename to save
-C 100m split into another file after exceeding 100 MB
-c 10000 stop after more than 10,000 packets
src host xxx capture only traffic initiated by this host
drc host xxx capture only traffic sent to this IP address
src port xxx capture only traffic initiated by this port

# View the process file path corresponding to PID
file /proc/$PID/exe
```

**Abnormal Files**

```
ls -alth
-a show all files
-l show permissions, group, owner, size, and date
- t sort by time
-h highlight

strace -f -e trace=file executable_file
-e trace child processes
-f trace type: file, process, trace, abbrev, verbose, raw, signal, read, write, fault, inject, status, kvm

find
find path –name xxx search_filename/directory
find path -name "*.php" -exec tar -rvf sss.tar.gz {} \; • find / \( -path /etc -o -path /usr \) -prune -o -name '*.conf'
-mtime modification time
-ctime attribute or permission change time
-atime access time

grep file_content search_directory
-R search string recursively
-P use regular expression matching
-n show line number containing the string
grep -RPn "(xx.xx.xx) *\(" /var/log
grep -RPn
“assthru|shell_exec|system|phpinfo|base64_decode|chmod|mkdir|fopen|fclose|readfile|php_uname|eval|tcpflood|udpflood|edoced_46esab)
*\(" /var/www

strings
strings /usr/bin/.sshd | grep '[1-9]{1,3}.[1-9]{1,3}.' // analyze sshd file and check whether it contains IP information

file

lsattr/chattr
-a only allow appending data, not deleting
-i cannot delete, rename, set links, write, or add
lsattr malaware_file
chattr –i malaware_file
chattr +i malaware_file

hexdump
-b show output in octal
-c show output as ASCII
-C show output as hexadecimal + ASCII
```

**Backdoor Accounts**

```bash
# Mainly check accounts with uid 0.
cat /etc/passwd

# Query privileged users with uid 0.
awk -F: '$3==0{print $1}' /etc/passwd

# Query account information that can log in remotely.
awk '/\$1|\$6/{print $1}' /etc/shadow

# Check whether accounts other than root have sudo privileges. If not needed for management, remove sudo privileges from ordinary accounts.
more /etc/sudoers | grep -v "^#\|^$" | grep "ALL=(ALL)"

# Disable an account. The account cannot log in. The second field in /etc/shadow starts with !.
usermod -L user
# Delete user and delete the user directory under /home.
userdel -r user
```

**SSH Public Keys**

```
/root/.ssh/authorized_keys
```

**Login Logs**

```
 last lastb     failed logins
 lastlog        last login
```

**Startup Items**

```
more /etc/rc.local
```

**Services**

```
# View service autostart status.
chkconfig  --list
```

**Scheduled Tasks**

```
crontab -l  view scheduled tasks
crontab -e  edit scheduled tasks
crontab -r  delete scheduled tasks
crontab -u  view a user's scheduled tasks

ls -al /var/spool/cron/*
cat /etc/crontab
/etc/cron.d/*
/etc/cron.daily/*
/etc/cron.hourly/*
/etc/cron.monthly/*
/etc/cron.weekly/
/etc/anacrontab
/var/spool/cron
/var/spool/anacron

# View all files in the directory.
more /etc/cron.d/*

/etc/anacrontab
/var/spool/anacron/*
```

**System Information Investigation**

```bash
# du
-s show total
-h output statistics in suitable units
df
-u show current filesystem space usage

# lspci
-v show device details at a basic level
-vv show device details at an advanced level
-s xx:xx –vv show only bus and slot device information. xx:xx values can be obtained through lspci.

# lsusb
-v show detailed USB information
-s xx:xx –vv show only bus and device number information. xx:xx values can be obtained through lspci.
-d xx:xx show only devices for the specified vendor and product number

who show all current login information
whereis find binary file path
uname -a print system information

# last
description: list current and past system login information
log_path: /var/log/wtmp
It reads the wtmp file and displays all usernames recorded as logging into the system.

# lastb
description: list failed system login information
log_path: /var/log/btmp
It reads the btmp file under /var/log and displays all usernames recorded as failed logins.
```

```bash
# systemctl system service management command

systemctl status sshd view SSH service status
systemctl start sshd start SSH service
systemctl stop sshd stop SSH service
systemctl enable sshd enable SSH autostart
systemctl disbale sshd disable SSH autostart
service system service control command
command_usage: service 'service_name' status/start/stop/restart
```

```bash
# rsyslog log configuration
configuration_file: /etc/rsyslog.conf
configuration_directory: /etc/rsyslog.d/

# lastlog
description: show the last login information for all users
log_path: /var/log/lastlog
It displays login name, port number (tty), and last login time sorted by UID.
If a user has never logged in, lastlog displays **Never logged**.
```

**Firewall Basics**

```bash
# iptables
-t table name (raw "URL filtering", nat "address translation", filter "packet filtering", mangle "packet modification")
- L list rules in the table
-n show IP
- v show advanced information
-A add a rule to the end. It executes only when placed at the end.
-i specify network interface
-j action to execute, including but not limited to ACCEPT, DROP, RRDIRECT

systemctl start/stop/restart/status iptables start, stop, restart, and view firewall status
iptables –L INPUT/OUTPUT -n view inbound/outbound rules
iptables -D INPUT rule_number
iptables –A INPUT –s xx.xx.xx.xx/24 –p tcp –dport 22 –j ACCEPT allow only a specific subnet to connect to port 22
iptables –A INPUT –s xx.xx.xx.xx/24 –p tcp –dport 22 –j ACCEPT ban a subnet from connecting to port 22
```

```bash
# firewalld
--state firewall status
--reload reload without interrupting services
--compete-reload reload after interrupting all connections
--runtime-to-premanent permanently save added rules
--check-config check configuration
--get-log-denied view denied logs
--set-loag-denied parameter: set denied log monitoring level (all/unicats/broardcast/multicast/off)

systemctl start/stop/restart/status firewalld start, stop, restart, and view firewall status
firewalld-cmd –-state view firewall status
firewalld-cmd –-list-services view open services
firewalld-cmdd –-add-ports=22/tcp open port 22
firewalld-cmdd –-remove-ports=22/tcp close port 22
firewalld-cmd –-reload update firewall rules
```

**Whether Key System Commands Have Been Replaced**

```
Try several commands casually.
```

**Several Key Log Files**

```
SSH                        /var/log/secure
System records             /var/log/message
Scheduled task logs        /var/log/cron
All user login records      /var/log/wtmp
```

**Filesystem Tree Structure and Incident Response**

```
/bin
Short for binary.
Stores basic Linux executables such as ls, cd, and so on.
Unlike /usr/bin, this directory can run independently without mounting other filesystems, such as in single-user mode.

/usr/bin
Applications and executable binaries accessible to locally logged-in users.
Malware is generally more likely to infect files under this directory, such as ssh, top, crontab, and so on.

/sbin
Short for binary.
Stores basic Linux executables such as ls, cd, and so on.
Unlike /usr/bin, this directory can run independently without mounting other filesystems, such as in single-user mode.

/usr/sbin
Executable binaries related to system administration for locally logged-in administrative users during system startup.
This directory usually has fewer issues unless git.kernel.org itself is compromised. Commands inside include fastboot, fdisk, grub, and so on.

/usr
Short for Unix Software Resource.
The practical directory used by logged-in users when operating Linux. It contains Linux applications/executables, 64/32-bit dependency libraries, user configuration files, low-level user management programs, and header files.

/var
Can be understood as Linux's cache directory. In most cases it is mounted read-only under /usr for system cache data and application cache, such as application cache, standard libraries, locks caused by a program running (apt, yum), log files, and PID information.

/lib, /lib32, /lib64, libex32, /libexec
/lib mainly contains kernel modules, boot system files, and basic shared libraries required by Linux runtime.
/lib<qual> calls different basic shared libraries under different 32/64-bit environments.
/libx32 stores object files and libraries targeting the x32 ABI (x32 Application Binary Interface).
/libexec stores binaries not executed by users or shells. Some LFS-based products use libexec as a deployment program.
Some binary hijacking drops .so files under /lib.

/dev
Short for device.
Stores special files and device file locations.

/dev/null is a special device file in Unix-like systems. It accepts any data written to it and discards the data.

/mnt
Short for mount. Directory for mounting optical drives and USB devices.
mount /dev/nvme0n1pxx /mnt/xxxx // mount
umount /mnt/xxxx // unmount

/proc
Linux pseudo-filesystem. It stores all information about the running system, such as advanced power management, boot parameters, and device usage.
Usually we use ls –alth /proc/*/exe to view the binary file corresponding to a malicious process, or to view cases where a file has been deleted but the process is still running.

/sys
Linux pseudo-filesystem. It provides kernel, driver, and device information for Linux, including many bus types. It is somewhat similar to Windows hardware management.

/root, /home
Root user directory and ordinary user directories.
They store user shell-related configuration files, such as .bashrc, .bash_history, .ssh, .config, and profile.
There may be malicious aliases in bashrc, historical commands left by attackers in .bash_history, passwordless login for persistence in .ssh/authorized_keys, or software configuration information in .config.

/boot
Mainly stores Linux kernel files and boot loader files. Issues here are less common and exploitation is harder.

/run
This directory is a temporary filesystem that stores all information after startup.

/srv
Different from /var. It mainly stores user-generated data and external services.

/tmp
Temporary file directory. Users store temporary files here. They can be destroyed at any time or automatically by the system. Permissions are relatively low.
Because permissions are relatively low, malware or attack activity often generates or drops trojans and tools under this path.
```

**Rootkit Scanning**

Dedicated scanning tools: `chkrootkit` and `rkhunter`.

**Common Linux Tools**

NetHogs is a small "network top" tool. Unlike most tools, it does not break traffic down by protocol or subnet; it groups bandwidth by process.

`iftop` is used to view network traffic, including real-time rate, total traffic, average traffic, and more. It is a real-time traffic monitoring tool.

### Windows

**Processes**

```
# View processes
tasklist
tasklist –m |findstr "string"
-m show all exe/dll services. If no parameter is specified, all loaded modules are shown.
-svc show services for each process
-v show detailed service information for all processes

# Force-stop a process
taskkill /T /F /PID

# Obtain the full path of a process
wmic process | finderstr “xxxx”
```

**Abnormal Network Traffic**

```
# Use fistr filtering, similar to grep on Linux
netstat -antop tcp
-a show all connections and ports
-n show IP and port numerically
-t show connection state
-o show related process ID
-p TCP/UDP
> eee.txt If there are many connections, append > to output to a file, cat eee.txt |awk '{print $2}'

ESTABLISHED established connection LISTENING listening state TIME_WAIT connection timeout SYN_SENT connection request SYN_RECVD request received

# Print routing table
route print

# View network proxy configuration
REG QUERY "HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Internet Settings"
```

**Sensitive File Paths**

```
%WINDIR%
%WINDIR%/System32
%TEMP%
%APPDATA%
%LOCALAPPDATA%
%LOCALAPPDATA%\Low
%ProgramData%\Temp
%ProgramData%\Temp\Low
%UserProfile%\Recent
```

**Accounts**

Query login sessions:

```
query user
```

Log an account out of the session:

```
logoff ID
```

- Open `lusrmgr.msc` and check whether new or suspicious accounts exist.
- Use D-Shield to check whether the server has hidden accounts or cloned accounts.

**Startup Items**

```
Run -> msconfig  boot, services, tools

# View system startup time
net statistics workstation

# View system scheduled tasks
schtasks /query /fo LIST /v

# View program startup information
wmic startup get command,caption

# View host service information
wmic service list brief
```

**Scheduled Tasks**

Some malware often writes scheduled tasks to maintain persistence or lateral movement.

Command-based: Run -> `tasksch.msc`

Tool-based: Autoruns, or This PC -> right-click Computer Management -> Task Scheduler

**System Logs**

```
win +r eventvwr.msc
```

Or use Computer Management -> Event Viewer for event log analysis.

**For Windows event log analysis, different EVENT IDs have different meanings**

| Event ID | Description                                      |
| :------- | :----------------------------------------------- |
| 4624     | Successful login                                 |
| 4625     | Failed login                                     |
| 4634     | Successful logoff                                |
| 4647     | User-initiated logoff                            |
| 4672     | Login with a superuser such as Administrator     |
| 4720     | User created                                     |

**Every successful login event marks a login type. Different login types represent different methods**

| Login Type | Description                         | Explanation                                                     |
| :--------- | :---------------------------------- | :-------------------------------------------------------------- |
| 2          | Interactive                         | User logs in locally.                                           |
| 3          | Network                             | Most commonly seen when connecting to a shared folder or printer. |
| 4          | Batch                               | Usually indicates a scheduled task started.                     |
| 5          | Service                             | Each service runs under a specific user account.                |
| 7          | Unlock                              | Screensaver unlock.                                             |
| 8          | NetworkCleartext                    | Password is transmitted in cleartext over the network, such as FTP. |
| 9          | NewCredentials                      | A program is run with the RUNAS command using the /Netonly parameter. |
| 10         | RemoteInteractive                   | Access through Terminal Services, Remote Desktop, or Remote Assistance. |
| 11         | CachedInteractive                   | Login as a domain user without a domain controller available.    |

**Whether System Patches Are Complete**

```bash
# cmd
systeminfo

# Tools and online addresses
https://i.hacking8.com/tiquan
https://github.com/bitsadmin/wesng
```

**Other Investigation Items**

Is antivirus software functioning abnormally?

Are there abnormal driver files under `C:\Windows\System32\drivers`?

What logs are recorded, including web logs?

**Image Hijacking**

Reference document: https://ssooking.github.io/2019/12/windows%E5%90%8E%E9%97%A8-%E6%98%A0%E5%83%8F%E5%8A%AB%E6%8C%81/

**Tools**

**Several official Microsoft tools**

For details, search online or refer to the previous Security Service Engineer manual.

autoruns  https://docs.microsoft.com/en-us/sysinternals/downloads/autoruns

tcpview   https://docs.microsoft.com/en-us/sysinternals/downloads/tcpview

procexp   https://docs.microsoft.com/en-us/sysinternals/downloads/process-explorer

Network Monitor [https://www.microsoft.com/en-us/download/confirmation.aspx?id=4865](https://www.microsoft.com/en-us/download/confirmation.aspx?id=4865)

**Huorong Sword**

**Kaspersky** and Dr.Web: no installation required, no conflict with other antivirus software, and not easily blocked from starting by malware.

**Wireshark** is excellent for packet capture. It can capture application, presentation, session, transport, network, and data-link layer traffic.

```
ip.addr==  match address (source/destination) packets
tcp.port== match TCP port
http.request.uri=="xxx" match specified URL
http.host == "domain"   match packets for a domain
```

Detailed tutorial: https://gitlab.com/wireshark/wireshark/-/wikis/CaptureFilters

**Browser Network Analysis**

Use the F12 inspection feature for webpage tampering analysis. It can be replaced by Burp Suite or Wireshark. Determine where webpage redirects happen based on the loading order and timing of webpage files, JavaScript, and CSS.

### WebShell Investigation

> Common detection methods include host-based traffic, file, and log detection, keyword matching for dangerous functions, semantic analysis, and more.

Web log audit: `access.log` (`/var/log/nginx`)

Use tools to scan and kill web directories.

Windows: D-Shield - http://www.d99net.net/down/WebShellKill_V2.0.9.zip

Linux: Hippo - https://www.shellpub.com/

Tool-based scanning is unreliable, so manually inspect parseable and executable files under the web directory.

Web access log analysis can quickly locate the webshell path.

**Incident Response Process for Websites Implanted with WebShells**

Focus mainly on web logs and check for abnormal HTTP visits. If source code is available, file comparison can quickly locate the webshell. Be sure to use source code backed up by the customer; never operate directly on the main source code.

- Locate time and scope: scan webshell locations; identify file creation time; check the `.htaccess` file under the web root.
- Web log audit: for example, check `access.log` (`/var/log/nginx`) and download it locally for audit.
- Vulnerability analysis: analyze possible vulnerable locations and reproduce the vulnerability that led to shell upload.
- Vulnerability remediation: remove the webshell, fix the vulnerability, and harden the system and web application.
