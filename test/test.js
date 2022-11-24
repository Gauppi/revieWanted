<script src="/src/script.js/"/>

let list = [];
for (let i=0; i <5000; i++){
  list.push(i)
}
let result = sliceIntoChunks(list,1000);
console.log(result);

list.push(5000);
result = sliceIntoChunks(list,1000);
console.log(result);

list.length = 499;
result = sliceIntoChunks(list,1000);
console.log(result);