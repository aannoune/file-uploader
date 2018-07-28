var express = require('express')
var app = express()
var path = require('path')
var formidable = require('formidable')
var fs = require('fs')
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

  // specify that we want to allow the user to upload multiple files in a single request
  form.multiples = true

  // store all uploads in the /uploads directory
  form.uploadDir = path.join(__dirname, '/uploads')

  // every time a file has been uploaded successfully,
  // rename it to it's orignal name
  form.on('file', function (field, file) {
    fs.rename(file.path, path.join(form.uploadDir, file.name), (err) => {
      if (err) console.log(err)
    })
  })
  form.on('field', function (name, value) {
    console.log(name, value)
    form.uploadDir = path.join(__dirname, '/uploads', value)
  })
  // log any errors that occur
  form.on('error', function (err) {
    console.log('An error has occured: \n' + err)
  })

  // once all the files have been uploaded, send a response to the client
  form.on('end', function () {
    res.setHeader('content-type', 'application/json')
    res.end(JSON.stringify({status: 'success'}))
  })

  // parse the incoming request containing the form data
  form.parse(req)
})

app.listen(3000, function () {
  console.log('Server listening on port 3000')
})
