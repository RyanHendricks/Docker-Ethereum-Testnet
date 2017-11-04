/**
 * Ethereum Account Scanner
 *https://gist.github.com/ross-p/bd5d4258ac23319f363dc75c2b722dd9
 */

var web3,wallet,maxThreads = 50,
txns;

function scanTransactionCallback(txn, block) {
    var contract;
    if(!txn.to){
      var receipt = web3.eth.getTransactionReceipt(txn.hash);
      contract = receipt?receipt.contractAddress:null;
    }

    if (txn.to === wallet || txn.from === wallet || contract === wallet) {
        // A transaction credited ether into this wallet
        var ether = web3.fromWei(txn.value, 'ether');
        var dir = txn.to === wallet? 'to' : 'from';
        txn.timestamp = block.timestamp;
        console.log(`\r${block.timestamp} +${ether} ${dir} ${txn.from}`);
        txns.push(txn);
    }
}

function scanBlockCallback(block) {

    if (block.transactions) {
        for (var i = 0; i < block.transactions.length; i++) {
            var txn = block.transactions[i];
            scanTransactionCallback(txn, block);
        }
    }
}

function scanBlockRange( Web3, address, startingBlock, stoppingBlock, callback) {
    if (typeof Web3 == 'undefined' || typeof Web3.currentProvider == 'undefined') {
        return -1;
    }

    if (startingBlock > stoppingBlock) {
        return -1;
    }

    web3 = Web3,
    wallet = address,
    txns = [];

    var blockNumber = startingBlock,
        gotError = false,
        numThreads = 0,
        startTime = new Date();

    function getPercentComplete(bn) {
        var t = stoppingBlock - startingBlock,
            n = bn - startingBlock;
        return Math.floor(n / t * 100, 2);
    }

    function exitThread() {
        if (--numThreads == 0) {
            var numBlocksScanned = 1 + stoppingBlock - startingBlock,
                stopTime = new Date(),
                duration = (stopTime.getTime() - startTime.getTime())/1000,
                blocksPerSec = Math.floor(numBlocksScanned / duration, 2),
                msg = `Scanned to block ${stoppingBlock} (${numBlocksScanned} in ${duration} seconds; ${blocksPerSec} blocks/sec).`,
                len = msg.length;

                var numSpaces = process.stdout.columns? process.stdout.columns - len : len,
                spaces = Array(1+numSpaces).join(" ");

            process.stdout.write("\r"+msg+spaces+"\n");
            if (callback) {
              //arrange by increasing blocknumber
                txns.sort(function(a, b) {
                  if (a.blockNumber < b.blockNumber)
                    return 1;
                  if (a.blockNumber > b.blockNumber)
                    return -1;
                  return 0;
                });

                callback(gotError, txns);
            }
        }
        return numThreads;
    }

    function asyncScanNextBlock() {
        if (gotError) {
            return exitThread();
        }

        if (blockNumber > stoppingBlock) {
            return exitThread();
        }

        var myBlockNumber = blockNumber++;

        // Write periodic status update so we can tell something is happening
        if (myBlockNumber % maxThreads == 0 || myBlockNumber == stoppingBlock) {
            var pctDone = getPercentComplete(myBlockNumber);
            process.stdout.write(`\rScanning block ${myBlockNumber} - ${pctDone} %`);
        }

        web3.eth.getBlock(myBlockNumber, true, (error, block) => {

            if (error) {
                gotError = true;
                console.error("Error:", error);
            } else {
                scanBlockCallback(block);
                asyncScanNextBlock();
            }
        });
    }

    var nt;
    for (nt = 0; nt < maxThreads && startingBlock + nt <= stoppingBlock; nt++) {
        numThreads++;
        asyncScanNextBlock();
    }

    return nt; // number of threads spawned (they'll continue processing)
}

module.exports = scanBlockRange;
