---
title: "PHP2Shell: Unauthenticated Remote Code Execution via PHP Core Memory Corruption (CVE-2026-109618 / CVE-2026-109619)"
---

# PHP2Shell: Unauthenticated Remote Code Execution via PHP Core Memory Corruption (CVE-2026-109618 / CVE-2026-109619)

## 0. Core Conclusions

- **Overview**: two remote code execution (RCE) vulnerabilities located in the PHP interpreter core, collectively known as **PHP2Shell**. Official rating **CVSS v4.0 = 9.2 (Critical)**. They require no authentication and do not require the upper-layer application to contain any traditional code vulnerability (although some CVE-2026-109619 exploitation paths require the application to perform specific decoding/session operations to consume stale state).
- **Trigger process**: an attacker crafts a specific `multipart/form-data` HTTP request that causes PHP to trigger out-of-memory (OOM) or a fatal error during the **request-body parsing** phase, leaving the worker process retaining internal state that "points to freed memory"; when the same worker handles a subsequent request it reuses this invalid state, forming a **cross-request use-after-free / type confusion**, ultimately hijacking the execution flow.
- **Impact scope**: all PHP-serving runtime environments exposed to the web (`mod_php`, `PHP-FPM`, `php-cgi`, `FrankenPHP`, `LiteSpeed`); affected versions can be traced back to **PHP 5.4 (2012)**. The official project only released fixes for the still-maintained **8.2 / 8.3 / 8.4 / 8.5** branches. **Note**: "affected" here means running a PHP core with the underlying flaw, and **does not mean every SAPI already has an equally mature, unconditional one-click RCE** — the maturity and triggering conditions of public exploitation chains vary greatly by SAPI / version / application behavior (see §2.2 and §3.4).
- **Remediation**: upgrading to **8.2.35 / 8.3.36 / 8.4.27 / 8.5.12** and **restarting all workers** is the only thorough fix; temporary mitigations can only reduce the exploitability of some paths and cannot replace the patch.

---

## 1. Vulnerability Overview and Authenticity

### 1.1 Event Timeline (as of 2026-10-22)

| Time (UTC) | Event |
|---|---|
| 2004 | Stefan Esser disclosed the first PHP `memory_limit` remote vulnerability (the granddaddy of this flaw) |
| 2020 | PHP Bug #78876 reported "multipart long variables cause OOM and temporary files are not cleaned up", which was not taken seriously at the time |
| 2024 | OSTIF / Quarkslab external audit rediscovered the same-root OOM issue, but **exploitation was not confirmed** and it was not fixed |
| 2026-08-01 | Calif independently discovered multiple RCE paths; OpenAI and Wiz later joined the coordinated disclosure |
| 2026-08-11 | Calif reported the first bug to PHP, kicking off coordinated disclosure |
| 2026-08-24 | Wiz reported the vulnerability to PHP |
| 2026-10-20 | **Details leaked early**, forcing the originally planned 10-22 disclosure to be brought forward |
| 2026-10-21 07:43 | Cloudflare reported observing **early attack attempts** |
| 2026-10-21 14:00 | PHP released the fixed versions and publicly disclosed the issues (Calif / Wiz / OpenAI published technical analyses simultaneously) |

> Key point for verifying authenticity: the "CVSS 10.0" claim that circulated in the community early on was **false**; the official rating for both CVEs is **CVSS v4.0 9.2**. The official advisory, GHSA advisories, and patch commits corroborate each other — the vulnerabilities **are real and PoCs are public**.

### 1.2 Authoritative Sources (Cross-Verified)

- PHP official security advisory: `https://www.php.net/archive/2026.php#2026-10-21-5`
- GitHub Security Advisories (official):
  - `GHSA-w8hw-w9fx-j79w` (CVE-2026-109618, OOM state corruption)
  - `GHSA-6wmf-4rv5-p3rp` (CVE-2026-109619, cross-request stale global state)
- Official patch commit: `php-src` commit `3584a98bda` ("Avoid state corruption via bailout", 389 files changed, +10,759 / -988 lines, author Arnaud Le Blanc et al.)
- In-depth analyses: Calif "A tale of two PHP remote vulnerabilities", Wiz "PHP2Shell: AI uncovers critical RCE…"

---

## 2. Actual Impact Scope

### 2.1 Affected Versions

| PHP branch | Affected | First fixed version | Official support status |
|---|---|---|---|
| 8.5 | < 8.5.12 | **8.5.12** | Maintained |
| 8.4 | < 8.4.27 | **8.4.27** | Maintained |
| 8.3 | < 8.3.36 | **8.3.36** | Maintained |
| 8.2 | < 8.2.35 | **8.2.35** | Security support until 2026-12-31 |
| 8.1 and earlier / 7.x / 5.x | Affected (traceable to 5.4) | **No official update** | EOL |

> PHP 8.1 and earlier versions no longer receive official updates. For **self-compiled source** users, the project provides minimal backport branches: `PHP-7.4-CVE-2026-109618-109619`, `PHP-8.0-…`, `PHP-8.1-…`; various distributions / LTS vendors (Ubuntu ESM, Remi, CloudLinux, TuxCare, ZendPHP, etc.) have also successively provided backported packages.

### 2.2 Risk Differences Across Deployment Modes (Important)

The vulnerability sits in the PHP **core**, independent of how PHP is run, but the exploitation maturity differs by SAPI:

| Deployment | CVE-2026-109618 | CVE-2026-109619 | Notes |
|---|---|---|---|
| Apache `mod_php` | **RCE confirmed** | **RCE confirmed** | Highest risk: a single request can trigger it before application code runs |
| `PHP-FPM` | Source analysis shows it affected; full RCE not fully confirmed | **RCE confirmed** (requires one decode/session operation in the application) | The mainstream modern deployment |
| `FrankenPHP` / `LSAPI` | Suspected affected from source analysis | No early consumer established under default config | Conditional |

> Note: "RCE confirmed" in the table refers to verification conclusions by the PHP official advisory / Wiz / 9bie and other public research under **specific versions + application scenarios** (see each source for the specific conditions), and is **not** saying every SAPI already has an equally mature, unconditional one-click RCE; the exploit surface of FrankenPHP / LSAPI is not yet fully established and counts as "conditionally affected".

**Key difference**: `mod_php` still executes `php_request_shutdown` and reuses the worker after request startup fails, allowing the invalid state to be consumed by the next request; `PHP-FPM` directly kills the worker when startup fails, so the OOM-type path (618) is hard to exploit directly on FPM, but a fatal that occurs "after application code runs" (the FPM path of 619) can still leave the worker alive and reuse the invalid state.

### 2.3 Real Exposure Surface (Scale Reference)

PHP has long held roughly 70% share among "websites with a known server-side language" (W3Techs). Because the flaw is in the core, frameworks such as WordPress, Drupal, Joomla, MediaWiki, Laravel, Symfony, ThinkPHP, and Discuz **cannot rule out the underlying PHP runtime risk just because "their own code has no vulnerabilities"** (whether it is actually reachable also depends on the PHP version / config / SAPI). FOFA surveys by domestic threat-intelligence teams show (used as a triage-priority reference, not meaning all are exploitable):

| App/Framework | Global assets | Domestic assets |
|---|---|---|
| WordPress | 72.26M | 887K |
| Drupal | 1.697M | 60.8K |
| Joomla | 1.00M | 12.7K |
| Laravel | 406K | 65.7K |
| ThinkPHP | 573K | **444K** |
| Discuz | 241K | **179K** |

> Note: the above FOFA figures (from a public report by a domestic threat-intelligence team, query date around 2026-10-21/22) are for **asset triage priority** rather than "number of exploitable hosts"; they carry biases such as fingerprint false positives, duplicate assets, CDN/proxy masking, and version invisibility, and "framework exposure" has nothing to do with "whether the framework can be directly exploited" — the flaw is in the PHP core.

> Real-world knock-on effects: several Dutch government sites (DigiD, MijnOverheid, the parliament site, NCSC, etc.) and HR SaaS BambooHR proactively took themselves offline around patch release to mitigate risk; Cloudflare / watchTowr observed in-the-wild exploitation attempts around the release.

---

## 3. Root Cause (Full Analysis)

### 3.1 Root Cause: OOM-triggered `longjmp` Interrupts "Publish State → Rollback Cleanup"

During request processing, when a memory allocation fails or another fatal error occurs, PHP jumps out of the current execution flow via `zend_bailout()` (`longjmp`), skipping the initialization / cleanup / rollback code that should have run after the interruption point. This produces two independent defects:

- **CVE-2026-109618 (intra-request state corruption)**: after an OOM `longjmp`, the request's internal data structures may be **only half-initialized**; `request shutdown` still treats this "half-finished" object as valid and destructs / accesses it, causing memory corruption.
- **CVE-2026-109619 (cross-request stale global state)**: the worker process's global state (`session`, `last_fatal_error_backtrace`, `unserialize` accounting, etc.) holds pointers to the **request heap**; normally these globals should be reset before the request heap is freed. If a fatal interrupts the extension's `RSHUTDOWN`, the reset is skipped, but the request heap is still freed → **dangling pointers**. The next request on the same worker accesses these stale pointers before normal initialization → **use-after-free**.

### 3.2 How This Exploitation Chain Works (Used in This Reproduction)

> Note: php2shell is **multiple variants** under the same root cause ("OOM interrupts state cleanup"). This section reproduces the "9bie chain" (send_cookie failure + Set-Cookie heap leak + forged HashTable), which is a **different primitive** from jackalsyn's research on `BG(serialize)/BG(unserialize)` serialization-context orphan — see §3.4 for the differences.
>
> Supplement (version-line clarification): the 9bie repository actually has **two lines** — the current main line (`pure`) claims 5/5 RCE under the official `php.ini-production` (`display_errors=Off`, `memory_limit=128M`), **not depending on `display_errors=On`**; the script used in this article is a v2 modified from its **early legacy line** (the `display_errors=On`, `memory_limit=8M` set, which the author archived to `archive/legacy-8m/`). Both share the same primitive (send_cookie failure + Set-Cookie leak + forged HashTable), but the **preconditions differ** — do not conflate them.

This reproduction uses the public "9bie" chain, sending only plain HTTP traffic, all of type `multipart/form-data`:

- **Preconditions**: `mod_php` (prefork); PHP 8.3.17+/8.4.4+/8.5.x (the version range where `send_cookie` does not zero on failure, originating from the GH-17541 change); `display_errors=On` (explicitly depended on by the early chain used in this article, see §3.2); `session.upload_progress.enabled=On` (PHP upstream default); single worker (only to improve reproduction stability — the project confirms normal multi-worker prefork is also exploitable, just with reduced reliability).
- **Key mechanism (why it works)**: the RFC1867 callback of `session.upload_progress` initializes the Session **before the PHP module is formally activated (pre-RINIT)**, pointing globals such as `PS(id)` / `PS(http_session_vars)` to the **current request heap**. If subsequent multipart parsing OOM-interrupts at this stage, both the `END` callback and the Session `RSHUTDOWN` are skipped, the request heap is freed, and `mod_php`'s worker survives → global dangling.

**Staged exploitation chain (stage 0–3):**

1. **stage 0 · worker rotation**: use an oversized / malformed request to crash the target worker (`SIGSEGV` / `Abort`); prefork spins up a **cleanly-laid-out** new worker, making subsequent heap layout predictable.
2. **stage 1 · heap base leak (ASLR bypass)**: the `A1` request uses "1000+ fields + `PHP_SESSION_UPLOAD_PROGRESS` + file field + 130MB large field" to trigger OOM, turning `PS(id)` into a dangling pointer; the `B1` request (no file field) goes through `END` cleanup, reads the dangling Session ID and URL-encodes the **freed heap memory** into the `PHPSESSID` response cookie → derive the Zend MM chunk base from the cookie.
3. **stage 2 · libphp base leak**: same manufacture → read, but this time the `Set-Cookie` data starts from `PS(id)+0x18`, which equals the HashTable's `nNextFreeElement|pDestructor`, where `pDestructor = &zval_ptr_dtor` → solve for the `libphp.so` base.
4. **stage 3 · forged HashTable → hijack `zif_system`**: overwrite `PS(http_session_vars)` with a "forged reference", then plant a **forged HashTable** whose `pDestructor` points to `zif_system` and whose `arData` points to a forged `execute_data` (`num_args=1`, with an `IS_STRING` argument holding the command string). When Session cleanup destructs the array, it calls the "destructor" as if it were `zif_system` → **arbitrary command execution** (as `www-data`).

> Version relevance: the `+0x18`, `zif_system`, `zval_ptr_dtor`, `pDestructor` offsets and struct layouts above are **specific to the PHP 8.4.26 official image (amd64) tested in this article**; they vary with PHP version / compile options / architecture and are **not fixed PHP ABI values**.

> In plain terms: **first steal memory addresses (two cookie leaks), then plant a fake PHP internal object into the process so that PHP's "cleanup function" thinks it is destructing an array when it actually calls `system()`.**

### 3.3 How the Official Patch Fixes It

The core of patch `3584a98bda` is "**Avoid state corruption via bailout**":

- Changes "`zend_bailout` on OOM" to safer **`UnwindExit`** semantics;
- **Correctly resets** the various global states that may be accessed during request startup;
- Adds a **hard memory limit**: terminates the process in OOM scenarios that cannot be safely recovered (officially described as "terminate once reached, `shutdown` handlers do not run"), rather than leaving corrupt state that can be reused; therefore, after upgrading, review the impact of `memory_limit` / `post_max_size` on the business.

This explains why the fix covers the currently-known bailout/state-corruption paths of the same kind at the root-cause level (rather than only blocking a single PoC), significantly reducing the likelihood of further exploitation primitives from the same error pattern.

### 3.4 Same Root Cause, Multiple Variants: Divergence and Convergence in Public Research (Important Cross-Check)

Around php2shell, public research does **not** uniformly reproduce RCE. Independent researcher jackalsyn (J4ck3LSyN) publicly **corrected his own initial conclusion** after publishing a PoC — this self-correction is valuable for understanding "how easy this really is to exploit":

- His initially proposed "cached-pointer (Bug S) chain" was self-disproven as **DEAD**: `Z_TRY_ADDREF(progress->data)` at `session.c:3213` keeps the array alive, so **there is no free, hence no UAF**; he self-rated that path **CVSS 0.0**.
- The **real primitive** he confirmed is the pre-RINIT OOM orphaning of the two **serialization-context globals** `BG(serialize)` / `BG(unserialize)`: `php_session_rfc1867_callback` runs inside `php_hash_environment`, **before** `zend_activate_modules` and the basic extension `RINIT` (`basic_functions.c:393-395` zeroing); after an OOM bailout `level=1` and `data` dangle, and the next request reuses them → `var.c:756` `data->n += 1` (heap-use-after-free confirmed by ASAN).
- But his conclusion is: **this surface (session.upload_progress's serialize/unserialize context) is a memory-safety UAF, not RCE, on the versions he verified (mod_php 8.2.34 / 8.1.2, Debian 12 / Ubuntu 22.04, glibc 2.36)**, self-rated **CVSS 5.3 Medium**, and **only reachable via prefork (mod_php / php -S)** — FPM/CGI/LSAPI unreachable.

This is **not contradictory** to the RCE conclusions of Wiz/Calif and our real RCE on **8.4.26** below — because these are **multiple variants under the same root cause (OOM interrupts state cleanup)**:

| Variant | Primitive | Version/preconditions | Conclusion |
|---|---|---|---|
| Wiz/Calif's 4 bugs | fatal-error backtrace UAF, OPcache type confusion, upload-progress unserializer UAF + memory leak | Multiple versions | RCE (WordPress / Drupal / Joomla) |
| 9bie chain (reproduced here) | send_cookie failure not zeroing + Set-Cookie heap leak + forged HashTable | 8.3.17+ / 8.4.4+ / 8.5.x, mod_php, display_errors=On | **RCE (verified in this article)** |
| jackalsyn's corrected chain | BG(serialize/unserialize) context orphan | 8.2.34 / 8.1.2, prefork, glibc 2.36 | memory-safety UAF (CVSS 5.3, not RCE) |

**Key point**: RCE feasibility **strongly depends on version / SAPI / heap layout / the specific primitive**, and is not "one-shot blow-through in any environment". This precisely corroborates the project's judgment that "the patch is the only thorough fix" — a root-cause-level problem has multiple variants that can be dug up one by one.

> On CVE attribution: the two CVEs are merged by the PHP project by **underlying error pattern** (618 = OOM corruption, 619 = stale global state), **not by component name**. Per Wiz's public mapping, "upload-progress unserializer UAF + process memory leak" is under **CVE-2026-109618**, and "fatal-error backtrace UAF + OPcache type confusion" is under **CVE-2026-109619**; the `session.upload_progress` component appears in multiple concrete primitives, so one cannot simply assume "all session paths belong to 619".

---

## 4. Reproduction

### 4.1 Reproduction Environment

| Item | Value |
|---|---|
| Target image | `php:8.4.26-apache` (official, Debian 12 / Apache 2.4.69) |
| SAPI | Apache `mod_php`, prefork, **single worker** (`MaxRequestWorkers=1`) |
| PHP config | Default: `display_errors=On`, `memory_limit=128M`, `post_max_size=8M`, `session.upload_progress.enabled=On`, `max_input_vars=1000` |
| Attacker machine | Standard-library Python 3 only, raw HTTP socket requests |
| Offsets | `zif_system=0x465370`, `zval_ptr_dtor=0x65eb60` (official 8.4.26 image symbols) |

> Environment note: the above is the **default config of the official `php:8.4.26-apache` image** (no custom `php.ini` mounted; `display_errors=On` is the built-in default of the PHP build). The script in this article is based on 9bie's early public chain (legacy, `display_errors=On` dependent); 9bie's current main line claims RCE is also reachable under the official `php.ini-production` (`display_errors=Off`, `memory_limit=128M`) — the preconditions of the two differ (see §3.2).

### 4.2 Reproduction Result (Unauthenticated RCE)

A single command completes "heap leak → base leak → forged object → command execution", landing as `www-data` on the first attempt in this article's lab environment (the exploit itself is probabilistic, see §4.4):

![](https://ckcsec.oss-cn-hangzhou.aliyuncs.com/img/02-%E5%A4%8D%E7%8E%B0RCE.png)

- The attacker needs no account / cookie / admin entry point to execute arbitrary commands; re-running with `uname -a` also hit, with the result read back via "relative-path redirect to the web root" then `GET /x`.
- This chain also has **memory-leak** capability (reading worker memory into the `PHPSESSID` cookie, similar to Heartbleed), able to steal passwords, tokens, API keys, and even private keys — in-process sensitive material of other requests on the same process.

### 4.3 Patch Comparison + Observable Characteristics of Public Exploit Chains (Detection)

- **Patch effective**: replaying the same chain on `php:8.4.27-apache` (offsets re-extracted for 8.4.27) fails at the very first stage's heap-leak primitive (`HEAP_LEAK_FAILED`), unable to continue to RCE — confirming the official patch blocks at the root cause.
- **Observable characteristics of public exploit chains**: frequent `child pid N exit signal Abort/Segmentation fault` and `long lost child came home` in Apache error logs; abnormally large / malformed `multipart` requests (field count approaching `max_input_vars`); abnormally large `PHPSESSID` / `Set-Cookie` responses (**especially for session-upload-progress / memory-leak public chains**; OPcache / backtrace variants may not produce large cookies); high worker churn / repeated restarts.

### 4.4 Limitations of This Chain (Objective Statement)

- **This PoC targets mod_php/prefork only**: FPM is not exploitable with this chain (startup failure kills the worker); this does not mean PHP2Shell only affects mod_php overall (FPM's 619 path is officially confirmed RCE-able, see §2.2).
- **The script used here (early chain) depends on `display_errors=On`**: this chain relies on the `max_input_vars` warning to create `headers_sent`. Note that 9bie's **current main line** claims 5/5 RCE under the official `php.ini-production` (`display_errors=Off`), not depending on that config; therefore "turning off `display_errors`" only works against this specific early chain and **cannot be treated as a general mitigation** (the project likewise explicitly says hiding diagnostics does not solve the underlying problem).
- **Command length ≤ 14 bytes (this PoC's single-shot `zif_system` payload limit)**: determined by the 167-byte forged struct layout — short commands execute directly, longer commands need `sh<file` multi-step; **this is an engineering limit of this PoC, not a 14-byte capability ceiling of the vulnerability itself**.
- **Probabilistic**: a single command may not succeed on the first attempt; the script needs 3–5 retries; multi-worker environments need dummy requests to rotate traffic back to the same worker.
- A fronting WAF may block it (chunked / 1001-field signatures are distinctive), but bypass ideas are public.

---

## 5. Comprehensive Remediation

### 5.1 Ultimate Fix: Upgrade + Restart (the only thorough solution)

```bash
# Confirm the PHP version of the actually-serving process (not the CLI `php -v`)
# Method 1: view phpinfo() / info.php
# Method 2: read from response headers (if expose_php is not disabled)
curl -sI https://your-host/ | grep -i x-powered-by
```

1. **Upgrade to a fixed version**: `8.2.35` / `8.3.36` / `8.4.27` / `8.5.12` (or higher).
   - Source / distributions: obtain from php.net, each Linux distribution's security source, and official container images.
   - **Do not judge by version number alone**: distributions "backport" patches to old version numbers, so be sure to `grep CVE-2026-109618` the package changelog to confirm.
2. **Restart all workers** (the step most easily missed):
   - `mod_php`: `systemctl restart apache2` (or httpd);
   - `PHP-FPM`: `systemctl restart php8.3-fpm` (substitute the actual version);
   - Long-running CLI processes (queue workers, daemon scripts, panel PHP): restart one by one.
3. **Container environments**: merely restarting the container is ineffective; you **must rebuild the image with the new PHP version** and perform a full rolling update.

### 5.2 What to Do About EOL Versions (8.1 and Earlier)

- Priority: **migrate to a supported branch**.
- If unable to migrate immediately: use **distribution / LTS vendor backported packages** (such as Ubuntu Pro/ESM, Remi, CloudLinux, TuxCare ELS, ZendPHP LTS), or the official **source backport branches** to compile yourself (`PHP-7.4/8.0/8.1-CVE-2026-109618-109619`).
- The official Docker `php` image does **not** provide fixes for 8.1 and earlier.

### 5.3 Temporary Mitigations (emergency only, cannot replace the patch)

> The following measures only reduce exploitability of specific paths and **cannot fully eliminate the risk**; remove / roll them back promptly after the upgrade.

| Measure | Coverage | Side effects / notes |
|---|---|---|
| `session.upload_progress.enabled = 0` + restart | Blocks the session path of 619 | Set at `php.ini`/FPM pool/server-config level, **cannot use `ini_set`/`.user.ini`** |
| `memory_limit = -1` | Blocks the PHP memory-limit failure path of 618 | Removes the memory cap → OOM/DoS risk; backstop with cgroup `memory.max`; **do not substitute `RLIMIT_AS`/`RLIMIT_DATA`** (they trigger the same failure path) |
| `fatal_error_backtraces = 0` (8.5 only) | Blocks the 8.5 fatal backtrace path | Only covers that path |
| Lower `post_max_size` (official temporary suggestion: 8M if no uploads, 32M if uploads, and ensure `upload_max_filesize < post_max_size`), limit request size / field count / nesting depth (at web server or proxy layer) | Reduces controllable memory pressure | Must also cover chunked requests without `Content-Length` |
| Edge WAF / proxy blocking of anomalous `multipart`, chunked uploads | Slows attacks | Auxiliary only; Cloudflare etc. have released rules, but they only protect traffic that passes through them |

### 5.4 Ineffective Measures (make sure not to mistake them for useful)

- ❌ `disable_functions` / `open_basedir`: these are **PHP userland script-execution / file-access restrictions**, and cannot fix PHP runtime memory corruption; even though they may constrain some specific post-exploitation actions (e.g., the 9bie chain ultimately still calls `zif_system`), they **cannot be treated as a security boundary or patch substitute** for this vulnerability.
- ❌ Only modifying application code / upgrading WordPress etc.: the flaw is in the core, unrelated to upper-layer applications.
- ❌ Turning off `display_errors`: it can reduce the success rate of some chains, but is **not** protection.
- ❌ Closing the SSH port: the attack entry is 80/443.
- ❌ Judging "already upgraded" only by `php -v`: the CLI binary and the serving process are not the same thing.

### 5.5 Post-Upgrade Notes

The patch adds a **hard memory limit**: in OOM scenarios that cannot be safely recovered it terminates the process and `shutdown` handlers do not run. After upgrading, re-verify:

- the matching between `memory_limit` and `post_max_size` and the expected request size;
- `max_input_nesting_level` for complex forms;
- if `memory_limit=-1` was used before upgrading, restore a reasonable value per the final official recommendation.

### 5.6 Verifying "the Fix Really Took Effect"

```bash
# 1) Confirm the PHP version loaded by the running process (not the CLI)
#    access info.php / phpinfo(), or query the running process's modules inside the container
# 2) Confirm the package actually contains the CVE fix (distribution backport scenario)
zgrep CVE-2026-109618 /usr/share/doc/php8.3-common/changelog.Debian.gz   # Debian/Ubuntu
rpm -q --changelog php-common | grep CVE-2026-109618                    # RHEL family
# 3) business regression + asset inventory check to ensure no instance is missed
```

### 5.7 Detection and Incident Response (If You Suspect Exploitation)

- **Logs**: watch for oversized / malformed multipart requests + memory errors + repeated 500s; abnormally large `PHPSESSID` responses (signature of upload-progress / memory-leak chains); repeated worker restarts.
- **Processes**: abnormal child processes spawned by `php-fpm` / `httpd` (`sh`, `bash`, `python`, `curl`, `wget`, `nc`), reverse-shell signatures such as `/dev/tcp/` and `mkfifo`, and combinations of functions like `fsockopen` with abnormal outbound targets and shell payloads; reconnaissance commands like `whoami`/`id`/`uname -a`.
- **Files**: newly written files in the web root (webshell), newly added cron/scheduled tasks, newly added accounts.
- **Handling**: isolate the host, preserve Web/PHP logs, search for webshells, **rotate all passwords / tokens / API keys / session secrets / cloud credentials / private keys readable by the PHP process** (the memory leak may already have exposed them).

---

## 6. Conclusion

PHP2Shell is a landmark case of "**a deep memory-safety issue whose exploitation barrier is significantly lowered in the AI era**": the vulnerable code existed for over a decade, but turning the "OOM interrupt → state corruption → cross-request UAF → forged object → arbitrary code execution" chain into a practical exploit traditionally required strong memory-safety, heap-layout, and PHP-core experience — AI-assisted research is significantly reducing the cost of this analysis and iteration. **This again shows: framework/application security ≠ runtime-environment security; be sure to include the PHP runtime in asset inventory and patch management.**

**Action checklist**: ① inventory all PHP runtime instances (including panels, containers, vendor devices, Windows packaged environments); ② prioritize upgrading internet-exposed surfaces to 8.2.35/8.3.36/8.4.27/8.5.12 and restart; ③ EOL branches go to distribution backports or migrate; ④ in the short term, use `session.upload_progress.enabled=0` + proxy-layer limits as emergency measures; ⑤ after upgrading, verify `memory_limit`/`post_max_size`, and enable logging and process monitoring for a period of hunting.

---

### References

- PHP official security advisory: https://www.php.net/archive/2026.php#2026-10-21-5
- GHSA-w8hw-w9fx-j79w / GHSA-6wmf-4rv5-p3rp: https://github.com/php/php-src/security/advisories
- Official patch commit 3584a98bda: https://github.com/php/php-src/commit/3584a98bda
- Calif in-depth analysis: https://calif.io/php2shell/
- Wiz analysis: https://www.wiz.io/blog/php2shell-php-rce
- CNCERT risk notice: https://www.cert.org.cn/publish/main/9/2026/20261022123700555224858/20261022123700555224858_.html
- Sansec emergency guide: https://sansec.io/research/php2shell
- jackalsyn corrected analysis (memory-safety variant of the same root cause, public self-correction): https://jackalsyn.com/posts/php-up-2026.html

> Disclaimer: This article is for authorized security research, self-inspection, and defense only. Reproductions were performed in a locally self-built lab; do not use it against unauthorized targets.
