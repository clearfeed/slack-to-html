var slackHawkDown = require('./dist/index.js');

var patterns = slackHawkDown.buildSlackHawkDownRegExps();

for (var key in patterns) {
  if (Object.prototype.hasOwnProperty.call(patterns, key)) {
    console.log(`${key}: ${patterns[key].source}`);
  }
}

console.log('Complete!');
