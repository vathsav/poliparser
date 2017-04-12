const d3 = require('d3');
const excel = require('excel');
const fs = require('fs');
var list = require('select-shell')({
    pointer: ' ▸ ',
    pointerColor: 'yellow',
    checked: ' ◉  ',
    unchecked:' ◎  ',
    checkedColor: 'green',
    msgCancel: 'No selected options!',
    msgCancelColor: 'orange',
    multiSelect: true,
    inverse: true,
    prepend: true
  }
);
const ora = require('ora');
const readline = require('readline');
const utils = require('./utils.js');

var invalidCharacters = ['.', '#', '$', '/', '[', ']', '\n', '\r'];
var numberOfSheets = 1;
var data;
var columnData;

var spinner = ora('Chunking your data').start();
spinner.color = 'yellow';

/*
  TODO Include keys for departments
*/

var displaySelector = function(titles) {
  // Push each title to the list
  titles.forEach(function(title, index) {
    if (title.length != 0)
      list.option(title);
  });

  list.on('select', function(choices) {
    const reader = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });

    reader.question('\nEnter the number of records to parse: ', (count, err) => {
      if (err)
        console.log(err);

      constructJSON(columnData.length, choices);
      reader.close();
    });
  });

  list.on('cancel', function(choices) {
    console.log("Cancelled!");
  });

  list.list();
}

fs.readFile('data/data_complete.csv', 'utf8', function (err, data) {
  if(err) spinner.fail('Failed to parse data');
  spinner.succeed('Data read successfully');
  columnData = d3.csvParseRows(data);

  var titles = [];

  // Display the column titles
  for (var i = 0; i < columnData[0].length; i++)
    titles.push(columnData[0][i]);

  displaySelector(titles);
});

function constructJSON(count, choices) {
  // AUTORE/I	AA	DATA	RELATORE	CORRELATORE	CORSO DI STUDI	FACOLTA'/SCUOLA	ACCESSO FILE	TIPO LAUREA	HANDLE	LINGUA	PAROLE CHIAVE - IT	PAROLE CHIAVE - EN	SSD	TITOLO	TIPO TESI
  // TODO: Temporary variables. Must be made dynamic based on choices
  var listOfAuthors = [];
  var listOfAcademicYears = [];
  var listOfDates = [];
  var listOfRelatores = [];
  var listOfCorrelators = [];
  var listOfCourses = [];
  var listOfSchools = [];
  var listOfAccesses = [];
  var listOfDegreeTypes = [];
  var listOfHandles = [];
  var listOfLanguages = [];
  var listOfKeywords = [];
  var listOfKeywordsEN = [];
  var listOfSSDs = []; // ???
  var listOfTitles = [];
  var listOfTypesOfTheses = [];

  for (var i = 0; i < count; i++) {
    if (columnData[i][9].includes(',')) {
      // Make sure
      columnData[i][9].replace(',', ';');
    }

    listOfAuthors.push(columnData[i][0]);
    listOfAcademicYears.push(columnData[i][1]);
    listOfDates.push(columnData[i][2]);
    listOfRelatores.push(columnData[i][3]);
    listOfCorrelators.push(columnData[i][4]);
    listOfCourses.push(columnData[i][5]);
    listOfSchools.push(columnData[i][6]);
    listOfAccesses.push(columnData[i][7]);
    listOfDegreeTypes.push(columnData[i][8]);
    listOfHandles.push(columnData[i][9]);
    listOfLanguages.push(columnData[i][10]);
    listOfKeywords.push(columnData[i][11]); // Cus that's how it is
    listOfKeywordsEN.push(columnData[i][12]);
    listOfSSDs.push(columnData[i][13]); // ???
    listOfTitles.push(columnData[i][14]);
    listOfTypesOfTheses.push(columnData[i][15]);
  }

  var keys = {};
  // Omit the titles of the columns. Iterate from index 1.
  for (var i = 1; i < count; i++) {
    var course = listOfCourses[i].toLowerCase();
    var arrayOfKeywords = listOfKeywords[i].split('; ');

    if (course.length == 0)
      course = 'Error';

    arrayOfKeywords.forEach(function(key, index) {
      // Ditch invalid characters - Keys must be non-empty strings and can't contain ".", "#", "$", "/", "[", or "]"
      if (key.length == 0 || key.length > 100)
        key = "Error";

      invalidCharacters.forEach(function(character, index) {
        for (var position = 0; position < key.length; position++) {
          if (key.includes(character)) {
            key = key.replace(character, "");
          }
        }
      });

      // Check if key is already present in the object
      if (keys[key] != undefined) {
        // Check if data already been encountered for this key
        var object = JSON.stringify(keys[key]);
        object = object.substring(1, object.length - 1);

        if (keys[key][course] != undefined) {
          // The course has already been encountered for this key. So get the count, and increment it.
          var count = keys[key][course] + 1;
          keys[key] = JSON.parse('{ ' + object + ', "' + course + '": ' + count
              + ', "author": "' + listOfAuthors[i]
              // + '", "academic_year": "' + listOfAcademicYears[i]
              // + '", "date": "' + listOfDates[i]
              // + '", "relators": "' + listOfRelatores[i]
              // + '", "correlators": "' + listOfCorrelators[i]
              // + '", "access": "' + listOfAccesses[i]
              // + '", "degree_type": "' + listOfDegreeTypes[i]
              // + '", "handle": "' + listOfHandles[i]
              // + '", "keyword_it": "' + listOfKeywordsEN[i]
              // + '", "ssd": "' + listOfSSDs[i]
              // + '", "title": "' + listOfTitles[i]
              + '", "type": "' + listOfTypesOfTheses[i]
              + '"}'
            );
        } else {
          // First encounter for a particular course
          keys[key] = JSON.parse('{ ' + object + ', "' + course + '": ' + 1
            + ', "author": "' + listOfAuthors[i]
            // + '", "academic_year": "' + listOfAcademicYears[i]
            // + '", "date": "' + listOfDates[i]
            // + '", "relators": "' + listOfRelatores[i]
            // + '", "correlators": "' + listOfCorrelators[i]
            // + '", "access": "' + listOfAccesses[i]
            // + '", "degree_type": "' + listOfDegreeTypes[i]
            // + '", "handle": "' + listOfHandles[i]
            // + '", "keyword_it": "' + listOfKeywordsEN[i]
            // + '", "ssd": "' + listOfSSDs[i]
            // + '", "title": "' + listOfTitles[i]
            + '", "type": "' + listOfTypesOfTheses[i]
            + '"}'
          );
        }
      } else {
        // Encountering the key for the first time
        keys[key] = JSON.parse('{ "' + course + '": ' + 1
            + ', "author": "' + listOfAuthors[i]
            // + '", "academic_year": "' + listOfAcademicYears[i]
            // + '", "date": "' + listOfDates[i]
            // + '", "relators": "' + listOfRelatores[i]
            // + '", "correlators": "' + listOfCorrelators[i]
            // + '", "access": "' + listOfAccesses[i]
            // + '", "degree_type": "' + listOfDegreeTypes[i]
            // + '", "handle": "' + listOfHandles[i]
            // + '", "keyword_it": "' + listOfKeywordsEN[i]
            // + '", "ssd": "' + listOfSSDs[i]
            // + '", "title": "' + listOfTitles[i]
            + '", "type": "' + listOfTypesOfTheses[i]
            + '"}'
          );
      }

      keys[key].total = 0;
      keys[key].total = d3.sum(d3.values(keys[key]));
    });
  }

  // TODO: Promt Firebase reference to push to

  utils.push('/keywords', keys);
}
