const express = require('express')
const Server = express()
const LANG = require('./lang.json')

Server.use(express.static('public'));
//Server.use(express.urlencoded({ extended : true }))
Server.use(express.json())
Server.set('views', './views')
Server.set('view engine', 'pug');
Server.listen(80, function(){
    console.log("웹 서버가 열렸습니다.")
})

Server.get('/', function(req, res){
   // res.sendFile(__dirname + "/public/index.html")
    res.render('index')
})
Server.get('/lang', (req, res) => {
    res.send("window.LANG = " + JSON.stringify(LANG.ko))
})
Server.get('/setupLang', (req, res) => {
    let lang = req.query.lang
    console.log(LANG[lang])
    res.send(LANG[lang])
})