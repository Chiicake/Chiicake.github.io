---
title: "Asymmetric Encryption and TLS Evolution"
---

When you run `curl -v https://example.com` to establish a connection, the terminal outputs handshake logs similar to the following:

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

This interaction, completed within hundreds of milliseconds, solves the most core contradiction in internet communication: how to safely exchange the symmetric keys required for subsequent encrypted communication over an insecure channel.

### The Problem Asymmetric Encryption Solves: Key Exchange

In symmetric encryption (such as AES), both encryption and decryption use the same key. If the two communicating parties have not shared a key beforehand, sending the key directly over the network allows any intermediate node to intercept it.

Asymmetric Encryption breaks this deadlock through mathematical one-way functions. It generates a pair of keys: a Public Key that can be made public to anyone, and a Private Key that is strictly kept by the owner.

1. **Encryption Scenario**: The sender encrypts with the receiver's public key, and only the receiver's private key can decrypt it.
2. **Signature Scenario**: The sender encrypts (signs) with their own private key, and anyone can verify it with the sender's public key.

While this mechanism solves the "initial trust" problem, the computational overhead of asymmetric encryption is usually several orders of magnitude higher than symmetric encryption. Therefore, the goal of the TLS protocol is to use asymmetric encryption to securely negotiate a temporary, random symmetric key (Session Key), and then switch to symmetric encryption for bulk data transmission.

### Early TLS: RSA-Based Key Exchange

In TLS 1.0 (RFC 2246) through the early applications of TLS 1.2, RSA was the most mainstream key exchange method. The process is as follows:

```text
Client                                          Server
  |                                               |
  |---- ClientHello (Cipher Suites, Random_C) --->|
  |                                               |
  |<--- ServerHello (Random_S), Certificate ------|
  |                                               |
  | 1. Verify server certificate                  |
  | 2. Generate Pre-Master Secret (PMS)           |
  | 3. Encrypt PMS with server public key         |
  |---- ClientKeyExchange (Encrypted PMS) ------->|
  |                                               |
  |           [Both compute Master Secret]        |
  |                                               |
  |---- Finished -------------------------------->|
  |<--- Finished ---------------------------------|
```

This model has a fatal weakness: **lack of Forward Secrecy**.

If an attacker records and saves all encrypted traffic today and steals the server's RSA private key two years later, they can decrypt the `ClientKeyExchange` messages captured two years ago, recover the PMS, derive the Master Secret, and decrypt all traffic. This means that if the private key is leaked, all historical session records become plaintext.

### Evolution to Ephemeral Key Exchange: Diffie-Hellman and ECDHE

To achieve forward secrecy, TLS shifted towards the Diffie-Hellman (DH) algorithm, specifically ephemeral Diffie-Hellman (DHE).

The DH algorithm is based on the discrete logarithm problem. Both parties generate a temporary pair of public and private keys. After exchanging public keys, they can both compute the same shared secret, while an eavesdropper cannot derive this secret from the exchanged public keys.

When the session ends, these temporary parameters are discarded. Even if the server's long-term private key (used for authentication) is leaked in the future, the attacker cannot recover the already destroyed temporary DH keys.

As computational performance requirements increased, Elliptic Curve Diffie-Hellman (ECDHE) became the mainstream. Compared to traditional DHE, ECDHE provides equivalent security with much shorter key lengths (e.g., a 256-bit elliptic curve key corresponds to 3072-bit RSA strength) and faster computation speeds.

### TLS Version Evolution Timeline

#### TLS 1.0 (RFC 2246, 1999)
TLS 1.0 was a standardized improvement over SSL 3.0.
- **Features**: Uses a combination of MD5 and SHA-1 as the Pseudo-Random Function (PRF).
- **Limitations**: Supports RSA and DH key exchange. Due to the use of weak hash functions, it is susceptible to various attacks discovered later.

#### TLS 1.1 (RFC 4346, 2006)
- **Improvements**: Introduced explicit Initialization Vectors (IVs) to address certain attacks in CBC mode (like the BEAST attack).
- **Status**: Minimal changes, failed to address the core problem of outdated algorithms.

#### TLS 1.2 (RFC 5246, 2008)
This is currently the most widely used version on the internet.
- **Algorithm Upgrades**: SHA-256 PRF by default, support for Authenticated Encryption with Associated Data (AEAD) modes like AES-GCM.
- **Flexibility**: Introduced negotiable signature algorithms.
- **Modern Features**: Added support for ECDHE and began the popularization of forward secrecy.

#### TLS 1.3 (RFC 8446, 2018)
This is the most significant change since the birth of the TLS protocol, with the core philosophy of "pruning and speeding up."
- **Mandatory Forward Secrecy**: Removed static RSA and static DH key exchange. Every connection must now negotiate keys via DHE or ECDHE.
- **Protocol Streamlining**: Removed CBC mode, RC4, DES, MD5, and SHA-1. Only AEAD encryption algorithms are retained (e.g., AES-GCM, ChaCha20-Poly1305).
- **Performance Optimization**: Handshake reduced from 2-RTT (Round Trip Time) to 1-RTT.
- **New Algorithm Support**: Introduced high-performance curves like EdDSA (Ed25519).
- **Key Derivation**: Replaced custom PRF with standard HKDF (RFC 5869).

### The Necessity of Deprecating TLS 1.0/1.1 (RFC 8996, 2021)

In 2021, RFC 8996 formally marked TLS 1.0 and 1.1 as Historic. The main reasons include:
1. **SHA-1 Dependency**: The handshake process of these two versions heavily depends on SHA-1, which is no longer secure against collision attacks.
2. **Lack of AEAD**: They do not support modern AEAD encryption. In TLS 1.0/1.1, encryption and integrity checks are separate (Encrypt-then-MAC or MAC-then-Encrypt), leaving significant room for side-channel attacks like Padding Oracle.

### Certificate Algorithm Migration Trends

As computing power increases, the signature algorithms that certificates rely on are also evolving:
1. **RSA-2048**: The current standard. While it has the best compatibility, RSA key lengths must increase exponentially as security requirements rise, leading to larger handshake messages and decreased performance.
2. **ECDSA P-256**: Due to shorter keys and faster speeds, more and more modern sites are choosing ECDSA certificates.
3. **EdDSA (Ed25519)**: Based on Edwards curves, providing faster signature and verification speeds and code implementations that are more resistant to side-channel attacks. It is gradually being adopted in modern infrastructure.

### Post-Quantum Cryptography (PQC) Horizon

The potential threat of quantum computing (Shor's algorithm) can easily break existing RSA and ECC systems. To guard against "store now, decrypt later" attacks, the industry has begun experimenting with Post-Quantum Cryptography in TLS.

In August 2024, NIST released the first batch of PQC standards:
- **FIPS 203 (ML-KEM)**: A lattice-based key encapsulation mechanism, formerly known as Kyber.
- **FIPS 204 (ML-DSA)**: Lattice-based digital signatures, formerly known as Dilithium.
- **FIPS 205 (SLH-DSA)**: Stateless hash-based digital signatures, formerly known as SPHINCS+.

Currently, Google Chrome and Cloudflare have already enabled hybrid X25519+Kyber768 key exchange experiments in production environments. Hybrid mode combines traditional ECDHE with PQC, ensuring existing security levels are maintained even if quantum algorithms are not yet mature; if quantum computing is achieved, attackers still cannot decrypt captured traffic in the future.

### Core Takeaways

1. **Deprecate Static RSA**: Never use RSA key exchange in modern production environments. Ensure your server configuration supports and prioritizes ECDHE to guarantee forward secrecy.
2. **Embrace TLS 1.3**: TLS 1.3 is not just a leap in security; its 1-RTT design also significantly reduces Time to First Byte (TTFB).
3. **AEAD is the Baseline**: Use only AES-GCM or ChaCha20-Poly1305 encryption algorithms.
4. **Monitor PQC Progress**: While quantum computers are not yet commercialized, consider hybrid PQC key exchange now for data with long life cycles.
5. **Minimize Algorithm Sets**: In web server configurations, actively disable TLS 1.0/1.1 and obsolete Cipher Suites (such as combinations containing CBC, SHA1, or 3DES).
