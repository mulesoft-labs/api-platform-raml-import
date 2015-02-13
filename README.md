# api-platform-raml-import

## Description
It loads a local folder to the API platform's API Designer, after clearing out everything already saved there. It recursively scans the local folder you are in and loads all files and subfolders to the API Designer file system in the API platform, for a specific API and API version.

### WARNING: This will delete ALL current files and folders in the API Designer file system in the selected API and API version!

### WARNING: This will upload ALL files and subfolders in the local folder to the API Designer, whether they're `!include`d in the RAML or not. Take care to make sure you intend to have them there.

## Usage

 1. Clone this project
 1. `cd api-platform-raml-import`
 1. `npm install`
 1. `cd <THE FOLDER THAT HAS THE RAML FILES>`
 1. `node PATH-TO-THIS-REPO/app.js -u <Anypoint Platform user name> -p <Anypoint Platform password> -a <API id> -v <API version id>`

_You can retrieve the API  and API version ids by looking at the URL of the API Designer for your API version: https://anypoint.mulesoft.com/apiplatform/popular/admin/#/dashboard/apis/<API id>/versions/<API version id>/designer_
 
## Requirements

Node.js (any recent version should suffice)
 
## Full usage

```
Usage: node app.js

  -a                                                           API id
  -v                                                           API version id
      --api-platform=http://anypoint.mulesoft.com/apiplatform
      --auth-platform=http://anypoint.mulesoft.com/accounts
  -c, --confirmed                                              Do not ask for confirmation on upload
  -u, --username=username                                      username; if not specified we will use the APIPLATFORMUSER env variable
  -p, --password=password                                      password; if not specified we will use the APIPLATFORMPASS env variable
  -h, --help                                                   This help
  -r, --root-raml=rootFile.raml                                The name of the root RAML file, assumed to be at the root level folder.
  ```
  
  
