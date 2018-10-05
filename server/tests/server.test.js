const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo');
const {User} = require('./../models/user');
const {ObjectID} = require('mongodb');

const {todos, populateTodos, users, populateUsers} = require('./seed/seed');

beforeEach(populateUsers);
beforeEach(populateTodos);

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TODOS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('POST /todos', () => {
    it('should create a new todo', (done) => {
        const text = 'Test todo text';
        request(app)
            .post('/todos/')
            .send({text})
            .expect(200)
            .expect((res) => {
                expect(res.body.text).toBe(text);
            })
            .end((err, res) => {
                if (err) {
                    return done(err);
                }
                Todo.find({text}).then((todos) => {
                    expect(todos.length).toBe(1);
                    expect(todos[0].text).toBe(text);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should not create todo with invalid body data', (done) => {
        request(app)
            .post('/todos')
            .send({})
            .expect(400)
            .end((err, res) => {
                if (err) {
                    return done(err);
                }

                Todo.find().then((todos) => {
                    expect(todos.length).toBe(2);
                    done();
                }).catch((e) => done(e));
            });
    });
});

describe('GET /todos', () => {
    it('should get all todos', (done) => {
        const text = 'Test todo text';
        request(app)
            .get('/todos/')
            .expect(200)
            .expect((res) => {
                expect(res.body.todos.length).toBe(2);
            })
            .end(done);
    });
});

describe('GET /todos:id', () => {
    it('should return todo doc', (done) => {
        const theID = todos[0]._id;
        request(app)
            .get(`/todos/${theID.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end(done);
    });

    it('should return 404 if todo with ID not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .get(`/todos/12234`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('DELETE /todos:id', () => {
    it('should delete and return todo doc', (done) => {
        const theID = todos[0]._id;
        request(app)
            .delete(`/todos/${theID.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end((err, res) => {
                Todo.findById(theID).then((todo) => {
                    expect(todo).toBeNull();
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should return 404 if todo with ID not found', (done) => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });

    it('should return 404 for non-object ids', (done) => {
        request(app)
            .delete(`/todos/12234`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});

describe('PATCH /todos:id', () => {
    it('should update and return updated todo doc', (done) => {
        const updatedText = "This has been updated";
        const theID = todos[0]._id;
        request(app)
            .patch(`/todos/${theID.toHexString()}`)
            .send({
                text: updatedText,
                completed: true
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end((err, res) => {
                Todo.findById(theID).then((todo) => {
                    expect(todo.text).toBe(updatedText);
                    expect(todo.completed).toBe(true);
                    expect(typeof todo.completedAt).toBe('number');
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should clear completedAt when todo is not completed', (done) => {
        const updatedText = "This has also been updated";
        const theID = todos[1]._id;
        request(app)
            .patch(`/todos/${theID.toHexString()}`)
            .send({
                text: updatedText,
                completed: false
            })
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end((err, res) => {
                Todo.findById(theID).then((todo) => {
                    expect(todo.text).toBe(updatedText);
                    expect(todo.completed).toBe(false);
                    expect(todo.completedAt).toBeNull();
                    done();
                }).catch((e) => done(e));
            });
    });
});

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// USERS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
describe('GET /users/me', () => {
    it('should return user if authenticated', (done) => {
        request(app)
            .get('/users/me')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .expect((res) => {
               expect(res.body._id).toBe(users[0]._id.toHexString());
               expect(res.body.email).toBe(users[0].email);
            })
            .end(done);
    });
    it('should return 401 if not authenticated', (done) => {
        request(app)
            .get('/users/me')
            .expect(401)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });
});
describe('POST /users', () => {
    it('should create user', (done) => {
        const email = "testone@google.com";
        const password = "pas$123#_asw";
        request(app)
            .post('/users')
            .send({
                email,
                password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
                expect(res.body._id).toBeTruthy();
                expect(res.body.email).toBe(email);
                expect(res.body.password).toEqual(undefined);
            })
            .end((err) => {
                if (err) {
                    return done(err);
                }
                User.findOne({email}).then((user) => {
                    expect(user.email).toBe(email);
                    expect(user.password).not.toBe(password);
                    done();
                }).catch((e) => done(e));
            });
    });
    it('should return validation errors if email is invalid', (done) => {
        const invalidEmail = "testone@google";
        const password = "pas$123#_asw";
        request(app)
            .post('/users')
            .send({
                email: invalidEmail,
                password
            })
            .expect(400)
            .end(done);
    });

    it('should return validation errors if password is missing', (done) => {
        const email = "testwo@google.com";
        request(app)
            .post('/users')
            .send({
                email
            })
            .expect(400)
            .end(done);
    });

    it('should return validation errors if password is too short', (done) => {
        const email = "testhree@google.com";
        const password = "pass12";
        request(app)
            .post('/users')
            .send({
                email,
                password
            })
            .expect(400)
            .end(done);
    });

    it('should not create user if email in use', (done) => {
        const email = users[0].email;
        const password = "pas$123#_asw";
        request(app)
            .post('/users')
            .send({
                email,
                password
            })
            .expect(400)
            .end(done);
    });
});

describe('POST /users/login', () => {
    it('should login user and return auth token', (done) => {
        request(app)
            .post('/users/login')
            .send({
               email: users[1].email,
               password: users[1].password
            })
            .expect(200)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeTruthy();
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens[0]).toHaveProperty('access', 'auth');
                    expect(user.tokens[0]).toHaveProperty('token', res.headers['x-auth']);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('should reject invalid login', (done) => {
        request(app)
            .post('/users/login')
            .send({
                email: users[1].email,
                password: 'invalidP4$$w0rd#'
            })
            .expect(400)
            .expect((res) => {
                expect(res.headers['x-auth']).toBeFalsy();
            })
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findById(users[1]._id).then((user) => {
                    expect(user.tokens.length).toBe(0);
                    done();
                }).catch((e) => done(e));
            });
    });
});


describe('DELETE /users/me/token', () => {
    it('should remove auth token on logout', (done) => {
        request(app)
            .delete('/users/me/token')
            .set('x-auth', users[0].tokens[0].token)
            .expect(200)
            .end((err, res) => {
                if(err) {
                    return done(err);
                }

                User.findByToken(users[0].tokens[0].token).then((user) => {
                    expect(user).toBeFalsy();
                    done();
                }).catch((e) => done(e));
            });

    });
});