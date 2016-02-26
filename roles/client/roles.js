;(function () {

_.extend(Roles, {

  loginWithToken: function (token, cb) {
    Meteor.call('alanning:roles/loginWithToken', token, function (e, userId) {
      if (!e)
        Meteor.connection.setUserId(userId)

      cb(e, userId)
    })
  } // end loginWithToken

}) // end _.extend(Roles ...)

}());
