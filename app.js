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
//   password: process.env.MYSQLPASSWORD || "1234",
//   database: process.env.MYSQLDATABASE || "FinalProyect"
// })
// Init objects
db.init({
  host: process.env.MYSQLHOST || "containers-us-west-200.railway.app",
  port: process.env.MYSQLPORT || 7688,
  user: process.env.MYSQLUSER || "root",
  password: process.env.MYSQLPASSWORD || "xqDNUAaizsutFa9IVL4U",
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
            const fileBuffer = Buffer.from(receivedPOST.imagen, 'base64');
            const path = "./private"
            const anuncios = await db.query("select imagen from Anuncios")
            let nameFile=`${createNameFile()}.jpg`;
            let flag=false;
            while(!flag){
              flag=true
              for (let i=0; i<anuncios.length;i++){
                if (nameFile==anuncios[i]["imagen"]){
                  nameFile=`${createNameFile()}.jpg`;
                  flag=false;
                  break;
                } 
              }
            }
            await fs.mkdir(path, { recursive: true }) // Crea el directori si no existeix
            await fs.writeFile(`${path}/${nameFile}`, fileBuffer)

            await db.query("insert into Anuncios(idUsu, tipo, direccion, imagen) values("+ receivedPOST.id+", '"+receivedPOST.tipo+"', '"+receivedPOST.direccion+"', '"+nameFile+"');");
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

function createNameFile(){
  let charsList = [];
  let tokenSize = 41;
  let token = "";

  for(i = 0; i < 10; i ++){
    charsList.push(i);
  }

  for(i = 65; i <= 90; i++) {
    charsList.push(String.fromCharCode(i));
  }

  for(i = 97; i <= 122; i++) {
    charsList.push(String.fromCharCode(i));
  }
  
  for(i = 0; i < tokenSize - 1; i++){
    let randomNum = Math.round(Math.random()*(charsList.length - 1));
    token += charsList[randomNum];
  }

  return token;
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

// Define routes
app.post('/get_advertisments', getAdvertisments)
async function getAdvertisments (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    let anuncios;
    if(receivedPOST.tipo=="Todos" && receivedPOST.search==""){
      anuncios = await db.query("SELECT Usuarios.nombreEmpresa, Anuncios.tipo, Anuncios.direccion, Anuncios.imagen FROM Usuarios JOIN Anuncios ON Usuarios.id = Anuncios.idUsu;");
    }else if(receivedPOST.tipo=="Todos" && receivedPOST.search!=""){
      anuncios = await db.query("SELECT Usuarios.nombreEmpresa, Anuncios.tipo, Anuncios.direccion, Anuncios.imagen FROM Usuarios JOIN Anuncios ON Usuarios.id = Anuncios.idUsu where Usuarios.nombreEmpresa LIKE '%"+receivedPOST.search+"%';");
    }else if(receivedPOST.tipo!="Todos" && receivedPOST.search==""){
      anuncios = await db.query("SELECT Usuarios.nombreEmpresa, Anuncios.tipo, Anuncios.direccion, Anuncios.imagen FROM Usuarios JOIN Anuncios ON Usuarios.id = Anuncios.idUsu where Anuncios.tipo='"+receivedPOST.tipo+"';");
    }else if(receivedPOST.tipo!="Todos" && receivedPOST.search!=""){
      anuncios = await db.query("SELECT Usuarios.nombreEmpresa, Anuncios.tipo, Anuncios.direccion, Anuncios.imagen FROM Usuarios JOIN Anuncios ON Usuarios.id = Anuncios.idUsu where Anuncios.tipo='"+receivedPOST.tipo+"' and Usuarios.nombreEmpresa LIKE '%"+receivedPOST.search+"%';");
    }

    for (let i = 0; i < anuncios.length; i++) {
      let image_name = anuncios[i].imagen;
      //Utilizar nombre para sacar la imagen y sacar base64
      let base64Imagen = await fs.readFile(`./private/${image_name}`, { encoding: 'base64'})
      //Cambiar el nombre de la imagen al base 64 para poder mandarla al telefono
      anuncios[i].imagen = base64Imagen;
    }
      
    result = {status: "OK", message: "Anuncios", advertisments: anuncios}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

function convertirDuracion(duracion) {
  let horas = Math.floor(duracion / 60);
  let minutos = duracion % 60;

  if (horas > 0 && minutos > 0) {
    return horas + 'h ' + minutos + 'm';
  } else if (horas > 0) {
    return horas + 'h';
  } else {
    return minutos + 'm';
  }
}

// Define routes
app.post('/get_services', getServices)
async function getServices (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    let servicios = await db.query("select nombre,duracion,precio from Servicios where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'));");

    for (let i = 0; i < servicios.length; i++) {
      let timeArray = servicios[i].duracion.split(":");
      let hours = parseInt(timeArray[0]);
      let minutes = parseInt(timeArray[1]);
      servicios[i].duracion=convertirDuracion(hours * 60 + minutes);
    }
      
    result = {status: "OK", message: "Servicios por anuncio", services: servicios}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

function modificarFormatHora(hora){
  let partes = hora.split(":");

  let horas = parseInt(partes[0]);
  let minutos = partes[1];
  
  return horas + ":" + minutos;
  
}
// Define routes
app.post('/get_shedule', getShedule)
async function getShedule (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    let telefono = await db.query("select telefono from Usuarios where nombreEmpresa='"+receivedPOST.name+"';");
    let lunes1rTurno;
    let lunes2oTurno;
    let martes1rTurno;
    let martes2oTurno;
    let miercoles1rTurno;
    let miercoles2oTurno;
    let jueves1rTurno;
    let jueves2oTurno;
    let viernes1rTurno;
    let viernes2oTurno;
    let sabado1rTurno;
    let sabado2oTurno;
    let domingo1rTurno;
    let domingo2oTurno;

    let lunesCont = await db.query("select count(*) as contador from HorarioLunes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (lunesCont[0]["contador"]==0){
      lunes1rTurno="Cerrado";
      lunes2oTurno="Cerrado";
    } else if(lunesCont[0]["contador"]==1){
      let lunes = await db.query("select horaInicio, horaFin from HorarioLunes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      lunes1rTurno=modificarFormatHora(lunes[0]["horaInicio"])+" - "+modificarFormatHora(lunes[0]["horaFin"]);
      lunes2oTurno="Cerrado";
    } else if(lunesCont[0]["contador"]==2){
      let lunes = await db.query("select horaInicio, horaFin from HorarioLunes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      lunes1rTurno=modificarFormatHora(lunes[0]["horaInicio"])+" - "+modificarFormatHora(lunes[0]["horaFin"]);
      lunes2oTurno=modificarFormatHora(lunes[1]["horaInicio"])+" - "+modificarFormatHora(lunes[1]["horaFin"]);
    }

    let martesCont = await db.query("select count(*) as contador from HorarioMartes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (martesCont[0]["contador"]==0){
      martes1rTurno="Cerrado";
      martes2oTurno="Cerrado";
    } else if(martesCont[0]["contador"]==1){
      let martes = await db.query("select horaInicio, horaFin from HorarioMartes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      martes1rTurno=modificarFormatHora(martes[0]["horaInicio"])+" - "+modificarFormatHora(martes[0]["horaFin"]);
      martes2oTurno="Cerrado";
    } else if(martesCont[0]["contador"]==2){
      let martes = await db.query("select horaInicio, horaFin from HorarioMartes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      martes1rTurno=modificarFormatHora(martes[0]["horaInicio"])+" - "+modificarFormatHora(martes[0]["horaFin"]);
      martes2oTurno=modificarFormatHora(martes[1]["horaInicio"])+" - "+modificarFormatHora(martes[1]["horaFin"]);
    }

    let miercolesCont = await db.query("select count(*) as contador from HorarioMiercoles where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (miercolesCont[0]["contador"]==0){
      miercoles1rTurno="Cerrado";
      miercoles2oTurno="Cerrado";
    } else if(miercolesCont[0]["contador"]==1){
      let miercoles = await db.query("select horaInicio, horaFin from HorarioMiercoles where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      miercoles1rTurno=modificarFormatHora(miercoles[0]["horaInicio"])+" - "+modificarFormatHora(miercoles[0]["horaFin"]);
      miercoles2oTurno="Cerrado";
    } else if(miercolesCont[0]["contador"]==2){
      let miercoles = await db.query("select horaInicio, horaFin from HorarioMiercoles where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      miercoles1rTurno=modificarFormatHora(miercoles[0]["horaInicio"])+" - "+modificarFormatHora(miercoles[0]["horaFin"]);
      miercoles2oTurno=modificarFormatHora(miercoles[1]["horaInicio"])+" - "+modificarFormatHora(miercoles[1]["horaFin"]);
    }

    let juevesCont = await db.query("select count(*) as contador from HorarioJueves where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (juevesCont[0]["contador"]==0){
      jueves1rTurno="Cerrado";
      jueves2oTurno="Cerrado";
    } else if(juevesCont[0]["contador"]==1){
      let jueves = await db.query("select horaInicio, horaFin from HorarioJueves where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      jueves1rTurno=modificarFormatHora(jueves[0]["horaInicio"])+" - "+modificarFormatHora(jueves[0]["horaFin"]);
      jueves2oTurno="Cerrado";
    } else if(juevesCont[0]["contador"]==2){
      let jueves = await db.query("select horaInicio, horaFin from HorarioJueves where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      jueves1rTurno=modificarFormatHora(jueves[0]["horaInicio"])+" - "+modificarFormatHora(jueves[0]["horaFin"]);
      jueves2oTurno=modificarFormatHora(jueves[1]["horaInicio"])+" - "+modificarFormatHora(jueves[1]["horaFin"]);
    }

    let viernesCont = await db.query("select count(*) as contador from HorarioViernes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (viernesCont[0]["contador"]==0){
      viernes1rTurno="Cerrado";
      viernes2oTurno="Cerrado";
    } else if(viernesCont[0]["contador"]==1){
      let viernes = await db.query("select horaInicio, horaFin from HorarioViernes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      viernes1rTurno=modificarFormatHora(viernes[0]["horaInicio"])+" - "+modificarFormatHora(viernes[0]["horaFin"]);
      viernes2oTurno="Cerrado";
    } else if(viernesCont[0]["contador"]==2){
      let viernes = await db.query("select horaInicio, horaFin from HorarioViernes where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      viernes1rTurno=modificarFormatHora(viernes[0]["horaInicio"])+" - "+modificarFormatHora(viernes[0]["horaFin"]);
      viernes2oTurno=modificarFormatHora(viernes[1]["horaInicio"])+" - "+modificarFormatHora(viernes[1]["horaFin"]);
    }

    let sabadoCont = await db.query("select count(*) as contador from HorarioSabado where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (sabadoCont[0]["contador"]==0){
      sabado1rTurno="Cerrado";
      sabado2oTurno="Cerrado";
    } else if(sabadoCont[0]["contador"]==1){
      let sabado = await db.query("select horaInicio, horaFin from HorarioSabado where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      sabado1rTurno=modificarFormatHora(sabado[0]["horaInicio"])+" - "+modificarFormatHora(sabado[0]["horaFin"]);
      sabado2oTurno="Cerrado";
    } else if(sabadoCont[0]["contador"]==2){
      let sabado = await db.query("select horaInicio, horaFin from HorarioSabado where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      sabado1rTurno=modificarFormatHora(sabado[0]["horaInicio"])+" - "+modificarFormatHora(sabado[0]["horaFin"]);
      sabado2oTurno=modificarFormatHora(sabado[1]["horaInicio"])+" - "+modificarFormatHora(sabado[1]["horaFin"]);
    }

    let domingoCont = await db.query("select count(*) as contador from HorarioDomingo where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (domingoCont[0]["contador"]==0){
      domingo1rTurno="Cerrado";
      domingo2oTurno="Cerrado";
    } else if(domingoCont[0]["contador"]==1){
      let domingo = await db.query("select horaInicio, horaFin from HorarioDomingo where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      domingo1rTurno=modificarFormatHora(domingo[0]["horaInicio"])+" - "+modificarFormatHora(domingo[0]["horaFin"]);
      domingo2oTurno="Cerrado";
    } else if(domingoCont[0]["contador"]==2){
      let domingo = await db.query("select horaInicio, horaFin from HorarioDomingo where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      domingo1rTurno=modificarFormatHora(domingo[0]["horaInicio"])+" - "+modificarFormatHora(domingo[0]["horaFin"]);
      domingo2oTurno=modificarFormatHora(domingo[1]["horaInicio"])+" - "+modificarFormatHora(domingo[1]["horaFin"]);
    }

    result = {status: "OK", message: "Detalles empresa", phone: telefono[0]["telefono"], lunes1rTurno: lunes1rTurno, lunes2oTurno: lunes2oTurno, martes1rTurno: martes1rTurno, 
    martes2oTurno: martes2oTurno, miercoles1rTurno: miercoles1rTurno, miercoles2oTurno: miercoles2oTurno, jueves1rTurno: jueves1rTurno, jueves2oTurno: jueves2oTurno, 
    viernes1rTurno: viernes1rTurno, viernes2oTurno: viernes2oTurno, sabado1rTurno: sabado1rTurno, sabado2oTurno: sabado2oTurno, domingo1rTurno: domingo1rTurno, domingo2oTurno: domingo2oTurno}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}

function convertToMinutes(duration) {
  let hours = 0;
  let minutes = 0;

  // Si la duración contiene "h", extraer las horas
  if (duration.includes("h")) {
    let durationArray = duration.split("h");
    hours = parseInt(durationArray[0]);
    duration = durationArray[1].trim();
  }

  // Si la duración contiene "m", extraer los minutos
  if (duration.includes("m")) {
    minutes = parseInt(duration.replace("m", "").trim());
  }

  return hours * 60 + minutes;
}

// Define routes
app.post('/get_dates', getDates)
async function getDates (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    let inicio = new Date(receivedPOST.year,receivedPOST.month,receivedPOST.day);
    let fin = new Date(receivedPOST.year,receivedPOST.month,receivedPOST.day);
    let tablasHorarios = ['HorarioDomingo', 'HorarioLunes', 'HorarioMartes', 'HorarioMiercoles', 'HorarioJueves', 'HorarioViernes', 'HorarioSabado'];
    let tabla = tablasHorarios[inicio.getDay()];
    let horas=[];
    let horasDisponibles=[];
    let duracionServicio=convertToMinutes(receivedPOST.duration);
    let cont = await db.query("select count(*) as contador from "+tabla+" where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
    if (cont[0]["contador"]==0){
      horasDisponibles.push("No hay horas disponibles")
    } else if(cont[0]["contador"]==1){
      let dia = await db.query("select horaInicio, horaFin from "+tabla+" where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      inicio.setHours(parseInt(dia[0]["horaInicio"].substr(0, 2)), parseInt(dia[0]["horaInicio"].substr(3, 2)), parseInt(dia[0]["horaInicio"].substr(6, 2)), 0);

      fin.setHours(parseInt(dia[0]["horaFin"].substr(0, 2)), parseInt(dia[0]["horaFin"].substr(3, 2)), parseInt(dia[0]["horaFin"].substr(6, 2)), 0);
      let citas = await db.query("select idServicio, fecha from Citas where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by fecha ASC");

      let hora = new Date(inicio.getTime());
      let horaProbar = new Date(inicio.getTime()); 
      while (hora < fin && horaProbar.setMinutes(horaProbar.getMinutes() + duracionServicio) <= fin) {
        horas.push(new Date(hora));
        hora.setMinutes(hora.getMinutes() + duracionServicio);
      }

      for(let i=0;i<citas.length;i++){
        let duracion = await db.query("select duracion from Servicios where id="+citas[i]["idServicio"]+" and idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
        let cita = new Date(citas[i]["fecha"]);
        let citaFinal = new Date(citas[i]["fecha"]);
        let timeArray = duracion[0]["duracion"].split(":");
        let hora = parseInt(timeArray[0]);
        let minutos = parseInt(timeArray[1]);
        citaFinal.setMinutes(citaFinal.getMinutes() + (hora*60+minutos));
        for (let j = 0; j < horas.length; j++) {
          let horaInicio = horas[j];
          let horaFinal = new Date(horas[j].getTime());
          horaFinal.setMinutes(horaFinal.getMinutes() + duracionServicio);
  
          if (horaFinal > cita && horaInicio < citaFinal) {
            horas.splice(j, 1);
            j--;
          }
        }

      }

      let now = new Date();
      now.setHours(now.getHours()+2)
      let horasValidas = [];

      for (let i = 0; i < horas.length; i++) {
        let hora = horas[i];
        if (hora > now) { 
          horasValidas.push(hora);
        }
      }

      horasDisponibles = horasValidas.map(hora => hora.getHours()+ ':' + hora.getMinutes().toString().padStart(2, '0'));


      
    } else if(cont[0]["contador"]==2){
      let dia = await db.query("select horaInicio, horaFin from "+tabla+" where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by horaInicio ASC;");
      inicio.setHours(parseInt(dia[0]["horaInicio"].substr(0, 2)), parseInt(dia[0]["horaInicio"].substr(3, 2)), parseInt(dia[0]["horaInicio"].substr(6, 2)), 0);

      fin.setHours(parseInt(dia[0]["horaFin"].substr(0, 2)), parseInt(dia[0]["horaFin"].substr(3, 2)), parseInt(dia[0]["horaFin"].substr(6, 2)), 0);
      let citas = await db.query("select idServicio, fecha from Citas where idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"')) order by fecha ASC");

      let hora = new Date(inicio.getTime());
      let horaProbar = new Date(inicio.getTime()); 
      while (hora < fin && horaProbar.setMinutes(horaProbar.getMinutes() + duracionServicio) <= fin) {
        horas.push(new Date(hora));
        hora.setMinutes(hora.getMinutes() + duracionServicio);
      }
      let inicio2 = new Date(receivedPOST.year,receivedPOST.month,receivedPOST.day);
      let fin2 = new Date(receivedPOST.year,receivedPOST.month,receivedPOST.day);
      inicio2.setHours(parseInt(dia[1]["horaInicio"].substr(0, 2)), parseInt(dia[1]["horaInicio"].substr(3, 2)), parseInt(dia[0]["horaInicio"].substr(6, 2)), 0);

      fin2.setHours(parseInt(dia[1]["horaFin"].substr(0, 2)), parseInt(dia[1]["horaFin"].substr(3, 2)), parseInt(dia[0]["horaFin"].substr(6, 2)), 0);
      
      hora = new Date(inicio2.getTime());
      horaProbar = new Date(inicio2.getTime()); 
      while (hora < fin2 && horaProbar.setMinutes(horaProbar.getMinutes() + duracionServicio) <= fin2) {
        horas.push(new Date(hora));
        hora.setMinutes(hora.getMinutes() + duracionServicio);
      }

      for(let i=0;i<citas.length;i++){
        let duracion = await db.query("select duracion from Servicios where id="+citas[i]["idServicio"]+" and idAnuncio=(select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"'))");
        let cita = new Date(citas[i]["fecha"]);
        let citaFinal = new Date(citas[i]["fecha"]);
        let timeArray = duracion[0]["duracion"].split(":");
        let hora = parseInt(timeArray[0]);
        let minutos = parseInt(timeArray[1]);
        citaFinal.setMinutes(citaFinal.getMinutes() + (hora*60+minutos));
        for (let j = 0; j < horas.length; j++) {
          let horaInicio = horas[j];
          let horaFinal = new Date(horas[j].getTime());
          horaFinal.setMinutes(horaFinal.getMinutes() + duracionServicio);
  
          if (horaFinal > cita && horaInicio < citaFinal) {
            horas.splice(j, 1);
            j--;
          }
        }

      }
      let now = new Date();
      now.setHours(now.getHours()+2)
      let horasValidas = [];

      for (let i = 0; i < horas.length; i++) {
        let hora = horas[i];
        if (hora > now) { 
          horasValidas.push(hora);
        }
      }

      horasDisponibles = horasValidas.map(hora => hora.getHours()+ ':' + hora.getMinutes().toString().padStart(2, '0'));

    }
    result = {status: "OK", message: "Fechas", hours: horasDisponibles}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}


app.post('/save_date', saveDate)
async function saveDate (req, res) {

  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if (receivedPOST) {
    let timeArray = receivedPOST.hour.split(":");
    let hours = parseInt(timeArray[0]);
    let minutes = parseInt(timeArray[1]);
    
    const date = new Date(receivedPOST.year, receivedPOST.month, receivedPOST.day, hours, minutes);
    date.setHours(date.getHours()-2);
    const opciones = { timeZone: "Europe/Madrid" };
    const fechaEspaña = date.toLocaleString("es-ES", opciones);
    const spanishDateString = fechaEspaña.replace(/(\d+)\/(\d+)\/(\d+), (\d+):(\d+):(\d+)/, "$3-$2-$1 $4:$5:$6");
                

    let idAnuncio = await db.query("select id from Anuncios where idUsu=(select id from Usuarios where nombreEmpresa='"+receivedPOST.name+"');");

    let idServicio = await db.query("select id from Servicios where idAnuncio="+idAnuncio[0]["id"]+" and nombre='"+receivedPOST.nameService+"';");
    await db.query("insert into Citas (idUsu,idAnuncio,idServicio,fecha) values("+receivedPOST.idUsu+","+idAnuncio[0]["id"]+","+idServicio[0]["id"]+",'"+spanishDateString+"');");

    result = {status: "OK", message: "Hora reservada correctamente"}
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}


app.post('/get_user',get_user)
async function get_user(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = {}

  if(receivedPOST){
      let user = await db.query("select * from Usuarios where id="+receivedPOST.id+";")
      result = {status:"OK", user: user}
  }
  else{
    result = { status: "ERROR", message: "Unkown type" }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))
}


app.post('/get_image',get_image)
async function get_image(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = {}

  if(receivedPOST){
    try{
      let anuncio = await db.query("select * from Anuncios where idUsu="+receivedPOST.id+";")

      let image_name = anuncio[0].imagen;

      let base64Imagen = await fs.readFile(`./private/${image_name}`, { encoding: 'base64'})
      
      result = {status:"OK", anuncio: base64Imagen}
    }
    catch{
      result = { status: "ERROR", message: "Error with image" }
    }
  }
  else{
    result = { status: "ERROR", message: "Unkown type" }
  }
  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))

}

app.post('/get_client_dates',getClientDates)
async function getClientDates(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if(receivedPOST){
    let citas
    if (receivedPOST.status=="Pending"){
      citas = await db.query("select * from Citas where idUsu="+receivedPOST.id+" and fecha > DATE_ADD(NOW(), INTERVAL 2 HOUR) order by fecha ASC")

    }else if (receivedPOST.status=="Complete"){
      citas = await db.query("select * from Citas where idUsu="+receivedPOST.id+" and fecha <= DATE_ADD(NOW(), INTERVAL 2 HOUR) order by fecha ASC")

    }
    let nuevaListaCitas = [];

    for (let i = 0; i < citas.length; i++) {

      let idServicio = citas[i].idServicio;
      let idAnuncio = citas[i].idAnuncio;
      let fecha = new Date(citas[i].fecha);

      let nombreServicio = await db.query("select nombre from Servicios where id="+idServicio);
      nombreServicio = nombreServicio[0]["nombre"]; 
      let nombreEmpresa = await db.query("select Usuarios.nombreEmpresa from Usuarios join Anuncios on Usuarios.id = Anuncios.idUsu where Anuncios.id="+idAnuncio);
      nombreEmpresa = nombreEmpresa[0]["nombreEmpresa"]

      let hora = fecha.getHours();
      let minutos = fecha.getMinutes();
      let segundos = fecha.getSeconds();

      if (hora < 10) {
        hora = "0" + hora;
      }
      if (minutos < 10) {
        minutos = "0" + minutos;
      }
      if (segundos < 10) {
        segundos = "0" + segundos;
      }

      let horaCompleta = hora + ":" + minutos + ":" + segundos; 
      
      const meses = [
        "Enero", "Febrero", "Marzo", "Abril",
        "Mayo", "Junio", "Julio", "Agosto",
        "Septiembre", "Octubre", "Noviembre", "Diciembre"
      ];

      let nuevaCita = {
        id: citas[i].id,
        nombreServicio: nombreServicio,
        nombreEmpresa: nombreEmpresa,
        mes: meses[fecha.getMonth()], 
        dia: fecha.getDate(),
        hora: modificarFormatHora(horaCompleta),
        year: fecha.getFullYear()
      };

      nuevaListaCitas.push(nuevaCita);
    }
    result = {status: "OK", message: "Las citas", citas: nuevaListaCitas}
    
    
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))

}

app.post('/get_company_dates',getCompanyDates)
async function getCompanyDates(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if(receivedPOST){
    let date = new Date(receivedPOST.year, receivedPOST.month, receivedPOST.day);
    date.setHours(4,0,0)
    let fechaCita = date.toISOString().slice(0, 10);
    let citas = await db.query("select Usuarios.nombre as nombreUsuario, Servicios.nombre as nombreServicio, Servicios.duracion, Citas.fecha from Citas join Usuarios on Usuarios.id = Citas.idUsu join Servicios on Servicios.id = Citas.idServicio where Citas.idAnuncio = (select id from Anuncios where idUsu="+receivedPOST.id+") and date(Citas.fecha) = '"+fechaCita+"' order by Citas.fecha ASC")

    for (let i = 0; i < citas.length; i++) {
      let fechaObj = new Date(citas[i].fecha);
      let hora = fechaObj.getHours();
      let minutos = fechaObj.getMinutes();
      let segundos = fechaObj.getSeconds();
      let horaFormateada = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;
      citas[i].horaInicio = modificarFormatHora(`${horaFormateada}`);

      let [horas, min, seg] = citas[i].duracion.split(":").map(componente => parseInt(componente, 10));
      let duracionSegundos = horas * 3600 + min * 60 + seg;
      let fechaObj2 = new Date(citas[i].fecha);
      fechaObj2.setSeconds(fechaObj2.getSeconds()+duracionSegundos)
      hora = fechaObj2.getHours();
      minutos = fechaObj2.getMinutes();
      segundos = fechaObj2.getSeconds();
      horaFormateada = `${hora.toString().padStart(2, '0')}:${minutos.toString().padStart(2, '0')}:${segundos.toString().padStart(2, '0')}`;

      citas[i].horaFin = modificarFormatHora(`${horaFormateada}`);


      delete citas[i].fecha;
      delete citas[i].duracion;

    }

    result = {status: "OK", message: "Las citas", citas: citas}
    
    
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))

}

app.post('/delete_date',deleteDate)
async function deleteDate(req,res){
  let receivedPOST = await post.getPostObject(req)
  let result = { status: "ERROR", message: "Unkown type" }

  if(receivedPOST){

    let contador = await db.query("select count(*) as cont from Citas where id="+receivedPOST.id);
    if(contador[0]["cont"]>0){
      try{
        await db.query("delete from Citas where id="+receivedPOST.id);
        result = {status: "OK", message: "Cita eliminada correctamente"}

      }catch{
        result = {status: "ERROR", message: "La cita que quieres eliminar no existe"}
      }
    }else{
      result = {status: "ERROR", message: "La cita que quieres eliminar no existe"}
    }    
    
  }

  res.writeHead(200, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(result))

}




