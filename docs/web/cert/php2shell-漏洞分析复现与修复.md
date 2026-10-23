---
title: PHP2Shell：PHP 核心内存破坏致未认证远程代码执行（CVE-2026-109618 / CVE-2026-109619）
---

# PHP2Shell：PHP 核心内存破坏致未认证远程代码执行（CVE-2026-109618 / CVE-2026-109619）

## 0. **核心结论** 

- 概述：两个位于 **PHP 解释器内核（Core）** 的远程代码执行漏洞，合称 **PHP2Shell**。官方评级 **CVSS v4.0 = 9.2（Critical）**，无需任何认证、不要求上层应用本身存在传统代码漏洞（但部分 CVE-2026-109619 利用路径需要应用执行特定的解码/会话操作来消费 stale state）。
- **触发过程**：攻击者构造特定的 `multipart/form-data` HTTP 请求，让 PHP 在**解析请求体阶段**触发内存耗尽（OOM）或致命错误，使 worker 进程保留「指向已释放内存」的内部状态；同一 worker 处理后续请求时复用这段失效状态，形成**跨请求 use-after-free / 类型混淆**，最终劫持执行流。
- **影响范围**：所有通过 Web 对外提供 PHP 服务的运行环境（`mod_php`、`PHP-FPM`、`php-cgi`、`FrankenPHP`、`LiteSpeed`），受影响版本可追溯至 **PHP 5.4（2012 年）**。官方仅对仍在维护的 **8.2 / 8.3 / 8.4 / 8.5** 分支发布修复版本。**注意**：这里的「受影响」指运行了存在缺陷的 PHP 内核，**不等于所有 SAPI 都已有同等成熟、无条件的一键 RCE**——公开利用链的成熟度与触发条件随 SAPI / 版本 / 应用行为差异很大（见 §2.2 与 §3.4）。
- **修复方案**：升级到 **8.2.35 / 8.3.36 / 8.4.27 / 8.5.12** 并**重启所有 worker**，是唯一彻底的修复手段；临时缓解只能降低部分路径的可利用性，不能替代补丁。

---

## 1. 漏洞概述与真伪辨别

### 1.1 事件时间线（截至 2026-10-22）

| 时间（UTC） | 事件 |
|---|---|
| 2004 | Stefan Esser 披露第一个 PHP「memory_limit」远程漏洞（本次漏洞的祖师爷级前身） |
| 2020 | PHP Bug #78876 报告「multipart 长变量导致 OOM 且临时文件未清理」，当时未重视 |
| 2024 | OSTIF / Quarkslab 外部审计重新发现同源 OOM 问题，但**利用未被证实**，未修复 |
| 2026-08-01 | Calif 独立发现多条 RCE 路径；随后 OpenAI、Wiz 加入协同披露 |
| 2026-08-11 | Calif 向 PHP 报告第一个 bug，启动协同披露 |
| 2026-08-24 | Wiz 向 PHP 报告漏洞 |
| 2026-10-20 | **细节提前泄露**，原定 10-22 的披露被迫提前 |
| 2026-10-21 07:43 | Cloudflare 报告观察到**早期攻击尝试** |
| 2026-10-21 14:00 | PHP 发布修复版本并公开披露（Calif / Wiz / OpenAI 同步发布技术分析） |

> 辨别真伪的关键点：事件初期社区流传「CVSS 10.0」的说法**不实**，官方对两个 CVE 的评级均为 **CVSS v4.0 9.2**；官方公告、GHSA 通告、补丁提交三者互相印证，漏洞**真实存在且 PoC 已公开**。

### 1.2 权威信息来源（交叉验证）

- PHP 官方安全公告：`https://www.php.net/archive/2026.php#2026-10-21-5`
- GitHub 安全通告（官方）：
  - `GHSA-w8hw-w9fx-j79w`（CVE-2026-109618，OOM 状态损坏）
  - `GHSA-6wmf-4rv5-p3rp`（CVE-2026-109619，跨请求陈旧全局状态）
- 官方补丁提交：`php-src` commit `3584a98bda`（「Avoid state corruption via bailout」，改动 389 个文件、+10,759 / -988 行，作者 Arnaud Le Blanc 等）
- 深度分析：Calif《A tale of two PHP remote vulnerabilities》、Wiz《PHP2Shell: AI uncovers critical RCE…》

---

## 2. 实际影响范围

### 2.1 受影响版本

| PHP 分支 | 受影响 | 首个修复版本 | 官方支持状态 |
|---|---|---|---|
| 8.5 | < 8.5.12 | **8.5.12** | 维护中 |
| 8.4 | < 8.4.27 | **8.4.27** | 维护中 |
| 8.3 | < 8.3.36 | **8.3.36** | 维护中 |
| 8.2 | < 8.2.35 | **8.2.35** | 安全支持至 2026-12-31 |
| 8.1 及更早 / 7.x / 5.x | 受影响（最早可追溯 5.4） | **无官方更新** | 已 EOL |

> PHP 8.1 及更早版本不再获得官方更新。官方为**源码自编译**用户提供了最小 backport 分支：`PHP-7.4-CVE-2026-109618-109619`、`PHP-8.0-…`、`PHP-8.1-…`；各发行版 / LTS 厂商（Ubuntu ESM、Remi、CloudLinux、TuxCare、ZendPHP 等）也陆续提供了回移植包。

### 2.2 不同部署方式的风险差异（重要）

漏洞在 PHP **内核层**，与运行方式无关，但不同 SAPI 的利用成熟度不同：

| 部署方式 | CVE-2026-109618 | CVE-2026-109619 | 说明 |
|---|---|---|---|
| Apache `mod_php` | **已证实 RCE** | **已证实 RCE** | 风险最高：单请求即可在应用代码执行前触发 |
| `PHP-FPM` | 源码分析受影响，完整 RCE 未完全证实 | **已证实 RCE**（依赖应用内的一次解码/会话操作） | 现代主流部署方式 |
| `FrankenPHP` / `LSAPI` | 源码分析怀疑受影响 | 默认配置下未确立早期 consumer | 条件性 |

> 注：表中「已证实 RCE」指 PHP 官方 advisory / Wiz / 9bie 等公开研究在**特定版本 + 应用场景**下的验证结论（具体条件见各源），**并非每种 SAPI 都已有同等成熟、无条件的一键 RCE**；FrankenPHP / LSAPI 的 exploit surface 尚未完全确立，属「条件性受影响」。

**关键差异**：`mod_php` 在请求启动失败后仍会执行 `php_request_shutdown` 并复用 worker，使失效状态可被下一请求消费；`PHP-FPM` 在启动失败时会直接退出 worker，因此 OOM 型路径（618）在 FPM 上难以直接利用，但「应用代码执行后」发生的 fatal（619 的 FPM 路径）仍可使 worker 存活并复用失效状态。

### 2.3 真实暴露面（规模参考）

PHP 在「已知服务端语言的网站」中长期占比约 70%（W3Techs）。漏洞位于内核，因此 WordPress、Drupal、Joomla、MediaWiki、Laravel、Symfony、ThinkPHP、Discuz 等框架**无法通过「自身代码无漏洞」排除底层 PHP Runtime 风险**（具体是否可达还取决于 PHP 版本 / 配置 / SAPI）。国内威胁情报团队的 FOFA 测绘显示（作为排查优先级参考，不代表全部可被利用）：

| 应用/框架 | 全球资产 | 国内资产 |
|---|---|---|
| WordPress | 7226 万 | 88.7 万 |
| Drupal | 169.7 万 | 6.08 万 |
| Joomla | 100.0 万 | 1.27 万 |
| Laravel | 40.6 万 | 6.57 万 |
| ThinkPHP | 57.3 万 | **44.4 万** |
| Discuz | 24.1 万 | **17.9 万** |

> 说明：以上 FOFA 测绘数字（源自国内威胁情报团队公开报告，查询口径约 2026-10-21/22）用于**资产排查优先级**而非「可利用主机数量」；存在指纹误报、重复资产、CDN/代理遮蔽、版本不可见等偏差，且「框架暴露量」与「框架是否直接可被利用」无关——漏洞在 PHP 内核层。

> 现实中的连锁反应：荷兰政府多个站点（DigiD、MijnOverheid、议会网站、NCSC 等）、人力资源 SaaS BambooHR 等在补丁发布前后主动下线规避风险；Cloudflare / watchTowr 在发布前后即观察到在野利用尝试。

---

## 3. 漏洞成因（完整分析）

### 3.1 根因：OOM 触发的 `longjmp` 中断了「发布状态 → 回滚清理」

PHP 在一次请求处理中，若内存分配失败或发生其它致命错误，会通过 `zend_bailout()`（`longjmp`）**跳转**出当前执行流，跳过中断点之后本该执行的初始化 / 清理 / 回滚代码。由此产生两类独立缺陷：

- **CVE-2026-109618（请求内状态损坏）**：OOM `longjmp` 后，请求内部数据结构可能**只初始化到一半**；`request shutdown` 仍把这份「半成品」当作有效对象去析构 / 访问，导致内存破坏。
- **CVE-2026-109619（跨请求陈旧全局状态）**：worker 进程的全局状态（`session`、`last_fatal_error_backtrace`、`unserialize` 记账等）持有指向**请求堆**的指针；正常情况下应先重置这些全局、再释放请求堆。若 fatal 打断了扩展的 `RSHUTDOWN`，重置被跳过，但请求堆仍被释放 → **悬空指针**。同一 worker 的下一请求在正常初始化之前访问这些过期指针 → **use-after-free**。

### 3.2 这条利用链具体怎么走（本复现所采用）

> 说明：php2shell 是「OOM 中断状态清理」这个根因下的**多个变体**。本节复现的是「9bie 链」（send_cookie 失败 + Set-Cookie 堆泄露 + 伪造 HashTable），与 jackalsyn 研究的 `BG(serialize)/BG(unserialize)` 序列化上下文 orphan 是**不同原语**——差异详见 §3.4。
>
> 补充（版本线澄清）：9bie 仓库实际有**两条线**——当前主线（`pure`）声称在官方 `php.ini-production`（`display_errors=Off`、`memory_limit=128M`）下 5/5 RCE、**不依赖 `display_errors=On`**；本文所用脚本是基于其**早期 legacy 线**（`display_errors=On`、`memory_limit=8M` 那套，已被作者归档到 `archive/legacy-8m/`）改造的 v2 版本。两者原语同源（send_cookie 失败 + Set-Cookie 泄露 + 伪造 HashTable），但**前提条件不同**，请勿混为一谈。

本复现使用公开的「9bie」链，只发纯 HTTP 流量，全部流量类型为 `multipart/form-data`：

- **前提条件**：`mod_php`（prefork）；PHP 8.3.17+/8.4.4+/8.5.x（`send_cookie` 在失败时不清零的版本区间，源于 GH-17541 的改动）；`display_errors=On`（本文所用早期链显式依赖，见 §3.2 说明）；`session.upload_progress.enabled=On`（PHP upstream 默认）；单 worker（仅用于提高复现稳定性，官方确认正常多 worker prefork 同样可利用、只是可靠性下降）。
- **关键机理（为什么可打）**：`session.upload_progress` 的 RFC1867 回调会在 **PHP 模块正式激活之前（pre-RINIT）** 就初始化 Session，把 `PS(id)` / `PS(http_session_vars)` 等全局指针指向**当前请求堆**。若后续 multipart 解析在此阶段 OOM 中断，`END` 回调与 Session 的 `RSHUTDOWN` 均被跳过，请求堆被释放，而 `mod_php` 的 worker 存活 → 全局悬空。

**分阶段利用链（stage 0–3）：**

1. **stage 0 · worker 轮转**：用超大 / 畸形请求让目标 worker 崩溃（`SIGSEGV` / `Abort`），prefork 拉起一个**布局干净**的新 worker，保证后续堆布局可预测。
2. **stage 1 · 堆基址泄露（绕过 ASLR）**：`A1` 请求用「1000+ 字段 + `PHP_SESSION_UPLOAD_PROGRESS` + 文件字段 + 130MB 大字段」触发 OOM，把 `PS(id)` 打成悬空；`B1` 请求（无文件字段）走 `END` cleanup，读取悬空的 Session ID 并把**已释放堆内存** URL 编码进 `PHPSESSID` 响应 Cookie → 从 cookie 里统计出 Zend MM chunk 基址。
3. **stage 2 · libphp 基址泄露**：同样的制造 → 读取，但这次 `Set-Cookie` 数据从 `PS(id)+0x18` 开始，等于 HashTable 的 `nNextFreeElement|pDestructor`，其中 `pDestructor = &zval_ptr_dtor` → 解出 `libphp.so` 基址。
4. **stage 3 · 伪造 HashTable → 劫持 `zif_system`**：用「伪造 reference」覆盖 `PS(http_session_vars)`，再投放一个**伪造 HashTable**，把 `pDestructor` 指向 `zif_system`、`arData` 指向伪造的 `execute_data`（`num_args=1`，参数为 `IS_STRING` 的命令字符串）。Session cleanup 析构数组时，把「析构函数」当成 `zif_system` 调用 → **执行任意命令**（以 `www-data` 身份）。

> 版本相关性：上述 `+0x18`、`zif_system`、`zval_ptr_dtor`、`pDestructor` 等偏移与结构布局**仅针对本文所测 PHP 8.4.26 官方镜像（amd64）**，随 PHP 版本 / 编译选项 / 架构不同而变化，**不是 PHP ABI 固定值**。

> 通俗说：**先把内存地址偷出来（两次 cookie 泄露），再往进程里塞一个假的 PHP 内部对象，让 PHP 的「清理函数」误以为自己在析构数组，实则是调用了 `system()`。**

### 3.3 官方补丁怎么修的

补丁 `3584a98bda` 的核心是「**Avoid state corruption via bailout**」：

- 把「OOM 时 `zend_bailout`」改为更安全的 **`UnwindExit`** 语义；
- **正确重置**各种可能在请求启动阶段被访问的全局状态；
- 新增**硬性内存上限（hard memory limit）**：在无法安全恢复的内存耗尽场景下终止进程（官方表述为「达到即终止、`shutdown` handler 不执行」），而不是留下可被复用的损坏状态；因此升级后需复核 `memory_limit` / `post_max_size` 对业务的影响。

这解释了为什么修复是从根因层面覆盖当前已知的同类 bailout/state-corruption 路径（而不是只堵单条 PoC），并显著降低相同错误模式继续产生利用原语的可能性。

### 3.4 同一根因、多个变体：社区公开研究的分歧与收敛（重要交叉验证）

围绕 php2shell，公开研究**并非人人一致复现 RCE**。独立研究者 jackalsyn（J4ck3LSyN）在发布 PoC 后公开**纠正了自己最初的结论**，这段自纠对理解「这个洞到底有多容易打」很有价值：

- 他最初提出的「cached-pointer（Bug S）链」被自己证伪为 **DEAD**：`session.c:3213` 的 `Z_TRY_ADDREF(progress->data)` 会让数组一直存活，**不存在 free，也就没有 UAF**，该路径自评 CVSS **0.0**。
- 他确认的**真正原语**是 `BG(serialize)` / `BG(unserialize)` 两个**序列化上下文全局**的 pre-RINIT OOM 孤儿化：`php_session_rfc1867_callback` 在 `php_hash_environment` 内、在 `zend_activate_modules` 与 basic 扩展 `RINIT`（`basic_functions.c:393-395` 清零）**之前**运行，OOM bailout 后 `level=1`、`data` 悬空，下一请求复用 → `var.c:756` 的 `data->n += 1`（ASAN 确认 heap-use-after-free）。
- 但他的结论是：**这条 surface（session.upload_progress 的 serialize/unserialize 上下文）在他验证的版本（mod_php 8.2.34 / 8.1.2，Debian 12 / Ubuntu 22.04，glibc 2.36）下是 memory-safety UAF，不是 RCE**，自评 CVSS **5.3 Medium**，且**仅 prefork（mod_php / php -S）可达**，FPM/CGI/LSAPI 不可达。

这与 Wiz/Calif 的 RCE 结论、以及我们下文在 **8.4.26** 上的实打实 RCE **并不矛盾**——因为这是**同一个根因（OOM 中断状态清理）下的多个变体**：

| 变体 | 原语 | 版本/前提 | 结论 |
|---|---|---|---|
| Wiz/Calif 的 4 个 bug | fatal-error backtrace UAF、OPcache type confusion、upload-progress unserializer UAF + 内存泄露 | 多版本 | RCE（WordPress / Drupal / Joomla） |
| 9bie 链（本文复现） | send_cookie 失败不清零 + Set-Cookie 堆泄露 + 伪造 HashTable | 8.3.17+ / 8.4.4+ / 8.5.x，mod_php，display_errors=On | **RCE（本文验证）** |
| jackalsyn 修正链 | BG(serialize/unserialize) 上下文 orphan | 8.2.34 / 8.1.2，prefork，glibc 2.36 | memory-safety UAF（CVSS 5.3，非 RCE） |

**要点**：RCE 的可行性**强依赖版本 / SAPI / 堆布局 / 具体原语**，并非「任意环境一键打穿」。这恰恰印证了官方「补丁是唯一彻底修复」的判断——根因级别的问题存在多个可被逐个挖掘的变体。

> 关于 CVE 归属：两个 CVE 是 PHP 项目按**底层错误模式**（618 = OOM corruption、619 = stale global state）归并的，**不是按组件名划分**。按 Wiz 的公开映射，「upload-progress unserializer UAF + 进程内存泄露」归在 **CVE-2026-109618**，「fatal-error backtrace UAF + OPcache type confusion」归在 **CVE-2026-109619**；`session.upload_progress` 这个组件会出现在多条具体原语中，不能简单认为「session 路径都属于 619」。

---

## 4. 复现

### 4.1 复现环境

| 项 | 值 |
|---|---|
| 目标镜像 | `php:8.4.26-apache`（官方，Debian 12 / Apache 2.4.69） |
| SAPI | Apache `mod_php`，prefork，**单 worker**（`MaxRequestWorkers=1`） |
| PHP 配置 | 默认：`display_errors=On`、`memory_limit=128M`、`post_max_size=8M`、`session.upload_progress.enabled=On`、`max_input_vars=1000` |
| 攻击机 | 仅标准库 Python 3，纯 HTTP 原始 socket 构造请求 |
| 偏移 | `zif_system=0x465370`、`zval_ptr_dtor=0x65eb60`（8.4.26 官方镜像符号） |

> 环境说明：以上是**官方 `php:8.4.26-apache` 镜像的默认配置**（未挂载自定义 `php.ini`，`display_errors=On` 为 PHP 编译内置默认值）。本文所用脚本基于 9bie 早期公开链（legacy，`display_errors=On` 依赖）改造；9bie 当前主线则宣称在官方 `php.ini-production`（`display_errors=Off`、`memory_limit=128M`）下同样可达 RCE——两者前提条件不同（见 §3.2 说明）。

### 4.2 复现结果（未认证 RCE）

一条命令即可完成「堆泄露 → 基址泄露 → 伪造对象 → 命令执行」，在本文实验环境中一次尝试即以 `www-data` 身份落地（exploit 本身存在概率性，见 §4.4）：

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/02-%E5%A4%8D%E7%8E%B0RCE.png)

- 攻击者无需账号 / Cookie / 后台入口即可执行任意命令；换 `uname -a` 二次执行同样命中，结果通过「相对路径重定向到网站根目录」后 `GET /x` 回读成功。
- 该链同时具备**内存泄露**能力（把 worker 内存读到 `PHPSESSID` Cookie，类似 Heartbleed），可窃取同一进程内其它请求的口令、Token、API Key，乃至私钥等进程内敏感材料。

### 4.3 补丁对照 + 已公开利用链的可观测特征（检测）

- **补丁生效**：在 `php:8.4.27-apache`（偏移按 8.4.27 重提取）上重放同一链，第一阶段堆泄露原语即无法命中（`HEAP_LEAK_FAILED`），无法继续 RCE——印证官方补丁从根因阻断。
- **已公开利用链的可观测特征**：Apache 错误日志频繁 `child pid N exit signal Abort/Segmentation fault`、`long lost child came home`；异常超大/畸形 `multipart` 请求（字段数逼近 `max_input_vars`）；异常巨大的 `PHPSESSID` / `Set-Cookie` 响应（**尤其针对 session-upload-progress / 内存泄露类公开链**，OPcache / backtrace 等变体未必产生大 Cookie）；worker 高 churn / 反复重启。

### 4.4 本链的限制（客观说明）

- **本文 PoC 仅针对 mod_php/prefork**：FPM 在本链下打不通（startup 失败杀 worker）；这不代表 PHP2Shell 整体只影响 mod_php（FPM 的 619 路径官方已证实可 RCE，见 §2.2）。
- **本文所用脚本（早期链）依赖 `display_errors=On`**：这条链靠 `max_input_vars` 警告制造 `headers_sent`。注意 9bie 的**当前主线**已宣称在官方 `php.ini-production`（`display_errors=Off`）下 5/5 RCE、不依赖该配置；因此「关闭 `display_errors`」只对本条早期链有效，**不能当作通用缓解**（官方同样明确：隐藏 diagnostics 不能解决底层问题）。
- **命令长度 ≤ 14 字节（本文 PoC 单次 `zif_system` 载荷限制）**：由 167 字节伪造结构布局决定，短命令直接执行、长命令需 `sh<file` 分步；**这是本 PoC 的工程限制，不代表漏洞本身存在 14 字节能力上限**。
- **有概率性**：单条命令不一定一次成功，脚本内需重试 3–5 次；多 worker 环境需用 dummy 请求把流量轮转回同一 worker。
- 前置 WAF 可能拦截（chunked / 1001 字段特征明显），但绕过思路公开。

---

## 5. 全面的修复方案

### 5.1 终极修复：升级 + 重启（唯一彻底方案）

```bash
# 确认当前实际服务进程的 PHP 版本（不是命令行 php -v）
# 方式1：phpinfo() / info.php 查看
# 方式2：从响应头看（若未关 expose_php）
curl -sI https://your-host/ | grep -i x-powered-by
```

1. **升级到修复版本**：`8.2.35` / `8.3.36` / `8.4.27` / `8.5.12`（或更高）。
   - 源码 / 发行版：从 php.net、各 Linux 发行版安全源、官方容器镜像获取。
   - **不要只看版本号**：发行版会「回移植」补丁到旧版本号，务必 `grep CVE-2026-109618` 包 changelog 确认。
2. **重启所有 worker**（最容易被漏掉的一步）：
   - `mod_php`：`systemctl restart apache2`（或 httpd）；
   - `PHP-FPM`：`systemctl restart php8.3-fpm`（换成实际版本）；
   - 常驻 CLI 进程（队列 worker、守护脚本、面板 PHP）：逐一重启。
3. **容器环境**：仅重启容器无效，必须**用新 PHP 版本重新构建镜像**并全量滚动更新。

### 5.2 EOL 版本（8.1 及更早）怎么办

- 优先：**迁移到受支持分支**。
- 无法立即迁移：使用**发行版 / LTS 厂商回移植包**（如 Ubuntu Pro/ESM、Remi、CloudLinux、TuxCare ELS、ZendPHP LTS），或官方**源码 backport 分支**自行编译（`PHP-7.4/8.0/8.1-CVE-2026-109618-109619`）。
- 官方 Docker `php` 镜像对 8.1 及更早**不提供**修复。

### 5.3 临时缓解（仅应急，不能替代补丁）

> 下列措施只降低特定路径的可利用性，**无法完全消除风险**，升级完成后应及时移除 / 回滚。

| 措施 | 覆盖 | 副作用 / 注意 |
|---|---|---|
| `session.upload_progress.enabled = 0` + 重启 | 阻断 619 的 session 路径 | 在 `php.ini`/FPM pool/服务器配置层面设，**不能用 `ini_set`/`.user.ini`** |
| `memory_limit = -1` | 阻断 618 的 PHP 内存上限失败路径 | 移除内存上限 → 内存耗尽/DoS 风险；配 cgroup `memory.max` 兜底；**禁止用 `RLIMIT_AS`/`RLIMIT_DATA` 替代**（会触发同款失败路径） |
| `fatal_error_backtraces = 0`（仅 8.5） | 阻断 8.5 fatal backtrace 路径 | 只覆盖该路径 |
| 调低 `post_max_size`（官方临时建议示例：无上传需求 8M、有上传需求 32M，并确保 `upload_max_filesize < post_max_size`）、限制请求大小/字段数/嵌套深度（Web 服务器或代理层） | 降低可控内存压力 | 需同时覆盖无 `Content-Length` 的 chunked 请求 |
| 边界 WAF / 代理拦截异常 `multipart`、chunked 上传 | 减缓攻击 | 仅辅助；Cloudflare 等已发布规则，只保护经过它的流量 |

### 5.4 无效措施（务必别误以为有用）

- ❌ `disable_functions` / `open_basedir`：这些是 **PHP 用户态脚本执行 / 文件访问限制**，不能修复 PHP Runtime 的内存破坏；即便它们可能对某些具体 post-exploitation 动作形成约束（例如 9bie 链最终仍要调用 `zif_system`），也**不能当作该漏洞的安全边界或替代补丁**。
- ❌ 仅修改应用代码 / 升级 WordPress 等应用：漏洞在内核，与上层应用无关。
- ❌ 关 `display_errors`：能降低部分链的成功率，**不是**防护。
- ❌ 封 SSH 端口：攻击入口是 80/443。
- ❌ 只 `php -v` 判断「已升级」：命令行二进制与正在服务的进程不是一回事。

### 5.5 升级后注意事项

补丁新增了**硬性内存上限（hard memory limit）**：在无法安全恢复的内存耗尽场景下终止进程、`shutdown` 处理函数不执行。升级后需复核：

- `memory_limit` 与 `post_max_size`、预期请求大小之间的匹配；
- 复杂表单的 `max_input_nesting_level`；
- 若升级前用了 `memory_limit=-1`，需按最终官方建议恢复合理值。

### 5.6 验证「修复是否真的生效」

```bash
# 1) 确认运行中进程加载的 PHP 版本（不是命令行）
#    访问 info.php / phpinfo()，或在容器内对运行进程查模块
# 2) 确认包确实含 CVE 修复（发行版回移植场景）
zgrep CVE-2026-109618 /usr/share/doc/php8.3-common/changelog.Debian.gz   # Debian/Ubuntu
rpm -q --changelog php-common | grep CVE-2026-109618                    # RHEL 系
# 3) 业务回归 + 资产清单核对，确保无遗漏实例
```

### 5.7 检测与应急（若怀疑已被利用）

- **日志**：关注超大/畸形 multipart 请求 + 内存错误 + 反复 500；异常大的 `PHPSESSID` 响应（upload-progress / 内存泄露类链特征）；worker 反复重启。
- **进程**：`php-fpm` / `httpd` 拉起的异常子进程（`sh`、`bash`、`python`、`curl`、`wget`、`nc`）、`/dev/tcp/`、`mkfifo` 等反弹 shell 特征，以及 `fsockopen` 等函数与异常外联目标、shell payload 组合出现；`whoami`/`id`/`uname -a` 等侦察命令。
- **文件**：web 根目录新落文件（webshell）、新增 cron/计划任务、新增账号。
- **处置**：隔离主机、保全 Web/PHP 日志、搜 webshell，**轮换 PHP 进程可读到的所有口令 / Token / API Key / Session secret / 云凭据 / 私钥**（内存泄露已可能使其暴露）。

---

## 6. 结论

PHP2Shell 是典型的「**底层内存安全问题被 AI 时代显著降低利用门槛**」的标志性事件：漏洞代码存在十余年，但把「OOM 中断 → 状态损坏 → 跨请求 UAF → 伪造对象 → 任意代码执行」这条链做成可落地 exploit，传统上需要较强的内存安全、堆布局与 PHP 内核经验，AI 辅助研究正在显著降低这种分析与迭代成本。**这再次说明：框架 / 应用自身安全 ≠ 运行环境安全，务必把 PHP 运行时纳入资产清点与补丁管理。**

**行动清单**：① 盘点所有 PHP 运行实例（含面板、容器、vendor 设备、Windows 打包环境）；② 互联网暴露面优先升级到 8.2.35/8.3.36/8.4.27/8.5.12 并重启；③ EOL 分支走发行版回移植或迁移；④ 短期用 `session.upload_progress.enabled=0` + 代理层限制做应急；⑤ 升级后核对 `memory_limit`/`post_max_size`，并开启日志与进程监控做一段时间的狩猎。

---

### 参考资料

- PHP 官方安全公告：https://www.php.net/archive/2026.php#2026-10-21-5
- GHSA-w8hw-w9fx-j79w / GHSA-6wmf-4rv5-p3rp：https://github.com/php/php-src/security/advisories
- 官方补丁提交 3584a98bda：https://github.com/php/php-src/commit/3584a98bda
- Calif 深度分析：https://calif.io/php2shell/
- Wiz 分析：https://www.wiz.io/blog/php2shell-php-rce
- CNCERT 风险提示：https://www.cert.org.cn/publish/main/9/2026/20261022123700555224858/20261022123700555224858_.html
- Sansec 应急指南：https://sansec.io/research/php2shell
- jackalsyn 修正分析（同一根因的 memory-safety 变体、公开自纠）：https://jackalsyn.com/posts/php-up-2026.html

> 免责声明：本文仅用于授权范围内的安全研究、自查与防护。复现均在本地自建靶场完成，请勿对未授权目标使用。
