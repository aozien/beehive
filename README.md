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
the options object properties for the hive object are
                    {
                       beeTimeout :(time in ms) time it should wait before considering the bee expired  (client side disconnected)
                            default ->20000 which is 20 seconds

                       checkPercent : (number from 0 to 100) it means there's X (X: X<=100 & X>=0) chance that the data from client side is to be checked
                              0 means no checks will be required , 100 means every batch will be calculated twice  .
                                       default ->100

                       logging : boolean determines whether or not it should display log in the console
                             default -> true
                       }

### Usage

#### setting up route and processing requests ( Hive.request(req,res) )
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

### And coding style tests

Explain what these tests test and why

```
Give an example
```

## Deployment

Add additional notes about how to deploy this on a live system

## Authors

* **Billie Thompson** - *Initial work* - [PurpleBooth](https://github.com/PurpleBooth)

See also the list of [contributors](https://github.com/your/project/contributors) who participated in this project.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details

## Acknowledgments

* Hat tip to anyone who's code was used
