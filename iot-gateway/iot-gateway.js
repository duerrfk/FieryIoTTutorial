/**
 * This file is part of FieryIoT.
 *
 * Copyright 2016 Frank Duerr
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 * 
 * http://www.apache.org/licenses/LICENSE-2.0
 * 
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

var http = require('http');
var firebase = require('firebase');

const port = 8080;
const host = 'localhost';

var fbconfig = {
  apiKey: "abcdefghijklmnopqrstuvwxyz1234567890",
  authDomain: "fieryiot-12345.firebaseapp.com",
  databaseURL: "https://fieryiot-12345.firebaseio.com"
  // We store everything in the database and don't need storage buckets here.
  //storageBucket: "<BUCKET>.appspot.com",
};
firebase.initializeApp(fbconfig);

firebase.auth().onAuthStateChanged(function(user) {
    if (user) {
        console.log("Signed in to Firebase");
    } else {
	console.log("No user signed in");
    }
});

function authenticateToFirebaseGoogleUser(idToken) {
    // Sign in with credential of Google user.
    var credential = firebase.auth.GoogleAuthProvider.credential(idToken);
    firebase.auth().signInWithCredential(credential).catch(
	function(error) {
            console.log("Error signing in to Firebase with user " + 
			error.email + ": " + error.message + " (" + 
			error.code + ")");
	});
}

server = http.createServer(function(req, res) {
    if (req.method == 'POST') {
        console.log("POST request");
        var body = '';
        req.on('data', function(data) {
            body += data;
        });
        req.on('end', function() {
            authenticateToFirebaseGoogleUser(body);
        });
        res.statusCode = 200;
        res.setHeader('Content-Type', 'text/plain');
        res.end('Credential received\n');
    } else {
        // Methods other than POST are not allowed.
	// Allowed methods are returned in 'Allow' header field.
        console.log("Unsupported HTTP request: " + req.method);
        res.statusCode = 405;
        res.setHeader('Content-Type', 'text/plain');
        res.setHeader('Allow', 'POST');
        res.end("Method not supported\n");
    }
});
server.listen(port, host);
console.log('HTTP server listening on ' + host + ':' + port);

// Simulate sensor events through a periodic timer.
function sensorUpdate() {
    console.log("Sensor event");

    var user = firebase.auth().currentUser;
    if (user) {
        // User is signed-in
        var uid = user.uid;
	var databaseRef = firebase.database();
	var newEventRef = databaseRef.ref('sensorevents/' + uid).push();
	var timestamp = new Date().toString();
	newEventRef.set({
	    'value': 'foo-sensor-value',
            'time': timestamp
	});
        console.log("Added new item to database");
    }
}
var timerSensorUpdates = setInterval(sensorUpdate, 15000);
