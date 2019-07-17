const express = require('express');
const app = express();
const Joi = require('joi');
const mysql = require('mysql');
const redis =  require('redis');

app.use(express.json());

const db = mysql.createConnection({
    host: 'mysql',
    user: 'root',
    password: 'root',
    database: 'test'
});

db.connect((err) => {
    if(err) process.abort();
    console.log('connected to mysql!')
    createCourseTable();
});

const redisClient = redis.createClient(6379, 'redis');

redisClient.on('error', (err) =>{
    console.log('Error:', err);
});

app.get('/', (req, res) => {
    res.send('Hello world');
});

app.post('/api/addRedisKey', (req, res)=>{
    redisClient.set('nodeTest', 'this is a test');
    res.send('nodeTest key added');
});

app.get('/api/getRedisKey', (req, res)=>{
    redisClient.get('nodeTest', (err, result)=>{
        if(err) throw err;
        console.log(`GET result: ${result}`);
        res.send(result);
    });
});

app.get('/api/courses', (req, res) => {
    let sql = 'SELECT * from course';
    db.query(sql, (err, result) => {
        if(err) return res.status(404).send(`Courses not found`);
        console.log(result);
        res.send(result);
    });
});

app.get('/api/courses/:id', (req, res) => {
    redisClient.hget('courses', req.params.id, (err, redRes)=>{
        if(redRes){
            console.log(`Redis rocks: ${redRes}`);
            res.send(redRes);
        } else{
            getCourse(req.params.id, (err, result) => {
                if(err || result.length === 0) return res.status(404).send(`Course with id ${req.params.id} not found`);
                console.log(result);
                redisClient.hset('courses', req.params.id, JSON.stringify(buildJsObj(result[0])));
                res.send(result[0]);
            });
        }
    });
});

app.post('/api/createCourseTable', (req, res) => {
    res.send(createCourseTable());
});

app.post('/api/courses', (req, res) => {
    const {error} = validateCourse(req.body);
    if(error) return res.status(400).send(error.details[0].message);

    let data = {name: `${req.body.name}`};
    let sql = 'INSERT into COURSE SET ?';
    db.query(sql, data, (err, result) => {
        if(err) throw err;
        data['id'] = result.insertId;
        console.log(data);
        res.send(data);
    });
});

app.put('/api/courses/:id', (req, res) => {
    getCourse(req.params.id, (err, result) => {
        if(err || result.length === 0) return res.status(404).send(`Course with id ${req.params.id} not found`);
        console.log(result);
        let course = result[0];
        const {error} = validateCourse(req.body);
        if(error) return res.status(400).send(error.details[0].message);
    
        let sql = `UPDATE course SET name = '${req.body.name}' where id = ${course.id}`;
        console.log(sql);
        db.query(sql, (err, result) => {
            if(err) res.status(400).send(`Could not update course ${course.id}`);
            course['name'] = req.body.name;
            redisClient.hset('courses', course.id, JSON.stringify(course));
            res.send(course);
        });
    });
});

app.delete('/api/courses/:id', (req, res) => {
    getCourse(req.params.id, (err, result) => {
        if(err || result.length === 0) return res.status(404).send(`Course with id ${req.params.id} not found`);
        console.log(result);
        let course = result[0];
    
        let sql = `DELETE from course where id = ${course.id}`;
        console.log(sql);
        db.query(sql, (err, result) => {
            if(err) res.status(400).send(`Could not delete course ${course.id}`);
            redisClient.hdel('courses', course.id);
            res.send(course);
        });
    });    
});

function buildJsObj(obj) {
    let jsObj = {};
    Object.keys(obj).forEach(key => {
        jsObj[key] = obj[key];
    });
    return jsObj;
}

function validateCourse(course){
    const schema = {
        name: Joi.string().min(3).required()
    }
    return Joi.validate(course, schema);
}

function getCourse(id, callback){
    let sql = `SELECT * from course where id = ${id}`;
    db.query(sql, (err, result) => {
        callback(err, result)
    });
}

function createCourseTable(){
    let sql = 'CREATE table IF NOT EXISTS course(id int AUTO_INCREMENT, name VARCHAR(255), PRIMARY KEY (id))';
    db.query(sql, (err, result) => {
        if(err) throw err;
        console.log(result);
        return 'table created';
    });
}

const port = process.env.PORT || 3000;
app.listen(port, ()=>console.log(`Listening on port ${port}...`));
