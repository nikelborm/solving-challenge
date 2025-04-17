// @ts-check

const assert = require('node:assert');

const arr = []
const alphabet = '01abcABC';

for (const _1 of alphabet) {
  for (const _2 of alphabet) {
    for (const _3 of alphabet) {
      // for (const _4 of alphabet) {
      //   for (const _5 of alphabet) {
      //     for (const _6 of alphabet) {
      //       for (const _7 of alphabet) {
      // console.log("'" + _1 + _2 + _3 + _4 + "',");
      // arr.push(_1 + _2);
      arr.push(_1 + _2 + _3);
      // arr.push(_1 + _2 + _3 + _4);
      // arr.push(_1 + _2 + _3 + _4 + _5);
      // arr.push(_1 + _2 + _3 + _4 + _5 + _6);
      // arr.push(_1 + _2 + _3 + _4 + _5 + _6 + _7);
    }
  }
}
// }
// }
// }
// }

const matchGroup = 'aa'

const rg1 = new RegExp(`^${matchGroup}....`);
const rg2 = new RegExp(`^.${matchGroup}...`);
const rg3 = new RegExp(`^..${matchGroup}..`);
const rg4 = new RegExp(`^...${matchGroup}.`);
const rg5 = new RegExp(`^....${matchGroup}`);

const rgf = new RegExp(`${matchGroup}`,);


/* /////////////////////////////////////////////////////////////////////////////

const firstMatchSet = arr.filter(item => rg1.test(item))


console.log(`First match set (${firstMatchSet.length} elements):`)

// console.log(firstMatchSet)



const other1 = arr.filter(item => !rg1.test(item));

console.log(`First other set (${other1.length} elements):`)

// console.log(other1)

// /////////////////////////////////////////////////////////////////////////////

const secondMatchSet = other1.filter(item => rg2.test(item))


console.log(`Second match set (${secondMatchSet.length} elements):`)

// console.log(secondMatchSet)




const other2 = other1.filter(item => !rg2.test(item));

console.log(`Second other set (${other2.length} elements):`)

// console.log(other2)

// /////////////////////////////////////////////////////////////////////////////

const thirdMatchSet = other2.filter(item => rg3.test(item))


console.log(`Third match set (${thirdMatchSet.length} elements):`)

// console.log(thirdMatchSet)




const other3 = other2.filter(item => !rg3.test(item));

console.log(`Third other set (${other3.length} elements):`)

// console.log(other3)


// /////////////////////////////////////////////////////////////////////////////

const fourthMatchSet = other3.filter(item => rg4.test(item))


console.log(`fourth match set (${fourthMatchSet.length} elements):`)

// console.log(fourthMatchSet)




const other4 = other3.filter(item => !rg4.test(item));

console.log(`fourth other set (${other4.length} elements):`)

// console.log(other4)

// /////////////////////////////////////////////////////////////////////////////

const fifthMatchSet = other4.filter(item => rg5.test(item))


console.log(`fifth match set (${fifthMatchSet.length} elements):`)

// console.log(fifthMatchSet)




const other5 = other4.filter(item => !rg5.test(item));

console.log(`fourth other set (${other5.length} elements):`)

// console.log(other5)


// /////////////////////////////////////////////////////////////////////////////

const hypotheticalMatchesCount = firstMatchSet.length +
  secondMatchSet.length +
  thirdMatchSet.length +
  fourthMatchSet.length +
  fifthMatchSet.length
  ;

console.log('hypotheticalMatchesCount:', hypotheticalMatchesCount);


// ///////////////////////////////////////////////////////////////////////////// */

let realMatchesCount = 0;

for (const str of arr) {
  if (rgf.test(str)) realMatchesCount++;
}

console.log('realMatchesCount:', realMatchesCount);
console.log('bad matches:', arr.length - realMatchesCount);
console.log('all:', arr.length);


// /////////////////////////////////////////////////////////////////


// assert(realMatchesCount === (hypotheticalMatchesCount));
