var Promise    = require('bluebird');
var superagent = require('superagent');

module.exports = {
	authenticate: authenticate
};

function authenticate(baseUri, username, password) {
	return promisifyRequest(superagent.post(baseUri + '/login')
	      .send({
	        username: username,
	        password: password
	      })
	    )
			.then(function (secInfo){
				return secInfo.access_token;
			})
			;
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
