const jwt = require('jsonwebtoken')
const s3Controller = require('./s3Controller')

const AppError = require('../utils/AppError')
const asyncCatch = require('../utils/asyncCatch')
const User = require('../models/User')
const StatusPost = require('../models/StatusPost')
const StatusComment = require('../models/StatusComment')
const Notification = require('../models/Notification')

const socketIO = require('../socket/socket')

const getUserIdFromJWT = (req, next) => {
    //// GET THE USERID FROM AUTHORIZATION HEADER
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')
    )
        return next(new AppError('Missing authorization header', 401))

    const token = req.headers.authorization.split(' ')[1]
    const tokenData = jwt.decode(token)
    return tokenData.id
}

// exports.getCommentById = asyncCatch(async (req, res, next) => {
//     const { commentId } = req.params
//     const comment = await StatusComment.findById(commentId).populate(
//         'author',
//         '_id profileImagePath email'
//     )
//     if (!comment) return next(new AppError('Unable to get the comment', 500))

//     const userId = await getUserIdFromJWT(req, next)
//     const objectComment = comment.toObject()
//     if (comment.likedUsers.includes(userId)) objectComment.isLiked = true
//     else objectComment.isLiked = false
//     delete comment.likedUsers

//     res.status(200).json(comment)
// })

exports.deleteComment = asyncCatch(async (req, res, next) => {
    const { commentId, statusPostId } = req.params

    const deletedComment = await StatusComment.findByIdAndDelete(commentId)
    if (!deletedComment)
        return next(new AppError('Unable to remove the comment', 500))

    StatusPost.findById(statusPostId).then((query) => {
        query.commentCount -= 1
        query.save()
    })

    if (deletedComment.mediaFile)
        s3Controller.deleteMediaFile(deletedComment.mediaFile)
    res.status(204).end()
})

exports.toggleLikeComment = asyncCatch(async (req, res, next) => {
    const { commentId } = req.params

    const userId = await getUserIdFromJWT(req, next)
    if (!userId) return next(new AppError('Invalid user id', 400))

    const comment = await StatusComment.findById(commentId)

    const indexOfTheLiked = comment.likedUsers.indexOf(userId)
    if (indexOfTheLiked === -1) comment.likedUsers.push(userId)
    else comment.likedUsers.splice(indexOfTheLiked, 1)
    await comment.save()
    res.status(204).end()
})

exports.getAllCommentsOfStatusPost = asyncCatch(async (req, res, next) => {
    const { statusPostId } = req.params

    const userId = await getUserIdFromJWT(req, next)
    if (!userId) return next(new AppError('Invalid user id', 400))

    const comments = await StatusComment.find({
        statusPostId: statusPostId,
    }).populate('author', '_id name profileImagePath email workingPlace')

    const objectComments = comments.map((comment) => {
        const objectComment = comment.toObject()
        if (comment.likedUsers.includes(userId)) objectComment.isLiked = true
        else objectComment.isLiked = false
        delete comment.likedUsers
        return objectComment
    })

    res.status(200).json(objectComments)
})
