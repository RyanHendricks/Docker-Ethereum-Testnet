/**
 * Wallet
 *
 * A wallet manages an Ethereum private key and uses the key to
 * sign transactions to be sent to Ethereum smart contracts
 *
 */

function Wallet() {
  this._privateKey = null;
}



Wallet.getValue = function(json, path) {
  var current = json;

  var parts = path.split('/');
  for (var i = 0; i < parts.length; i++) {
    var search = parts[i].toLowerCase();
    var found = null;
    for (var key in current) {
      if (key.toLowerCase() === search) {
        found = key;
        break;
      }
    }
    if (found === null) {
      return null;
    }
    current = current[found];
  }
  return current;
}


Wallet.prototype.importFromJson = function (json, password, callback){

  if( !json ) throw new Error('json is missing');
  if( json === String ) {
    try {
      json = JSON.parse(json);
    } catch (err) {
      throw new Error("Invalid JSON Wallet");
    }
  }
  var ciphertext = Wallet.getValue(json, "crypto/ciphertext");
  if( !ciphertext ) throw new Error('ciphertext is missing in json file.'); 
  var cipherhex = new Buffer(ciphertext, 'hex');

  var key = null;

  // Derive the key
  var kdf = Wallet.getValue(json, "crypto/kdf");
  if (kdf && kdf.toLowerCase() === "scrypt") {

  // Scrypt parameters
  var saltString = Wallet.getValue(json, 'crypto/kdfparams/salt');
  if( !saltString ) throw new Error('salt is missing in json file.'); 
  var salt = new Buffer(saltString, 'hex');
  var N = Wallet.getValue(json, 'crypto/kdfparams/n');
  var r = Wallet.getValue(json, 'crypto/kdfparams/r');
  var p = Wallet.getValue(json, 'crypto/kdfparams/p');
  if (!N || !r || !p) {
    throw new Error("Invalid JSON Wallet (bad kdfparams)");
  }

  // We need exactly 32 bytes of derived key
  var dkLen = Wallet.getValue(json, 'crypto/kdfparams/dklen');
  if (dkLen !== 32) {
    throw new Error("Invalid JSON Wallet (dkLen != 32)");
  }

  // Derive the key, calling the callback periodically with progress updates
  
  if( !password ) password = '';
  var passwordBytes = new Buffer(password, 'utf8');
  var derivedKey = scryptsy(passwordBytes, salt, N, r, p, dkLen, function(progress) {
    if (progress) {
      callback(progress.percent);
    }
  });

  
  // Check the password is correct
  var mac = ethUtil.sha3(buffer.SlowBuffer.concat([derivedKey.slice(16, 32), cipherhex])).toString('hex')
  var macWallet = Wallet.getValue(json, 'crypto/mac').toLowerCase();
  if (mac.toLowerCase() !== macWallet) {
    console.log("Message Authentication Code mismatch (wrong password)");
    return null;
  }

  } else {
    throw new Error("Unsupported key derivation function");
  }

  key = derivedKey.slice(0, 16);
  var seed = null;

  var cipher = Wallet.getValue(json, 'crypto/cipher');
  if (cipher === 'aes-128-ctr') {
    var iv = Wallet.getValue(json, 'crypto/cipherparams/iv');
    if( !iv ) throw new Error('iv is missing.'); 
    var ivBytes = new Buffer(iv, 'hex');
    var counter;
    try {
      counter = new aesjs.Counter(ivBytes);
    } catch (err) {
      throw new Error('new aesjs counter error' + err);
    }

    var aes ;
    try {
      aes = new aesjs.ModeOfOperation.ctr(key, counter);
    } catch (err) {
      throw new Error('new aesjs mode of operation error' + err);
    }

    try {
      seed = aes.decrypt(cipherhex);
    } catch (err) {
      throw new Error('new aesjs decrypt error: ' + err);
    }

  } else {
    throw new Error("Unsupported cipher algorithm");
  }


  var privateKey = ethUtil.addHexPrefix(ethUtil.padToEven(seed.toString('hex')));
  var address = ethUtil.privateToAddress(seed).toString('hex');
  var addressJson = Wallet.getValue(json, 'address'); 
  console.log('addr=' + address + ' jsonAdr= ' + addressJson);
  if( address === addressJson ) {
    this._privateKey = seed;
  } else {
    throw new Error("Invalid address for the private key");
  }
  
  return privateKey;
}

Wallet.prototype.importFromKey = function(privateKey) {
  var key;
  if( typeof privateKey === 'string' ) {
    console.log('converting private key to buffer');
    key = new Buffer(ethUtil.stripHexPrefix(privateKey), 'hex');
  }
  else {
    console.log('no need to convert private key to buffer');
    key = privateKey; 
  }

  this._privateKey = key; 
  
  var address = ethUtil.addHexPrefix(
                  ethUtil.padToEven(
                    ethUtil.privateToAddress(key).toString('hex')));
  return address;
}

/**
 *  signs a transaction and returns the serialized string
 */
Wallet.prototype.sign = function (txObject){

  if( !this._privateKey ) {
    throw new Error('Private key is not available, import wallet to load the private key');
  }
  var tx = new EthTx(txObject);
  tx.sign(this._privateKey);
  var serializedTx = tx.serialize();
  return serializedTx;
}

Wallet.prototype.getAddressFromPrivateKey = function (){
  var address = '';
  if( this._privateKey ) {
    var rawAddress = ethUtil.privateToAddress(this._privateKey).toString('hex');
    address = ethUtil.addHexPrefix(ethUtil.padToEven(rawAddress));
  }
  return address;
}

Wallet.prototype.clearPrivateKey = function() {
  this._privateKey = null;
}
