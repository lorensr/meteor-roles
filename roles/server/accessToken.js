"use strict"

function AccessToken (token) {
  if (!token.hashedToken || !token.when || !token.type)
    throw new Meteor.Error('alanning:roles/access-token-missing-field')

  _.extend(this, token)
}

AccessToken.prototype.getTypeConfig = function() {
  return Roles._accessTokenTypes[this.type]
}

AccessToken.prototype.expirationInSeconds = function() {
  return this.getTypeConfig().expirationInSeconds ||
    Roles._defaultAccessTokenExpirationInSeconds
}

AccessToken.prototype.expiresAt = function() {
  var expirationInMilliseconds = this.expirationInSeconds() * 1000
  return this.when + expirationInMilliseconds
}

AccessToken.prototype.isExpired = function() {
  var now = new Date()
  return this.expiresAt() > now
}

AccessToken.prototype.expirationReason = function() {
  var reason = 'This '
        + this.type
        + ' access token has a '
        + this.expirationInSeconds()
        + '-second expiry, and expired at '
        + this.expiresAt()
  return reason
}

AccessToken.prototype.isRestricted = function() {
  var typeConfig = this.getTypeConfig()
  return typeConfig.only || typeConfig.except
}
