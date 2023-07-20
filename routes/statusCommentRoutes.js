const express = require('express')
const statusCommentController = require('../controllers/statusCommentController')
const authController = require('../controllers/authController')
const s3Controller = require('../controllers/s3Controller')

const multer = require('multer')

const storage = multer.memoryStorage()
const upload = multer({ storage })

const router = express.Router({
    mergeParams: true,
})

router
    .route('/')
    .get(
        authController.isUser,
        statusCommentController.getAllCommentsOfStatusPost
    )
    .post(
        authController.isUser,
        upload.single('media-file'),
        s3Controller.uploadCommentFile
    )

router
    .route('/:commentId')
    .put(authController.isUser, statusCommentController.toggleLikeComment)
    .delete(authController.isUser, statusCommentController.deleteComment)

module.exports = router
