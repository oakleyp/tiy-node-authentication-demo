const express = require('express');
const app = express();
const parseurl = require('parseurl');
const bodyParser = require('body-parser');
const session = require('express-session');
const mustacheExpress = require('mustache-express');
const data = require('../public/data/data.js');

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({extended: false}));

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    authenticated: false,
}));

function authenticate(req, uname, pass) {
    console.log("Attempting to authenticate user from users: ", data.users);
    let authenticated = data.users.find(function(user) {
        if(user.username === uname && user.password === pass) {
            req.session.udata = {
                username: uname,
                firstname: user.firstname,
                lastname: user.lastname,
            }
            return true;
        }
        else { 
            console.log(`Error: ${uname} != ${user.username} || ${pass} != ${user.password}`);
            return false;
        }
    });
    
    return authenticated;
}


app.use(function(req, res, next) {
    let views = req.session.views;
    
    if(!views) {
        views = req.session.views = {};
    }
    
    let pathname = parseurl(req).pathname;
    
    views[pathname] = (views[pathname] || 0) + 1;
    
    next();
});

app.get('/', function(req, res) {
    if(req.session.authenticated) {
        res.render('index', req.session.udata);
    } else {
        res.render('login', {});
    }
});

app.get('/logout', function(req, res) {
    req.session.authenticated = false;
    delete req.session.udata;
    res.render('login', {});
});

app.post('/', function(req, res) {
    let username = req.body.username;
    let password = req.body.password;
    
    console.log("Request params:", req.body);
    
    if(authenticate(req, username, password)) {
        req.session.authenticated = true;
        res.render('index', req.session.udata);
    } else {
        res.render('login', { error: `<span class="error">Error: The username and password combination you provided is not correct.</span>` });
    }
    
    
});

app.listen(3000, function() { console.log("App started.") });