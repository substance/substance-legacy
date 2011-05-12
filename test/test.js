var crypto = require('crypto');

var encryptPassword = function (password) {
  var hash = crypto.createHash('sha256');
  hash.update(password);
  return hash.digest('hex');
}

console.log(encryptPassword('be2e60A6f')); // => 3fb3806c2757e02ae6a742adc001b6385ae8fce0849fc483379fc3eaf63abfd6
