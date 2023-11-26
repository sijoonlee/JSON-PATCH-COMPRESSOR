

// Iterate branches without child
// list last write and ancestors

// { 'op': 'replace', 'path': '/address/province', value: 'Ontario' },  --- (1)
// { 'op': 'replace', 'path': '/address', value: { city: 'Ottawa', code: 'ON' }},  ----- (2)
// { 'op': 'replace', 'path': '/address/city', value: 'Kingston' }, ------- (3)
// { 'op': 'replace', 'path': '/address/city', value: 'Toronto' }, -------- (4)



// address/province should check (1) (2) --> higher ancester is last write --> (2) survives 
//                                      -->  { 'op': 'replace', 'path': '/address', value: { city: 'Ottawa', code: 'ON' }}  // write (2)
// address/city --> shouuld check (2) (3) (4) --> (2) higher anscester (4) last write survivies
//   --> { 'op': 'replace', 'path': '/address', value: { city: 'Ottawa', code: 'ON' }}
//   --> { 'op': 'replace', 'path': '/address/city', value: 'Toronto' }
//                                      Combine --> { 'op': 'replace', 'path': '/address', value: { city: 'Toronto', code: 'ON' }} // write (4) --> same level, last write -> win


const Trie = require('./Trie.js')

const trie = new Trie([
    { 'op': 'replace', 'path': '/home/province/code', value: '??'},
    { 'op': 'replace', 'path': '/home', value: { city: { name:'Ottawa', code: 'ot' }, province: { name: 'Ontario', code: 'ON'} }},
    { 'op': 'replace', 'path': '/home/city', value: { name: 'Kingston', code: 'kt' }},
    { 'op': 'replace', 'path': '/home/city', value: { name: 'Toronto', code: 'tt' }},
    { 'op': 'replace', 'path': '/home/city/name', value: 'tttt'},
    { 'op': 'add', 'path': '/home/city/alias', value: 'some'},
    { 'op': 'remove', 'path': '/home/province/name', value: 'somewhere' },
    { 'op': 'replace', 'path': '/firstName', value: 'test'},
    { 'op': 'replace', 'path': '/lastName', value: 'test'},
    { 'op': 'replace', 'path': '/nowhere/to/go', value: 'test'}
])

const anotherTrie = new Trie([
    { 'op': 'replace', 'path': '/home', value: { city: { name:'Ottawa', code: 'ot' }, province: { name: 'Ontario', code: 'ON'} }},
    { 'op': 'replace', 'path': '/home/city', value: { name: 'Toronto', code: 'tt' }},
    { 'op': 'replace', 'path': '/home/city', value: { name: 'Kingston', code: 'kt' }},
    { 'op': 'replace', 'path': '/home/city/name', value: 'tttt'},
    { 'op': 'add', 'path': '/home/city/alias', value: 'some'},
    { 'op': 'replace', 'path': '/home/province/code', value: '??'},
    { 'op': 'remove', 'path': '/home/province/name', value: 'somewhere' },
    { 'op': 'replace', 'path': '/firstName', value: 'test'},
    { 'op': 'replace', 'path': '/lastName', value: 'test'},
    { 'op': 'replace', 'path': '/nowhere/to/go', value: 'test'}
])

const anotherTrie2 = new Trie([
    { 'op': 'replace', 'path': '/1/home', value: { city: { name:'Ottawa', code: 'ot' }, province: { 3: { name: 'Ontario', code: 'ON'} }}},
    { 'op': 'replace', 'path': '/1/home/city', value: { name: 'Toronto', code: 'tt' }},
    { 'op': 'replace', 'path': '/1/home/city', value: { name: 'Kingston', code: 'kt' }},
    { 'op': 'replace', 'path': '/1/home/city/name', value: 'tttt'},
    { 'op': 'add', 'path': '/1/home/city/alias', value: 'some'},
    { 'op': 'replace', 'path': '/1/home/province/3/code', value: '??'},
    { 'op': 'remove', 'path': '/1/home/province/3/name', value: 'somewhere' },
    { 'op': 'replace', 'path': '/firstName', value: 'test'},
    { 'op': 'replace', 'path': '/lastName', value: 'test'},
    { 'op': 'replace', 'path': '/nowhere/to/go', value: 'test'}
])



function run() {
    console.log(JSON.stringify(trie.getCompressedPatches()))
    console.log(JSON.stringify(anotherTrie.getCompressedPatches()))
    console.log(JSON.stringify(anotherTrie2.getCompressedPatches()))
}
console.log("-------------")
run()
