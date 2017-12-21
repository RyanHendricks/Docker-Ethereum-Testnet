/**
* httpclient.js
*
* ajax calls to retrieve information from external server
*/

/**
 * constructor for http calls
 */
function HttpClient(networkid) {
  this.setUrl(networkid);
}

/**
 * ajax http call interface
 */
HttpClient.httpRequest = function( request ) {
  console.log( "httpRequest: " + JSON.stringify( request ));
  $.ajax( request );
}

/**
 * set the API url based on the chosen network
 */
HttpClient.prototype.setUrl = function (networkid) {
  const URL_TESTNET = "https://ropsten.etherscan.io/api";
  const URL_MAIN = "https://api.etherscan.io/api";

  this.url = URL_TESTNET;   
  this.networkid = 'testnet';   
  if( networkid ) {
    if( networkid === "mainnet" ) {
       this.url = URL_MAIN; 
       this.networkid = networkid;
    } 
  }
  console.log( 'networkid changed to ' + networkid + '. ' + this.url);
}


/**
 * return the url for transaction lookup in etherscan.io
 */
HttpClient.prototype.getTxHashUrl = function(txHash) {
  var url = '';
  if( this.networkid === 'mainnet' ) {
    url = 'http://etherscan.io/tx/' + txHash;
  } else {
    url = 'http://testnet.etherscan.io/tx/' + txHash;
  }
  return url;
}

/** 
 * call for a constant function
 */
HttpClient.prototype.ethCall = function (addr, rawTx, fromAddr, callback, errHandler){

  if( rawTx !== String ){
    rawTx = rawTx.toString("hex");
  }

  var data = {
               module: "proxy",
               action: "eth_call",
               to: addr,
               data: rawTx
             };

  if( fromAddr ) {
    data.from = fromAddr;  
  }

  HttpClient.httpRequest({
    method: "POST",
    url: this.url,
    data:  data,
    success: function(response) {
      console.log("ethCall result: " + JSON.stringify(response) );
      callback(response);
    }, 
    error: function(error) {
      errHandler('Unable to call function', error);
    }
  });
}

/** 
 * send a transaction for non-constant functions that require gas to run
 */
HttpClient.prototype.sendRawTransaction = function(rawTx, callback, errHandler) {

  if( rawTx !== String ){
    rawTx = rawTx.toString("hex");
  }

  rawTx = ethUtil.addHexPrefix(rawTx);

  console.log("sendRawTransaction: " + rawTx );

  HttpClient.httpRequest({
    method: "POST",
    url: this.url,
    data: {
      module: "proxy",
      action: "eth_sendRawTransaction",
      hex: rawTx
    },
    success: function(response) { 
      callback(response);
    },
    error: function(msg, error) {
      errHandler('Unable to send transaction', error);
    }
  });

}

/**
 *  get the gas price using the api offered by etherchain.
 *  TODO - use different gas price for testnet
 */
HttpClient.prototype.getGasPrice = function( callback, errHandler ) {
  var gasPrice =     20000000000;
  callback(gasPrice);
  
/*
  var url = "https://etherchain.org/api/gasPrice";
  HttpClient.httpRequest({
    method: "GET",
    url: url,
    data: {},
    success: function(response) { 
      var data = response.data;
      if( data && data.length > 0) {
        gasPrice = Web3.prototype.toDecimal(data[0].price);
        callback(gasPrice);
      }
      else {
        errHandler('Error getting gas price', JSON.stringify(response));
      }
    },
    error: function(error) {
      errHandler('Unable get gas price', error);
    }
  });
*/

}
 
/**
 * get gas limit 
 */
HttpClient.prototype.getGasLimit = function( callback ) {
  var gasLimit = 500000;
  callback( gasLimit );
}

/**
 * get the nounce for the account - used for constructing a transaction
 */
HttpClient.prototype.getNonce = function (accountAddress, callback, errHandler) {
  if( !accountAddress ) return;

  HttpClient.httpRequest({
     method: "POST",
     url: this.url,
     data: {
       module: "proxy",
       action: "eth_getTransactionCount",
       address: accountAddress,
       tag: "latest"
     },
     success: function (response) {
       console.log('getNonce:' + JSON.stringify(response));
       if( response.result ) {
         var nonce = Web3.prototype.toDecimal(response.result);
         callback(nonce);
       }
       else
       {
         errHandler('Unable to get nonce', response);
       }
     },
     error: function(err) {
       errHandler('Error getting nonce', err);
     }
  });
}

/**
 * get the balance for the account - for informational display only 
 */
HttpClient.prototype.getBalance = function(accountAddress, callback, errHandler) {
  if( !accountAddress ) return;

  HttpClient.httpRequest({
    method: "POST",
    url: this.url,
    data: {
      module: "account",
      action: "balance",
      address: accountAddress,
      tag: "latest" 
    },
    success: function (response) {
      console.log('getBalance:' + JSON.stringify(response));
      if( response.status === "1" )
      {
        var bal = Web3.prototype.fromWei(response.result, 'ether');
        callback(bal);
      }
      else
      {
        errHandler('Unable to get balance', response);
      }
    },
    error: function(errorThrown) {
      errHandler ('Error getting balance', errorThrown);
    }
  });
}

/** 
 * Get the source code and ABI from etherchain.  
 * Only used for mainnet because source is not available in testnet
 */
HttpClient.prototype.getSource = function( addr, callback, errHandler ) {
  if( !addr ) return;

  HttpClient.httpRequest({
    method: "GET",
    url: "https://etherchain.org/api/account/" + addr + "/source",
    success: function (response) {
      var contract = { };
      try {
        contract.name = response.data[0].contractName;
        contract.address = response.data[0].address;
        contract.abi = JSON.parse(response.data[0].abi);
        console.log("contract.abi: " + response.data[0].abi);
        callback(contract);
      } catch (err) {
        errHandler('Unable to get source', err);
      }
    },
    error: function(err) {
      errHandler ('Error getting source', err);
    }
  });
}

