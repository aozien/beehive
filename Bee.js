
function Bee(){
  this.uId = beeUID();
  this.speed;
  this.fn ;
  this.fnID ;
  this.p_id ;
  this.dataSet =[]; 
  this.range = '';
  this.iterations ;
  this.workType='';
  this.resultToCheck=[] ;
  this.lastSeen = Date.now(); 
}
module.exports = Bee;
var counter = 0; 
function beeUID() {
  return ('bee'+counter+'-xxxxxxxxxxxx').replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}
var s = 0 
function beeUID2(){
s++;
return 'bee'+s ;
}