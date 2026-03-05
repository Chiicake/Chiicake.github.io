---
title: "非对称加密与TLS演进"
---

当你使用 `curl -v https://example.com` 建立连接时，终端会输出类似以下的握手日志：

```text
* ALPN, offering h2
* ALPN, offering http/1.1
* TLSv1.3 (OUT), TLS handshake, Client hello (1):
* TLSv1.3 (IN), TLS handshake, Server hello (2):
* TLSv1.3 (IN), TLS handshake, Encrypted Extensions (8):
* TLSv1.3 (IN), TLS handshake, Certificate (11):
* TLSv1.3 (IN), TLS handshake, CERT verify (15):
* TLSv1.3 (IN), TLS handshake, Finished (20):
* TLSv1.3 (OUT), TLS change cipher, Change cipher spec (1):
* TLSv1.3 (OUT), TLS handshake, Finished (20):
* SSL connection using TLSv1.3 / TLS_AES_256_GCM_SHA384
```

这段几百毫秒内完成的交互，解决了互联网通信中最核心的矛盾：如何在不安全的信道上，安全地交换后续加密通信所需的对称密钥。

### 非对称加密解决的痛点：密钥交换

在对称加密（如 AES）中，加密和解密使用同一个密钥。如果通信双方在之前没有共享过密钥，直接在网络上发送密钥，任何中间节点都能截获它。

非对称加密（Asymmetric Encryption）通过数学上的单向函数打破了这个僵局。它生成一对密钥：公钥（Public Key）可以公开给任何人，私钥（Private Key）由所有者严格保管。

1. **加密场景**：发送方用接收方的公钥加密，只有接收方的私钥能解密。
2. **签名场景**：发送方用自己的私钥加密（签名），任何人都可以用发送方的公钥验证。

这种机制解决了“初始信任”的问题，但由于非对称加密的计算开销通常比对称加密高出几个数量级，因此 TLS 协议的设计目标是：利用非对称加密安全地协商出一个临时的、随机的对称密钥（Session Key），然后切换到对称加密进行大批量数据的传输。

### TLS 早期阶段：基于 RSA 的密钥交换

在 TLS 1.0 (RFC 2246) 到 TLS 1.2 的早期应用中，RSA 是最主流的密钥交换方式。其流程如下：

```text
Client                                          Server
  |                                               |
  |---- ClientHello (Cipher Suites, Random_C) --->|
  |                                               |
  |<--- ServerHello (Random_S), Certificate ------|
  |                                               |
  | 1. 验证服务器证书                               |
  | 2. 生成 Pre-Master Secret (PMS)                |
  | 3. 用服务器公钥加密 PMS                         |
  |---- ClientKeyExchange (Encrypted PMS) ------->|
  |                                               |
  |           [双方计算出 Master Secret]            |
  |                                               |
  |---- Finished -------------------------------->|
  |<--- Finished ---------------------------------|
```

这种模式存在一个致命弱点：**缺乏前向安全性（Forward Secrecy）**。

如果攻击者在今天录制并保存了所有的加密流量，而在两年后窃取了服务器的 RSA 私钥，那么他可以解密两年前捕获的 `ClientKeyExchange` 报文，还原出 PMS，进而推导出 Master Secret 并解密所有的流量。这意味着，一旦私钥泄露，历史上的所有会话记录都将变成明文。

### 向临时密钥交换进化：Diffie-Hellman 与 ECDHE

为了实现前向安全性，TLS 开始转向 Diffie-Hellman (DH) 算法，特别是临时 Diffie-Hellman (DHE)。

DH 算法基于离散对数难题。双方各自生成一对临时的公私钥，交换公钥后，根据数学原理，双方能计算出相同的共享密钥，而监听者无法通过交换的公钥反导出这个密钥。

当会话结束，这些临时的参数就被丢弃。即使服务器的长久私钥（用于身份验证）在未来泄露，攻击者也无法追溯已经销毁的临时 DH 密钥。

随着计算性能要求的提升，椭圆曲线 Diffie-Hellman (ECDHE) 成为主流。相比传统的 DHE，ECDHE 使用更短的密钥长度（如 256 位椭圆曲线密钥对应 3072 位 RSA 强度）就能提供同等的安全性，且计算速度更快。

### TLS 版本演进时间轴

#### TLS 1.0 (RFC 2246, 1999)
TLS 1.0 是对 SSL 3.0 的标准化改进。
- **特征**：使用 MD5 和 SHA-1 组合作为伪随机函数（PRF）。
- **局限性**：支持 RSA 和 DH 密钥交换。由于使用了弱哈希函数，它容易受到后续发现的各种攻击。

#### TLS 1.1 (RFC 4346, 2006)
- **改进**：引入了显式的初始化向量（Explicit IV），解决了 CBC 模式下的某些攻击（如 BEAST 攻击）。
- **现状**：变化极小，未能解决核心的算法陈旧问题。

#### TLS 1.2 (RFC 5246, 2008)
这是目前互联网上使用最广泛的版本。
- **算法升级**：默认使用 SHA-256 PRF，支持认证加密（AEAD）模式，如 AES-GCM。
- **灵活性**：引入了可协商的签名算法。
- **现代特性**：增加了对 ECDHE 的支持，开始普及前向安全性。

#### TLS 1.3 (RFC 8446, 2018)
这是 TLS 协议诞生以来最大的变革，核心理念是“删减与提速”。
- **强制前向安全性**：移除了静态 RSA 和静态 DH 密钥交换。现在每个连接必须通过 DHE 或 ECDHE 协商密钥。
- **协议精简**：移除了 CBC 模式、RC4、DES、MD5 和 SHA-1。只保留了 AEAD 加密算法（如 AES-GCM, ChaCha20-Poly1305）。
- **性能优化**：握手由 2-RTT（往返时间）减少为 1-RTT。
- **新算法支持**：引入了 EdDSA（Ed25519）等高性能曲线。
- **密钥导出**：使用标准的 HKDF (RFC 5869) 替换了自定义的 PRF。

### 淘汰 TLS 1.0/1.1 的必然性 (RFC 8996, 2021)

2021年，RFC 8996 正式将 TLS 1.0 和 1.1 标记为过时（Historic）。主要原因包括：
1. **SHA-1 依赖**：这两个版本的握手过程极度依赖 SHA-1，而 SHA-1 在碰撞攻击面前已不再安全。
2. **缺乏 AEAD**：它们不支持现代化的 AEAD 加密。在 TLS 1.0/1.1 中，加密和完整性校验是分开的（Encrypt-then-MAC 或 MAC-then-Encrypt），这给 Padding Oracle 等侧信道攻击留下了巨大空间。

### 证书算法的迁移趋势

随着计算能力的提升，证书所依赖的签名算法也在演进：
1. **RSA-2048**：目前的标准。虽然兼容性最好，但随着安全要求提高，RSA 密钥长度必须指数级增加，导致握手报文变大，性能下降。
2. **ECDSA P-256**：由于密钥更短、速度更快，越来越多的现代站点选择 ECDSA 证书。
3. **EdDSA (Ed25519)**：基于 Edwards 曲线，提供更快的签名和验证速度，且代码实现更易于抵抗侧信道攻击，正逐渐在现代基础设施中应用。

### 后量子密码学（PQC）地平线

量子计算的潜在威胁（Shor 算法）可以轻易破解现有的 RSA 和 ECC 体系。为了防范“先存储，后解密”的攻击，业界已经开始在 TLS 中实验后量子密码学。

2024年8月，NIST 发布了首批 PQC 标准：
- **FIPS 203 (ML-KEM)**：基于格（Lattice）的密钥封装机制，前身为 Kyber。
- **FIPS 204 (ML-DSA)**：基于格的数字签名，前身为 Dilithium。
- **FIPS 205 (SLH-DSA)**：基于哈希的无状态数字签名，前身为 SPHINCS+。

目前，Google Chrome 和 Cloudflare 已经在生产环境中开启了 X25519+Kyber768 的混合密钥交换实验。混合模式（Hybrid Mode）将传统 ECDHE 与 PQC 结合，确保即使量子算法尚未成熟，也能维持现有的安全等级；而一旦量子计算实现，攻击者也无法通过捕获流量在未来解密。

### 核心结论

1. **弃用静态 RSA**：永远不要在现代生产环境中使用 RSA 密钥交换。确保你的服务器配置支持并优先使用 ECDHE，以保证前向安全性。
2. **拥抱 TLS 1.3**：TLS 1.3 不仅是安全性的飞跃，其 1-RTT 的设计也能显著降低首字节延迟（TTFB）。
3. **AEAD 是底线**：只使用 AES-GCM 或 ChaCha20-Poly1305 加密算法。
4. **关注 PQC 进展**：虽然量子计算机尚未商业化，但针对长生命周期的数据，现在就应考虑混合 PQC 密钥交换。
5. **最小化算法集**：在 Web 服务器配置中，主动停用 TLS 1.0/1.1 及过时的 Cipher Suites（如包含 CBC、SHA1 或 3DES 的组合）。
