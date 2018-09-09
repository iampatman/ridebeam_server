const feathers = require('@feathersjs/feathers');
const express = require('@feathersjs/express');
const firebase = require('firebase');
var fs = require('fs');
const config = {
  apiKey: 'AIzaSyBOw24YamYyE9scDBY1iR6f3eq0mmJC5h0',
  authDomain: 'ridebeam.firebaseapp.com',
  databaseURL: 'https://ridebeam.firebaseio.com',
  projectId: 'ridebeam',
  storageBucket: 'ridebeam.appspot.com',
  messagingSenderId: '348910149405'
};
var defaultApp = firebase.initializeApp(config);
var database = firebase.database();
database.ref('/123123').set({
  long: 1,
  lat: 2,
  battery: 100,
  status: 1
});

function toRad (Value) {
  return Value * Math.PI / 180;
}

function calcCrow (lat1, lon1, lat2, lon2) {
  var R = 6371; // km
  var dLat = toRad(lat2 - lat1);
  var dLon = toRad(lon2 - lon1);
  var lat1 = toRad(lat1);
  var lat2 = toRad(lat2);

  var a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.sin(dLon / 2) * Math.sin(dLon / 2) * Math.cos(lat1) * Math.cos(lat2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c;
  return d;
}

function initScooters () {
  fs.readFile('coords.txt', 'utf8', function (err, data) {
    if (err) throw err;
    // console.log('OK: ' + filename);
    // console.log(data);
    data.split('\n').forEach((item, index) => {
      // console.log('item: ' + index + ' ' + item);
      if (item.trim() === '') {
        return;
      }
      let coords = item.split(',');

      let key = 'scooter_' + index;
      database.ref('/' + key).set({
        long: coords[3],
        lat: coords[1],
        battery: 100,
        status: 1
      }).then((e) => {
        // console.log(e);
      }).catch((e) => {
        // console.log(e);
      });
    });
  });

}

initScooters();

var scooters = [];
var starCountRef = firebase.database().ref('/');
starCountRef.on('value', function (snapshot) {
  console.log(snapshot.val());
  Object.keys(snapshot.val()).map(scooter_id => {
    // console.log('scooter' + JSON.stringify(snapshot.val()[scooter_id]));

    scooters.push(snapshot.val()[scooter_id]);
  });
});

class Scooters {
  constructor () {
    // this.scooters = [];
    this.currentId = 0;
  }

  async find (params) {
    console.log('params' + JSON.stringify(params));
    const {query} = params;
    const {x, y, lat, long} = query;
    const result = [];
    scooters.forEach(scooter => {
      const dis = calcCrow(lat, long, scooter.lat, scooter.long);
      if (dis * 1000 < y) {
        result.push(scooter);
      }
    });
    return result.filter((scooter, index) => {
      return index < x ;
    });
  }

  async get (id, params) {
    console.log('params' + JSON.stringify(params));
    return scooters;
  }

  async create (data, params) {
    // Create a new object with the original data and an id
    // taken from the incrementing `currentId` counter
    const scooter = Object.assign({
      id: ++this.currentId
    }, data);

    this.scooters.push(scooter);
    return scooter;
  }

  async update (id, data, params) {}

  async patch (id, data, params) {}

  async remove (id, params) {}
}

const app = express(feathers());

// Turn on JSON body parsing for REST services
app.use(express.json());
// Turn on URL-encoded body parsing for REST services
app.use(express.urlencoded({extended: true}));
// Set up REST transport using Express
app.configure(express.rest());

// Initialize the messages service by creating
// a new instance of our class
// app.use('messages', new Messages());
app.use('scooters', new Scooters());

// Set up an error handler that gives us nicer errors
app.use(express.errorHandler());

// Start the server on port 3030
const server = app.listen(3030);

// Use the service to create a new message on the server

server.on('listening', () => console.log('Feathers REST API started at http://localhost:3030'));
