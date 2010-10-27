// var RemoteSession = function() {
//   return {
//     get: function(id) {
//       console.log('getting a document');
//     },
//     create: function() {
//       // create a new document on the server and return the _id
//     },
//     update: function(document) {
//       // updates a document on the server and creates a new _rev
//       console.log('saving');
//     }
//   }
// };

// var db = new RemoteSession();
// 
// console.log('doink');
// $.ajax({
//   type: 'GET',
//   dataType: 'json',
//   url: 'http://localhost:5984' ,
//   success: function(data) {
//     console.log('yay')
//   }
// });

// Initializes property editors for property types. 
// The default editor just uses a text input field
// var PropertyEditors = {
//   default: function(editor, node, propertyKey, propertyValue) {
//     
//     console.log('jo');
//   },
//   text: function() {
//     
//   }
// }
