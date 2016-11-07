// Licensed under the Apache License, Version 2.0 (the 'License'); you may not
// use this file except in compliance with the License. You may obtain a copy of
// the License at
//
//   http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an 'AS IS' BASIS, WITHOUT
// WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied. See the
// License for the specific language governing permissions and limitations under
// the License.

var express = require('express')
   , db    = require('nano')('http://localhost:5984/my_couch')
   , app     = module.exports = express()
   ;

app.get('/', function(req, res) {
   db.get('foo', function (error, body, headers) {
      if(error) {
         res.status(error.statusCode);
         return res.send(error.message); 
      }
      res.status(200);
      res.send(body);
   });
});

app.listen(3333);
console.log('server is running. check expressjs.com for more cool tricks');
