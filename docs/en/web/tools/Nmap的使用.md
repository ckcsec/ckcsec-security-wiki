---
title: Using Nmap
---

# Using Nmap

## Basics

```bash
nmap 192.168.0.100 # single target
nmap 192.168.0.100 192.168.0.105 # multiple individual targets
nmap 192.168.0.100-110 # continuous range
nmap 192.168.0.100/24 # all addresses in the target's subnet
nmap 192.168.0.100/24 -exclude 192.168.0.105 # scan all addresses in the subnet except the excluded target
nmap -iL C:\Users\zhiji\desktop\targets.txt # scan all target addresses in a file
nmap 192.168.0.100/24 -excludefile C:\Users\zhiji\desktop\targets.txt # scan targets except those listed in a file
nmap 192.168.0.100 -p 21,22,23,80 # specify ports
nmap --traceroute 192.168.0.105 # route tracing
nmap -sP 192.168.0.100/24 # online status of the C-class subnet; host discovery
nmap -O 192.168.0.105 # fingerprinting; identify target operating system version
nmap -A 192.168.0.105 # scan target OS information and perform traceroute
nmap -sV 192.168.0.105 # service versions for open ports
nmap -sF -T4 192.168.0.105 # probe firewall status: open, filtered, closed, or unrecognized
```



## Advanced

1. Authentication and weak password checks

```bash
nmap --script=auth 192.168.0.105
```

2. Brute forcing

```bash
nmap --script=brute ip
```

3. Vulnerability scanning

```bash
nmap --script=vuln ip
```

4. Application service scanning (VNC, MySQL, Telnet, Rsync)

```bash
nmap --script=realvnc-auth-bypass ip # VNC service example
```

5. LAN service discovery

```bash
nmap -m -p 445 --script=broadcast ip
```

6. WHOIS parsing

```bash
nmap -script external baidu.com
```
