
const path = require('path')
const formidable = require('formidable')
const fs = require('fs')
const config = require('./config.json');

const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser');
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const port = config.port
const uploadDir = path.join(__dirname, '/uploads')

/*
Session management
*/
var session = require('express-session')({
  secret: 'my-secret',
  resave: true,
  saveUninitialized: true
})
var sharedsession = require('express-socket.io-session')
app.use(session)
app.use(cookieParser()).use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
io.use(sharedsession(session, {
  autoSave: true
}))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'POST,GET,PATCH')
  next()
})

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'))
})
app.get('/foldersList', (req, res) => {
  let dirList = fs.readdirSync(uploadDir).filter((file) => { return fs.statSync(uploadDir + '/' + file).isDirectory() })
  console.log(req.session)
  res.status(200).send({list: dirList})
})

app.patch('/setFolder', function(req, res){
console.log(req.body.folder)
console.log(path.join(uploadDir,req.body.folder))
let listOfFiles=fs.readdirSync( path.join(uploadDir,req.body.folder)).filter((file) => { return fs.statSync(path.join(uploadDir,req.body.folder,file)).isFile() }) 

  res.status(200).send({status: 'folder sucessfully changed',fileList:listOfFiles})
})

app.post('/upload', function (req, res) {
  io.to(req.cookies.io).emit('filecount', 0)
  // create an incoming form object
  var form = new formidable.IncomingForm()
  var imgCount = 0
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true
  form.maxFileSize = 2147483648
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads')

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
      if (err) console.log(err)
      else imgCount++
      /*  console.log(file.name)
        console.log(imgCount) */
      io.to(req.cookies.io).emit('filecount', imgCount)
    })
  })
  form.on('field', function (name, value) {
    form.uploadDir = path.join(__dirname, '/uploads', value)
  })
  // log any errors that occur
  form.on('error', function (err) {
    console.log('An error has occured: \n' + err)
    res.setHeader('content-type', 'application/json')
    res.status(500).end(JSON.stringify({status: 'error', message: 'err'}))
  })

  // once all the files have been uploaded, send a response to the client
  form.on('end', function () {
    console.log('END !! ')
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({status: 'success', count: imgCount}))
  })

  // parse the incoming request containing the form data
  form.parse(req)
})

http.listen(port, function () {
  console.log(`Server listening on port ${port}`)
})

io.on('connection', function (socket) {
  console.log(`connect with id ${socket.id}`)

  // Accept a login event with user's data
  /*  socket.on("login", function(userdata) {
      console.log()
        socket.handshake.session.userdata = userdata;
        socket.handshake.session.save();
    });
    socket.on("logout", function(userdata) {
        if (socket.handshake.session.userdata) {
            delete socket.handshake.session.userdata;
            socket.handshake.session.save();
        }
    }); */
})
