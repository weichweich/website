const BLOCK_DURATION = 6000;

const getEndDateByBlock = (blockNumber, currentBlockNumber, currentTimestamp) => {
  let newStamp = parseInt(currentTimestamp.toString()) + ((parseInt(blockNumber.toString()) - currentBlockNumber.toNumber()) * BLOCK_DURATION)
  return new Date(newStamp);
}

function getRandomInt( max ) {
  return Math.floor( Math.random() * max )
}

function getRandomIntBetween(min, max) {
  min = Math.ceil(min);
  max = Math.floor(max);
  return Math.floor(Math.random() * (max - min)) + min;
}

const microToKSM = (microKSM) => {
  return parseInt(microKSM) / 1000000000000;
}

const microToKSMFormatted = (microKSM) => {
  return parseFloat((microToKSM(microKSM) / 1000).toFixed(2)) + 'K KSM';
}

const trimAddress = ( address, length = 3 ) => {
  return `${ address.substring(0,length) }...${ address.substring(address.length - length) }`
}

export {
  getRandomInt,
  getRandomIntBetween,
  microToKSM,
  microToKSMFormatted,
  trimAddress,
  getEndDateByBlock,
}