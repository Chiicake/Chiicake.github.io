---
title: ECDSA 算法解析
---

# ECDSA 算法解析

椭圆曲线数字签名算法（ECDSA）是现代密码学中的核心原语。它于1999年被纳入ANSI标准，并于2000年被接受为FIPS标准。它在现代安全协议中扮演着至关重要的角色。

如今，ECDSA 的应用无处不在。它保护着 TLS 1.3 的安全连接，构成了比特币和以太坊钱包地址的基础，并为数百万台服务器的 SSH 访问提供保护。与 RSA 相比，ECDSA 在显著减小密钥尺寸的同时，提供了同等的安全性。例如，256 位的 ECDSA 密钥提供的安全强度相当于 3072 位的 RSA 密钥。

## 1. 椭圆曲线基础

ECDSA 的核心是基于有限域上的椭圆曲线数学。对于加密用途，我们通常使用 Short Weierstrass 形式的方程：

$$y^2 = x^3 + ax + b$$

为了确保曲线是光滑的且没有奇点（这会导致加密强度的丧失），其判别式 $\Delta$ 必须不为零：

$$\Delta = -16(4a^3 + 27b^2) \neq 0$$

椭圆曲线关于 x 轴对称。如果点 $(x, y)$ 在曲线上，那么点 $(x, -y)$ 也在曲线上。

![椭圆曲线](./assets/elliptic-curve.svg)

在密码学中，我们不使用实数，而是在有限域 $\mathbb{F}_p$ 上进行运算，其中 $p$ 是一个大素数。这意味着所有的坐标和计算都在模 $p$ 的环境下完成。

## 2. 点加法与标量乘法

椭圆曲线上的点集，连同特殊的“无穷远点” $\mathcal{O}$，在特定的加法运算下构成一个阿贝尔群（Abelian Group）。

### 几何解释

要将两个不同的点 $P$ 和 $Q$ 相加：
1. 画一条穿过 $P$ 和 $Q$ 的直线。
2. 该直线将与曲线在另一点 $R'$ 处相交。
3. 将 $R'$ 关于 x 轴对称，得到的点 $R = P + Q$ 就是结果。

![点加法](./assets/point-addition.svg)

### 数学公式

对于两个点 $P(x_1, y_1)$ 和 $Q(x_2, y_2)$，且 $P \neq Q$：

斜率 $\lambda$ 为：
$$\lambda = \frac{y_2 - y_1}{x_2 - x_1} \pmod p$$

结果点 $R(x_R, y_R)$ 为：
$$x_R = \lambda^2 - x_1 - x_2 \pmod p$$
$$y_R = \lambda(x_1 - x_R) - y_1 \pmod p$$

如果 $P = Q$（倍点运算），斜率 $\lambda$ 通过对方程求导得出：
$$\lambda = \frac{3x_1^2 + a}{2y_1} \pmod p$$

### 标量乘法

操作 $Q = k \times P$（将点 $P$ 与自身相加 $k$ 次）被称为标量乘法。虽然使用“倍乘相加”算法很容易计算，但其逆向操作却极其困难。

## 3. 椭圆曲线离散对数问题 (ECDLP)

ECDSA 的安全性依赖于椭圆曲线离散对数问题（ECDLP）。已知点 $P$ 和 $Q = k \times P$，如果有限域足够大，在计算上是无法找到标量 $k$ 的。与 RSA 使用的整数分解不同，对于精心选择的曲线，目前还没有已知的次指数级算法可以解决 ECDLP。

## 4. ECDSA 算法步骤

### 域参数

在签名之前，双方必须就域参数 $(p, a, b, G, n, h)$ 达成一致：
- $p$: 定义有限域的素数。
- $a, b$: 曲线系数。
- $G$: 曲线上的基点（生成元）。
- $n$: $G$ 的阶（使得 $n \times G = \mathcal{O}$ 的最小正整数 $n$）。
- $h$: 余因子（通常为 1）。

### 密钥生成

1. 选择私钥 $d_A$，作为 $[1, n-1]$ 范围内的随机整数。
2. 计算公钥 $Q_A = d_A \times G$。

### 数字签名生成

要对消息 $M$ 进行签名：
1. 计算 $e = \text{Hash}(M)$。
2. 令 $z$ 为 $e$ 的左侧 $L_n$ 位，其中 $L_n$ 是群阶 $n$ 的位长度。
3. 从 $[1, n-1]$ 中选择一个高强度的随机整数 $k$。
4. 计算曲线点 $(x_1, y_1) = k \times G$。
5. 计算 $r = x_1 \pmod n$。如果 $r = 0$，则返回步骤 3。
6. 计算 $s = k^{-1}(z + r d_A) \pmod n$。如果 $s = 0$，则返回步骤 3。

签名结果为一对值 $(r, s)$。

![ECDSA 签名流程](./assets/ecdsa-signing-flow.svg)

### 验证

要针对公钥 $Q_A$ 和消息 $M$ 验证签名 $(r, s)$：
1. 验证 $r$ 和 $s$ 是处于 $[1, n-1]$ 范围内的整数。
2. 计算 $e = \text{Hash}(M)$ 及其对应的 $z$。
3. 计算 $w = s^{-1} \pmod n$。
4. 计算 $u_1 = zw \pmod n$ 和 $u_2 = rw \pmod n$。
5. 计算曲线点 $(x_1, y_1) = u_1 \times G + u_2 \times Q_A$。
6. 如果 $r \equiv x_1 \pmod n$，则签名有效。

### 正确性证明

验证过程之所以有效，是因为：
$$C = u_1 \times G + u_2 \times Q_A = (zw) \times G + (rw) \times (d_A \times G)$$
$$C = (z + rd_A)w \times G = (z + rd_A)s^{-1} \times G$$
由于 $s = k^{-1}(z + rd_A) \pmod n$，因此 $s^{-1} \equiv k(z + rd_A)^{-1} \pmod n$。
代入 $s^{-1}$：
$$C = (z + rd_A)k(z + rd_A)^{-1} \times G = k \times G$$
因此 $C$ 的 x 坐标与 $r$ 一致。

## 5. 伪代码实现

```python
def sign(message, private_key, G, n):
    z = hash_to_int(message)
    while True:
        k = secure_random(1, n-1)
        point_R = scalar_mult(k, G)
        r = point_R.x % n
        if r == 0: continue
        
        k_inv = mod_inverse(k, n)
        s = (k_inv * (z + r * private_key)) % n
        if s == 0: continue
        
        return (r, s)

def verify(message, signature, public_key, G, n):
    r, s = signature
    if not (1 <= r < n and 1 <= s < n):
        return False
        
    z = hash_to_int(message)
    w = mod_inverse(s, n)
    u1 = (z * w) % n
    u2 = (r * w) % n
    
    point_C = add_points(scalar_mult(u1, G), scalar_mult(u2, public_key))
    return r == (point_C.x % n)
```

## 6. 安全注意事项

### 随机数 $k$ 的重要性

ECDSA 中最关键的安全要求是 $k$（随机数）必须唯一、随机且保密。如果使用相同的 $k$ 对两条不同的消息使用相同的私钥进行签名，私钥将被还原：

$$s_1 = k^{-1}(z_1 + rd_A)$$
$$s_2 = k^{-1}(z_2 + rd_A)$$
$$s_1 - s_2 = k^{-1}(z_1 - z_2)$$
$$k = (z_1 - z_2)(s_1 - s_2)^{-1}$$

一旦找到了 $k$，就可以计算出私钥 $d_A = r^{-1}(sk - z) \pmod n$。这一漏洞曾导致著名的 PlayStation 3 被破解，也引发了多次比特币被盗事件。为了防止这种情况，RFC 6979 规定了一种从消息和私钥中确定性推导 $k$ 的方法。

### 侧信道攻击

实现时必须小心避免计时攻击，特别是在标量乘法期间。像“倍乘相加”这样的算法可能会通过功耗或执行时间泄露私钥信息。对于生产系统，常数时间的实现是必不可少的。

## 7. 常见曲线对比

不同的应用根据安全要求和性能需求使用不同的曲线。

| 曲线名称 | 位长度 | 安全级别 | 特点 | 应用场景 |
|-------|------------|----------------|----------|---------|
| **secp256k1** | 256 | 128 bit | Koblitz 曲线，高效端同态 | 比特币, 以太坊 |
| **P-256 (secp256r1)** | 256 | 128 bit | NIST 标准, 可验证随机系数 | TLS, SSH, JWT |
| **Curve25519** | 255 | 128 bit | Montgomery 曲线, EdDSA, 极速 | Signal, WireGuard, SSH |
| **P-384** | 384 | 192 bit | 更高安全级别 | 政府/大型企业 |

## 8. 总结

ECDSA 代表了代数几何与数论的精妙结合。它提供了现代互联世界所要求的高性能数字签名。虽然 ECDSA 在 Shor 算法面前是脆弱的，但在进入后量子密码学时代之前，它仍然是保护当前数字基础设施的行业标准。

了解 ECDSA 的机制不仅是学术研究，对于任何在区块链、网络安全或身份管理领域工作的开发者来说，这都是至关重要的。
