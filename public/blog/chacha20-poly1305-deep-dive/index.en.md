---
title: ChaCha20-Poly1305 AEAD Algorithm Analysis
---

## Overview

ChaCha20-Poly1305 is an AEAD (Authenticated Encryption with Associated Data) algorithm combining Daniel J. Bernstein's ChaCha20 stream cipher and Poly1305 message authentication code. The algorithm has been standardized in TLS 1.3 (RFC 8446), WireGuard, OpenSSH, and other protocols.

Compared to AES-GCM, ChaCha20-Poly1305 demonstrates superior software performance on platforms without hardware acceleration. This article analyzes its mathematical foundations, construction, and security properties.

## ChaCha20 Stream Cipher

### Algorithm Structure

ChaCha20 is based on Salsa20, using ARX (Addition-Rotation-XOR) operations to construct pseudorandom keystreams. The internal state is a 4×4 matrix with 32-bit word elements:

```
cccccccc  cccccccc  cccccccc  cccccccc
kkkkkkkk  kkkkkkkk  kkkkkkkk  kkkkkkkk
kkkkkkkk  kkkkkkkk  kkkkkkkk  kkkkkkkk
bbbbbbbb  nnnnnnnn  nnnnnnnn  nnnnnnnn
```

Initial state:
- Words 0-3: ASCII encoding of "expand 32-byte k"
- Words 4-11: 256-bit key
- Word 12: 32-bit block counter
- Words 13-15: 96-bit nonce

$$
\text{State} = \begin{bmatrix}
0x61707865 & 0x3320646e & 0x79622d32 & 0x6b206574 \\
k_0 & k_1 & k_2 & k_3 \\
k_4 & k_5 & k_6 & k_7 \\
\text{counter} & n_0 & n_1 & n_2
\end{bmatrix}
$$

### Quarter Round Function

Core operation unit that mixes 4 words:

$$
\begin{aligned}
a &\leftarrow a + b; \quad d \leftarrow (d \oplus a) \lll 16 \\
c &\leftarrow c + d; \quad b \leftarrow (b \oplus c) \lll 12 \\
a &\leftarrow a + b; \quad d \leftarrow (d \oplus a) \lll 8 \\
c &\leftarrow c + d; \quad b \leftarrow (b \oplus c) \lll 7
\end{aligned}
$$

Where $\lll$ denotes rotate left.

### Round Function

A double round contains column and diagonal rounds, totaling 8 Quarter Rounds:

**Column round**:
```
QR(0, 4,  8, 12)
QR(1, 5,  9, 13)
QR(2, 6, 10, 14)
QR(3, 7, 11, 15)
```

**Diagonal round**:
```
QR(0, 5, 10, 15)
QR(1, 6, 11, 12)
QR(2, 7,  8, 13)
QR(3, 4,  9, 14)
```

### Block Function

Performs 10 double rounds (20 rounds total), then adds the result to the initial state:

```python
def chacha20_block(key, counter, nonce):
    state = initial_state(key, counter, nonce)
    working_state = state.copy()
    
    for i in range(10):
        column_round(working_state)
        diagonal_round(working_state)
    
    for i in range(16):
        working_state[i] += state[i]
    
    return working_state
```

![ChaCha20 State Mixing Process](./assets/chacha20-rounds.svg)

Encryption is performed by XORing with the keystream:

$$
C_i = P_i \oplus \text{ChaCha20}(K, \text{counter}, N)[i \bmod 64]
$$

## Poly1305 Message Authentication Code

### Mathematical Foundation

Poly1305 is a one-time MAC based on polynomial evaluation over the finite field modulo $p = 2^{130} - 5$.

### Key Structure

256-bit key split into two parts:
- $r$ (128 bits): polynomial coefficient, requires clamping
- $s$ (128 bits): final mask

Clamping operation:
```
r &= 0x0ffffffc0ffffffc0ffffffc0fffffff
```

This ensures multiplication does not overflow on 64-bit systems while maintaining security.

### Tag Calculation

Message $M$ is split into 16-byte blocks $m_1, m_2, \ldots, m_k$. Each block receives padding:

$$
c_i = \begin{cases}
m_i || 0x01 & \text{if } |m_i| = 16 \\
m_i || 0x01 || 0x00^{16-|m_i|-1} & \text{if } |m_i| < 16
\end{cases}
$$

Polynomial evaluation:

$$
\text{tag} = \left(\sum_{i=1}^{k} c_i \cdot r^{k-i+1} \bmod p\right) + s
$$

Computed using Horner's method:

```python
def poly1305(msg, key):
    r = clamp(key[:16])
    s = key[16:32]
    accumulator = 0
    p = (1 << 130) - 5
    
    for i in range(0, len(msg), 16):
        block = msg[i:i+16]
        n = int.from_bytes(block + b'\x01', 'little')
        accumulator = ((accumulator + n) * r) % p
    
    tag = (accumulator + int.from_bytes(s, 'little')) % (2**128)
    return tag.to_bytes(16, 'little')
```

![Poly1305 Polynomial Evaluation](./assets/poly1305-polynomial.svg)

### Security

For different messages $M \neq M'$, collision probability:

$$
\Pr[\text{tag}(M) = \text{tag}(M')] \leq \frac{d}{p}
$$

Where $d$ is the polynomial degree. For $2^{64}$ byte messages, collision probability $< 2^{-66}$.

## ChaCha20-Poly1305 AEAD Construction

### RFC 8439 Standard

Standard construction process:

1. **Generate Poly1305 key**:
   ```
   poly1305_key = ChaCha20(K, 0, nonce)[0:32]
   ```

2. **Encrypt plaintext**:
   ```
   ciphertext = ChaCha20(K, 1, nonce) ⊕ plaintext
   ```

3. **Construct MAC input**:
   ```
   mac_data = AAD || pad16(AAD) ||
              ciphertext || pad16(ciphertext) ||
              len(AAD) || len(ciphertext)
   ```

4. **Calculate tag**:
   ```
   tag = Poly1305(mac_data, poly1305_key)
   ```

![ChaCha20-Poly1305 AEAD Construction](./assets/chacha20-poly1305-aead.svg)

### Implementation

```python
def chacha20_poly1305_encrypt(key, nonce, plaintext, aad):
    poly_key_block = chacha20_block(key, 0, nonce)
    poly_key = serialize(poly_key_block)[:32]
    
    ciphertext = chacha20_encrypt(key, 1, nonce, plaintext)
    
    mac_data = (
        aad + pad16(aad) +
        ciphertext + pad16(ciphertext) +
        len(aad).to_bytes(8, 'little') +
        len(ciphertext).to_bytes(8, 'little')
    )
    
    tag = poly1305(mac_data, poly_key)
    return ciphertext, tag

def chacha20_poly1305_decrypt(key, nonce, ciphertext, tag, aad):
    poly_key_block = chacha20_block(key, 0, nonce)
    poly_key = serialize(poly_key_block)[:32]
    
    mac_data = (
        aad + pad16(aad) +
        ciphertext + pad16(ciphertext) +
        len(aad).to_bytes(8, 'little') +
        len(ciphertext).to_bytes(8, 'little')
    )
    
    expected_tag = poly1305(mac_data, poly_key)
    if not constant_time_compare(tag, expected_tag):
        raise AuthenticationError("MAC verification failed")
    
    plaintext = chacha20_encrypt(key, 1, nonce, ciphertext)
    return plaintext
```

## Performance Characteristics

### Software Implementation

ChaCha20-Poly1305 outperforms AES-GCM in environments without hardware acceleration:

| Algorithm | x86-64 (cpb) | ARM Cortex-A53 (cpb) |
|-----------|--------------|----------------------|
| ChaCha20-Poly1305 | 3.5 | 4.2 |
| AES-128-GCM (AES-NI) | 0.7 | 0.9 |
| AES-128-GCM (Software) | 26.8 | 45.3 |

> cpb = cycles per byte

On platforms with AES-NI support, AES-GCM has performance advantages; on platforms without hardware acceleration (mobile devices, IoT devices), ChaCha20-Poly1305 is approximately 6-10× faster than software AES-GCM.

### Algorithm Complexity

**ChaCha20**:
- Time complexity: $O(n)$
- Each 64-byte block requires 80 Quarter Rounds
- Each Quarter Round contains 8 basic operations

**Poly1305**:
- Time complexity: $O(n)$
- Each 16-byte block requires 1 modular multiplication and 1 modular addition

## Security Analysis

### ChaCha20 Security

1. **Key space**: 256-bit key and 96-bit nonce provide $2^{256}$ key space.

2. **Differential attacks**: 20 rounds provide sufficient security margin, no practical differential attacks exist.

3. **Nonce reuse**: If $(key, nonce)$ is reused, plaintext XOR can be recovered through ciphertext XOR:
   $$
   C_1 \oplus C_2 = (P_1 \oplus S) \oplus (P_2 \oplus S) = P_1 \oplus P_2
   $$

### Poly1305 Security

1. **One-time key**: Each message requires different $r$. ChaCha20-Poly1305 satisfies this by deriving new keys for each nonce.

2. **Forgery probability**:
   $$
   \epsilon \leq \frac{8 \lceil L / 16 \rceil}{2^{106}}
   $$
   For $2^{64}$ byte messages, forgery probability $< 2^{-42}$.

3. **Timing attacks**: Tag verification must use constant-time comparison:
   ```python
   def constant_time_compare(a, b):
       if len(a) != len(b):
           return False
       result = 0
       for x, y in zip(a, b):
           result |= x ^ y
       return result == 0
   ```

### AEAD Security

Uses Encrypt-then-MAC construction. According to Bellare-Namprempre (2000) theorem:

> If the encryption scheme is IND-CPA secure and the MAC is SUF-CMA secure, then Encrypt-then-MAC construction is IND-CCA2 and INT-CTXT secure.

ChaCha20-Poly1305 satisfies these conditions.

## Applications

### TLS 1.3

TLS 1.3 lists ChaCha20-Poly1305 as a mandatory cipher suite:

```
TLS_CHACHA20_POLY1305_SHA256
```

### WireGuard

WireGuard uses ChaCha20-Poly1305 as its symmetric encryption algorithm:

```
Packet := ChaCha20Poly1305(
    key=DH_shared_secret,
    nonce=packet_counter,
    plaintext=IP_packet,
    aad=packet_header
)
```

### OpenSSH

OpenSSH 7.3+ supports the algorithm:

```bash
ssh -c chacha20-poly1305@openssh.com user@host
```

### Linux Kernel

Kernel support since version 4.2:

```c
struct aead_request *req;
struct crypto_aead *tfm;

tfm = crypto_alloc_aead("rfc7539(chacha20,poly1305)", 0, 0);
crypto_aead_setkey(tfm, key, 32);
```

## Implementation Considerations

### Nonce Management

Nonce reuse with the same key is prohibited:

```python
# Incorrect
nonce = b'\x00' * 12

# Correct: use counter
nonce = counter.to_bytes(12, 'little')
counter += 1

# Correct: use random (requires sufficient entropy)
nonce = os.urandom(12)
```

### Key Derivation

User passwords should not be used directly, use KDF:

```python
from cryptography.hazmat.primitives.kdf.pbkdf2 import PBKDF2HMAC
from cryptography.hazmat.primitives import hashes

kdf = PBKDF2HMAC(
    algorithm=hashes.SHA256(),
    length=32,
    salt=salt,
    iterations=600000,
)
key = kdf.derive(password)
```

### Timing Attack Protection

MAC verification must use constant-time comparison:

```python
# Incorrect
if computed_tag == received_tag:
    ...

# Correct
if hmac.compare_digest(computed_tag, received_tag):
    ...
```

### Associated Data

AAD typically contains protocol header information:

```python
# TLS 1.3 AEAD record
aad = (
    record_type +           # 1 byte
    protocol_version +      # 2 bytes
    length                  # 2 bytes
)

ciphertext, tag = chacha20_poly1305_encrypt(
    key, nonce, plaintext, aad
)
```

### Large File Handling

Process in chunks while maintaining counter:

```python
def encrypt_file(key, nonce_base, input_file, output_file):
    chunk_size = 64 * 1024
    counter = 0
    
    with open(input_file, 'rb') as fin, open(output_file, 'wb') as fout:
        while True:
            chunk = fin.read(chunk_size)
            if not chunk:
                break
            
            nonce = (int.from_bytes(nonce_base, 'little') + counter).to_bytes(12, 'little')
            ct, tag = chacha20_poly1305_encrypt(key, nonce, chunk, b'')
            
            fout.write(len(ct).to_bytes(4, 'little'))
            fout.write(tag)
            fout.write(ct)
            
            counter += 1
```

## Comparison with Other AEAD Schemes

### vs. AES-GCM

| Feature | ChaCha20-Poly1305 | AES-GCM |
|---------|-------------------|---------|
| Software Performance | High | Low |
| Hardware Performance (AES-NI) | Medium | High |
| Side-channel Resistance | High (no table lookup) | Medium (S-box lookup) |
| Implementation Complexity | Medium | Medium |
| Standardization | RFC 8439 | NIST SP 800-38D |

### vs. AES-CCM

| Feature | ChaCha20-Poly1305 | AES-CCM |
|---------|-------------------|---------|
| Parallelization | Full parallelism | Serial CBC-MAC |
| Performance | High | Medium |
| Tag Length | 128-bit fixed | Variable (32-128 bits) |
| Applications | TLS 1.3, WireGuard | Thread, ZigBee |

### XChaCha20-Poly1305

XChaCha20 extends nonce to 192 bits, allowing random generation without collision concerns. Implemented via HChaCha20:

```python
def xchacha20_poly1305_encrypt(key, nonce_192, plaintext, aad):
    subkey = hchacha20(key, nonce_192[:16])
    return chacha20_poly1305_encrypt(subkey, nonce_192[16:], plaintext, aad)
```

## Formal Verification

### Coq Proof

Verified:
- ChaCha20 bit diffusion properties
- Poly1305 collision probability bounds
- Encrypt-then-MAC IND-CCA2 security

### CryptoVerif

Automatically proven secure under assumptions:
1. ChaCha20 is PRF
2. Poly1305 is UF-CMA secure

Proof conclusion:
$$
\text{Adv}^{\text{AEAD}}_{\text{ChaCha20-Poly1305}}(A) \leq \text{Adv}^{\text{PRF}}_{\text{ChaCha20}}(B_1) + \text{Adv}^{\text{UF-CMA}}_{\text{Poly1305}}(B_2)
$$

### F* Implementation

HACL* project provides F* implementation, extractable to:
- C code (high performance)
- WebAssembly (browsers)
- OCaml (verification)

## Post-Quantum Cryptography

ChaCha20-Poly1305 does not resist quantum attacks but can be combined with post-quantum key exchange algorithms:

```
Quantum-safe key exchange (CRYSTALS-Kyber)
    ↓
Derive symmetric key
    ↓
ChaCha20-Poly1305 encryption
```

NIST post-quantum standardization project recommends this algorithm in hybrid modes.

## References

1. Bernstein, D. J. (2008). "ChaCha, a variant of Salsa20". *Workshop Record of SASC*.

2. Bernstein, D. J. (2005). "The Poly1305-AES message-authentication code". *FSE 2005*, Springer.

3. Nir, Y., & Langley, A. (2018). "ChaCha20 and Poly1305 for IETF Protocols". *RFC 8439*.

4. Procter, G. (2014). "A Security Analysis of the Composition of ChaCha20 and Poly1305". *IACR ePrint*.

5. Bellare, M., & Namprempre, C. (2000). "Authenticated encryption: Relations among notions and analysis of the generic composition paradigm". *ASIACRYPT 2000*, Springer.

6. Zinzindohoué, J. K., et al. (2017). "HACL*: A Verified Modern Cryptographic Library". *CCS 2017*.

---

*Code examples are for educational purposes only. Production environments should use audited cryptographic libraries.*
