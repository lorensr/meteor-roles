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
    'services.roles.accessTokens': {
      $elemMatch: {hashedToken: hashedToken}
    }
  }

  user = Meteor.users.findOne({
    'services.roles.accessTokens.hashedToken': hashedToken
  }, fields)

  if (!user)
    throw new Meteor.Error('alanning:roles/token-not-found')

  accessToken = new AccessToken(user.services.roles.tokens[0])

  if (accessToken.isExpired())
    throw new Meteor.Error('alanning:roles/token-expired',
                           accessToken.expirationReason())

  if (accessToken.isRestricted())
    Roles._restrictAccess(accessToken)

  return {userId: user._id}
})
