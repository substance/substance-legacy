<!DOCTYPE html>
<html>
  <head>
    <title>Substance</title>
    <link href='styles/fonts/open-sans/open-sans.css' rel='stylesheet' type='text/css'/>
    <link href='http://fonts.googleapis.com/css?family=Montserrat:400,700' rel='stylesheet' type='text/css'>
    <link href='styles/font-awesome.css' rel='stylesheet' type='text/css'/>

    <link href="styles/substance.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="styles/ken.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="styles/composer.css" media="screen" rel="stylesheet" type="text/css" />
    <link href="styles/console.css" media="screen" rel="stylesheet" type="text/css" />

    <!-- Templates -->
    <script type="text/html" name="substance">

      <!-- Substance Main Menu -->
      <div id="menu">
        <div class="views">
          <a href="#" class="toggle-view document"><i class="icon-edit"></i></a>
        </div>

        <div class="actions">
          <a href="#new" class="action new-document"><i class="icon-plus"></i></a>
          <a href="#tests" class="action testsuite" ><i class="icon-tasks"></i></a>
        </div>
      </div>

      <div id="container">

      </div>

      <!-- Temporary Canvas for image manipulation -->
      <canvas id="canvas" style="display: none;"></canvas>
    </script>

    <!-- Annotation Toggles -->
    <script type="text/html" name="annotation_toggles">
      <div class="annotation-toggles">
        <% if (link){ %>
          <div class="annotation-data">
            <input type="text" class="link-url" name="link-url" data-id="<%= link.id %>" value="<%= link.url %>"></input>
          </div>
        <% } %>
        <% _.each(annotations, function(a) { %>
          <a href="#" class="toggle <%= a.type %><%= a.active ? " active" : "" %> " data-type="<%= a.type %>" title="<%= a.description %>"></a>
        <% }) %>
        <div class="arrow-down"></div>
      </div>
    </script>

    <!-- Dashboard -->
    <script type="text/html" name="dashboard">
      <div id="dashboard">
        <div class="shelf">
          <div class="user">
            <div><%= session.user() %></div>
          </div>

          <!-- User-specific document collections -->
          <div class="collections">
            <% _.each(library.listCollections(), function(c) { %>
              <a href="#dashboard/<%= c.id %>" class="collection<%= c.id === library.collection.id ? ' active' : '' %>"><%= c.name %> <div class="count"><%= c.documents.length %></div></a>
            <% }); %>
          </div>
        </div>

        <div class="documents">

        </div>
      </div>
    </script>


    <!-- User Login -->
    <script type="text/html" name="login">
      <div id="login">
        <h1>Substance</h1>
        <form id="login_form" class="centered-form">
          <div class="error-message"></div>
          <div class="label">Username</div>
          <input type="text" name="username" id="login_username"/>
          <div class="label">Password</div>
          <input type="password" name="password" id="login_password"/>
          <input type="submit" id="login_submit" value="Login"/>

          <div class="sign-up">
            New to Substance? <a href="#signup">Signup</a>
          </div>
        </form>
      </div>
    </script>

    <!-- User Signup -->
    <script type="text/html" name="signup">
      <div id="login">
        <h1>Substance</h1>
        <form id="signup_form" class="centered-form">
          <div class="error-message"></div>
          <div class="label">Email</div>
          <input type="text" name="name" id="signup_email"/>

          <div class="label">Username</div>
          <input type="text" name="username" id="signup_username"/>

          <div class="label">Full Name</div>
          <input type="text" name="name" id="signup_name"/>

          <div class="label">Password</div>
          <input type="password" name="password" id="signup_password"/>

          <input type="submit" id="login_submit" value="Signup"/>

          <div class="sign-up">
            Already registered? <a href="#login">Login</a>
          </div>
        </form>
      </div>
    </script>

    <!-- Publications -->
    <script type="text/html" name="publications">
      <% _.each(document.entry.get('publications'), function(pub) { %>
        <div class="publication">
          <div class="publication-header">
            <i class="icon-smile"></i> <%= get(pub.network).name %>
            <div class="actions">
              <a href="#" class="create-version"><i class="icon-share"></i></a>
              <a href="#" class="delete-publication" data-id="<%= pub.id %>"><i class="icon-trash"></i></a>
            </div>
          </div>
          <div class="property">
            <div class="label">Creator</div>
            <div class="value"><%= get(pub.creator).name %></div>
          </div>
          <div class="property">
            <div class="label">Status</div>
            <div class="value">Confirmed</div>
          </div>
        </div>
      <% }); %>
      <a href="#" class="create-publication">Add Publication</a>
    </script>


    <!-- Document Collaborators -->
    <script type="text/html" name="document_collaborators">

      <div class="collaborators">
        <% _.each(document.entry.get('collaborators'), function(c) { %>
          <div class="collaborator">
            <%= c.name %>
            <a href="#" class="delete-collaborator" data-id="<%= c.id %>">Remove</a>
          </div>
        <% }); %>
      </div>

      <div class="add_collaborator">
        <a class="add_collaborator">Add Collaborator</a>
        <div class="add_collaborator_form">
          <input type="text" name="collaborator" id="new_collaborator"/>
          <a href="#" class="create-collaborator">Add</a>
        </div>
      </div>
    </script>


    <!-- Editor -->
    <script type="text/x-ejs-template" name="editor">

      <div class="document-settings shelf">
        <div class="meta">
          <div class="title"><%= "title" %></div>
          <div class="updated-at"><%= "updated_at" %></div>
        </div>

        <div class="label">Creator</div>
        <div class="creator">
          <div class="value"><%= "creator.name" %></div>
        </div>

        <div class="label">Collaborators</div>

        <div class="collaborators">

        </div>

        <!-- Publish Settings -->
        <div class="label">Publications</div>
        <div class="publications">

        </div>
      </div>

      <div id="document_wrapper">
        <div id="composer">
          <div id="tools"></div>
          <div id="document" contenteditable="false">

          </div>
        </div>
      </div>
      <div id="console_wrapper">

      </div>
    </script>

    <!-- Substance.Text Node -->
    <script type="text/x-ejs-template" name="text">
      <div class="content"></div>
    </script>

    <!-- Ken.Browser  -->
    <script type="text/x-ejs-template" name="browser">
      <div id="facets"></div>
      <div id="matrix" class="surface"></div>
      <div id="details"></div>
    </script>

    <!-- Ken.Item  -->
    <script type="text/x-ejs-template" name="item">
      <a href="#<%= item.id %>" class="item" id="<%= item.id %>" data-id="<%= item.id %>">
        <div class="inner">
          <div class="article-type">
            Article
            <div class="published_at">
              <% if (item.published_at) { %>
                <%= new Date(item.published_at).toDateString() %>
              <% } %>
            </div>
          </div>
          <% if (matches.length > 0) { %>
            <div class="markers">
              <% _.each(matches, function(match) { %>
                <div class="marker" style="background: <%= match.color %>"></div>
              <% }); %>
            </div>
          <% } %>
          <div class="name"><%= item.title.substr(0, 300) %></div>
          <div class="authors"><%= item.creator.name %></div>
        </div>
      </a>
    </script>

    <!-- Ken.Facets  -->
    <script type="text/x-ejs-template" name="facets">
      <% var count = 0; %>
      <% _.each(facets, function(f, key) { %>
        <div class="filter <%= key %>">
          <div class="filter-name"><%= f.name %></div>
          <div class="available-values">
            <% _.each(f.availableValues, function(val) { %>
              <a href="#" class="value <%= val.selected ? 'remove' : 'add' %><%= val.relatedObjects.length > 0 ? " related" : "" %>" data-property="<%= key %>" data-value="<%= val.val %>" style="background: <%= val.color %>">
                <%= val.val.toLowerCase().substr(0, 36) %>
                <span class="frequency"><%= val.objects.length %></span>
              </a>
            <% }); %>
          </div>
        </div>
      <% }); %>
    </script>

    <!-- Substance.TestCenter -->
    <script type="text/text/x-handlebars-template" name="test_center">
      <div class="test-suites">
        {{#each test_suites}}
          <a class="test-suite" href="#tests/{{name}}">
            {{name}}
          </a>
        {{/each}}
      </div>

      <div class="test-report">

      </div>

      <div class="test-output">

      </div>
    </script>

    <!-- Substance.TestReport -->
    <script type="text/text/x-handlebars-template" name="test_report">
      <h2>Subtance.{{name}}</h2>
      <div class="tests">
        {{#each tests}}
          <div class="test">
            <div class="name">{{name}}</div>
            <div class="actions">
              {{#each actions}}
                <div class="action {{#ifelse error "error" "success"}}{{/ifelse}}">
                  <div class="status">
                    <i class="{{#ifelse error "icon-frown" "icon-smile"}}{{/ifelse}}"></i>
                  </div>
                   {{label}}
                  <div class="duration">
                     15 ms
                  </div>
                </div>
              {{/each}}
            </div>
          </div>
        {{/each}}
      </div>
    </script>

    <!-- Substance.TestAction -->
    <script type="text/text/x-handlebars-template" name="test_action">
      <div class="label">

      </div>
    </script>

    <script src="lib/underscore.js"></script>
    <script src="lib/jquery.min.js"></script>
    <script src="lib/backbone.js"></script>
    <script src="lib/base64.js"></script>
    <script src="lib/jquery.timeago.js"></script>

    {{#each scripts}}
      <script type="text/javascript" src="/scripts{{this}}"></script>
    {{/each}}

    <script>
      var boot = require("/src/boot.js")
      var Substance = boot();
      Substance.render();
    </script>
  </head>
  <body>

  </body>
</html>
