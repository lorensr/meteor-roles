"use strict"


/**
 * Roles collection documents consist only of an id and a role name.
 *   ex: { _id: "123", name: "admin" }
 */
if (!Meteor.roles) {
  Meteor.roles = new Mongo.Collection("roles")

  // Create default indexes for roles collection
  Meteor.roles._ensureIndex('name', {unique: 1})
}


/**
 * Publish logged-in user's roles so client-side checks can work.
 *
 * Use a named publish function so clients can check `ready()` state.
 */
Meteor.publish('_roles', function () {
  var loggedInUserId = this.userId,
      fields = {roles: 1}

  if (!loggedInUserId) {
    this.ready()
    return
  }

  return Meteor.users.find({_id: loggedInUserId},
                           {fields: fields})
})


_.extend(Roles, {

  generateAccessToken: function (user, type, group) {
    var stampedToken,
        hashStampedToken,
        update

    check(user, Match.OneOf(String, Object))
    check(type, String)
    check(group, Match.Optional(String))

    if ('string' === typeof user) {
      user = Meteor.users.findOne(
               {_id: user},
               {fields: {
                 roles: 1,
                 'services.accessTokens': 1}})
      if (!user)
        throw new Error ("Roles error: user not found")
    } else if ('object' !== typeof user) {
      throw new Error ("Roles error: invalid user argument")
    }

    if (!Roles._accessTokenTypes[type])
      throw new Error ("Roles error: unrecognized type")

    if (group) {
      if ('$' === group[0])
        throw new Error ("Roles error: groups can not start with '$'")

      // convert any periods to underscores
      group = group.replace('.', '_')
    }

    stampedToken = Accounts._generateStampedLoginToken()
    hashStampedToken = Accounts._hashStampedToken(stampedToken)
    hashStampedToken.type = type
    if group
      hashStampedToken.group = group

    if (user.services.accessTokens)
      update = {
        $push: {
          'services.accessTokens.tokens': hashStampedToken
        }
      }
    else
      update = {
        $set: {
          'services.accessTokens.tokens': [hashStampedToken]
        }
      }

    Meteor.users.update(user._id, update)

    return stampedToken.token
  } // end generateAccessToken

  _restrictAccess: function (user, token) {
    var type,
        config,
        group,
        update

    check(user, Object)
    check(token, AccessToken)

    config = token.getTypeConfig()
    group = token.group

    if (config.only) {
      newRoles = config.only
    } else {
      oldRoles = Roles.getFullRolesForUser(user, group)
      newRoles = _.difference(oldRoles, config.except)
    }

    update = Roles._update_$set_fn(newRoles, group)

    if (!user.fullRoles)
      update.$set.fullRoles = user.roles

    Meteor.users.update(user._id, update)
  } // end _restrictAccess

} // end _.extend(Roles, ...)
