// DBs
// Accounts
// _id - ObjectID
// username - String
// password - String
// salt - String
// email - String
// clientId - String
// clientSecret - String
// databases
//    name - String
//    ip - String
//    username - String
//    password - String
//    type - String

// Tokens
// _id - ObjectID
// accessToken - String
// accessTokenExpDate - Int (Unix Time) or Date
// refreshToken - String
// refreshTokenExpDate - Int (Unix Time) or Date
// userId - ObjectID


// Needs implementing
// getAccessToken (accessToken) -> Token Object (accessToken, [accessTokenExpDate], [scope], client(Object with client.id), user(Object))
// getClient (clientId, clientSecret) -> Client Object (id, redirectUrls(Array), grants(Array), [accessTokenLifetime - Number], [refreshTokenLifetime - Number])
// getRefreshToken (refreshToken) -> Refresh Token Object (refreshToken, [refreshTokenExpDate], [scope], client(Object with client.id), user(Object))
// getUser (username, password) -> User Object or falsy value
// saveToken (token, client(Object), user(Object)) -> Token Object (accessToken, accessTokenExpDate, refreshToken, refreshTokenExpDate, [scope - String], client(Object with client.id), user)

const client = {
    id: 'abc',
    secret: '123',
    redirectUris: ['http://localhost:5000'],
    grants: ['authorization_code', 'write']
};

const user = {
    id: 'jsmith',
    name: 'john'
};

let token = {
    accessToken: 'wasd',
    accessTokenExpDate: '123',
    refreshToken: 'qwerty',
    refreshTokenExpDate: '321'
}

module.exports = {
    getAccessToken: (accessToken) => {
        console.log('getAccessToken', accessToken);

        let token = {};
        token.accessToken = accessToken;
        token.client = client;
        token.user = user;

        return token;
    },
    getClient: (clientId, clientSecret) => {
        console.log('getClient', clientId, clientSecret);
        return client;
    },
    getRefreshToken: (refreshToken) => {
        console.log('getRefreshToken', refreshToken);
        return token;
    },
    getUser: (username, password) => {
        console.log('getUser', username, password);
        return user;
    },
    saveToken: (_token, client, user) => {
        console.log('saveToken', _token, client, user);

        token.accessToken = _token.accessToken;
        token.accessTokenExpDate = _token.accessTokenExpiresOn;
        token.refreshToken = _token.refreshToken;
        token.refreshTokenExpDate = _token.refreshTokenExpiresOn;

        let data = {};
        data.client = client.id;
        data.user = user.id;

        return data;
    },
    saveAuthorizationCode: (code, client, user) => {
        console.log('saveAuthorizationCode', code, client, user);
        return code;
    }
}
