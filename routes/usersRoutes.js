const express = require('express')
const usersController = require('../controllers/usersController')
const authController = require('../controllers/authController')
const chatController = require('../controllers/chatController')
const friendController = require('../controllers/friendController')
const s3Controller = require('../controllers/s3Controller')

const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = express.Router({ mergeParams: true })
router.route('/:userId/follow').post(usersController.followUserById)
router.route('/:userId/unfollow').post(usersController.unfollowUserById)

router
    .route('/u/:userEmail')
    .get(authController.isUser, usersController.getUserByEmail)

router
    .route('/:userId/profile-image')
    .post(
        authController.isUser,
        authController.isOwnerOfThePath,
        upload.single('image'),
        s3Controller.uploadProfileImage
    )

router
    .route('/:userId/background-image')
    .post(
        authController.isUser,
        authController.isOwnerOfThePath,
        upload.single('image'),
        s3Controller.uploadBackgroundImage
    )

router
    .route('/:userId/friend')
    .get(
        authController.isUser,
        authController.isOwnerOfThePath,
        usersController.getAllFriends
    )

router
    .route('/:userId/friend-recommend')
    .get(
        authController.isUser,
        authController.isOwnerOfThePath,
        friendController.recommendFriends
    )

router
    .route('/:userId/friend/:unfriendUserId')
    .delete(
        authController.isUser,
        authController.isOwnerOfThePath,
        friendController.unfriend
    )

router
    .route('/:userId/chatroom')
    .get(
        authController.isUser,
        authController.isOwnerOfThePath,
        chatController.getAllChatRooms
    )

router
    .route('/:userId')
    .get(usersController.getUserById)
    .put(
        authController.isUser,
        authController.isOwnerOfThePath,
        usersController.updateUserById
    )

module.exports = router
