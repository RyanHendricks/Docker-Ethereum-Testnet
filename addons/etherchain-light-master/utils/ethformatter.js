var BigNumber = require('bignumber.js'),
Ether     = new BigNumber(10e+17);
Gwei = new BigNumber(10e+8);


function formatAmount(amount,unit) {
  var ret = new BigNumber(amount.toString()),
  dec = ret%Ether == 0;
  if(!unit){
  ret = ret.dividedBy(Ether),
  unit = 'ETH';
  }
  else{
    switch(unit.toLowerCase()){
      case 'wei':
        unit = 'WEI';
        break;
      case 'gwei':
        unit = 'GWEI';
        ret = ret.dividedBy(Gwei);
        break;
    }
  }

  //if(dec)
  //ret = Number(ret);

  //if(Number(ret)<1)
  //ret = !dec ? Number(ret).toFixed(20):Number(ret);
  return ret + ' ' + unit;
}
module.exports = formatAmount;
