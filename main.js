/**
 * @author:nasaiboy
 */
const sha256 = require('crypto-js/sha256');
const ecLib = require('elliptic').ec;
const ec = new ecLib('secp256k1')
/* blockchain = block + chain */

//block
class Transaction {
    constructor(from, to, amount) {
        this.from = from;
        this.to = to;
        this.amount = amount;
    }

    computeHash() {
        return sha256(this.from + this.to + this.amount).toString();
    }

    sign(key) {
        this.signature = key.sign(this.computeHash(), 'base64').toDER('hex');
    }

    isValid() {
        if (this.from === '') {
            return true;
        }
        const keyObj = ec.keyFromPublic(this.from, 'hex');
        return keyObj.verify(this.computeHash(), this.signature)
    }
}

class Block {
    constructor(transactions, previousHash) {
        this.transactions = transactions;
        this.previousHash = previousHash;
        this.timestamp = Date.now();
        this.nonce = 1;
        this.hash = this.computeHash();
    }

    //计算哈希值的方法
    computeHash() {
        return sha256(JSON.stringify(this.transactions) + this.previousHash + this.nonce + this.timestamp).toString();
    }

    getAnswer(difficulty) {
        let answer = '';
        for (let i = 0; i < difficulty; i++) {
            answer += '0';
        }
        return answer;
    }

    mine(difficulty) {
        this.validateBlockTransactions();
        while (true) {
            this.hash = this.computeHash();
            if (this.hash.substring(0, difficulty) !== this.getAnswer(difficulty)) {
                this.nonce++;
                this.hash = this.computeHash();
            } else {
                break;
            }
        }
        console.log('挖矿结束', this.hash);
    }

    validateBlockTransactions() {
        for (let transaction of this.transactions) {
            if (!transaction.isValid()) {
                console.log('invalid transaction found in transactions,发现异常交易');
                return false;
            }
            return true;
        }
    }
}

//chain
class Chain {
    constructor() {
        this.chain = [this.bigBang()];
        this.transactionPool = [];
        this.minerReward = 50;
        this.difficulty = 4;
    }

    bigBang() {
        const genesisBlock = new Block('我是祖先', '');
        return genesisBlock;
    }

    getLatestBlock() {
        return this.chain[this.chain.length - 1];
    }

    addTransaction(transaction) {
        if (!transaction.isValid()) {
            throw new Error('invalid transaction');
        }
        console.log('valid transaction');
        this.transactionPool.push(transaction);
    }

    addBlockToChain(newBlock) {
        newBlock.previousHash = this.getLatestBlock().hash;
        // newBlock.hash = newBlock.computeHash();
        newBlock.mine(this.difficulty);
        this.chain.push(newBlock);
    }

    mineTransactionPool(minerRewardAddress) {
        const minerRewardTransaction = new Transaction('', minerRewardAddress, this.minerReward);
        this.transactionPool.push(minerRewardTransaction);
        const newBlock = new Block(this.transactionPool, this.getLatestBlock().hash);
        newBlock.mine(this.difficulty);
        this.chain.push(newBlock);
        this.transactionPool = [];
    }

    validateChain() {
        if (this.chain.length === 1) {
            if (this.chain[0].hash !== this.chain[0].computeHash()) {
                return false;
            }
            return true;
        }
        for (let i = 1; i <= this.chain.length - 1; i++) {
            const blockToValidate = this.chain[i];
            if (!blockToValidate.validateBlockTransactions()) {
                console.log('发现非法交易');
                return false;
            }
            if (blockToValidate.hash !== blockToValidate.computeHash()) {
                console.log('数据篡改');
                return false;
            }
            const previousBlock = this.chain[i - 1];
            if (blockToValidate.previousHash !== previousBlock.hash) {
                console.log('前后区块断裂');
                return false;
            }
        }
        return true;
    }
}

//测试数据
// const block = new Block('转账十元','123');
// console.log(block);
const julianCoin = new Chain();
const keyPairSender = ec.genKeyPair();
const privateKeySender = keyPairSender.getPrivate('hex')
const publicKeySender = keyPairSender.getPublic('hex')
const keyPairReceiver = ec.genKeyPair();
const privateKeyReceiver = keyPairReceiver.getPrivate('hex')
const publicKeyReceiver = keyPairReceiver.getPublic('hex')
const t1 = new Transaction(publicKeySender, publicKeyReceiver, 10);
t1.sign(keyPairSender);
console.log(t1);
console.log(t1.isValid())
// t1.amount = 20;
julianCoin.addTransaction(t1);
julianCoin.mineTransactionPool(publicKeyReceiver);
console.log(julianCoin.chain);
console.log(julianCoin.chain[1].transactions);
// const t2 = new Transaction('addr2', 'addr1', 5);
// julianCoin.addTransaction(t1);
// julianCoin.addTransaction(t2);
//console.log(julianCoin);
// julianCoin.mineTransactionPool('addr3');
// console.log(julianCoin);
// console.log(julianCoin.chain[1]);
// console.log(julianCoin.chain[1].transactions);
//console.log(julianChain.validateChain());
//console.log(julianChain);
// const block1 = new Block('转账十元', '');
// julianChain.addBlockToChain(block1);
// const block2 = new Block('转账十个十元', '');
// julianChain.addBlockToChain(block2);
// console.log(julianChain.validateChain());
// julianChain.chain[1].data = '转账一百个十元';
// julianChain.chain[1].mine(5);
// console.log(julianChain);
// console.log(julianChain.validateChain());