---
title: Vulstudy Lab
---

# Vulstudy Lab

Vulstudy is a project that collects popular vulnerability training platforms and packages them as Docker images. This makes it easier to set up environments quickly, saves deployment time, and lets you focus on learning the vulnerabilities. It includes the following vulnerable platforms:

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bac-1.png)

The following sections describe the environment setup process in detail.

## 1. Download Docker

```zsh
# Install Docker
apt-get install docker.io
# Install pip3
apt-get install python3-pip
# Install docker-compose
pip3 install docker-compose
# Download the vulstudy project, equivalent to cloning a Git repository
git clone https://github.com/c0ny1/vulstudy.git
```

## 2. Configure Docker

Because Docker pulls images from overseas sources by default, image downloads can be very slow. Configure a domestic image accelerator. Here, you can directly visit [Alibaba Cloud Container Registry]( https://cr.console.aliyun.com/ ) and follow the configuration documentation for your own system.

![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bac-2.png)

After the configuration is complete, image pulls from domestic mirrors will be accelerated.

## 3. Usage

### 3.1 Run a Single Lab

```zsh
# Enter the lab directory you want to run
cd vulstudy/vulnerability-directory
# Start the container
docker-compose up -d
```

Open the browser built into Kali and visit `127.0.0.1`, or use the host browser to visit Kali's IP address, and you can access the lab you just started.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bac-3.png)

If you do not want to keep using it, stop the container:

```zsh
# Stop the container 
docker-compose stop 
```

### 3.2 Run Everything

(If you start everything at once, there may be port conflicts. Enter each lab's configuration file and adjust the corresponding ports as needed.)

```shell
cd vulstudy
# Start the container
docker-compose up -d 
# Stop the container
docker-compose stop
```

OK. Now you can happily move back and forth among more than a dozen labs.

## 4. Error Fixes (Continuously Updated)

When bWAPP is started for the first time, the following error may appear:

```
Connection failed: Unknown database ‘bWAPP’
```

Visit `127.0.0.1/install.php`, or `ip/install.php`, to install the database.
![](https://cdn-zhiji-icu.oss-cn-hangzhou.aliyuncs.com/2021/bac-4.png)
After installation, visit `127.0.0.1` or Kali's IP again. The username is `bee`, and the password is `bug`.
