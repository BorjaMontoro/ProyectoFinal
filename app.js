const express     = require('express')
const fs          = require('fs').promises

const webSockets  = require('./appWS.js')
const post        = require('./utilsPost.js')
const database    = require('./utilsMySQL.js')
const wait        = require('./utilsWait.js')

var db = new database()   // Database example: await db.query("SELECT * FROM test")
var ws = new webSockets()

// Start HTTP server
const app = express()
const port = process.env.PORT || 3000

// Publish static files from 'public' folder
app.use(express.static('public'))

// Activate HTTP server
const httpServer = app.listen(port, appListen)
function appListen () {
  console.log(`Listening for HTTP queries on: http://localhost:${port}`)
}

// Close connections when process is killed
process.on('SIGTERM', shutDown);
process.on('SIGINT', shutDown);
function shutDown() {
  console.log('Received kill signal, shutting down gracefully');
  httpServer.close()
  db.end()
  ws.end()
  process.exit(0);
}

// Init objects
// db.init({
//   host: process.env.MYSQLHOST || "localhost",
//   port: process.env.MYSQLPORT || 3306,
//   user: process.env.MYSQLUSER || "root",
//   password: process.env.MYSQLPASSWORD || "",
//   database: process.env.MYSQLDATABASE || "corndb"
// })
// Init objects
db.init({
  host: process.env.MYSQLHOST || "containers-us-west-99.railway.app",
  port: process.env.MYSQLPORT || 7879,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "Qqv1dUdKdMNNiZHa2CEP",
  database: process.env.MYSQLDATABASE || "railway"
})
ws.init(httpServer, port, db)



// Define routes
app.post('/api/login', login)
async function login (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    if (receivedPOST.email.trim()==""){
      result = {status: "ERROR", message: "Es requereix un correu electrònic"}
    }else{
      let contador = await db.query("select count(*) as cuenta from Users where userEmail='"+receivedPOST.email+"' and userPassword='"+receivedPOST.password+"'")
      if (contador[0]["cuenta"]>0){
        let token=createSessionToken();
        await db.query("update Users set userSessionToken='"+token+"'where userEmail='"+receivedPOST.email+"' and userPassword='"+receivedPOST.password+"'");
        result = {status: "OK", message: "Sessió iniciada", session_token: token}
      }else{
        result = {status: "ERROR", message: "El correu i/o la contrasenya estan malament"}
      }
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/api/signup', signup)
async function signup (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    var regex = /^(\d{9})$/;
    if (regex.test(receivedPOST.phone)){
      const existe = await db.query("select count(*) from Users where userPhoneNumber="+receivedPOST.phone+" or userEmail='"+receivedPOST.email+"'");
      if (Object.values(existe[0])==0){
        regex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
        if (regex.test(receivedPOST.name)){
          regex = /^[ a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
          if (regex.test(receivedPOST.surname)){
            if (receivedPOST.surname.trim()==""){
              result = {status: "ERROR", message: "El cognom no és vàlid"}
            }else{
              regex = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
              if (regex.test(receivedPOST.email)){
                regex = /^([a-zA-Z0-9 _-]+)$/;
                if (regex.test(receivedPOST.password)){
                  const fecha = new Date();
                  const opciones = { timeZone: "Europe/Madrid" };
                  const fechaEspaña = fecha.toLocaleString("es-ES", opciones);
                  const fechaSQL = fechaEspaña.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$2-$1 $4:$5:$6");
                  let token=createSessionToken();
                  await db.query("insert into Users(userPhoneNumber,userName, userLastName, userEmail, userBalance, userStatus, userStatusModifyTime, userPassword,userSessionToken) values('"+ receivedPOST.phone+"', '"+receivedPOST.name +"', '"+ receivedPOST.surname +"', '"+ receivedPOST.email +"', "+ 100 +", 'NO_VERFICAT', '"+fechaSQL+"', '"+receivedPOST.password+"', '"+token+"');");
                  result = { status: "OK", message: "Usuari creat correctament", session_token: token}
                } else{
                  result = {status: "ERROR", message: "La contrasenya només pot contenir lletres majúscules i minúscules i números"}
                }
              }
              else{
                result = {status: "ERROR", message: "El correu no és vàlid"}
              }
            }
          }else{
            result = {status: "ERROR", message: "El cognom no és vàlid"}
          }
        }else{
          result = {status: "ERROR", message: "El nom no és vàlid"}
        }
      } else{
        result = {status: "ERROR", message: "Ja existeix un usuari amb aquest número de telèfon o correu electrònic"};
      }
    }else{
      result = {status: "ERROR", message: "El número de telèfon no és vàlid"}
    }
        
    }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/api/logout', logout)
async function logout (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    if (receivedPOST.session_token.trim()!=""){
      const contador = await db.query("select count(*) as contador from Users where userSessionToken='"+receivedPOST.session_token+"'")
      if (contador[0]["contador"]>0){
        await db.query("update Users set userSessionToken=NULL where userSessionToken='"+receivedPOST.session_token+"'")
        result = {status: "OK", message: "Sessió tancada correctament"}
      } else{
        result = {status: "ERROR", message: "No s'ha trobat la sessió"}
      }
    }else{
      result = {status: "ERROR", message: "Es requereix token de sessio"}
    }

  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))

}

