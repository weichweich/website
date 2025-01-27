import { merge, values, keyBy } from 'lodash'
const BLOCK_DURATION = 6000;
const EXPONENT_CONSTANTS = [3, 0.4]

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
  return KSMFormatted( microToKSM( microKSM ) )
}

const KSMFormatted = ( KSM ) => {
  return `${ parseFloat( KSM / 1000 ).toFixed(2) } K KSM`
}

const trimAddress = ( address, length = 3 ) => {
  return `${ address.substring(0,length) }...${ address.substring(address.length - length) }`
}

/**
 * Merge two arrays (similar to join on mysql) based on key
 * https://stackoverflow.com/questions/35091975/how-to-use-lodash-to-merge-two-collections-based-on-a-key
 */
const mergeArrays = (a1, a2, key) => {
  const merged = merge(keyBy(a1, key), keyBy(a2, key));
  return values(merged);
}

/**
 * Merge two arrays (similar to join on mysql) based on key
 * https://stackoverflow.com/questions/35091975/how-to-use-lodash-to-merge-two-collections-based-on-a-key
 * @param {*} a1
 * @param {*} a2
 * @param {*} a1key
 * @param {*} a2key
 */
const joinArrays = (a1, a2, a1key, a2key) => {
  return a1.map( obj => {
    return Object.assign(obj, a2.find( el => el[a2key] === obj[a1key] ) );
  })
}

const calculateLuck = (
  n,
  minIn,
  maxIn,
  minOut,
  maxOut,
  exponent,
  minAmount,
  luckMultiplier,
) => {
  minOut = parseInt(minOut);
  maxOut = parseInt(maxOut);
  if (n > maxIn) {
      n = maxOut;
  }
  else if (n < minAmount) {
      n = minOut;
  }
  else {
      // unscale input
      n -= minIn
      n /= maxIn - minIn
      n = Math.pow(n, exponent)
      // scale output
      n *= maxOut - minOut
      n += minOut
  }
  return n * luckMultiplier
}

const getLuckMultiplier = ( options, config ) => {
  let luckMultiplier = 1.0

  const {
    babyBonus,
    toddlerBonus,
    adolescentBonus,
    adultBonus
  } = config

  if ( options.babyEquipped ) {
    luckMultiplier = babyBonus ? (1 + (babyBonus / 100)) : 1.0
  } else if ( options.toddlerEquipped ) {
    luckMultiplier = toddlerBonus ? (1 + (toddlerBonus / 100)) : 1.0
  } else if ( options.adolescentEquipped ) {
    luckMultiplier = adolescentBonus ? (1 + (adolescentBonus / 100)) : 1.0
  } else if ( options.adultEquipped ) {
    luckMultiplier = adultBonus ? (1 + (adultBonus / 100)) : 1.0
  }

  return luckMultiplier
}

/**
 * return the chances array
 */
 const lucksForConfig = ( ksm, refConfig, luckMultiplier ) => {
  const lucks = {}

  if ( ksm < refConfig.minValue ) {
    return {
      common: 100,
      rare: 0,
      epic: 0,
    }
  }
  //do not calc luck for the last to items (common, default)
  //will be done below
  //TODO will have to find a filter that will filter the correct items
  const optionsToConsider = refConfig?.options.filter( opt => opt.rarity !== 'common' )
  optionsToConsider?.forEach( option => {
    if ( ksm < refConfig.median ) {
      lucks[`${ option.rarity }`] = calculateLuck(
        ksm,
        refConfig.minValue,
        refConfig.median,
        option.minProbability,
        option.sweetspotProbability,
        EXPONENT_CONSTANTS[0],
        refConfig.minAmount,
        luckMultiplier,
      )
    } else {
      lucks[`${ option.rarity }`] = calculateLuck(
          ksm,
          refConfig.median,
          refConfig.maxValue,
          option.sweetspotProbability,
          option.maxProbability,
          EXPONENT_CONSTANTS[1],
          refConfig.minAmount,
          luckMultiplier,
        )
    }
  })
  lucks.rare = (100 - lucks.epic) / 100 * lucks.rare
  lucks.common = 100 - lucks.rare - lucks.epic
  return lucks
}

/**
 * Produce an animated svg that can be used as image placeholder
 * @param {Integer} w
 * @param {Integer} h
 * @returns html string
 */
const shimmer = (w, h) => `
  <svg width="${w}" height="${h}" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink">
    <defs>
      <linearGradient id="g">
        <stop stop-color="#fff" offset="20%" />
        <stop stop-color="#eee" offset="50%" />
        <stop stop-color="#fff" offset="70%" />
      </linearGradient>
    </defs>
    <rect width="${w}" height="${h}" fill="#fff" />
    <rect id="r" width="${w}" height="${h}" fill="url(#g)" />
    <animate xlink:href="#r" attributeName="x" from="-${w}" to="${w}" dur="1s" repeatCount="indefinite"  />
  </svg>`

/**
 * Base64 encode string, can be used for inline images
 * @param {String} str String to encode
 * @returns String
 */
const toBase64 = (str) =>
  typeof window === 'undefined'
    ? Buffer.from(str).toString('base64')
    : window.btoa(str)

    const titleCase = (s) =>
    s.replace(/^_*(.)|_+(.)/g, (s, c, d) => c ? c.toUpperCase() : ' ' + d.toUpperCase())


/**
 * Stips all tags from html
 * @param {String} html
 * @returns String
 */
function stripHtml(html){
  let doc = new DOMParser().parseFromString(html, 'text/html');
  return doc.body.textContent || "";
}

export {
  getRandomInt,
  getRandomIntBetween,
  KSMFormatted,
  microToKSM,
  microToKSMFormatted,
  trimAddress,
  getEndDateByBlock,
  mergeArrays,
  joinArrays,
  lucksForConfig,
  getLuckMultiplier,
  shimmer,
  toBase64,
  titleCase,
  stripHtml
}