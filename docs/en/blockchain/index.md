---
title: Blockchain Basics
---

# Blockchain Basics

## Technical Foundations
Peking University Professor Xiao Zhen's open course, Blockchain Technology and Applications

https://www.bilibili.com/video/BV1Vt411X7JF/?vd_source=46b87a83ff1ac8f06aa40d6801a00b21

## Basic Concepts

### Public Blockchain

A public blockchain, often shortened to public chain, is a consensus blockchain that anyone in the world can read at any time, where anyone can send transactions and receive valid confirmation. Public chains are usually considered fully decentralized. On-chain data is open, transparent, and immutable, and anyone can read and write data through transactions or mining. A token mechanism is generally used to encourage participants to compete in bookkeeping and ensure data security.

### Exchange

Similar to a securities exchange for buying and selling stocks, a blockchain exchange is a platform for buying and selling digital currencies. Digital currency exchanges are divided into centralized exchanges and decentralized exchanges.
Decentralized exchange: trading happens directly on the blockchain, and digital currencies are sent directly back to the user's wallet or stored in smart contracts on the blockchain. The advantage of trading directly on-chain is that the exchange does not hold large amounts of users' digital currencies. All digital currencies are stored in users' wallets or in the platform's smart contracts. Decentralized trading uses technical means to decentralize the trust layer, and can also be described as trustless. Every transaction is public and transparent through the blockchain. It does not take custody of users' assets, private keys, or other information; users retain full ownership of their funds, which provides strong personal data security and privacy.

### Centralized Exchange

Most popular exchanges today use centralized technology. Users usually register on the platform, complete a series of identity verification procedures (KYC), and can then start trading digital currencies there. When users trade on a centralized exchange, the currency exchange may not actually happen on the blockchain. Instead, the platform may only update asset numbers in the exchange database. What users see is just a change in ledger balances, and the exchange only needs to prepare enough digital currency to send out when users withdraw. Most mainstream trading is currently completed inside centralized exchanges. Current centralized exchanges on the market include Binance, Huobi, OKEx, and others.
### Node

In the traditional Internet field, all enterprise data runs on a centralized server, and that server is a node. Because a blockchain is a decentralized distributed database, it is composed of thousands upon thousands of "small servers." Every node in a blockchain network is equivalent to a computer or server that stores all block data. Nodes complete the production of all new blocks, verification and bookkeeping of transactions, and broadcasting to the whole network for synchronization. Nodes are divided into "full nodes" and "light nodes." A full node has all transaction data for the whole network, while a light node only has transaction data related to itself. Because every full node keeps a copy of the entire network's data, even if one node has a problem, the whole blockchain network can still run securely. This is the charm of decentralization.

### Consensus

Consensus algorithms mainly solve the problem of multiple nodes in a distributed system reaching the same result for a certain state. A distributed system uses multiple service nodes to process transactions together, and the data state presented by multiple replicas in the distributed system needs to remain consistent. Because nodes may be unreliable, communication between nodes may be unstable, and nodes may even act maliciously or forge information, inconsistencies can appear between nodes' data states. Through consensus algorithms, multiple unreliable independent nodes can be organized into a reliable distributed system, achieving data-state consistency and improving system reliability.

A blockchain system itself is a very large distributed system, but it is clearly different from traditional distributed systems. Because it does not rely on any central authority and is built on a decentralized peer-to-peer network, distributed nodes need to agree on whether transactions are valid. This is where consensus algorithms come into play: they ensure that all nodes follow protocol rules and that all transactions proceed in a reliable way. Consensus algorithms make distributed nodes agree on the processing order of transactions, which is their most important role in blockchain systems.

Consensus algorithms in blockchain systems also take on some functions in the incentive model and governance model. They solve the process of how mutually independent nodes in a peer-to-peer (P2P) network can reach a decision. In short, consensus algorithms solve how distributed systems maintain consistency.

### Proof of Work (PoW)

PoW (Proof of Work) was the first successful decentralized blockchain consensus algorithm in history. Proof of Work is familiar to most people and is widely used by mainstream public chains such as Bitcoin, Ethereum, and Litecoin.
Proof of Work requires node participants to perform computationally intensive tasks, while making the result easy for other network participants to verify. In Bitcoin, miners compete to add collected transactions, namely blocks, to the blockchain ledger maintained by the entire network. To do this, miners must be the first to accurately calculate a "nonce," a number added to the end of a string to create a hash value that begins with a specific number of zeros. However, mining has drawbacks such as high electricity consumption and low transaction throughput.

### Proof of Stake (PoS)

PoS (Proof of Stake) is a mainstream blockchain consensus algorithm designed to help distributed nodes in a blockchain reach consensus. It is often discussed together with Proof of Work, and both are considered major blockchain consensus algorithms. As an algorithm, it reaches consensus through the agreement of coin holders and aims to determine new blocks. Compared with PoW, this process does not require hardware or electricity and is more efficient.
PoS consensus introduces the concept of Stake. Coin holders stake their tokens, and all participants are required to lock up a portion of the tokens they own to validate transactions and gain the opportunity to produce blocks. In PoS consensus, an election algorithm selects the miner who packages a block according to the proportion of holdings, the duration of token staking, or other methods. The miner packages transactions at a specified height, generates a new block, and broadcasts the block. The broadcast block then passes through another "threshold" in PoS consensus: validators verify the transactions, and after validation, the block is confirmed. One round of PoS consensus is then complete. Proof of Stake prevents bad behavior by binding validators' long-term interests to the interests of the entire network. After tokens are locked, if validators conduct fraudulent transactions, their staked tokens may also be slashed.
PoS research is still advancing. Security, performance, and decentralization have always been the goals pursued by PoS, and more PoS projects will land in the future.

### Delegated Proof of Stake (DPoS)

Delegated Proof of Stake first took shape on December 8, 2013, when Daniel Larimer first discussed on bitsharetalk the idea of selecting block producers through voting, replacing the possible manipulation of election randomness in PoS. In DPoS, every coin holder can vote, producing a certain number of delegates, or understood as a certain number of nodes or mining pools, all of which have completely equal rights. Coin holders can replace these delegates at any time through voting to maintain the "long-term purity" of the on-chain system. To some extent, this is very similar to representative democracy in national governance, or a people's representative system. The biggest advantage of this system is that it solves the low-efficiency problem caused by too many validators. Of course, it also has an obvious disadvantage: because of the "delegate" system, it has long been criticized for centralization.

### Wallet
Wallet is a tool for managing private keys. Digital currency wallets come in many forms, but they usually include a software client that allows users to check, store, and trade the digital currencies they hold through the wallet. It is the basic infrastructure and important entry point into the blockchain world.
Cold Wallet
A Cold Wallet is an offline wallet disconnected from the network, used to store digital currencies offline. The user generates a digital currency address and private key on an offline wallet and then saves them. Because cold wallets store digital currency without needing any network, it is very difficult for hackers to enter the wallet and obtain the private key. However, they are not absolutely secure: insecure random numbers can also make a cold wallet unsafe. In addition, hardware damage or loss can also cause digital currency losses, so key backups must be handled properly.
### Hot Wallet

A Hot Wallet is an online wallet that requires a network connection and is more convenient to use. However, because hot wallets generally need to be used online, personal electronic devices may have wallet files stolen, wallet passwords captured, or encrypted private keys cracked after a mistaken click on a phishing site. Some centrally managed wallets are also not absolutely secure. Therefore, when using centralized exchanges or wallets, it is best to set different passwords on different platforms and enable two-factor authentication to protect your assets.

### Public Key

A Public Key appears as a pair with a private key, and together they form a key pair stored in the wallet. The public key is generated from the private key, but the private key cannot be derived backward from the public key. A public key can be processed through a series of algorithms to obtain a wallet address, so it can serve as proof of ownership of that wallet address.

### Private Key

A Private Key is a string of data generated by a random algorithm. It can derive a public key through asymmetric encryption algorithms, and the public key can then derive a coin address. The private key is extremely important. As a password, it is hidden from everyone except the owner of the address. Blockchain assets are actually on the blockchain; the owner effectively only holds the private key and has absolute control over blockchain assets through it. Therefore, the core issue of blockchain asset security is private-key storage, and owners must keep them secure.
Compared with the traditional username-and-password model, the biggest advantage of using public and private keys for transactions is improved security and integrity of data transmission. Because the two have a corresponding relationship, users basically do not need to worry that data may be intercepted or modified by hackers during transmission. At the same time, because data encrypted with a private key must be decrypted by the public key generated from it, the sender does not need to worry that the data was forged by someone else.

### Mnemonic
Because a private key is a long string of meaningless characters and is difficult to remember, mnemonics appeared. A Mnemonic uses a fixed algorithm to convert a private key into more than a dozen common English words. In simple terms, a mnemonic and a private key have similar functions; it is only a user-friendly format for the private key of a blockchain digital wallet. Therefore, it is emphasized here: a mnemonic is just as important as a private key! Because it is plaintext, it is not recommended to store it electronically. Instead, write it down and keep it safely on a physical medium. It complements the Keystore as a second backup.

### Keystore

Keystore is mainly common in Ethereum wallet apps (the Bitcoin mechanism similar to Ethereum Keystore is BIP38). It is obtained by encrypting the private key again with the wallet password. Unlike a mnemonic, it can usually be saved as text or JSON. In other words, a Keystore is equivalent to the private key only after it is decrypted with the wallet password. Therefore, Keystore must be used together with the wallet password in order to import a wallet. After a hacker steals a Keystore, if there is no password, they may still brute-force the Keystore password to unlock it. Therefore, users are advised to make passwords slightly more complex, such as including special characters, using at least 8 characters, and storing them securely.
