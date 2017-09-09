# Beehive Massive Parallel Processing (beehive-mpp)
combine the processing power of your website's visitors' computers to create a one large network of processors that's capable of solving large complex problems without overburdening your server 

## how it works 
the module transfers the load of processing large repetitive tasks from server side to client side computers, as it divides large repetitive tasks to smaller ones, the smaller tasks is then to be sent and processed on client side , the result will be sent back to the server and -optionally- checked by a different client visiting the site.
it's more handy in tasks that require doing a repetitive task with large amount of data such as training a neural network in machine learning.

## Getting Started

### Installing
install and save module
```
npm install beehive-mpp -s
```
then require it  in the route file 
```
var Hive = require('beehive-mpp').Hive(options);


// set up route 
app.use('/Hive', function (req, res, next) {
  Hive.request(req, res);
  res.end();
});
```
and in client side hmtl pages add this js file to them
```
<script src="dist/bee.js"></script>
<script> 
 var bee = new Bee('/Hive');
     bee.initialize()
</script>

```
#### options available for Hive object :
* beeTimeout :(time in ms) time it should wait before considering the bee expired (client side disconnected), default ->20000 which is 20 seconds
* checkPercent : (number from 0 to 100) it means there's X (X: X<=100 & X>=0) chance that the data from client side is to be checked
* logging : boolean determines whether or not it should display log in the console , default -> true

### Usage

#### Setting up route and processing requests ( Hive.request(req,res) )
```
app.use('/Hive', function (req, res, next) {
  Hive.request(req, res);
  res.end();
});
```

#### Adding tasks to the hive ( Hive.addTask(options,callback) )

Used to assign the function and dataset to the hive ,the dataset will be later broken into smaller batches and added to the process queue to be processed by the clientside then to be checked by another pc

```
Hive.addTask(options,callback)
```
##### The options object:

 * fn: -*required*- the function that will process data ,you can pass either the name of the function on the front side as a string value or you can write and pass the js function itself.
 * dataSet: -*required*- (2D array) the data which will be processed , it takes the form of a 2d array [[arg1,arg2],[arg3,arg4], .... ] if the function takes 2 parameters as input, note that the number of iterations will be dependant on the dataset length.
 * batchSize:(Number) the whole task will be split into smaller process each with a fixed batch size , ie: if there are 1 million test case and the batch size is 10000 that means there would be a hundred process in the process queue , defaults to 1% from the whole dataset if not assigned.
 * name: (String) assign a name to the task so you would be able to recognize it from other tasks.
 * timePerIteration: (time in ms) should be assigned if the function takes too long to process one iteration , helpful to estimate the time require for task and it's expiration date , defaults to 1 ms if not assigned.


### Examples on different ways for adding tasks

```
//backend 
Hive.addTask({
    fn: 'sum' , dataSet : [[1,2] , [3,5]] , batchSize:1 
},function (data){
    console.log(data)
})

//frontend
function task(a,b){
    return a+b ;
}
var bee = new Bee('/Hive');
    bee.initialize()

```

or 
```
//backend 
Hive.addTask({
    fn: function task(a,b){
        return a+b ;
        } , dataSet : [[1,2] , [3,5]] , batchSize:1 
    },function (data){
        console.log(data)
})

//frontend
var bee = new Bee('/Hive');
     bee.initialize()

```
the result in both cases would be the same object
{
    '0-0':[3] ,
    '1-1':[8]
}
## Authors

* **Tarek Elwkeel** - *Initial work* - [Tarek Elwkeel](https://github.com/tarekelwkeel)

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
