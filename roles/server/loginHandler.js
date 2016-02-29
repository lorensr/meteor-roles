"use strict"

Accounts.registerLoginHandler(function (loginRequest) {
  var token,
      hashedToken,
      fields,
      user,
      accessToken

  token = loginRequest['alanning:roles/accessToken']

  if (!token)
    return undefined // don't handle

  check(token, String)

  hashedToken = Accounts._hashLoginToken token

  fields = {
    _id: 1,
    roles: 1,
    fullRoles: 1,
    'services.accessTokens.tokens': {
      $elemMatch: {hashedToken: hashedToken}
    }
  }

  user = Meteor.users.findOne({
    'services.accessTokens.tokens.hashedToken': hashedToken
  }, fields)

  if (!user)
    throw new Meteor.Error('alanning:roles/token-not-found')

  accessToken = new AccessToken(user.services.accessTokens.tokens[0])

  if (accessToken.isExpired())
    throw new Meteor.Error('alanning:roles/token-expired',
                           accessToken.expirationReason())

  if (accessToken.isRestricted())
    Roles._restrictAccess(user, accessToken)

  return {userId: user._id}
})
