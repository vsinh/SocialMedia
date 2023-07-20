const express = require('express')

const router = express.Router({ mergeParams: true })
const authController = require('../controllers/authController')
const storyController = require('../controllers/storyController')
const s3Controller = require('../controllers/s3Controller')

const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage })

router
    .route('')
    .get(authController.isUser, storyController.getAllStoryOfAUser)
    .post(
        authController.isUser,
        authController.isOwnerOfThePath,
        upload.any(),
        s3Controller.uploadStoryFiles
    )

router
    .route('/:storyId')
    .patch(authController.isUser, storyController.toggleLikeStory)
    .delete(
        authController.isUser,
        authController.isOwnerOfThePath,
        storyController.deleteStory
    )

module.exports = router
