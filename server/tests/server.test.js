const expect = require('expect');
const request = require('supertest');

const {app} = require('./../server.js');
const {Todo} = require('./../models/todo');
const {ObjectID} = require('mongodb');

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

beforeEach((done) => {
    Todo.deleteMany({}).then(() => {
        return Todo.insertMany(todos);
    }).then(() => done());
});

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
    it('it should return todo doc', (done) => {
        const theID = todos[0]._id;
        request(app)
            .get(`/todos/${theID.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end(done);
    });

    it('it should return 404 if todo with ID not found', (done) => {
        request(app)
            .get(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });

    it('it should return 404 for non-object ids', (done) => {
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
    it('it should delete and return todo doc', (done) => {
        const theID = todos[0]._id;
        request(app)
            .delete(`/todos/${theID.toHexString()}`)
            .expect(200)
            .expect((res) => {
                expect(res.body.todo._id).toBe(theID.toHexString());
            })
            .end((err, res) => {
                Todo.findById(theID).then((todo) => {
                    expect(todo).toEqual(null);
                    done();
                }).catch((e) => done(e));
            });
    });

    it('it should return 404 if todo with ID not found', (done) => {
        request(app)
            .delete(`/todos/${new ObjectID().toHexString()}`)
            .expect(404)
            .expect((res) => {
                expect(res.body).toEqual({});
            })
            .end(done);
    });

    it('it should return 404 for non-object ids', (done) => {
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
    it('it should update and return updated todo doc', (done) => {
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

    it('it should clear completedAt when todo is not completed', (done) => {
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
                    expect(todo.completedAt).toEqual(null);
                    done();
                }).catch((e) => done(e));
            });
    });
});
