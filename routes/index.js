var express = require('express');
var router = express.Router();
var oracledb = require('oracledb');
var dbConfig = require('./dbConfig.js');
/* GET home page. */
router.post('/', function(req, res, next) {

    res.render('index', { title: 'Express' });
});
router.get('/', function(req, res, next) {
  res.render('index', { title: 'Express' });
});
//volunteer form filled
router.post('/volunteer', function(req, res, next) {

//vol
router.get('/volunteer', function(req, res, next) {
    res.render('volunteer', { title: 'Express' });
});
    res.redirect('/index');
    //res.render('volunteer', { title: 'Express' });
});
//maintenance request form
router.get('/reqmaintain', function(req, res, next) {
    res.render('reqmaintain', { title: 'Express' });
});
//maintenance request form filled
router.post('/volunteer', function(req, res, next) {

    res.redirect('/index');
    //res.render('volunteer', { title: 'Express' });
});
//your area species
router.get('/yourareaspecies', function(req, res, next) {
    res.render('yourareaspecies', { title: 'Express' });
});


module.exports = router;
