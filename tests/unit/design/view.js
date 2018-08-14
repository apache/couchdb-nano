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

'use strict'

const viewDesign = require('../../helpers/unit').unit([
  'view',
  'view'
])

viewDesign('alice', 'by_id', {
  keys: ['foobar', 'barfoo'],
  'include_docs': true
}, {
  body: '{"keys":["foobar","barfoo"]}',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json'
  },
  method: 'POST',
  qs: {
    'include_docs': true
  },
  uri: '/mock/_design/alice/_view/by_id'
})

viewDesign('alice', 'by_id', {
  queries: [{keys: ['foobar', 'barfoo']}, {limit: 3, skip: 2}],
  include_docs: true
}, {
  body: '{"queries":[{"keys":["foobar","barfoo"]},{"limit":3,"skip":2}]}',
  headers: {
    accept: 'application/json',
    'content-type': 'application/json'
  },
  method: 'POST',
  qs: {
    'include_docs': true
  },
  uri: '/mock/_design/alice/_view/by_id'
})
