const vm = require('vm');

process.on('message', message => {
    try {

        console.log('message from parent:' + message.input.reqId);
        console.time('requestTime');

        callback = () => {
            process.send({ reqId: message.input.reqId, data: 'send', processIndex: message.input.processIndex });
        }

        let vmContext = {
            callback: callback,
            console: console,
            require: require
        }

        let script = `
            const request = require('request');
            request({ url: 'http://localhost:6447/check' }
                , (error, res, body) => {
                    if(res) console.log('statusCode:' + res.statusCode);
                    else console.log(error);
                    callback();

                });
        `;

        vm.runInNewContext(script, vmContext);

    } catch (error) {
        console.log('error in child process' + error)
    }

});
