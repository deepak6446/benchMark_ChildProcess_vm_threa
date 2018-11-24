const { workerData, parentPort } = require('worker_threads');
const request = require('request');

request({ url: 'http://localhost:6447/check' }
    , (error, res, body) => {
        if (res) console.log('statusCode:' + res.statusCode);
        else console.log(error);
        parentPort.postMessage({ reqId: workerData.reqId });
    });