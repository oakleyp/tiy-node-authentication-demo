const express = require('express');
const app = express();
const parseurl = require('parseurl');
const bodyParser = require('body-parser');
const session = require('express-session');
const mustacheExpress = require('mustache-express');
const fs = require('fs');

const dataFilePath = './public/data/data.json';

app.engine('mustache', mustacheExpress());
app.set('views', './views');
app.set('view engine', 'mustache');

app.use(express.static('public'));

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
    extended: false
}));

app.use(session({
    secret: 'some secret',
    resave: false,
    saveUninitialized: true,
    authenticated: false,
}));

function writeFile(path, data) {
    fs.writeFile(path, JSON.stringify(data, null, 4), 'utf-8', function (err) {
        if (err) console.log(`Error writing to file ${path}, with data: ${data}`, err);
    })
}


app.use(function (req, res, next) {
    let views = req.session.views;

    if (!views) {
        views = req.session.views = {};
    }

    let pathname = parseurl(req).pathname;

    views[pathname] = (views[pathname] || 0) + 1;

    next();
});

app.get('/', function (req, res) {
    if (req.session.authenticated) {
        res.render('index', req.session.udata);
    } else {
        res.redirect('/login');
    }
});

/*=========================================================================*/
/* --------------------------- SIGN UP ----------------------------------- */
/*=========================================================================*/

app.get('/signup', function (req, res) {
    res.render('signup', {});
});

app.post('/signup', function (req, res) {
    console.log("Signup posted values: ", req.body);

    //Clear session first so redirect to login page doesn't open any previous user's page
    req.session.authenticated = false;
    delete req.session.udata;

    if (Object.keys(req.body).length == 5) {
        let newuser = {
            firstname: req.body.firstname,
            lastname: req.body.lastname,
            username: req.body.username.toLowerCase(),
            password: req.body.password,
        }

        fs.readFile(dataFilePath, 'utf-8', function (err, fdata) {

            if (err) console.log(`Error reading data file... POST - /signup`);
            else {

                let data = JSON.parse(fdata);
                
                //See if username is already taken
                let taken = false;
                for(var i = 0; i < data.users.length; i++) {
                    if(data.users[i].username == newuser.username) {
                        taken = true;
                        break;
                    } 
                }
                if (taken) {
                    res.render('signup', {error: `<span class="error">Sorry, the username '${newuser.username}' is already in use. Please try a different one.<span>`});
                } else {
                    data.users.push(newuser);

                    writeFile(dataFilePath, data);

                    res.render('login', {
                        error: `<span>Your account has been created successfully. Please login to continue.</span>`
                    });
                }
            }
        });
    } else {
        res.render('signup', {
            error: `<span class="error">Error: One or more fields were either left blank or invalid. There hasn't been any logic implemented to know which one yet, so figure it out yourself.`
        });
    }
});

/*=========================================================================*/
/* --------------------------- LOG IN ------------------------------------ */
/*=========================================================================*/

app.get('/login', function (req, res) {
    if (req.session.authenticated) {
        res.redirect('/');
    } else {
        res.render('login', {});
    }
});

app.post('/login', function (req, res) {
    let username = req.body.username.toLowerCase();
    let password = req.body.password;

    fs.readFile(dataFilePath, 'utf-8', function (err, fdata) {
        if (err) {
            console.log(`Error reading file ${path}. `, err);
            console.log(`Error parsing data:`, fdata);

        } else {
            let data = JSON.parse(fdata);
            let authenticated = data['users'].find(function (user) {
                if (user.username === username && user.password === password) {
                    req.session.udata = {
                        username: username,
                        firstname: user.firstname,
                        lastname: user.lastname,
                    }
                    return true;
                } else {
                    return false;
                }
            });

            if (authenticated) {

                req.session.authenticated = true;
                res.redirect('/');
            } else {
                res.render('login', {
                    error: `<span class="error">Error: The username and password combination you provided is not correct.</span>`
                });
            }

        }
    });


});

app.get('/logout', function (req, res) {
    req.session.authenticated = false;
    delete req.session.udata;
    res.redirect('/login');
});

app.listen(3000, function () {
    console.log("App started.")
});
