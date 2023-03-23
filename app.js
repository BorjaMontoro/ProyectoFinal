const express     = require('express')
const fs          = require('fs').promises

const webSockets  = require('./appWS.js')
const post        = require('./utilsPost.js')
const database    = require('./utilsMySQL.js')
const moment = require('./moment.js')
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
  host: process.env.MYSQLHOST || "containers-us-west-110.railway.app",
  port: process.env.MYSQLPORT || 7754,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "BzDYLaHqVGAQCfG9gtj6",
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
                  await db.query("insert into Usuarios(nombre, apellidos, correo, telefono, password, esEmpresa) values('"+ receivedPOST.name+"', '"+receivedPOST.surname +"', '"+ receivedPOST.email +"', '"+ receivedPOST.phone +"', '"+receivedPOST.password+"', false);");
                  let usu = await db.query("select id from Usuarios where correo='"+receivedPOST.email+"' and password='"+receivedPOST.password+"'")
                  result = { status: "OK", message: "Usuario creado correctamente", id: usu[0]["id"]}
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
                      await db.query("insert into Usuarios(nombreEmpresa,nombre, apellidos, correo, telefono, password, esEmpresa) values('"+ receivedPOST.nameCompany+"','"+ receivedPOST.name+"', '"+receivedPOST.surname +"', '"+ receivedPOST.email +"', '"+ receivedPOST.phone +"', '"+receivedPOST.password+"', true);");
                      let usu = await db.query("select id from Usuarios where correo='"+receivedPOST.email+"' and password='"+receivedPOST.password+"'")
                      result = { status: "OK", message: "Usuario creado correctamente", id: usu[0]["id"]}
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
      let contador = await db.query("select count(*) as cuentas, id from Usuarios where correo='"+receivedPOST.email+"' and password='"+receivedPOST.password+"'")
      if (contador[0]["cuentas"]>0){
        result = {status: "OK", message: "Session iniciada", id: contador[0]["id"]}
      }else{
        result = {status: "ERROR", message: "El correo y/o la contraseña son incorrectas"}
      }
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

function comprobarHora(horas){
  let comprobacion=true
  for (let i=0;i<horas.length-1;i++){
    let hora= String(horas[i])
    const format="HH:mm";
    if (!moment(hora, format, true).isValid()){
      const format="H:mm";
      if (!moment(hora, format, true).isValid()){
        if(!hora.trim()==""){
          comprobacion=false;
        }
      }
    }
    console.log(horas[i])
  }
  return comprobacion
}

function cumplimientoFranjas(inicioDia,finalDia,inicioTarde,finalTarde){
  let timeStrings
  if (inicioDia==null || finalDia==null ||inicioTarde==null || finalTarde==null){
    if (inicioDia==null && finalDia==null && inicioTarde==null && finalTarde==null){
      return true;
    }else if (inicioDia==null && finalDia==null){
      timeStrings = [inicioTarde, finalTarde];
    }else if (inicioTarde==null && finalTarde==null){
     timeStrings = [inicioDia, finalDia];
    }else{
      return false
    }
  }else{
   timeStrings = [inicioDia, finalDia, inicioTarde, finalTarde];
  }
  const timeObjs = timeStrings.map(timeString => {
    const [hours, minutes] = timeString.split(':');
    const currentDate = new Date();
    return new Date(currentDate.getFullYear(), currentDate.getMonth(), currentDate.getDate(), hours, minutes);
  });
  for (let i = 0; i < timeObjs.length - 1; i++) {
    if (timeObjs[i] >= timeObjs[i+1]) {
      return false;
    }
  }

  for (let i = 0; i < timeObjs.length - 1; i++) {
    if (timeObjs[i].getTime() + (60 * 60 * 1000) >= timeObjs[i+1].getTime()) {
      return false;
    }
  }
  return true
}

function comprobarYRemplazar(str) {
  if (str && str.trim().length > 0) {
    return str;
  } else {
    return null;
  }
}

// Define routes
app.post('/create_advertisment', createAdvertisment)
async function createAdvertisment (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    if(isNaN(receivedPOST.direccion)){
      if (receivedPOST.direccion.trim()==""){
        result = {status: "ERROR", message: "Es necesaria una dirección"}
      }else{
        const horas=[receivedPOST.diaInicioLunes,receivedPOST.diaFinalLunes,receivedPOST.tardeInicioLunes,receivedPOST.tardeFinalLunes]
        //if (comprobarHora(receivedPOST.diaInicioLunes) && comprobarHora(receivedPOST.diaFinalLunes) && comprobarHora(receivedPOST.tardeInicioLunes) && comprobarHora(receivedPOST.tardeFinalLunes)){
        // comprobarHora(receivedPOST.diaInicioMartes) && comprobarHora(receivedPOST.diaFinalMartes) && comprobarHora(receivedPOST.tardeInicioMartes) && comprobarHora(receivedPOST.tardeFinalMartes) && 
        // comprobarHora(receivedPOST.diaInicioMiercoles) && comprobarHora(receivedPOST.diaFinalMiercoles) && comprobarHora(receivedPOST.tardeInicioMiercoles) && comprobarHora(receivedPOST.tardeFinalMiercoles) &&
        // comprobarHora(receivedPOST.diaInicioJueves) && comprobarHora(receivedPOST.diaFinalJueves) && comprobarHora(receivedPOST.tardeInicioJueves) && comprobarHora(receivedPOST.tardeFinalJueves) &&
        // comprobarHora(receivedPOST.diaInicioViernes) && comprobarHora(receivedPOST.diaFinalViernes) && comprobarHora(receivedPOST.tardeInicioViernes) && comprobarHora(receivedPOST.tardeFinalViernes) &&
        // comprobarHora(receivedPOST.diaInicioSabado) && comprobarHora(receivedPOST.diaFinalSabado) && comprobarHora(receivedPOST.tardeInicioSabado) && comprobarHora(receivedPOST.tardeFinalSabado) && 
        // comprobarHora(receivedPOST.diaInicioDomingo) && comprobarHora(receivedPOST.diaFinalDomingo) && comprobarHora(receivedPOST.tardeInicioDomingo) && comprobarHora(receivedPOST.tardeFinalDomingo
        if (comprobarHora(horas)){
          let diaInicioLunes=comprobarYRemplazar(receivedPOST.diaInicioLunes)
          let diaFinalLunes=comprobarYRemplazar(receivedPOST.diaFinalLunes)
          let tardeInicioLunes=comprobarYRemplazar(receivedPOST.tardeInicioLunes)
          let tardeFinalLunes=comprobarYRemplazar(receivedPOST.tardeFinalLunes)
 
          // await db.query("insert into Anuncios(idUsu, direccion) values("+ receivedPOST.id+", '"+receivedPOST.direccion+"');");
          // const idAnuncio = await db.query("select id from Anuncios where idUsu="+receivedPOST.id);
          // await db.query("insert into HorarioLunes(idAnuncio, horaInicio) values("+ idAnuncio[0]["id"]+", '"+receivedPOST.dia1Lunes+"');");
          if(cumplimientoFranjas(diaInicioLunes,diaFinalLunes,tardeInicioLunes,tardeFinalLunes)){
            result = {status: "OK", message: "Hora valida"}
          }else{
            result = {status: "ERROR", message: "Las franjas del horario no son correctas "}
          }
          //result = {status: "OK", message: "Hora valida"}
        }else{
          result = {status: "ERROR", message: "La hora no es valida"}
        }
      }
    }else{
      result = {status: "ERROR", message: "La direccion no puede estar formada solo por numeros ni quedarse vacia"}
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

