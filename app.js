var Getopt       = require('node-getopt');
var path         = require('path');
var readDirFiles = require('read-dir-files');
var readline     = require('readline');

var authenticationService  = require('./authenticationService');
var apiPlatformRamlService = require('./apiPlatformRamlClientService');

// Allow connecting to other non-production versions of API platform
process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

// Parse cmdline args
var getopt = new Getopt([
  ['a', '=', 'API id'],
  ['v', '=', 'API Version id'],
  ['', 'api-platform=http://anypoint.mulesoft.com/apiplatform'],
  ['', 'auth-platform=http://anypoint.mulesoft.com/accounts'],
  ['c', 'confirmed', 'Do not ask for confirmation on upload'],
  ['u', 'username=username', 'username, if not specified we will use the APIPLATFORMUSER env variable'],
  ['p', 'password=password', 'password, if not specified we will use the APIPLATFORMPASS env variable'],
  ['h', 'help', 'This help'],
  ['r', 'root-raml=rootFile.raml', 'The name of the root RAML file, it is assumed to be at the root level folder.']
]).bindHelp();

var opt = getopt.parseSystem();
var rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

// Some globals
var rootDir             = process.cwd();
var interactive         = !opt.options.confirmed;
var API_PLATFORM_ROOT   = opt.options['api-platform'] || 'http://anypoint.mulesoft.com/apiplatform';
var AUTHENTICATION_ROOT = opt.options['auth-platform'] || 'http://anypoint.mulesoft.com/accounts';
var USERNAME            = opt.options['username'] || process.env['APIPLATFORMUSER'];
var PASSWORD            = opt.options['password'] || process.env['APIPLATFORMPASS'];
var APIID               = opt.options['a'];
var VERSIONID           = opt.options['v'];
var ROOT_RAML_FILE_NAME = opt.options['root-raml'] || 'api.raml';

// run the script
run();

function run(){
  if (interactive) {
    rl.question('You will import all files in path: ' +  rootDir + '\nThis will delete all your RAML files for API: ' + APIID + ' Version: ' +  VERSIONID + '\nPress ^C to cancel, return to continue.', function(answer) {
      readDirFiles.list(rootDir, processFiles);
      rl.close();
    });
  } else {
    console.log('Recursively importing all files from: ' + rootDir + '\nThis will delete all your RAML files for API: ' + APIID + ' Version: ' +  VERSIONID);
    readDirFiles.list(rootDir, processFiles);
  } 
}

function processFiles(error, fileNames) {
  var apiToken;

  if (error) {
    console.dir(error);
    abort();
  }

  // Authenticate user
  return authenticationService.authenticate(AUTHENTICATION_ROOT, USERNAME, PASSWORD)
    .then(function (token){
      // Open an API platform session
      return apiPlatformRamlService.openSession(API_PLATFORM_ROOT, token);
    })
    .then(function (session){
      apiToken = session.token;
      // Load all files
      return apiPlatformRamlService.clearFileStructure(API_PLATFORM_ROOT, apiToken, APIID, VERSIONID);
    })
    .then(function () {
      return apiPlatformRamlService.loadFileStructure(API_PLATFORM_ROOT, apiToken, APIID, VERSIONID, ROOT_RAML_FILE_NAME, fileNames);
    })
    .then(exit)
    .catch(function (error){
      console.dir(error);
      abort();
    })
    ;
}

function abort(status) {
  process.exit(status || 1);
}

function exit() {
  process.exit(0);
}
