var express = require('express');
const jsdom = require("jsdom");
var router = express.Router();


router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express' });
});

module.exports = router;
