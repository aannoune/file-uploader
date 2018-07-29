

const path = require('path')
const formidable = require('formidable')
const fs = require('fs')

const express = require('express')
const app = express()
const http = require('http').Server(app)
const io = require('socket.io')(http)

const port=8881
const uploadDir = path.join(__dirname, '/uploads')

app.use(express.static(path.join(__dirname, 'public')))

app.use(function (req, res, next) {
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept')
  res.header('Access-Control-Allow-Methods', 'POST,GET')
  next()
})

app.get('/', function (req, res) {
  res.sendFile(path.join(__dirname, 'views/index.html'))
})
app.get('/foldersList', (req, res) => {
  let dirList = fs.readdirSync(uploadDir).filter((file) => { return fs.statSync(uploadDir + '/' + file).isDirectory() })

  res.status(200).send({list: dirList})
})

app.post('/upload', function (req, res) {
  // create an incoming form object
  var form = new formidable.IncomingForm()
var imgCount=1
  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true
  form.maxFileSize  = 2147483648
  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads')

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
      if (err) console.log(err)
      else imgCount++
      	console.log(file.name)
      	console.log(imgCount)
    })
  })
  form.on('field', function (name, value) {
    console.log(name, value)
    form.uploadDir = path.join(__dirname, '/uploads', value)
   
  })
  // log any errors that occur
  form.on('error', function (err) {
    console.log('An error has occured: \n' + err)
    res.setHeader('content-type', 'application/json')
    res.status(500).end(JSON.stringify({status: 'error',message:'err'}))
  })

  // once all the files have been uploaded, send a response to the client
  form.on('end', function () {
  	console.log('END !! ') 
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({status: 'success',count:imgCount}))
  })

  // parse the incoming request containing the form data
  form.parse(req)
})


http.listen(port, function () {
  console.log(`Server listening on port ${port}`)
})


io.on('connection', function(socket){
console.log('a user connected');
});