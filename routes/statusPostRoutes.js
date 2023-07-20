const express = require('express')

const router = express.Router({ mergeParams: true })
const authController = require('../controllers/authController')
const statusPostController = require('../controllers/statusPostController')
const s3Controller = require('../controllers/s3Controller')

const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } })

router
    .route('')
    .get(authController.isUser, statusPostController.getAllStatusPostsOfAUser)
    .post(
        authController.isUser,
        authController.isOwnerOfThePath,
        upload.any(),
        s3Controller.uploadPostFiles
    )

router
    .route('/:statusPostId')
    .patch(authController.isUser, statusPostController.toggleLikeStatusPost)
    .put(
        authController.isUser,
        authController.isOwnerOfThePath,
        statusPostController.updateStatusPostById
    )
    .delete(
        authController.isUser,
        authController.isOwnerOfThePath,
        statusPostController.deleteStatusPostById
    )

module.exports = router
