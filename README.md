# api-platform-raml-import

## Description
It helps loading a local folder to the API platform's API Designer. It recursively scans the directory you are in and loads all files and folders to the API designer file system in the API platform

## Usage

 1. Clone this project
 1. `cd api-platform-raml-import`
 1. `npm install`
 1. `cd <THE FOLDER THAT HAS THE RAML files>`
 1. `node PATH-TO-THIS-REPO/app.js -u <Anypoint Platform user name> -p <Anypoint Platform password> -a <API id> -v <API version id>`
 
## Requirements

Node.js (any recent version should suffice)
 
## Full usage

```
Usage: node app.js

  -a                                                           API id
  -v                                                           API Version id
      --api-platform=http://anypoint.mulesoft.com/apiplatform
      --auth-platform=http://anypoint.mulesoft.com/accounts
  -c, --confirmed                                              Do not ask for confirmation on upload
  -u, --username=username                                      username, if not specified we will use the APIPLATFORMUSER env variable
  -p, --password=password                                      password, if not specified we will use the APIPLATFORMPASS env variable
  -h, --help                                                   This help
  -r, --root-raml=rootFile.raml                                The name of the root RAML file, it is assumed to be at the root level folder.
  ```
  
  
