const {MongoClient, ObjectID} = require('mongodb');

MongoClient.connect('mongodb://localhost:27017/TodoApp', { useNewUrlParser: true }, (err, client) => {
    if(err) {
        return console.log('Unable to connect to mongodb server.');
    }
    console.log('Connected to mongodb server.');

    const db = client.db('TodoApp');

    db.collection('Users').findOneAndUpdate({_id: new ObjectID('5bac23248243221a9393d070') }, {
        $set: {
            name: "James"
        },
        $inc: {
            "age": 1
        }
    }, { returnOriginal: false }).then((result) => {
        console.log(result);
    });


    client.close();
});
