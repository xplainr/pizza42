const express = require('express');
const app = express();
const jwt = require('express-jwt');
const jwtAuthz = require('express-jwt-authz');
const jwksRsa = require('jwks-rsa');
const cors = require('cors');
const port = process.env.PORT || 8000;

var AUTH0_AUDIENCE = 'http://localhost:3001/api'
var AUTH0_DOMAIN = 'xplainr.auth0.com'


app.use(cors());

const checkJwt = jwt({
    // Dynamically provide a signing key based on the kID in the header and the singing keys provided by the JWKS endpoint.
    secret: jwksRsa.expressJwtSecret({
        cache: true,
        rateLimit: true,
        jwksRequestsPerMinute: 5,
        jwksUri: `https://xplainr.auth0.com/.well-known/jwks.json`
    }),

    // Validate the audience and the issuer.
    audience: AUTH0_AUDIENCE,
    issuer: `https://xplainr.auth0.com/`,
    algorithms: ['RS256']
});

//Left for posterity, useful if custom scopes are needed
//const checkScopes = jwtAuthz([ 'read:messages' ]);
//const checkScopesAdmin = jwtAuthz([ 'write:messages' ]);


//Left for posterity, not needed
//app.get('/api/public', function(req, res) {
//    res.json({ message: "Hello from a public endpoint! You don't need to be authenticated to see this. Try api/token and you'll get refused" });
//});

//Proxy to securely get token for Management API to pull full profile in app.js without exposing client secret
app.get('/api/token', checkJwt, function(req, res) {
    var request = require("request");
    var options = {
        method: 'POST',
        url: 'https://xplainr.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: {
            grant_type: 'client_credentials',
            client_id: '',
            client_secret: '',
            audience: 'https://xplainr.auth0.com/api/v2/'
        },
        json: true
    };

    request(options, function(error, response, body) {
        if (error) throw new Error(error);

        message = body
        res.json(message);
    });
});

// serve static assets normally
app.use(express.static(__dirname + '/public'));

app.get('*', function(req, res) {
    const index = path.join(__dirname, 'public', 'index.html');
    res.sendFile(index);
});

app.listen(port);
console.log("Listening on port " + port);