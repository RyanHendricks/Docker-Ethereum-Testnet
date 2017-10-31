/**
 *  Web worker for importing wallet
 *  FIXME: currently only supports v3 wallet
 */

onmessage = function(e) {
  var data = e.data;
  if( data.action === 'import' ){
    var json = data.json;
    var password = data.password;
   
    if( !json ) {
      postMessage({action: 'error', error:'Missing json.' });
      return;
    }

    try {
      json = JSON.parse(json);
    } catch( err ) {
      postMessage({action: 'error', error:'Unable to parse json.' });
      return;
    }

    importScripts('buffer.js', 'aes.js', 'scryptsy.js', 
                  'web3.min.js', 'ethereumjs-tx.js', 'wallet.js' ); 
    var wallet = new Wallet();
    var privateKey;
    try {
      privateKey = wallet.importFromJson( json, password, function(progress) {
        postMessage({
          action:'progress', 
          percent: progress
        });  
      }); 

      if( privateKey ) {
        postMessage({
          action: 'imported',
          privateKey: privateKey.toString('hex')
        });
      } else {
        postMessage( {
          action: 'error',
          error: 'Incorrect password' 
        });
      }
    } catch (err) {
      postMessage( {
        action: 'error',
        error: 'Error importing wallet:' + JSON.stringify(err) 
      });
    }
    
  } else {
    postMessage({action: 'error', error:'Invalid action: ' + data.action});
  }
}
