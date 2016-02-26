;(function () {

  "use strict";

  var users,
      roles = ['admin', 'editor', 'user']

  users = {
    'eve': {
      _id: 'eve',
      roles: ['admin', 'editor']
    },
    'bob': {
      _id: 'bob',
      roles: {
        'group1': ['user'],
        'group2': ['editor']
      }
    },
    'joe': {
      _id: 'joe',
      roles: {
        '__global_roles__': ['admin'],
        'group1': ['editor']
      }
    },
    'alice': {
      _id: 'alice',
      roles: {
        'group1': ['user'],
        'group2': ['user', 'editor']
      },
      fullRoles: {
        'group1': ['user', 'editor'],
        'group2': ['user', 'editor', 'admin']
      }
    }
  }

  function testUser (test, username, expectedRoles, group) {
    var user = users[username]

    // test using user object rather than userId to avoid mocking
    _.each(roles, function (role) {
      var expected = _.contains(expectedRoles, role),
          msg = username + ' expected to have \'' + role + '\' permission but does not',
          nmsg = username + ' had un-expected permission ' + role

      if (expected) {
        test.isTrue(Roles.userIsInRole(user, role, group), msg)
      } else {
        test.isFalse(Roles.userIsInRole(user, role, group), nmsg)
      }
    })
  }


  // Mock Meteor.user() for handlebars helper testing
  Meteor.user = function () {
    return users.alice
  }

  Tinytest.add(
    "roles - can check current user's roles via template helpers",
    function (test) {
      var isInRole,
          isInFullRole,
          expected,
          actual

      if (!Roles._handlebarsHelpers) {
        // probably running package tests outside of a Meteor app.
        // skip this test.
        return
      }

      isInRole = Roles._handlebarsHelpers.isInRole
      test.equal(typeof isInRole, 'function', "'isInRole' helper not registered")

      expected = true
      actual = isInRole('user', 'group1')
      test.equal(actual, expected)

      expected = false
      actual = isInRole('admin', 'group1')
      test.equal(actual, expected)

      expected = false
      actual = isInRole('unknown')
      test.equal(actual, expected)

      isInFullRole = Roles._handlebarsHelpers.isInFullRole
      test.equal(typeof isInFullRole, 'function', "'isInFullRole' helper not registered")

      expected = true
      actual = isInFullRole('user,editor', 'group1')
      test.equal(actual, expected)

      expected = false
      actual = isInFullRole('admin', 'group1')
      test.equal(actual, expected)

      expected = true
      actual = isInFullRole('admin', 'group2')
      test.equal(actual, expected)
    })

  Tinytest.add(
    'roles - can check if user is in role',
    function (test) {
      testUser(test, 'eve', ['admin', 'editor'])
    })

  Tinytest.add(
    'roles - can check if user is in role by group',
    function (test) {
      testUser(test, 'bob', ['user'], 'group1')
      testUser(test, 'bob', ['editor'], 'group2')
    })

  Tinytest.add(
    'roles - can check if user is in role with Roles.GLOBAL_GROUP',
    function (test) {
      testUser(test, 'joe', ['admin'])
      testUser(test, 'joe', ['admin'], Roles.GLOBAL_GROUP)
      testUser(test, 'joe', ['admin', 'editor'], 'group1')
    })

  Tinytest.add(
    'roles - can get all roles for user by group with periods in name',
    function (test) {
      Roles.addUsersToRoles(users.joe, ['admin'], 'example.k12.va.us')
      test.equal(Roles.getRolesForUser(users.joe, 'example.k12.va.us'), ['admin'])
    })

  Tinytest.addAsync(
    'roles - can login with token',
    function (test, next) {
      test.isNull(Meteor.userId())

      Roles.loginWithToken('a', function (e, userId) {
        test.isFalse(e)
        test.equal(userId, 'foo')
        test.equal(Meteor.userId(), 'foo')
        next()
      })
    })

}());
