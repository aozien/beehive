'use strict';
var Bee = require("./Bee.js");


function Hive(opts) {
    var self =this; 
    var opts = opts ? opts : {};
    self.hiveMap = {};
    self.fnsMap = {};
    self.fnsMap['0000'] = { fn: function(){}, state: '0/00', batchSize: 1, timePerIteration: 400, rate: 10, callback: null };//state waiting started finished
    self.dataSourceMap = { '0000': [ [0]] }
    self.processQueue = [];
    self.processing = [];
    self.processDone = {};
    self.hiveCode = getID('hive');
    self.checkPercent = opts.percent ? opts.percent : 100;
    self.beeTimeout = opts.beeTimeout ? opts.beeTimeout : 20000;


    function chunkify(_id, LengthOfData, chunk) {
        for (var i = 0; i < Math.floor(LengthOfData / chunk); i++) {
            self.processQueue.push(OneProcess(_id, i * chunk, (i + 1) * chunk - 1));
        }
        var remainder = (LengthOfData % chunk);
        if (remainder) { self.processQueue.push(OneProcess(_id, LengthOfData - remainder, LengthOfData - 1)) }
        self.fnsMap[_id].state = 0 + '/' + Math.ceil(LengthOfData / chunk)
    }
    function getWork(bee) {

        var d = bee.p_id ? bee.p_id : false;
        if (!d) {
            var temp = nextProcess(bee);
            if (temp) {
                bee.fnID = temp.fnID;
                bee.fn = self.fnsMap[temp.fnID].fn;
                bee.p_id = temp.p_id;
                bee.workType = temp.type;
                bee.dataSet = self.dataSourceMap[temp.fnID].slice(temp.start, temp.end + 1);
                bee.resultToCheck = temp.result;
            }
        } else {
        }

    }

    function nextProcess(bee) {
        if (self.processing[0] && self.processing[0].estimatedFinish + self.beeTimeout < Date.now()) {
            delete self.hiveMap[self.processing[0].workerID];
            var ReProcess = OneProcess(self.processing[0].fnID, self.processing[0].start, self.processing[0].end, Date.now(), Date.now() + (self.fnsMap[self.processing[0].fnID].batchSize * (self.fnsMap[self.processing[0].fnID].timePerIteration + self.fnsMap[self.processing[0].fnID].delay)), bee.uId);
            self.processing.push(ReProcess)
            self.processing.shift()
            return ReProcess;
        } else if (self.processQueue[0] && self.processQueue[0].workerID != bee.uId) {
            var newProcess = self.processQueue[0];
            newProcess.timeStarted = Date.now()
            newProcess.estimatedFinish = Date.now() + Math.ceil(self.fnsMap[newProcess.fnID].batchSize * self.fnsMap[newProcess.fnID].timePerIteration)
            newProcess.workerID = bee.uId;
            self.processQueue.splice(0, 1);
            self.processing.push(newProcess);
            return newProcess;
        } else if (self.processQueue[0] && self.processQueue[0].workerID == bee.uId) {
            if (self.processQueue[0].type != 'check') { throw new Error('Bees ids are being recycled in some new processes') }
            var tempArr = self.processQueue.slice(0, Math.max(10, self.processQueue.length));
            var chosenProcess = '';
            for (var i = 0; i < tempArr.length; i++) {
                var element = tempArr[i];
                if (element.workerID != bee.uId) {
                    chosenProcess = element;
                    chosenProcess.workerID = bee.uId;
                    bee.resultToCheck = chosenProcess.result;
                    chosenProcess.timeStarted = Date.now()
                    chosenProcess.estimatedFinish = Date.now() + Math.ceil(self.fnsMap[chosenProcess.fnID].batchSize * self.fnsMap[chosenProcess.fnID].timePerIteration)
                    self.processQueue.splice(i, 1);
                    i=tempArr.length;
                }
            }
            chosenProcess = chosenProcess ? chosenProcess : OneProcess('0000', 0, 1);
            self.processing.push(chosenProcess)
            return chosenProcess;

        } else if (!self.processQueue[0]) {
            var waitProcess = OneProcess('0000', 0, 1)
            self.processing.push(waitProcess)
            return waitProcess;
        }
        else {
            return OneProcess('0000', 0, 1)
        }

    }


    return {
        addWorker: function (bee) {
            self.hiveMap[bee.uId] = bee;
            getWork(bee);
        },
        deleteWorker: function (uId) {
            if (uId && uId.length == 26 && uId.split('-').length == 3) {
                this.returnProcess(self.hiveMap[uId].p_id);
                delete self.hiveMap[uId];
            }
        },
        returnProcess: function (p_id) {
            var processIndex = search(self.processing, 'p_id', p_id);
            if (processIndex != -1) {
                self.processQueue.unshift(OneProcess(self.processing[processIndex].fnID, self.processing[processIndex].start, self.processing[processIndex].end))
                self.processing.splice(processIndex, 1)
            }
        },
        endProcess: function (p_id) {
            var processIndex = search(self.processing, 'p_id', p_id);
            if (processIndex != -1) {
                self.hiveMap[self.processing[processIndex].workerID].p_id = false;
                self.processing.splice(processIndex, 1)
            }

        },
        saveWork: function (uId, fnID, data) {
            if (uId && self.hiveMap[uId] && self.hiveMap[uId].fnID == fnID) {
                var currentBee = self.hiveMap[uId]
                var processIndex = search(self.processing, 'p_id', currentBee.p_id);
                if (processIndex > -1 && self.processing[processIndex].fnID == fnID) {
                    var currentProcess = self.processing[processIndex];
                    if (currentProcess.type == 'new' && Math.random() * 100 <= self.checkPercent) {
                        this.check(currentBee, currentProcess, data);
                    } else if (currentProcess.type == 'check') {

                        if (data[0] == 'false') {
                            currentProcess.result = data[1];
                            this.check(currentBee, currentProcess, data[1])
                        } else {
                            self.processDone[fnID][currentProcess.start + '-' + currentProcess.end] = currentBee.resultToCheck;
                            currentBee.resultToCheck = [];
                            self.fnsMap[fnID].state = (parseInt(self.fnsMap[fnID].state.split("/")[0]) + 1) + '/' + self.fnsMap[fnID].state.split("/")[1]
                            if (self.fnsMap[fnID].state.split("/")[0] == self.fnsMap[fnID].state.split("/")[1]) {
                                self.fnsMap[fnID].callback(self.processDone[fnID]);
                            }
                            this.endProcess(currentProcess.p_id)
                        }

                    } else {
                        self.processDone[fnID][currentProcess.start + '-' + currentProcess.end] = data;
                        self.fnsMap[fnID].state = (parseInt(self.fnsMap[fnID].state.split("/")[0]) + 1) + '/' + self.fnsMap[fnID].state.split("/")[1]
                        if (self.fnsMap[fnID].state.split("/")[0] == self.fnsMap[fnID].state.split("/")[1]) {
                            self.fnsMap[fnID].callback(self.processDone[fnID]);
                        }
                        this.endProcess(currentProcess.p_id)
                    }
                } else {
                    }
            }
            else {
            }

        },
        check: function (bee, currentProcess, data) {
            self.processQueue.unshift(OneProcess(bee.fnID, currentProcess.start, currentProcess.end, 0, 0, data, bee.uId))
            this.endProcess(currentProcess.p_id)
        },
        addTask: function (opts, callback) {
            if (!opts.fn || !opts.dataSet) { throw new Error('missing a function (fn) or a dataSet parameter ') }
            opts.batchSize = opts.batchSize ? opts.batchSize : Math.round(opts.dataSet.length / 100);
            var _id = opts.name?getID(name) : getID('fn');
            self.processDone[_id] = {};
            self.fnsMap[_id] = {}
            self.fnsMap[_id].fn = opts.fn;
            self.fnsMap[_id].batchSize = opts.batchSize;
            self.fnsMap[_id].delay = opts.delay ? opts.delay : 0;
            self.fnsMap[_id].timePerIteration = opts.timePerIteration ? opts.timePerIteration : 1;
            self.fnsMap[_id].callback = (typeof callback === 'function') ? callback : function() {};
            self.dataSourceMap[_id] = opts.dataSet;
            chunkify(_id, opts.dataSet.length, opts.batchSize)
        },
        request: function (req, res) {
            // console.log('Hive Got a request of type ', req.body.type)
            switch (req.body.type) {
                case 'new':
                    if (!req.cookies.beeID || (req.cookies.beeID  && eval(req.cookies.expire) < Date.now())) {
                        if (req.cookies.beeID && self.hiveMap[req.cookies.beeID]) { this.deleteWorker(req.cookies.beeID) }
                        var bee = new Bee();
                        this.addWorker(bee);
                        bee.lastSeen = Date.now()
                        res.cookie('beeID', bee.uId)
                        res.cookie('expire', Date.now() + self.beeTimeout)
                        res.send({ uId: bee.uId, fn: bee.fn.toString(), DS: bee.dataSet, fnID: bee.fnID, delay: self.fnsMap[bee.fnID].delay, type: bee.workType, result: bee.resultToCheck })
                    }
                    else {  }
                    break;
                case 'close':
                    this.deleteWorker(req.body.uId)
                    res.cookie('beeID', null)
                    break;
                case 'save':
                    if (req.body.fnID != '0000') {
                        this.saveWork(req.body.uId, req.body.fnID, req.body.Result)
                    }
                    getWork(self.hiveMap[req.body.uId])
                    var bee = self.hiveMap[req.body.uId];
                    bee.lastSeen = Date.now();
                    res.cookie('expire', Date.now() + self.beeTimeout)
                    res.send({ uId: bee.uId, fn: bee.fn.toString(), DS: bee.dataSet, fnID: bee.fnID, delay: self.fnsMap[bee.fnID].delay, type: bee.workType, result: bee.resultToCheck })
                    break;
            }
            
            pr(`Hive:> Queued ${self.processQueue.length} Processing ${self.processing.length} Workers ${Object.keys(self.hiveMap).length}`, 'c')
            pr(' '+self.processing.map(function (a, i) { return `${i}:${a.fnID} state (${self.fnsMap[a.fnID].state}) from (${a.start}:${a.end}) \n ` }).toString().replace(/,/ig,''), 'c')
        },Hive:self
    }

}

function getID(name) {
    if (!name) { name = 'xxx' }
    return (name + '-xxxxxxxxxxxx').replace(/[xy]/g, function (c) {
        var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
        return v.toString(16);
    });
}


module.exports = Hive;
var pCount = 0;
function OneProcess(fnId, R_start, R_end, t_start, t_finish, Results, w_ID) {
    pCount++;
    return {
        fnID: fnId,
        start: R_start,
        end: R_end,
        timeStarted: t_start,
        estimatedFinish: t_finish,
        workerID: w_ID,
        p_id: pCount,
        type: (Results) ? 'check' : 'new',
        result: (Results) ? Results : false
    }
}


function search(items, key, value) {
    var index = -1;
    for (var i = 0; i < items.length; i++) {
        if (items[i][key] == value) {
            index = i;
            break;
        }
    }
    return index;
}

function pr(text, color) {
    if (!color) { color = 'cyan' }
    var t = '';
    switch (color) {
        case 'cyan':
        case 'c':
            t = '\x1b[36m';
            break;
        case 'blue':
            t = '\x1b[34m'
            break;
        case 'red':
            t = '\x1b[31m'
            break;
        case 'bgred':
            t = '\x1b[41m'
            break;
    }
     console.log(t + '%s\x1b[0m', text)
}



