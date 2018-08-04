
const path = require('path')
const formidable = require('formidable')
const fs = require('fs')

const environment = (typeof process.env.NODE_ENV !== 'undefined') ? process.env.NODE_ENV : 'development'
const config = require('./config.json')[environment]
const userDb = require('./users.json')

const express = require('express')
const cookieParser = require('cookie-parser')
const bodyParser = require('body-parser')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const passport = require('passport')

console.log(`environment: ${environment}`)
const port = config.port
const uploadDir = config.uploadRoot
console.log(`Upload dir: ${uploadDir}`)
if (!fs.existsSync(config.uploadRoot)) {
  fs.mkdirSync(config.uploadRoot)
}

/*
Session management
*/

var session = require('express-session')({
  secret: 'ketnsdlSs!t',
  resave: true,
  saveUninitialized: true
})
var sharedsession = require('express-socket.io-session')

app.use(session)
app.use(cookieParser()).use(bodyParser.urlencoded({ extended: true }))
app.use(bodyParser.json())
app.use(express.static(path.join(__dirname, 'public')))
app.use(passport.initialize())
app.use(passport.session())
io.use(sharedsession(session, {
  autoSave: true
}))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'POST,GET,PATCH')
  next()
})

app.get('/success', (req, res) => res.send('Welcome ' + req.query.username + '!!'))
app.get('/error', (req, res) => res.send('error logging in'))

var loggedUsersCache = {}
passport.serializeUser(function (userDetails, cb) {

  loggedUsersCache[userDetails.id] = userDetails
  cb(null, userDetails.id)
})
passport.deserializeUser(function (id, cb) {
  cb(null, loggedUsersCache[id])
})

const passportCustom = require('passport-custom')
const CustomStrategy = passportCustom.Strategy

passport.use('custom-strategy', new CustomStrategy(
  function (req, callback) {
    if (req.body.email) {

      let validAccount = false
      userDb.accounts.forEach((account, idx) => {

        if (account.email === req.body.email && req.body.password === account.password) { validAccount = account }
      })

      if (validAccount) {
        callback(null, validAccount)
      } else callback(null, null, { message: 'something is wrong' })
    } else { if (!req.session.passport) {
        callback(null, false)
      } else {
        let validAccount = false

        userDb.accounts.forEach((account, idx) => {

          if (account.id === req.session.passport.user) { validAccount = account }
        })
        if (validAccount) callback(null, validAccount)
        else callback(false, null) }
    }
  }
))

app.get('/', passport.authenticate('custom-strategy', { failureRedirect: '/login' }), function (req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'))
})

app.get('/logout',
  function (req, res) {
    req.session.destroy()

    res.redirect('/')
  })

app.get('/login', function (req, res) {
  res.sendFile(path.join(__dirname, 'views/login.html'))

})
app.post('/login',
  passport.authenticate('custom-strategy', { failureRedirect: '/login?error', successRedirect: '/' }),
  function (req, res) {


    res.redirect('/')
  })

/****************************************************************/

app.get('/foldersList', (req, res) => {
  let dirList = fs.readdirSync(uploadDir).filter((file) => { return fs.statSync(uploadDir + '/' + file).isDirectory() })

  res.status(200).send({list: dirList})
})

app.patch('/setFolder', function (req, res) {
  let userFolder = getUserbyId(req.session.passport.user).folder

  fs.existsSync(path.join(uploadDir, userFolder)) || fs.mkdirSync(path.join(uploadDir, userFolder))
  let listOfFiles = fs.readdirSync(path.join(uploadDir, userFolder)).filter((file) => { return fs.statSync(path.join(uploadDir, userFolder, file)).isFile() })

  res.status(200).send({status: 'folder sucessfully changed', fileList: listOfFiles})
})

app.post('/upload', function (req, res) {
  var form = new formidable.IncomingForm()
  var receivedBytes = 0

  var imgCount = 0
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true
  form.maxFileSize = 2147483648
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(uploadDir, userDb.accounts[req.session.passport.user].folder)

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
      if (err) console.log(err)
      else imgCount++
      receivedBytes = file.size


      //  console.log(imgCount) */
      io.to(req.cookies.io).emit('saved', {name: file.name, size: file.size, count: imgCount})
    })
  })
  form.on('field', function (name, value) {
    form.uploadDir = path.join(uploadDir, value)
  })
  // log any errors that occur
  form.on('error', function (err) {
    console.log('An error has occured: \n' + err)
    res.setHeader('content-type', 'application/json')
    res.status(500).end(JSON.stringify({status: 'error', message: 'err'}))
  })

  // once all the files have been uploaded, send a response to the client
  form.on('end', function () {
    
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({status: 'success', receivedBytes: form.openedFiles[0].size}))
  })

  // parse the incoming request containing the form data
  form.parse(req)
})

http.listen(port, function () {
  console.log(`Server listening on port ${port}`)
})

io.on('connection', function (socket) {

})

function getUserbyId (id) {
  let validAccount = false
  userDb.accounts.forEach((account, idx) => {
  // console.log(account)
    if (account.id === id) { validAccount = account }
  })
  return validAccount
}
