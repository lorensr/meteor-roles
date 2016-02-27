"use strict"

Meteor.loginWithToken = function (accessToken, cb) {
  var loginRequest = {'alanning:roles/accessToken': accessToken}

  Accounts.callLoginMethod({
    methodArguments: [loginRequest],
    userCallback: cb
  })

}) // end Meteor.loginWithToken
