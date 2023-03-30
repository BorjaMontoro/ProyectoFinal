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
      let contador = await db.query("select count(*) as cuentas, id, esEmpresa from Usuarios where correo='"+receivedPOST.email+"' and password='"+receivedPOST.password+"'")
      if (contador[0]["cuentas"]>0){
        result = {status: "OK", message: "Session iniciada", id: contador[0]["id"], esEmpresa: contador[0]["esEmpresa"]}
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
  for (let i=0;i<horas.length;i++){
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

async function insertarDatos(horario, id, inicio, final){
  if (inicio!=null && final!=null){
    await db.query("insert into "+horario+"(idAnuncio, horaInicio, horaFin) values("+ id+", '"+inicio+"', '"+final+"');");
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
        const horas=[receivedPOST.diaInicioLunes,receivedPOST.diaFinalLunes,receivedPOST.tardeInicioLunes,receivedPOST.tardeFinalLunes,receivedPOST.diaInicioMartes,receivedPOST.diaFinalMartes,
          receivedPOST.tardeInicioMartes,receivedPOST.tardeFinalMartes,receivedPOST.diaInicioMiercoles,receivedPOST.diaFinalMiercoles,receivedPOST.tardeInicioMiercoles,
          receivedPOST.tardeFinalMiercoles,receivedPOST.diaInicioJueves,receivedPOST.diaFinalJueves,receivedPOST.tardeInicioJueves,receivedPOST.tardeFinalJueves,receivedPOST.diaInicioViernes,
          receivedPOST.diaFinalViernes,receivedPOST.tardeInicioViernes,receivedPOST.tardeFinalViernes,receivedPOST.diaInicioSabado,receivedPOST.diaFinalSabado,receivedPOST.tardeInicioSabado,
          receivedPOST.tardeFinalSabado,receivedPOST.diaInicioDomingo,receivedPOST.diaFinalDomingo,receivedPOST.tardeInicioDomingo,receivedPOST.tardeFinalDomingo]
        if (comprobarHora(horas)){
          let diaInicioLunes=comprobarYRemplazar(receivedPOST.diaInicioLunes)
          let diaFinalLunes=comprobarYRemplazar(receivedPOST.diaFinalLunes)
          let tardeInicioLunes=comprobarYRemplazar(receivedPOST.tardeInicioLunes)
          let tardeFinalLunes=comprobarYRemplazar(receivedPOST.tardeFinalLunes)
          let diaInicioMartes=comprobarYRemplazar(receivedPOST.diaInicioMartes)
          let diaFinalMartes=comprobarYRemplazar(receivedPOST.diaFinalMartes)
          let tardeInicioMartes=comprobarYRemplazar(receivedPOST.tardeInicioMartes)
          let tardeFinalMartes=comprobarYRemplazar(receivedPOST.tardeFinalMartes)
          let diaInicioMiercoles=comprobarYRemplazar(receivedPOST.diaInicioMiercoles)
          let diaFinalMiercoles=comprobarYRemplazar(receivedPOST.diaFinalMiercoles)
          let tardeInicioMiercoles=comprobarYRemplazar(receivedPOST.tardeInicioMiercoles)
          let tardeFinalMiercoles=comprobarYRemplazar(receivedPOST.tardeFinalMiercoles)
          let diaInicioJueves=comprobarYRemplazar(receivedPOST.diaInicioJueves)
          let diaFinalJueves=comprobarYRemplazar(receivedPOST.diaFinalJueves)
          let tardeInicioJueves=comprobarYRemplazar(receivedPOST.tardeInicioJueves)
          let tardeFinalJueves=comprobarYRemplazar(receivedPOST.tardeFinalJueves)
          let diaInicioViernes=comprobarYRemplazar(receivedPOST.diaInicioViernes)
          let diaFinalViernes=comprobarYRemplazar(receivedPOST.diaFinalViernes)
          let tardeInicioViernes=comprobarYRemplazar(receivedPOST.tardeInicioViernes)
          let tardeFinalViernes=comprobarYRemplazar(receivedPOST.tardeFinalViernes)
          let diaInicioSabado=comprobarYRemplazar(receivedPOST.diaInicioSabado)
          let diaFinalSabado=comprobarYRemplazar(receivedPOST.diaFinalSabado)
          let tardeInicioSabado=comprobarYRemplazar(receivedPOST.tardeInicioSabado)
          let tardeFinalSabado=comprobarYRemplazar(receivedPOST.tardeFinalSabado)
          let diaInicioDomingo=comprobarYRemplazar(receivedPOST.diaInicioDomingo)
          let diaFinalDomingo=comprobarYRemplazar(receivedPOST.diaFinalDomingo)
          let tardeInicioDomingo=comprobarYRemplazar(receivedPOST.tardeInicioDomingo)
          let tardeFinalDomingo=comprobarYRemplazar(receivedPOST.tardeFinalDomingo)

          if(cumplimientoFranjas(diaInicioLunes,diaFinalLunes,tardeInicioLunes,tardeFinalLunes) && cumplimientoFranjas(diaInicioMartes,diaFinalMartes,tardeInicioMartes,tardeFinalMartes) && 
          cumplimientoFranjas(diaInicioMiercoles,diaFinalMiercoles,tardeInicioMiercoles,tardeFinalMiercoles) && cumplimientoFranjas(diaInicioJueves,diaFinalJueves,tardeInicioJueves,tardeFinalJueves) && 
          cumplimientoFranjas(diaInicioViernes,diaFinalViernes,tardeInicioViernes,tardeFinalViernes) && cumplimientoFranjas(diaInicioSabado,diaFinalSabado,tardeInicioSabado,tardeFinalSabado) && 
          cumplimientoFranjas(diaInicioDomingo,diaFinalDomingo,tardeInicioDomingo,tardeFinalDomingo)){
            await db.query("insert into Anuncios(idUsu, tipo, direccion) values("+ receivedPOST.id+", '"+receivedPOST.tipo+"', '"+receivedPOST.direccion+"');");
            const idAnuncio = await db.query("select id from Anuncios where idUsu="+receivedPOST.id);
            insertarDatos("HorarioLunes",idAnuncio[0]["id"],diaInicioLunes,diaFinalLunes)
            insertarDatos("HorarioLunes",idAnuncio[0]["id"],tardeInicioLunes,tardeFinalLunes)
            insertarDatos("HorarioMartes",idAnuncio[0]["id"],diaInicioMartes,diaFinalMartes)
            insertarDatos("HorarioMartes",idAnuncio[0]["id"],tardeInicioMartes,tardeFinalMartes)
            insertarDatos("HorarioMiercoles",idAnuncio[0]["id"],diaInicioMiercoles,diaFinalMiercoles)
            insertarDatos("HorarioMiercoles",idAnuncio[0]["id"],tardeInicioMiercoles,tardeFinalMiercoles)
            insertarDatos("HorarioJueves",idAnuncio[0]["id"],diaInicioJueves,diaFinalJueves)
            insertarDatos("HorarioJueves",idAnuncio[0]["id"],tardeInicioJueves,tardeFinalJueves)
            insertarDatos("HorarioViernes",idAnuncio[0]["id"],diaInicioViernes,diaFinalViernes)
            insertarDatos("HorarioViernes",idAnuncio[0]["id"],tardeInicioViernes,tardeFinalViernes)
            insertarDatos("HorarioSabado",idAnuncio[0]["id"],diaInicioSabado,diaFinalSabado)
            insertarDatos("HorarioSabado",idAnuncio[0]["id"],tardeInicioSabado,tardeFinalSabado)
            insertarDatos("HorarioDomingo",idAnuncio[0]["id"],diaInicioDomingo,diaFinalDomingo)
            insertarDatos("HorarioDomingo",idAnuncio[0]["id"],tardeInicioDomingo,tardeFinalDomingo)
            result = {status: "OK", message: "El anuncio ha sido creado correctamente"}
          }else{
            result = {status: "ERROR", message: "Las franjas del horario no son correctas "}
          }
        }else{
          result = {status: "ERROR", message: "Alguna hora no es valida"}
        }
      }
    }else{
      result = {status: "ERROR", message: "La direccion no puede estar formada solo por numeros ni quedarse vacia"}
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/have_advertisment', haveAdvertisment)
async function haveAdvertisment (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    const contador = await db.query("select count(*) as contador from Usuarios where id="+receivedPOST.id);
    if (contador[0]["contador"]>0){
      const anuncio = await db.query("select count(*) as contador from Anuncios where idUsu="+receivedPOST.id);
      if (anuncio[0]["contador"]>0){
        result = {status: "OK", message: "Si tiene un anuncio", anuncio: true}
      }else{
        result = {status: "OK", message: "No tiene un anuncio", anuncio: false}
      }
    }else{
      result = {status: "ERROR", message: "No existe el usuario"}
    }
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

// Define routes
app.post('/insert_service', insertService)
async function insertService (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    const contador = await db.query("select count(*) as contador from Usuarios where id="+receivedPOST.id);
    if (contador[0]["contador"]>0){
      const anuncio = await db.query("select id from Anuncios where idUsu="+receivedPOST.id);
      let idAnuncio=anuncio[0]["id"]
      if(isNaN(receivedPOST.name)){
        if (receivedPOST.name.trim()==""){
          result = {status: "ERROR", message: "El nombre no puede quedarse vacio"}
        }else{
          const servicio = await db.query("select count(*) as cont from Servicios where idAnuncio="+idAnuncio+" and nombre='"+receivedPOST.name+"'");
          if(servicio[0]["cont"]==0){
            let regex = /^-?\d*(\.\d+)?$/;
            if (regex.test(receivedPOST.price)) {
              const totalMinutos = parseInt(receivedPOST.duration);
              const horas = Math.floor(totalMinutos / 60);
              let minutos = totalMinutos % 60;
              const horasStr = horas.toString().padStart(2, '0');
              const minutosStr = minutos.toString().padStart(2, '0');
              const tiempo = new Date();
              tiempo.setHours(horasStr);
              tiempo.setMinutes(minutosStr);
              tiempo.setSeconds(0);
              const tiempoStr = tiempo.toLocaleTimeString('en-ES', {hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit'});
              await db.query("insert into Servicios(idAnuncio, nombre, duracion, precio) values("+ idAnuncio+", '"+receivedPOST.name+"', '"+tiempoStr.replace("24","00")+"', "+receivedPOST.price+")");
              result = {status: "OK", message: "Se ha introducido correctamente el servicio"}
            } else {
              result = {status: "ERROR", message: "El precio no es un numero valido"}
            }
          }else{
            result = {status: "ERROR", message: "Ya existe un servicio con este mismo nombre"}
          }
        }
      }else{
        result = {status: "ERROR", message: "El nombre no pueden ser solo numero ni quedarse vacio"}
      }
    }else{
      result = {status: "ERROR", message: "No existe el usuario"}
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

