var https = require('https');
var fs = require('fs');
var path = require('path');

var EMOJI_PRETTY_JSON_URL = 'https://raw.githubusercontent.com/iamcal/emoji-data/master/emoji_pretty.json';
var EMOJI_CONFIG_PATH = path.join(__dirname, 'config', 'emoji_pretty.json');

function downloadEmojiData() {
  return new Promise(function(resolve, reject) {
    process.stdout.write('Downloading latest emoji data...\n');

    https.get(EMOJI_PRETTY_JSON_URL, function(res) {
      var data = '';

      res.on('data', function(chunk) {
        data += chunk;
      });

      res.on('end', function() {
        if (res.statusCode === 200) {
          try {
            // Validate JSON before saving
            JSON.parse(data);
            fs.writeFileSync(EMOJI_CONFIG_PATH, data, 'utf8');
            console.log('✓ Emoji data downloaded and saved to config/emoji_pretty.json');
            resolve();
          } catch (error) {
            reject(new Error('Failed to parse downloaded emoji data: ' + error.message));
          }
        } else {
          reject(new Error('Failed to download emoji data. Status code: ' + res.statusCode));
        }
      });
    }).on('error', function(error) {
      reject(new Error('Download error: ' + error.message));
    });
  });
}
var EMOJI_PATHS = ['dist/emoji.js', 'src/emoji.js'];
// Function to process emoji data
function processEmojiData() {
  process.stdout.write('Processing emoji list...\n');

  var rawEmoji = require(EMOJI_CONFIG_PATH);
  var condensedEmoji = rawEmoji.reduce(function(accumulator, emoji) {
    accumulator[emoji.short_name] = emoji.unified;
    return accumulator;
  }, {});

  for (var i in EMOJI_PATHS) {
    var emojiPath = EMOJI_PATHS[i];
    fs.writeFileSync(emojiPath, 'module.exports = ' + JSON.stringify(condensedEmoji), 'utf8');
    console.log('✓ Updated ' + emojiPath);
  }

  console.log('✓ Complete!');
}

// Main execution
downloadEmojiData()
  .then(function() {
    // Clear the require cache to load fresh data
    delete require.cache[require.resolve(EMOJI_CONFIG_PATH)];
    processEmojiData();
  })
  .catch(function(error) {
    console.error('✗ Error:', error.message);
    console.log('Falling back to existing emoji_pretty.json file...');
    try {
      processEmojiData();
    } catch (fallbackError) {
      console.error('✗ Fatal error:', fallbackError.message);
      process.exit(1);
    }
  });
