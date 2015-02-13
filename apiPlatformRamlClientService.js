var fs         = require('fs');
var path       = require('path');
var Promise    = require('bluebird');
var superagent = require('superagent');
var toposort   = require('toposort');

module.exports = {
  openSession:    openSession,
  clearFileStructure: clearFileStructure,
  loadFileStructure:  loadFileStructure
};

function openSession(baseUri, token) {
  return promisifyRequest(superagent.post(baseUri + '/login')
        .send({
          token: token
        })
      )
    ;
}

function clearFileStructure(baseUri, token, apiId, versionId) {
  return getAllFiles(baseUri, token, apiId, versionId)
    .then(function (files){
      return deleteFiles(baseUri, token, apiId, versionId, files);
    });
}

function loadFileStructure(baseUri, token, apiId, versionId, rootRamlFileName, files) {
  var fileInfo = splitFilesFolders(files);

  return assertRootRaml(baseUri, token, apiId, versionId, rootRamlFileName)
    .then(function (){
      return createFolders(baseUri, token, apiId, versionId, fileInfo);
    })
    .then(function (folderMap){
      return createFiles(baseUri, token, apiId, versionId, fileInfo, folderMap);
    })
    ;
}

function getAllFiles(baseUri, token, apiId, versionId) {
  return apiClient(superagent.get(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files'), token);
}

function deleteFiles(baseUri, token, apiId, versionId, files) {
  var hashFiles = {};

  if (!files) {
    return Promise.resolve();
  }

  var nodes = files.map(function (file){
    hashFiles[file.id] = file;
    return [file.id, file.parentId]
  });

  var sortedFiles = toposort(nodes).filter(function (item) {return !!item});

  return Promise.reduce(sortedFiles, function(total, fileId){
      return deleteFile(baseUri, token, apiId, versionId, hashFiles[fileId]);
    }, 
    0);
}

function deleteFile(baseUri, token, apiId, versionId, file) {
  return apiClient(superagent.del(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files/'  + file.id), token)
    .catch(function (error){
      if(error.body.name === 'CannotDeleteObjectError') {
        // Swallow attempting to delete root RAML file
        return Promise.resolve('');
      }

      return Promise.reject(error);
    });
}

function splitFilesFolders(files) {
  var result = {
    files: [],
    folders: [],
    root: files[0]
  };

  var root = files[0];

  files.forEach(function (file){
    if (file === result.root) {
      return;
    }

    var stats = fs.lstatSync(file);

    if (stats.isDirectory(file)) {
      return result.folders.push(file);
    } 

    if (stats.isFile(file)){
      return result.files.push(file);
    }
  });

  return result;
}

function assertRootRaml(baseUri, token, apiId, versionId, rootRamlFileName) {
  return getApi(baseUri, token, apiId, versionId)
    .then(function (api){
      if (api.rootFileId) {
        return updateRootRaml(baseUri, token, apiId, versionId, api.rootFileId, rootRamlFileName);
      }

      return addRootRaml(baseUri, token, apiId, versionId, rootRamlFileName);
    });
}

function getApi(baseUri, token, apiId, versionId) {
  return apiClient(superagent.get(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId), token);
}

function updateRootRaml(baseUri, token, apiId, versionId, rootFileId, rootRamlFileName) {
  return getFile(baseUri, token, apiId, versionId, rootFileId)
    .then(function (file){
      file.data = fs.readFileSync('./' + rootRamlFileName, 'utf8');
      file.name = rootRamlFileName;
      return updateFile(baseUri, token, apiId, versionId, rootFileId, file);
    })
}

function getFile(baseUri, token, apiId, versionId, fileId) {
  return apiClient(superagent.get(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files/' + fileId), token);
}

function updateFile(baseUri, token, apiId, versionId, fileId, file) {
  return apiClient(superagent.put(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files/' + fileId).send(file), token);
}

function getApi(baseUri, token, apiId, versionId) {
  return apiClient(superagent.get(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId), token);
}

function addRootRaml(baseUri, token, apiId, versionId, rootRamlFileName) {
  var rootRaml = {
    apiId:        apiId,
    apiVersionId: versionId,
    isDirectory:  false,
    name:         rootRamlFileName,
    data:         '#%RAML 0.8\ntitle: Automatically generated RAML'
  };

  try {
    rootRaml.data = fs.readFileSync('./' + rootRamlFileName, 'utf8');
  } catch (error) {
    // we do not care if we cannot read the file
  }

  return apiClient(superagent.post(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/addRootRaml').send(rootRaml), token);
}

function createFolders(baseUri, token, apiId, versionId, fileInfo) {
  var folderMap = {};

  folderMap[fileInfo.root] = null;

  return Promise.reduce(fileInfo.folders, function(total, folderName){
        var parent = path.dirname(folderName);
        var name   = path.basename(folderName);

        return addFolder(baseUri, token, apiId, versionId, name, folderMap[parent])
          .then(function (folder){
            folderMap[parent + '/' + name] = folder.id;
          })
          ;
      },
      0)
    .then(function (){
      return folderMap;
    })
    ;

}

function createFiles(baseUri, token, apiId, versionId, fileInfo, folderMap) {
  return Promise.reduce(fileInfo.files, function(total, filePath){
        var parent = path.dirname(filePath);
        var name   = path.basename(filePath);

        return addFile(baseUri, token, apiId, versionId, filePath, name, folderMap[parent])
          .then(function (folder){
            folderMap[parent + '/' + name] = folder.id;
          })
          ;
      },
      0)
    .then(function (){
      return folderMap;
    })
    ;
}

function addFolder(baseUri, token, apiId, versionId, folderName, parentId) {
  var folder = {
    apiId:        apiId,
    apiVersionId: versionId,
    isDirectory:  true,
    name:         folderName
  };

  if (parentId) {
    folder.parentId = parentId;
  }

  return apiClient(superagent.post(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files').send(folder), token);
}

function addFile(baseUri, token, apiId, versionId, filePath, name, parentId) {
  var file = {
    apiId:        apiId,
    apiVersionId: versionId,
    isDirectory:  false,
    name:         name,
    data:         fs.readFileSync(filePath, 'utf8')
  };

  if (parentId) {
    file.parentId = parentId;
  }

  return apiClient(superagent.post(baseUri + '/repository/apis/' + apiId + '/versions/' + versionId + '/files').send(file), token)
    .catch(function (error){
      if (error.body.name === 'ConflictError') {
        // swallow these
        return Promise.resolve('')
      }

      return Promise.reject(error);
    });

}

function apiClient(request, token) {
  return promisifyRequest(request.set('Authorization', 'Bearer ' + token));
}

function promisifyRequest(request) {
  return new Promise(function (resolve, reject) {
    request.end(function (err, res) {
      if (err || res.error) {
        if (res.error && res.body) {
          res.error.body = res.body;
        }

        return reject(err || res.error);
      }

      return resolve(res.body);
    });
  });
}
