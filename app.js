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
//   database: process.env.MYSQLDATABASE || "FinalProyect"
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
app.post('/signup_client', signupClient)
async function signupClient (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    var regex = /^(\d{9})$/;
    if (regex.test(receivedPOST.phone)){
      const existe = await db.query("select count(*) from Usuarios where telefono='"+receivedPOST.phone+"' or correo='"+receivedPOST.email+"'");
      if (Object.values(existe[0])==0){
        regex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
        if (regex.test(receivedPOST.name)){
          regex = /^[ a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
          if (regex.test(receivedPOST.surname)){
            if (receivedPOST.surname.trim()==""){
              result = {status: "ERROR", message: "El apellido no es valido"}
            }else{
              regex = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
              if (regex.test(receivedPOST.email)){
                regex = /^([a-zA-Z0-9 _-\u00f1\u00d1]+)$/;
                if (regex.test(receivedPOST.password)){
                  await db.query("insert into Usuarios(nombre, apellidos, correo, telefono, contraseña, esEmpresa) values('"+ receivedPOST.name+"', '"+receivedPOST.surname +"', '"+ receivedPOST.email +"', '"+ receivedPOST.phone +"', '"+receivedPOST.password+"', false);");
                  result = { status: "OK", message: "Usuario creado correctamente"}
                } else{
                  result = {status: "ERROR", message: "La contraseña solo puede contener letras mayusculas i minusculas i números"}
                }
              }
              else{
                result = {status: "ERROR", message: "El correo no es valido"}
              }
            }
          }else{
            result = {status: "ERROR", message: "El apellido no es valido"}
          }
        }else{
          result = {status: "ERROR", message: "El nombre no es valido"}
        }
      } else{
        result = {status: "ERROR", message: "Ya existe un usuario con este numero de telefono o correo electronico"};
      }
    }else{
      result = {status: "ERROR", message: "El número de telefono no es valido"}
    }
        
    }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/signup_company', signupCompany)
async function signupCompany (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    var regex = /^(\d{9})$/;
    if (regex.test(receivedPOST.phone)){
      const existe = await db.query("select count(*) from Usuarios where telefono='"+receivedPOST.phone+"' or correo='"+receivedPOST.email+"' or nombreEmpresa='"+receivedPOST.nameCompany+"'");
      if (Object.values(existe[0])==0){
        regex = /^[a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
        if (regex.test(receivedPOST.name)){
          regex = /^[ a-zA-ZñÑáéíóúÁÉÍÓÚ]+$/;
          if (regex.test(receivedPOST.surname)){
            if (receivedPOST.surname.trim()==""){
              result = {status: "ERROR", message: "El apellido no es valido"}
            }else{
              regex = /^\w+([.-_+]?\w+)*@\w+([.-]?\w+)*(\.\w{2,10})+$/;
              if (regex.test(receivedPOST.email)){
                regex = /^([a-zA-Z0-9ñÑ_-]+)$/;
                if (regex.test(receivedPOST.password)){
                  regex = /^[ a-zA-Z0-9ñÑáéíóúÁÉÍÓÚ]+$/;
                  if (regex.test(receivedPOST.nameCompany)){
                    if (receivedPOST.nameCompany.trim()==""){
                      result = { status: "ERROR", message: "El nombre de la empresa no puede quedarse en blanco"}
                    }else{
                      await db.query("insert into Usuarios(nombreEmpresa,nombre, apellidos, correo, telefono, contraseña, esEmpresa) values('"+ receivedPOST.nameCompany+"','"+ receivedPOST.name+"', '"+receivedPOST.surname +"', '"+ receivedPOST.email +"', '"+ receivedPOST.phone +"', '"+receivedPOST.password+"', true);");
                      result = { status: "OK", message: "Usuario creado correctamente"}
                    }
                  }else{
                    result = { status: "ERROR", message: "El nombre de la empresa no es valido"}
                  }
                } else{
                  result = {status: "ERROR", message: "La contraseña solo puede contener letras mayusculas i minusculas i números"}
                }
              }
              else{
                result = {status: "ERROR", message: "El correo no es valido"}
              }
            }
          }else{
            result = {status: "ERROR", message: "El apellido no es valido"}
          }
        }else{
          result = {status: "ERROR", message: "El nombre no es valido"}
        }
      } else{
        result = {status: "ERROR", message: "Ya existe un usuario con este numero de telefono, correo electronico o nombre de empresa"};
      }
    }else{
      result = {status: "ERROR", message: "El número de telefono no es valido"}
    }
        
    }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/login', login)
async function login (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    if (receivedPOST.email.trim()==""){
      result = {status: "ERROR", message: "Es necesario un correo electrónico"}
    }else{
      let contador = await db.query("select count(*) as cuentas from Usuarios where correo='"+receivedPOST.email+"' and contraseña='"+receivedPOST.password+"'")
      if (contador[0]["cuentas"]>0){
        result = {status: "OK", message: "Session iniciada"}
      }else{
        result = {status: "ERROR", message: "El correo y/o la contraseña son incorrectas"}
      }
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// // Define routes
// app.post('/api/logout', logout)
// async function logout (req, res) {

//   let receivedPOST = await post.getPostObject(req)
//   let result = { status: "ERROR", message: "Unkown type" }

//   if (receivedPOST) {
//     if (receivedPOST.session_token.trim()!=""){
//       const contador = await db.query("select count(*) as contador from Users where userSessionToken='"+receivedPOST.session_token+"'")
//       if (contador[0]["contador"]>0){
//         await db.query("update Users set userSessionToken=NULL where userSessionToken='"+receivedPOST.session_token+"'")
//         result = {status: "OK", message: "Sessió tancada correctament"}
//       } else{
//         result = {status: "ERROR", message: "No s'ha trobat la sessió"}
//       }
//     }else{
//       result = {status: "ERROR", message: "Es requereix token de sessio"}
//     }

//   }

//   res.writeHead(200, { 'Content-Type': 'application/json' })
//   res.end(JSON.stringify(result))

// }

