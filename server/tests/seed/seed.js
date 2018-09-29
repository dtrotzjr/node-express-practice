const {ObjectID} = require('mongodb');
const jwt = require('jsonwebtoken');
const {Todo} = require('./../../models/todo');
const {User} = require('./../../models/user');

const userOneID = new ObjectID();
const userTwoID = new ObjectID();
const users = [{
  _id: userOneID,
  email: 'someone@gmail.com',
  password: '$peci4lPASS#all',
  tokens: [{
      access: 'auth',
      token: jwt.sign({_id: userOneID, access: 'auth'}, 'abc123').toString()
  }]
}, {
    _id: userTwoID,
    email: 'someoneelse@gmail.com',
    password: '$peci4lPASS#all'
}];
const todos = [{
    _id: new ObjectID(),
    text: 'First test todo.'
},
{
    _id: new ObjectID(),
    text: 'First test todo.',
    completed: true,
    completedAt: 333
}];

const populateTodos = (done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
};

const populateUsers = (done) => {
    User.deleteMany({}).then(() => {
        var userOne = new User(users[0]).save();
        var userTwo = new User(users[1]).save();

        return Promise.all([userOne, userTwo])
    }).then(() => done());
};

module.exports = {todos, populateTodos, users, populateUsers};