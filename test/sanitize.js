var sanitize = require('../src/server/sanitize').sanitize
,   assert = require('assert');

assert.equal(sanitize('<a b="c"><d>lorem</d> ipsum </a>dolor'), 'lorem ipsum dolor');
assert.equal(sanitize('<a>lo>rem</a ipsum'), 'lo&gt;rem');
assert.equal(sanitize('<a b="c"><d>lorem</d> ipsum </a>dolor', {a:{}}), '<a>lorem ipsum </a>dolor');
assert.equal(sanitize('<a b="c"><d>lorem</d> ipsum </a>dolor', {a:{b:true}}), '<a b="c">lorem ipsum </a>dolor');
assert.equal(sanitize('<a b="c"><d>lorem</d> ipsum </a>dolor', {a:{b:true}}), '<a b="c">lorem ipsum </a>dolor');
assert.equal(sanitize('<a b="c"><d>lorem</d> ipsum </a>dolor', {a:{b:function (v){return v==='c'}}}), '<a b="c">lorem ipsum </a>dolor');
assert.equal(sanitize('<a b="x"><d>lorem</d> ipsum </a>dolor', {a:{b:function (v){return v==='c'}}}), '<a>lorem ipsum </a>dolor');
assert.equal(sanitize('" onclick="alert(true);'), '&quot; onclick=&quot;alert(true);');
assert.equal(sanitize("<a href='\" onclick=\"alert(true);'>", {a:{href:true}}), '<a href="&quot; onclick=&quot;alert(true);">');

console.log("All tests have completed successfully!");
