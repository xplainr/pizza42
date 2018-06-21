$('document').ready(function() {
    var content = $('.content');
    var loadingSpinner = $('#loading');
    content.css('display', 'block');
    loadingSpinner.css('display', 'none');
    var loginStatus = $('.container h4');

    var userProfile;
    var apiUrl = '/api';
    var requestedScopes = 'openid profile offline_access email gender';
    var otherScopes = "contacts.readonly userinfo.profile email"

    var AUTH0_CLIENT_ID = 'j';
    var AUTH0_DOMAIN = 'xplainr.auth0.com';
    var AUTH0_AUDIENCE = 'http://localhost:3001/api';
    var AUTH0_CALLBACK_URL = location.href;

    //Create webAuth instance
    var webAuth = new auth0.WebAuth({
        domain: AUTH0_DOMAIN,
        clientID: AUTH0_CLIENT_ID,
        redirectUri: AUTH0_CALLBACK_URL,
        audience: AUTH0_AUDIENCE,
        responseType: 'token id_token',
        scope: requestedScopes,
        connectionScopes: otherScopes,
        leeway: 60
    });


    //Buttons and view definititions
    var homeView = $('#home-view');
    var profileView = $('#profile-view');
    var pizzaView = $('#pizza-view');
    var getPizzaView = $('#get-pizza-view');


    var loginBtn = $('#qsLoginBtn');
    var logoutBtn = $('#qsLogoutBtn');

    var homeViewBtn = $('#btn-home-view');
    var profileViewBtn = $('#btn-profile-view');
    var orderPizzaViewBtn = $('#btn-order-pizza-view');


    var orderPizzaBtn = $('#btn-order-pizza');

    var pizzaMessage = $('#pizza-message');
    var getPizzaMessage = $('#get-pizza-message');

    //Event listeners for buttons
    orderPizzaBtn.click(function() {
        getPizzaView.css('display', 'inline-block');
        callTokenAPI('/token', true, 'GET', function(err, message) {
            if (err) {
                alert(err);
                return;
            }
            localStorage.setItem('manage_token', message.access_token);
            getFullProfile()
        });
    });


    loginBtn.click(login);
    logoutBtn.click(logout);

    homeViewBtn.click(function() {
        homeView.css('display', 'inline-block');
        profileView.css('display', 'none');
        getPizzaView.css('display', 'none');


    });

    profileViewBtn.click(function() {
        homeView.css('display', 'none');
        getPizzaView.css('display', 'none');
        profileView.css('display', 'inline-block');
        getProfile();
    });

    orderPizzaViewBtn.click(function() {
        homeView.css('display', 'none');
        profileView.css('display', 'none');
        getPizzaView.css('display', 'inline-block');
        pizzaView.css('display', 'none');
        orderPizzaBtn.css('display', 'inline-block');
        getPizzaMessage.text('Get your 42 inch Pizza!');

    });

    //Functions for buttons
    function login() {
        webAuth.authorize();
    }

    function logout() {
        // Remove tokens, profile data, and expiry time from localStorage
        localStorage.removeItem('access_token');
        localStorage.removeItem('id_token');
        localStorage.removeItem('expires_at');
        localStorage.removeItem('scopes');
        localStorage.removeItem('user_id');
        localStorage.removeItem('email_verified');
        localStorage.removeItem('userId');
        localStorage.removeItem('manage_token');
        localStorage.removeItem('gToken');
        localStorage.removeItem('gUserId');
        localStorage.removeItem('manage_token');
        getPizzaView.css('display', 'none');
        loginStatus.text('You are not logged in! Please log in to continue.');
        displayButtons();
    }

    function displayButtons() {

        if (isAuthenticated()) {
            loginBtn.css('display', 'none');
            logoutBtn.css('display', 'inline-block');
            profileViewBtn.css('display', 'inline-block');

        } else {
            homeView.css('display', 'inline-block');
            loginBtn.css('display', 'inline-block');
            logoutBtn.css('display', 'none');
            profileViewBtn.css('display', 'none');
            profileView.css('display', 'none');
            getPizzaView.css('display', 'none');
            orderPizzaViewBtn.css('display', 'none');
            loginStatus.text('You are not logged in! Please log in to continue.');
        }

        if (localStorage.getItem('email_verified') == 'false') {
            orderPizzaViewBtn.css('display', 'none');
            getPizzaView.css('display', 'none');;
            loginStatus.text(
                'You are logged in! But you need to verify your email before you can order pizza.'
            );
        }
        if (isAuthenticated() && localStorage.getItem('email_verified') == 'true') {
            orderPizzaViewBtn.css('display', 'inline-block');
            getPizzaView.css('display', 'none');
            loginStatus.text(
                'You are logged in, and your email is verified! You can now order pizza!'
            );
        }
    }

    // Check whether the current time is past the access token's expiry time
    function isAuthenticated() {
        var expiresAt = JSON.parse(localStorage.getItem('expires_at'));
        return new Date().getTime() < expiresAt;
    }
    //Call users endpoint of API v2 for full profile
    function getFullProfile() {
        var baseURL = "https://xplainr.auth0.com/api/v2/users/"

        var user = localStorage.getItem('userId');
        var userId = user;
        url = baseURL + userId;
        var manage_token = localStorage.getItem('manage_token');
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": url,
            "method": "GET",
            "headers": {
                "content-type": "application/json",
                "authorization": "Bearer " + manage_token
            }
        }
        $.ajax(settings).done(function(response) {

            //Check if they have a google account associated with their username/password login
            if (response.identities[0].connection == "Username-Password-Authentication" && !response.identities[1]) {
                getPizzaMessage.text('Order successful!');
                pizzaMessage.text('Enjoy your 42 inch pizza!');
                orderPizzaBtn.css('display', 'none');
                pizzaView.css('display', 'inline-block');
                userProfile = response
            }

            //Get and set google access token even if it is the second account merged into their profile
            else {
                googleAccessToken = response.identities[0].access_token
                if (!googleAccessToken) {
                    googleAccessToken = response.identities[1].access_token
                    googleUserId = response.identities[1].user_id
                    userProfile = response

                } else {
                    googleAccessToken = response.identities[0].access_token
                    googleUserId = response.identities[0].user_id
                }
                localStorage.setItem('gToken', googleAccessToken);
                localStorage.setItem('gUserId', googleUserId);
                userProfile = response
                getGoogleContacts()
            }
        });
    };

    function getGoogleContacts() {
        var baseURL = "https://people.googleapis.com/v1/people/me/connections/?personFields=emailAddresses"
        var gToken = localStorage.getItem('gToken');
        var user = localStorage.getItem('gUserId');
        var uSplit = user.split(/\|/);
        var userId = uSplit[1];
        var url = baseURL
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": url,
            "method": "GET",
            "headers": {
                "content-type": "application/json",
                "authorization": "Bearer " + gToken
            }
        }
        $.ajax(settings).done(function(response) {
            //google includes authenticted user in their contact count, so removing 1 from count
            count = response.totalItems;
            total = count - 1;
            nan = (total !== total);

            //Solving for edge case where gSuite hosted emails don't allow contacts to be pulled, and preventing from setting NaN in user meta
            if (!nan) {
                localStorage.setItem('contactCount', total);
                setContactCount()
            } else {
                console.log(nan);
                pizzaView.css('display', 'inline-block');
                orderPizzaBtn.css('display', 'none');
                pizzaMessage.text('Enjoy your 42 inch pizza with your friends!');
                getPizzaMessage.text('Order successful!');
            }
        });
    };

    //Add their total number of contacts to their profile in Auth0
    function setContactCount() {
        var baseURL = "https://xplainr.auth0.com/api/v2/users/"
        var user = localStorage.getItem('userId');
        var totalContacts = localStorage.getItem('contactCount');
        var userId = user;
        var url = baseURL + userId;
        var manage_token = localStorage.getItem('manage_token');
        var data = { "user_metadata": { "total_contacts": totalContacts } };
        var json = JSON.stringify(data);
        var settings = {
            "async": true,
            "crossDomain": true,
            "url": "https://xplainr.auth0.com/api/v2/users/" + userId,
            "method": "PATCH",
            "headers": {
                "authorization": "Bearer " + manage_token,
                "content-type": "application/json"
            },
            "processData": false,
            "data": json
        }
        $.ajax(settings).done(function(response) {
            userProfile = response
            getPizzaMessage.text('Order successful!');
            pizzaMessage.text('Enjoy your 42 inch pizza with your ' + totalContacts + ' friends!');
            orderPizzaBtn.css('display', 'none');
            pizzaView.css('display', 'inline-block');
        });
    };

    function setSession(authResult) {
        // Set the time that the access token will expire at
        var expiresAt = JSON.stringify(
            authResult.expiresIn * 1000 + new Date().getTime()
        );

        // If there is a value on the `scope` param from the authResult,
        // use it to set scopes in the session for the user. Otherwise
        // use the scopes as requested. If no scopes were requested,
        // set it to nothing... Left this for posterity, later utility...
        const scopes = authResult.scope || requestedScopes || '';


        localStorage.setItem('access_token', authResult.accessToken);
        localStorage.setItem('id_token', authResult.idToken);
        localStorage.setItem('expires_at', expiresAt);
        localStorage.setItem('scopes', JSON.stringify(scopes));
        localStorage.setItem('email_verified', authResult.idTokenPayload.email_verified);

        getProfileSilent()

    }
    //Gets the users profile on demand
    function getProfile() {
        if (!userProfile) {
            var accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                console.log('Access token must exist to fetch profile');
            }

            webAuth.client.userInfo(accessToken, function(err, profile) {
                if (profile) {
                    userProfile = profile;
                    displayProfile();
                }
            });
        } else {
            displayProfile();
        }
    }

    //Silently gets user ID from their profile after authentication/authorization
    function getProfileSilent() {
        if (!userProfile) {
            var accessToken = localStorage.getItem('access_token');

            if (!accessToken) {
                //console.log('Access token must exist to fetch profile');
            }

            webAuth.client.userInfo(accessToken, function(err, profile) {
                if (profile) {
                    userProfile = profile;
                    var userId = userProfile.sub
                    localStorage.setItem('userId', userId);
                }
            });
        } else {}
    }

    //Displays whatever is stored in userProfile variable, initially basic profile then full profile on order completion

    function displayProfile() {
        //Format and display the profile bits
        $('#profile-view .nickname').text(userProfile.nickname);
        $('#profile-view .full-profile').text(JSON.stringify(userProfile, null, 2));
        $('#profile-view img').attr('src', userProfile.picture);
    }

    function handleAuthentication() {
        webAuth.parseHash(function(err, authResult) {
            if (authResult && authResult.accessToken && authResult.idToken) {
                window.location.hash = '';
                setSession(authResult);
                loginBtn.css('display', 'none');
                homeView.css('display', 'inline-block');
            } else if (err) {
                homeView.css('display', 'inline-block');
                console.log(err);
                alert(
                    'Error: ' + err.error + '. Check the console for further details.'
                );
            }
            displayButtons();
        });
    }

    //Not used, maintained for posterity
    function userHasScopes(scopes) {
        var savedScopes = JSON.parse(localStorage.getItem('scopes'));
        if (!savedScopes) return false;
        var grantedScopes = savedScopes.split(' ');
        for (var i = 0; i < scopes.length; i++) {
            if (grantedScopes.indexOf(scopes[i]) < 0) {
                return false;
            }
        }
        return true;
    }

    handleAuthentication();

    //Not used but incuded for posterity
    function callAPI(endpoint, secured, method, cb) {
        var url = apiUrl + endpoint;
        var accessToken = localStorage.getItem('access_token');

        var headers;
        if (secured && accessToken) {
            headers = { Authorization: 'Bearer ' + accessToken };
        }

        $.ajax({
                method: method,
                url: url,
                headers: headers
            })
            .done(function(result) {
                cb(null, result.message);
            })
            .fail(function(err) {
                cb(err);
            });
    }

    displayButtons();

    //Securely get a token for the user from backend API
    function callTokenAPI(endpoint, secured, method, cb) {
        var url = apiUrl + endpoint;
        var accessToken = localStorage.getItem('access_token');

        var headers;
        if (secured && accessToken) {
            headers = { Authorization: 'Bearer ' + accessToken };
        }

        $.ajax({
                method: method,
                url: url,
                headers: headers
            })
            .done(function(result) {
                cb(null, result);
            })
            .fail(function(err) {
                cb(err);
            });
    }

    displayButtons();
});