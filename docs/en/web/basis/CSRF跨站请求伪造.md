---
title: Cross-Site Request Forgery (CSRF)
---

# Cross-Site Request Forgery (CSRF)

## Target

Web clients.

## Exploitation Point

The key idea in CSRF is using the victim's cookie to send forged requests to the server.

Main impacts:

Sending emails or messages in your name, stealing your account, purchasing goods, transferring virtual currency, and more.

Principle:

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240619113354663.png)

## CSRF Attack Flow

1. Log in to trusted website A and generate a local cookie.
2. Without logging out of A, visit malicious website B.

## CSRF Exploitation Methods

### GET-Based

Only one HTTP request is needed to construct a simple CSRF.

1. Link exploitation (`a` tag)
2. `iframe` exploitation

Set the iframe style to `display:none` so the content loaded in the iframe is not displayed.

1. `img` tag exploitation

The content inside an `img` tag is requested as the page loads. Therefore, the location pointed to by `src` is requested during page loading.

1. `background` exploitation

Use the `url` in a CSS `background` style to load content from a remote machine, sending an HTTP request to the URL.

### POST-Based

The impact is usually not as large as GET-based CSRF. Exploitation usually uses an auto-submitting form, for example:

```
<form name="csrf" action="http://edu.xss.tv/payload/xss/csrf2.php" method="post">
    <input type="hidden" name="name" value="zhangsan">
    <input type="hidden" name="money" value="1000">
</form>
<script type="text/javascript">document.csrf.submit();</script>
```

After visiting this page, the form submits automatically, which is equivalent to simulating a user completing a POST operation.

**CSRF detection**

Use automated detection tools such as CSRFTester or Burp's built-in CSRF POC generator.

1. Configure the browser proxy for CSRFTester as `127.0.0.1:8008`; Burp uses `8080`.

2. Log in to the web application and submit the form. Modify the form content in the CSRF tool and check whether the change succeeds. If it does, a CSRF vulnerability exists.

3. Generate a CSRF POC.

Reference: [Web Security Day 3 - CSRF Practical Attack and Defense](https://xz.aliyun.com/t/6128#toc-7)

**CSRF defenses**

- Use hash-based authentication when setting and checking cookies.
- Prefer POST parameters where possible, which reduces the chance of direct request forgery.
- Verify the HTTP `Referer` field.
- Add and verify custom attributes in HTTP headers.
- Add a token to the request URL and verify it.
- Use CAPTCHA checks for defense.
