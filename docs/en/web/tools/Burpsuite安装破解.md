---
title: Burp Suite Installation
---

# Burp Suite 2020.12.1 Professional Installation

## Preface

More than three years have passed since this article was written, and many related activation resources now have bugs. The resource link is updated here. The latest tutorial has already been exported as a PDF and included inside the archive; just download and extract it.

Download link:
https://www.123pan.com/s/LPX9-ktD5v.html
Extraction code: osoX

Burp Suite is an integrated penetration testing tool with many features. Burp Suite is written in Java, so installation and use require a Java environment. The following briefly introduces its installation process.

## Setup Process

1. First extract the resource provided above and create a CMD script named `Burp Suite.cmd`.

```bash
java.exe -noverify -javaagent:BurpSuiteLoader.jar -jar burpsuite_pro_v2020.12.1.jar
```

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204155029160.png)

2. Double-click the `Burp Suite.cmd` script to run it. After opening, it prompts for a key.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204155140956.png)

2. Return to the directory and double-click `BurpSuite KeyGen By Uncia.jar`. Copy the code in `license` (right-click copy will not work here; use Ctrl+C/V), paste it into Burp Suite's key field, and click Next.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/2021020415541217.png)

3. Click Manual activation.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/2021020415553136.png)

4. Click copy request to copy the request key.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204155734746.png)

5. Paste it into the second window of the Burp Suite key generator. It will automatically generate a key in the third window.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204155707219.png)

6. Copy the key generated in the third window into the third window in Burp Suite, then click Next.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204155937281.png)

7. Finally click Finish to complete the process.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/20210204160144773.png)

8. A command window appears every time it runs, which is not very elegant, so create a small wrapper script for post-processing.

```bash
set shell = wscript.createobject("wscript.shell")
a = shell.run("""burp suite.cmd""",0)
```

![](https://img-blog.csdnimg.cn/20210204160508490.png)

9. Later, just double-click this script to run it. You can also create a desktop shortcut and change the icon for a cleaner and more convenient setup.
