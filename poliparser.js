const firebase = require("firebase");
const readline = require('readline');
const credentials = require("./config.js");
const fs = require('fs');

// Initialize Firebase
var config = {
  apiKey: credentials.apiKey,
  authDomain: credentials.authDomain,
  databaseURL: credentials.databaseURL,
  storageBucket: credentials.storageBucket,
  messagingSenderId: credentials.messagingSenderId
};

firebase.initializeApp(config);
var database = firebase.database();

const reader = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const keywords = fs.readFileSync('data/keywords.txt', 'utf8', function(err, data) {
  if (err) console.log(err);
});

const courses = fs.readFileSync('data/courses.txt', 'utf8', function(err, data) {
  if (err) console.log(err);
});

var listOfCourses = courses.split('\n');
var listOfKeywords = keywords.split('\n');
var numberOfTheses = listOfCourses.length;

var pandapandapanda = {};
var invalidCharacters = ['.', '#', '$', '/', '[', ']'];

/*
  TODO something like this?
    [{
  	"milan": [{
  		"design": {
  			"something": 30,
  			"somethingElse": 40
  		},
  		"engineering": {
  			"something": 30,
  			"somethingElse": 40
  		}
  	}]
  }]
*/


reader.question('Percentage of theses to push: ', (percentage, err) => {
  if (err)
    console.log(err);
    pushEm(percentage);
  reader.close();
});

function pushEm(percentage) {
  for (var i = 0; i < (numberOfTheses / 100) * percentage; i++) {
    var course = listOfCourses[i];
    var arrayOfKeywords = listOfKeywords[i].split("; ");

    if (course.length == 0)
      course = "Error";

    arrayOfKeywords.forEach(function(keyword, index) {
      // Ditch invalid characters Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
      if (keyword.length == 0)
        keyword = "Error";

      invalidCharacters.forEach(function(character, index) {
        for (var position = 0; position < keyword.length; position++) {
          if (keyword.includes(character)) {
            keyword = keyword.replace(character, "");
          }
        }
      });

      // Check if keyword is already present in the object
      if (pandapandapanda[keyword] != undefined) {
        // Check if the course has already been encountered for this keyword
        var pandaWord = JSON.stringify(pandapandapanda[keyword]);
        pandaWord = pandaWord.substring(1, pandaWord.length - 1);

        if (pandapandapanda[keyword][course] != undefined) {
          // The course has already been encountered for this keyword. So get the count, and increment it.
          var count = pandapandapanda[keyword][course] + 1;
          pandapandapanda[keyword] = JSON.parse('{ ' + pandaWord + ', "' + course + '": ' + count + ' }');
        } else {
          // First encounter for a particular course
          pandapandapanda[keyword] = JSON.parse('{ ' + pandaWord + ', "' + course + '": ' + 1 + ' }');
        }
      } else {
        // Encountering the keyword for the first time
        pandapandapanda[keyword] = JSON.parse('{ "' + course + '": ' + 1 + '}');
      }
    });
  }

  firebase.database().ref('keywords').set({pandapandapanda});

  console.log("Push successful!");
}
