var express = require('express');
//var validator = require('express-validator');
var router = express.Router();
var User = require('../models/user.js');
//router.use(validator());
//home ------------------------------------------------------
router.get('/home', function(req, res, next) {
    if(!(req.mySession.username==undefined)){
        res.render('home', { title: 'Express' });
    }
    else{
        res.redirect('/users/login');
    }

});
//register get ------------------------------------------------------
router.get('/register', function(req, res, next) {

    res.render('register', { title: 'Express' });

});
//login get --------------------------------------------------------
router.get('/login', function(req, res, next) {
    if(!(req.mySession.username==undefined)){
        res.redirect('/users/home');
    }
    else{
        res.render('login', { title: 'Express' });
    }


});
//REGISTER POST------------------------------------------------------
router.post('/register', function(req, res,next) {
    if(!(req.mySession.username==undefined)){
        res.redirect('/users/home');
    }
    var name = req.body.name;
    var email = req.body.email;
    var username = req.body.username;
    var password = req.body.password;
    var password2 = req.body.password2;

    console.log(name);
    var newUser = new User(username,password);
    res.render('login', { title: 'Express' });
});
//LOGIN POST--------------------------------------------
router.post('/login', function(req, res,next) {
    if(!(req.mySession.username==undefined)){
        res.redirect('/users/home');
    }

    var username = req.body.username;
    var password = req.body.password;
    //console.log(name);
    User.userExists(username,function(data){
        console.log("smothin bttr than nthin");
        if(data){
            //console.log("true aaya hai bhai");
            req.mySession.username = username;
            res.redirect('/users/home');
        }
        else{
            //console.log("false aaya hai bhai");
            res.redirect('/users/login');
        }
    });
    /*if(User.userExists(username)){
        req.mySession.username = username;
        console.log("here is the king"+req.mySession.username);
        res.redirect('/users/home');
    }
    else{
        res.redirect('/users/login');
    }
    //var newUser = new User(username,password);
    //*/
});
module.exports = router;
