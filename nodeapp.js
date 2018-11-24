let app = require('express')();


app.listen(6447, (err) => {

    if (err) return console.log('something bad happened' + err);
    console.log(`server is listening on 6446`);

});

app.get('/check', (req, res) => {

    setTimeout(() => {
        res.status(200).send('ok');
    }, 60);

});

