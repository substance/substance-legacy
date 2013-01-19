// RedisDocStore Testsuite
// ===================
// 
// Execute, by openening the Composer and navigating to the corresponding URL manually
// document.location.href = "file:///Users/michael/projects/composer/build/app/osx/Substance.app/Contents/Assets/index.html"
// 

// Cleanup
// -------------------

// TODO: Reset Database instead?
redisstore.delete(doc1.id);

// Doc Creation
// -------------------

console.log('Testing document creation ...\n==================');
redisstore.create(doc1.id);

console.log("Doc1, just stored: "+redisstore.get(doc1.id));

// Doc Updates
// ===================

console.log('Testing document updates ...\n==================');

redisstore.update(doc1.id, doc1Commits);

console.log("Doc1, just updated: ", redisstore.get(doc1.id));


// Unicode Chars
// ===================

console.log('Testing Unicode character insertion ...\n==================');

// Insert Unicode character
var ops = [
  {
    "op": [
      "insert",
      {
        "id": "text:42c72d87e40f529dba27a9970c0a6ef3",
        "type": "text",
        "data": {
          "content": "Hello — world!"
        }
      }
    ],
    "sha": "commit-3000",
    "parent": "80895d15d6b6eca5733af79cc0f74b1b"
  }
];

redisstore.update(doc1.id, ops);

console.log("Doc1, with unicode char: ", redisstore.get(doc1.id));