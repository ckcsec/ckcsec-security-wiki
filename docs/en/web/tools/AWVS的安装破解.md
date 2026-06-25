---
title: AWVS Installation
---

# AWVS Installation

Acunetix Web Vulnerability Scanner (AWVS) is a classic commercial vulnerability scanning tool.

## Download Links

The tools in this article are all from Pwn3rzs's channel. Respect to the predecessor for sharing resources selflessly. For later updates, refer directly to the channel.

Channel: https://t.me/Pwn3rzs

Windows:

https://ponies.cloud/scanner_web/acunetix/Acunetix-v24.4.240514098-Windows-Pwn3rzs-CyberArsenal.rar

Linux:

https://ponies.cloud/scanner_web/acunetix/Acunetix-v24.4.240514098-Linux-Pwn3rzs-CyberArsenal.7z

Password: Pwn3rzs

## Installation

### Windows

Install by clicking through the installer.

Activation process:

1. Add the following content to `C:\Windows\System32\drivers\etc\hosts`.

```
127.0.0.1  erp.acunetix.com
127.0.0.1  erp.acunetix.com.
::1  erp.acunetix.com
::1  erp.acunetix.com.

192.178.49.174  telemetry.invicti.com
192.178.49.174  telemetry.invicti.com.
2607:f8b0:402a:80a::200e  telemetry.invicti.com
2607:f8b0:402a:80a::200e  telemetry.invicti.com.
```

3. Use the `wvsc.exe` file from the folder to overwrite the file with the same name under `C:\Program Files (x86)\Acunetix\24.4.240514098\`.

4. Delete all files under `C:\ProgramData\Acunetix\shared\license\`.

5. Move `license_info.json` and `wa_data.dat` from the folder into `C:\ProgramData\Acunetix\shared\license`, replacing the files with the same names. Select both files and set their permissions to read-only.

Restart the computer, then start AWVS to complete the process.

### Linux

1. Add the following content to `/etc/hosts`.

```bash
127.0.0.1 erp.acunetix.com
127.0.0.1 erp.acunetix.com.
::1 erp.acunetix.com
::1 erp.acunetix.com.

192.178.49.174 telemetry.invicti.com
192.178.49.174 telemetry.invicti.com.
2607:f8b0:402a:80a::200e telemetry.invicti.com
2607:f8b0:402a:80a::200e telemetry.invicti.com.
```

2. Run the shell script to install.

```bash
sudo bash acunetix_xxxxx.sh
```

3. After installation, stop the service with the following command:

```bash
sudo systemctl stop acunetix
```

4. Replace the `wvsc` file.

```bash
sudo cp wvsc /home/acunetix/.acunetix/v_240514098/scanner/wvsc

sudo chown acunetix:acunetix /home/acunetix/.acunetix/v_240514098/scanner/wvsc

sudo chmod +x /home/acunetix/.acunetix/v_240514098/scanner/wvsc
```

5. Add the license files.

Be careful when copying and pasting; a mistake may damage the entire operating system.

```bash
sudo cp license_info.json /home/acunetix/.acunetix/data/license/
sudo cp wa_data.dat /home/acunetix/.acunetix/data/license/
sudo chown acunetix:acunetix /home/acunetix/.acunetix/data/license/license_info.json
sudo chown acunetix:acunetix /home/acunetix/.acunetix/data/license/wa_data.dat
sudo chmod 444 /home/acunetix/.acunetix/data/license/license_info.json
sudo chmod 444 /home/acunetix/.acunetix/data/license/wa_data.dat
sudo chattr +i /home/acunetix/.acunetix/data/license/license_info.json
sudo chattr +i /home/acunetix/.acunetix/data/license/wa_data.dat
```

6. Restart Acunetix.

```bash
sudo systemctl start acunetix
```

7. Log in to the application again and it should be ready to use.

### macOS

For Linux and macOS, Docker installation is recommended.

The x86 image can also run on M-series chips.

Pull the image:

```bash
docker pull quay.io/hiepnv/acunetix
```

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240620000341793.png)

Setup and activation:

```lua
docker volume create acunetix_data
```

```bash
docker run -d -p 3443:3443 --restart=unless-stopped --name=acunetix_web quay.io/hiepnv/acunetix
```

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240620000426927.png)

## Login Information

Visit:

https://127.0.0.1:3443/

Username: `admin@acu.com`

Password: `Passw0rd!`

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240620002507533.png)

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240620003725576.png)
