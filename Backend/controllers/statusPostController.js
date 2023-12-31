const jwt = require('jsonwebtoken')
const s3Controller = require('./s3Controller')

const AppError = require('../utils/AppError')
const asyncCatch = require('../utils/asyncCatch')
const User = require('../models/User')
const StatusPost = require('../models/StatusPost')
const JWTBlacklist = require('../models/JWTBlacklist')
const socketIO = require('../socket/socket')
const Notification = require('../models/Notification')

const getUserIdFromJWT = async (req, next) => {
    if (
        !req.headers.authorization ||
        !req.headers.authorization.startsWith('Bearer')
    )
        return next(new AppError('Missing authorization header', 401))

    const token = req.headers.authorization.split(' ')[1]
    if (!token) return next(new AppError('Missing JWT token', 401))

    const freshToken = await JWTBlacklist.findOne({ jwtData: token })
    if (freshToken)
        return next(
            new AppError('Invalid request, this token is already revoked', 401)
        )

    jwt.verify(token, process.env.JWT_SECRET)
    const data = jwt.decode(token)
    return data.id
}

exports.getStatusPostById = asyncCatch(async (req, res, next) => {
    const { statusPostId } = req.params
    const statusPost = await StatusPost.findById(statusPostId).populate(
        'author',
        '_id name profileImagePath workingPlace'
    )

    if (!statusPost)
        return next(
            new AppError(
                `Unable to find the status post or invalid status post's id`,
                500
            )
        )

    // userId is the current request user, the author is post's owner
    const userId = await getUserIdFromJWT(req, next)
    const isLiked = statusPost.likedUsers.includes(userId)
    const postObject = statusPost.toObject()
    postObject.isLiked = isLiked
    delete postObject.likedUsers

    res.status(200).json(postObject)
})

exports.getAllStatusPostsOfAUser = asyncCatch(async (req, res, next) => {
    const { userId: authorId } = req.params
    const author = await User.findById(authorId)
    if (!author) return next(new AppError('Unable to find this user', 404))
    const statusPostsRaw = await StatusPost.find({
        author: authorId,
    }).populate('author', '_id name profileImagePath workingPlace')

    // userId is the current request user, the author is post's owner
    const userId = await getUserIdFromJWT(req, next)
    const statusPosts = statusPostsRaw.map((post) => {
        const isLiked = post.likedUsers.includes(userId)
        const postObject = post.toObject()
        postObject.isLiked = isLiked
        delete postObject.likedUsers
        return postObject
    })

    res.status(200).json(statusPosts)
})

exports.updateStatusPostById = asyncCatch(async (req, res, next) => {
    const { description } = req.body
    const { statusPostId } = req.params

    // TODO: Should have a feature to update media-files
    const updatedPost = await StatusPost.findByIdAndUpdate(
        statusPostId,
        { description: description },
        {
            new: true,
            runValidators: true,
        }
    )

    if (!updatedPost)
        return next(new AppError('Unable to update status post', 500))

    res.status(200).json(updatedPost)
})

exports.toggleLikeStatusPost = asyncCatch(async (req, res, next) => {
    const { statusPostId } = req.params
    const userId = await getUserIdFromJWT(req, next)

    const post = await StatusPost.findById(statusPostId)
    if (!post) return next(new AppError('Unable to find the status post', 500))

    const indexOfTheLiked = post.likedUsers.indexOf(userId)
    if (indexOfTheLiked === -1) {
        post.likedUsers.push(userId)
        post.likeCount += 1
    } else {
        post.likedUsers.splice(indexOfTheLiked, 1)
        post.likeCount -= 1
    }

    post.markModified('likedUsers')
    await post.save()

    res.status(204).end()
})

exports.deleteStatusPostById = asyncCatch(async (req, res, next) => {
    const { statusPostId } = req.params

    const deletedPost = await StatusPost.findByIdAndDelete(statusPostId)
    if (!deletedPost)
        return next(
            new AppError('Invalid status post id or already removed', 400)
        )

    deletedPost.mediaFiles.forEach((mediaFile) =>
        s3Controller.deleteMediaFile(mediaFile.location)
    )

    res.status(204).end()
})

exports.getNewsFeed = asyncCatch(async (req, res, next) => {
    const { userId } = req.params
    const { page } = req.query
    const user = await User.findById(userId)

    const newsFeed = await StatusPost.find({
        author: { $in: user.followings },
    })
        .sort('-createdAt') // Sort by descending createdAt
        .skip(page * 7)
        .limit(7)
        .populate('author', '_id name profileImagePath workingPlace')

    const randomTopPosts = await StatusPost.find({
        $and: [
            { author: { $nin: user.followings } },
            { _id: { $nin: newsFeed.map((feed) => feed._id) } },
        ],
    })
        .sort({ likeCount: -1 })
        .skip(page * 3)
        .limit(3)
        .populate('author', '_id name profileImagePath workingPlace')

    randomTopPosts.forEach((post) => newsFeed.push(post))

    res.status(200).json(newsFeed)
})
