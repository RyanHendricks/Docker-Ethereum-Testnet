var express = require('express');
var router = express.Router();

var async = require('async');
var Web3 = require('web3');

router.get('/:block', function(req, res, next) {
  
  var config = req.app.get('config');  
  var web3 = new Web3();
  web3.setProvider(config.provider);
 
  web3._extend({
    property: 'debug',
    methods: [
      new web3._extend.Method({
         name: 'traceBlockByNumber',
         call: 'debug_traceBlockByNumber',
         params: 1,
      })
    ]
  });

  async.waterfall([
    function(callback) {
      web3.eth.getBlock(req.params.block, true, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {
      if (!result) {
        return next({name : "BlockNotFoundError", message : "Block not found!"});
      }

      var hex= web3.toHex(result.number);
      web3.debug.traceBlockByNumber(hex, function(err, traces) {
        callback(err, result, traces);
      });
    }
  ], function(err, block, traces) {
    if (err) {
      return next(err);
    }

    block.transactions.forEach(function(tx) {
      if(tx.to == 0x0)tx.to = null;
      tx.traces = [];
      tx.failed = false;
      if (traces != null && traces.structLogs != null) {
        traces.structLogs.forEach(function(trace) {
          if (tx.hash === trace.transactionHash) {
            tx.traces.push(trace);
            if (trace.error) {
              tx.failed = true;
              tx.error = trace.error;
            }
          }
        });
      }
      // console.log(tx);
    });
    res.render('block', { block: block });
  });

});

router.get('/uncle/:hash/:number', function(req, res, next) {

  var config = req.app.get('config');
  var web3 = new Web3();
  web3.setProvider(config.provider);

  async.waterfall([
    function(callback) {
      web3.eth.getUncle(req.params.hash, req.params.number, true, function(err, result) {
        callback(err, result);
      });
    }, function(result, callback) {
      if (!result) {
        return next({name : "UncleNotFoundError", message : "Uncle not found!"});
      }

      callback(null, result);
    }
  ], function(err, uncle) {
    if (err) {
      return next(err);
    }

    console.log(uncle);

    res.render('uncle', { uncle: uncle, blockHash: req.params.hash });
  });

});

module.exports = router;
