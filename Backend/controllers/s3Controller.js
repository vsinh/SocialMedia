var admin = require('firebase-admin')
const asyncCatch = require('../utils/asyncCatch')
const { v4: uuidv4 } = require('uuid')
const User = require('../models/User')
const StatusPost = require('../models/StatusPost')
const s3Controller = require('./s3Controller')
const socketIO = require('../socket/socket')
const Notification = require('../models/Notification')
const Story = require('../models/Story')

var serviceAccount = require('../social-media-620ea-firebase-adminsdk-76t2t-2acb9784e9.json')
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    storageBucket: 'social-media-620ea.appspot.com',
})

const bucket = admin.storage().bucket()

exports.uploadMediaFiles = asyncCatch(async (req, res, next) => {})

exports.uploadStoryFiles = asyncCatch(async (req, res, next) => {
    const { userId } = req.params
    const mediaFiles = []
    console.log('request received')
    console.log(req.files)

    if (req.files) {
        const promises = req.files.map(async (file) => {
            const filename = file.originalname
            const blob = bucket.file(filename)
            const downloadTokens = uuidv4()

            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: downloadTokens,
                    },
                },
            })

            return new Promise((resolve, reject) => {
                blobStream.on('error', (err) => {
                    console.error('Error uploading image to Firebase:', err)
                    reject(err)
                })

                blobStream.on('finish', async () => {
                    // Make the image file publicly accessible
                    await blob.makePublic()

                    const downloadUrl = await blob.getSignedUrl({
                        action: 'read',
                        expires: '03-01-2500', // Set an appropriate expiration date
                    })

                    let fileType
                    if (file.mimetype.startsWith('image/')) fileType = 'Image'
                    else if (file.mimetype.startsWith('video/'))
                        fileType = 'Video'

                    const newFile = {
                        location: downloadUrl[0],
                        name: file.originalname,
                        fileType: fileType,
                    }

                    resolve(newFile)
                })

                blobStream.end(file.buffer)
            })
        })

        try {
            const uploadedFiles = await Promise.all(promises)
            mediaFiles.push(...uploadedFiles)
        } catch (err) {
            return res.status(500).json({ error: 'Failed to upload image' })
        }
    }

    const newStory = await Story.create({
        author: userId,
        mediaFiles: mediaFiles,
    })

    if (!newStory) {
        if (req.files)
            req.files.forEach((item) =>
                s3Controller.deleteMediaFile(item.location)
            )
        return next(new AppError('Unable to create new story', 500))
    }

    const populatedStory = await newStory.populate(
        'author',
        '_id name profileImagePath followers'
    )

    sendNotificationOnPostingStory(populatedStory._id, populatedStory.author)

    res.status(200).json(populatedStory)
})

exports.uploadPostFiles = asyncCatch(async (req, res, next) => {
    const { userId } = req.params
    const mediaFiles = []

    if (req.files) {
        const promises = req.files.map(async (file) => {
            const filename = file.originalname
            const blob = bucket.file(filename)
            const downloadTokens = uuidv4()

            const blobStream = blob.createWriteStream({
                metadata: {
                    contentType: file.mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: downloadTokens,
                    },
                },
            })

            return new Promise((resolve, reject) => {
                blobStream.on('error', (err) => {
                    console.error('Error uploading image to Firebase:', err)
                    reject(err)
                })

                blobStream.on('finish', async () => {
                    // Make the image file publicly accessible
                    await blob.makePublic()

                    const downloadUrl = await blob.getSignedUrl({
                        action: 'read',
                        expires: '03-01-2500', // Set an appropriate expiration date
                    })

                    let fileType
                    if (file.mimetype.startsWith('image/')) fileType = 'Image'
                    else if (file.mimetype.startsWith('video/'))
                        fileType = 'Video'

                    const newFile = {
                        location: downloadUrl[0],
                        name: file.originalname,
                        fileType: fileType,
                    }

                    resolve(newFile)
                })

                blobStream.end(file.buffer)
            })
        })

        try {
            const uploadedFiles = await Promise.all(promises)
            mediaFiles.push(...uploadedFiles)
        } catch (err) {
            return res.status(500).json({ error: 'Failed to upload image' })
        }
    }

    const newStatusPost = await StatusPost.create({
        author: userId,
        description: req.body.description,
        mediaFiles: mediaFiles,
        sharedLink: req.body.sharedLink,
    })

    if (!newStatusPost) {
        if (req.files)
            req.files.forEach((item) =>
                s3Controller.deleteMediaFile(item.location)
            )
        return next(new AppError('Unable to create new status post', 500))
    }

    // why populated is not the response for res.json is because it was in the old version and i hate to change it
    // and notify the change to the frontend lmao
    const populatedPost = await newStatusPost.populate(
        'author',
        '_id name profileImagePath'
    )

    const io = socketIO.getIO()
    User.findById(userId).then((user) => {
        sendNotificationOnPosting(populatedPost._id, user)
        user.followers.forEach((follower) => {
            io.in(follower._id.toString()).emit('newStatusPost', populatedPost)
        })
    })

    res.status(200).json(newStatusPost)
})

exports.uploadBackgroundImage = asyncCatch(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' })
    }

    const imageFile = req.file
    const { userId } = req.params
    const user = await User.findById(userId)

    if (!imageFile.mimetype.startsWith('image/')) {
        return res.status(400).json({
            error: 'Invalid file format. Only image files are allowed.',
        })
    }

    const filename = imageFile.originalname

    const blob = bucket.file(filename)

    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: imageFile.mimetype,
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(),
            },
        },
    })

    blobStream.on('error', (err) => {
        console.error('Error uploading image to Firebase:', err)
        return res.status(500).json({ error: 'Failed to upload image' })
    })

    blobStream.on('finish', async () => {
        // Make the image file publicly accessible
        await blob.makePublic()

        // Get the uploaded image URL
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`

        const downloadUrl = await blob.getSignedUrl({
            action: 'read',
            expires: '03-01-2500', // Set an appropriate expiration date
        })

        // Set the uploaded image URL and download URL on the request object for further processing
        req.uploadedFileUrl = imageUrl
        req.uploadedFileDownloadUrl = downloadUrl[0]

        if (user != null) {
            if (user.backgroundImagePath != '') {
                s3Controller.deleteMediaFile(user.backgroundImagePath)
            }

            user.backgroundImagePath = downloadUrl[0]
            await user.save()
        }

        res.status(200).json({
            backgroundImagePath: downloadUrl[0],
        })
    })

    blobStream.end(imageFile.buffer)
})

exports.uploadProfileImage = asyncCatch(async (req, res, next) => {
    if (!req.file) {
        return res.status(400).json({ error: 'No image file provided' })
    }

    const imageFile = req.file
    const { userId } = req.params
    const user = await User.findById(userId)

    if (!imageFile.mimetype.startsWith('image/')) {
        return res.status(400).json({
            error: 'Invalid file format. Only image files are allowed.',
        })
    }

    const filename = imageFile.originalname

    const blob = bucket.file(filename)

    const blobStream = blob.createWriteStream({
        metadata: {
            contentType: imageFile.mimetype,
            metadata: {
                firebaseStorageDownloadTokens: uuidv4(),
            },
        },
    })

    blobStream.on('error', (err) => {
        console.error('Error uploading image to Firebase:', err)
        return res.status(500).json({ error: 'Failed to upload image' })
    })

    blobStream.on('finish', async () => {
        // Make the image file publicly accessible
        await blob.makePublic()

        // Get the uploaded image URL
        const imageUrl = `https://storage.googleapis.com/${bucket.name}/${filename}`

        const downloadUrl = await blob.getSignedUrl({
            action: 'read',
            expires: '03-01-2500', // Set an appropriate expiration date
        })

        // Set the uploaded image URL and download URL on the request object for further processing
        req.uploadedFileUrl = imageUrl
        req.uploadedFileDownloadUrl = downloadUrl[0]

        if (user != null) {
            if (user.profileImagePath != '') {
                s3Controller.deleteMediaFile(user.profileImagePath)
            }

            user.profileImagePath = downloadUrl[0]
            await user.save()
        }

        res.status(200).json({
            imagePath: downloadUrl[0],
        })
    })

    blobStream.end(imageFile.buffer)
})

exports.deleteMediaFile = async (signedUrl) => {
    try {
        const regex = /\/([^/]+)\?/
        const matches = signedUrl.match(regex)

        if (matches && matches.length >= 2) {
            const extractedString = matches[1]
            await bucket.file(extractedString).delete()
            console.log('File deleted successfully')
        } else {
            console.log('String extraction failed')
        }
    } catch (error) {
        console.error('Error deleting file:', error)
    }
}

const sendNotificationOnPosting = async (statusPostId, statusPostAuthor) => {
    statusPostAuthor.followers.forEach(async (followerId) => {
        Notification.create({
            userId: followerId.toString(),
            sender: statusPostAuthor._id,
            notificationType: 'Comment', // todo: there is no time for other type, should be changed in future
            content: `${statusPostAuthor.name} has posted a new post`,
            isRead: false,
            link: statusPostId,
        })
    })
}

const sendNotificationOnPostingStory = async (storyId, storyAuthor) => {
    storyAuthor.followers.forEach(async (followerId) => {
        const noti = await Notification.create({
            userId: followerId.toString(),
            sender: storyAuthor._id,
            notificationType: 'NewStory', // todo: there is no time for other type, should be changed in future
            content: `${storyAuthor.name} has posted a new story`,
            isRead: false,
            link: storyId,
        })

        const notiObject = noti.toObject()
        notiObject.sender = {
            _id: storyAuthor._id,
            name: storyAuthor.name,
            profileImagePath: storyAuthor.profileImagePath,
        }

        const io = socketIO.getIO()
        if (noti)
            io.in(followerId.toString()).emit('newNotification', notiObject)
    })
}
