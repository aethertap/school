class Mix {
  //const prng = splitmix32((Math.random()*2**32)>>>0)
  //for(let i=0; i<10; i++) console.log(prng());

splitmix32(a) {
    return function() {
      a |= 0;
      a = a + 0x9e3779b9 | 0;
      let t = a ^ a >>> 16;
      t = Math.imul(t, 0x21f0aaad);
      t = t ^ t >>> 15;
      t = Math.imul(t, 0x735a2d97);
      return ((t = t ^ t >>> 15) >>> 0); // / 4294967296;
    }
  }

date_stable_rng(date) {
    if(!date) {
      date = new Date();
    }
    return this.splitmix32(date.getYear()*(date.getMonth()+1)*date.getDay());
  }

rand_subset(data,n,rng) {
    let result = [];
    if(!rng) {
      rng = this.splitmix32((Math.random()*2**32)>>>0);
    }
    let swap=(a,b)=>{
      let tmp = data[a];
      data[a] = data[b];
      data[b] = tmp;
    }
    if(n >= data.length) {
      n = data.length-1; // shuffle the whole array
    }
    for(let i=0; i<n; i++) {
      let index = rng()%(data.length-i);
      result.push(data[index]);
      swap(data.length-i, index);
    }
    return result;
  }
}
