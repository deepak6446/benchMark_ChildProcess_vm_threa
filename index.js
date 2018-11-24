let { EventEmitter } = require('events');
process.setMaxListeners(0);
EventEmitter.defaultMaxListeners = Infinity;

let app = require('express')();
let _ = require('lodash');
let { Worker } = require('worker_threads');
let cp = require('child_process');
let path = require('path');

let liveCP = [];                             //liveCP = [ { reqId: [ 12378221 ], count:0, child: 'forkObject' } ]
let executeIn = 'childProcess';              // 'childProcess' || 'threads'
let maxLiveProcess = 100;
let workerPath = path.resolve(__dirname, './workerFile.js');

const childProcess = (req, res) => {

    try {

        let processIndex = getMinLoadProcess();
        let input = req.query;
        let reqId = Math.random();
        let user = {};
        let child = liveCP[processIndex].child;

        input = { reqId, processIndex };

        user[input.reqId] = { res: res };
        liveCP[processIndex].reqId.push(reqId);

        child.send({ input });

        child.on('message', (msg) => {

            let { reqId, processIndex } = msg;

            if (user[reqId]) {
                console.log('responce send for reqId:' + reqId);
                user[reqId].res.send('done');
                removeUser(processIndex, reqId);
                delete user[reqId];
            }
            // else console.log('user with requesterID' + msg.reqId + 'not found');
            child.removeListener('message', () => { });   //TODO: check number of events
        });

        child.on('exit', (m) => {
            console.log('exited with status' + m)
        });

    } catch (error) {
        console.log('Error:' + error)
    }
}

const workerThread = (req, res) => {

    let reqId = Math.random();
    let w = new Worker(workerPath, { workerData: { reqId: reqId } });

    w.on('message', (msg) => {
        delete w;
        w.terminate();
        console.log('in thread, responce send for reqId:' + msg.reqId);
        res.send('done');
    });

}

const removeUser = (pIndex, reqId) => {
    liveCP[pIndex].count--;
    _.remove(liveCP[pIndex].reqId, (id) => {
        return id == reqId;
    });
}

const initLiveProcess = () => {

    for (let x = maxLiveProcess - 1; x >= 0; x--) {
        liveCP[x] = {
            reqId: [],
            count: 0,
            child: cp.fork('./worker')
        };
    }
    console.log('live process count:' + liveCP.length);
}

const getMinLoadProcess = () => {

    let minLoadIndex = liveCP.reduce((iMin, cp, i, liveCP) => cp.count > liveCP[iMin].count ? i : iMin, 0);

    liveCP[minLoadIndex].count++;
    return minLoadIndex;
}

if (executeIn == 'childProcess') initLiveProcess();

app.listen(6446, (err) => {

    if (err) return console.log('something bad happened' + err);
    console.log(`server is listening on 6446`);

});

app.get('/execute', (req, res) => {

    if (executeIn === 'childProcess') childProcess(req, res);
    else workerThread(req, res);

});


setTimeout(() => {
    for (let x = maxLiveProcess - 1; x >= 0; x--) {
        console.log(liveCP[x].reqId)
        console.log(liveCP[x].count)
    }
}, 1000 * 60 * 5)

//ab -k -c 350 -n 20000 http://localhost:6446/execute?test:data