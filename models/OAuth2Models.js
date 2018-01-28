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
