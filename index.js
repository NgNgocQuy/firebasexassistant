'use strict';

const {dialogflow} = require('actions-on-google');
const functions = require('firebase-functions');

const admin = require('firebase-admin');
admin.initializeApp();

const app = dialogflow({debug: true});

const ref = admin.database().ref('/');
const firebaseRefController =ref.child('/controller');
const firebaseRefSensorData =ref.child('/sensorData');
// child
const firebaseRefConnectionStatus = firebaseRefController.child("/connection/status/garden_3")
const firebaseRefRealtimeData = firebaseRefSensorData.child("/garden_3")

const myGarden = "myGarden"
// parameter
const test = "test"
const light = "light"
const pump = "pump"
const help = "help"
const auto = "auto"
const statusGarden = "statusGarden"

// function-------------------------------------------------------------------------------

  // function check connection of raspberry to firebase
  async function Connection(){
    firebaseRefConnectionStatus.once("value", function(snapshot){
      let data = Object.values(snapshot.val())
      return data[1]+10
    })
  }

  // conntrol device, option...
  async function Controller(value,turn){
    let status =""
    if(turn=="light") firebaseRefController.update({light: value})
    else if(turn=="auto") firebaseRefController.update({auto: value})
    else if(turn=="pump") firebaseRefController.update({pump: value})
    if(value==1) status = "on"
    else status = "off"
    let talk ="Turn " + status + " the " + turn + " completed" //Turn off the pump completed
    return talk 
  }

  // get data everything....
  async function getController(){
    let snapshot = await firebaseRefController.get()
    let data = Object.values( await snapshot.val())
    let result =""
    if(data.auto==1) {result+="auto: on. "} else {result+="auto: off. "}
    if(data.light==1) {result+="light: on. "} else {result+="light: off. "}
    if(data.pump==1) {result+="pump: on. "} else {result+="pump: off. "}

    return result
  }
  async function getRealtimeData(){
    let snapshot = await firebaseRefRealtimeData.limitToLast(1).get()
    let data = Object.values(snapshot.val())
    console.log("data: " +data);
    let result = ``
    data.forEach(data => {
      result = `temperature: ${data.temp} C. humidity: ${data.humi}%. light intensity: ${data.lux}lux. soil moisture: ${data.soil}%`      
    })

    return result
  }

// function-------------------------------------------------------------------------------

app.intent(myGarden, async (conv) => {

  if(conv.parameters[test]!=""){
    let snapshot = await ref.child("/test").get()
    let result = Object.values(snapshot.val())
    conv.ask(' Testing : '+result+'');
  } //true //turn off check connection 

// controller-------------------------
    // auto
  else if(conv.parameters[auto]!=""){
    let result = await Controller(conv.parameters[auto],"auto")
    conv.ask(result+"!");
  // light
  } else if(conv.parameters[light]!=""){
    let result = await Controller(conv.parameters[light],"light")
    conv.ask(result+"!");
  // pump 
  }else if(conv.parameters[pump]!=""){
    let result = await Controller(conv.parameters[pump],"pump")
    conv.ask(result+"!");
  }

// help-------------------------------
  else if(conv.parameters[help]!=""){
    
    conv.ask("Turn device: 'auto control, human control'. 'light on, off'. 'pump on, off'.");
    conv.ask("Status of garden:'status'")
    conv.ask("You need help:'help' ")
  }

  // view status garden-----------------
  else if(conv.parameters[statusGarden]!=""){
    let realtime = await getRealtimeData()
    let controller = await getController()
    // let result = `:${}. ${}`
    conv.ask("My garden status:");
    conv.ask(controller)
    conv.ask(realtime)
  }

// catch result------------------------
  else {
    conv.ask('What are you looking for? You can say "help" ');

  }

// checking connection of raspberry and firebase
  // }else if( Connection() <=(new Date().getTime())/1000){ //true //turn off check connection  
  if( Connection() <=(new Date().getTime())/1000){ //false
    conv.ask('Lost connection to the garden!');
  }

// whatever
  conv.ask('hmm..!');
});


exports.dialogflowFirebaseFulfillment = functions.https.onRequest(app);
