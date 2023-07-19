require('./utils/startServerScript')

const express = require('express')
const http = require('http')
const io = require('./socket/socket')

const errorHandlers = require('./controllers/errorController/errorController')
// const userJobPostController = require('./controllers/userJobPostController')
const stringSearchController = require('./controllers/stringSearchController')
const statusPostController = require('./controllers/statusPostController')
const storyController = require('./controllers/storyController')
const s3Controller = require('./controllers/s3Controller')

const authRouter = require('./routes/authRoutes')
const usersRouter = require('./routes/usersRoutes')
// const jobPostRouter = require('./routes/jobPostRoutes')
const friendRouter = require('./routes/friendRoutes')
const notificationRouter = require('./routes/notificationRoutes')
const chatRouter = require('./routes/chatRoutes')
const statusPostRouter = require('./routes/statusPostRoutes')
const statusCommentRouter = require('./routes/statusCommentRoutes')
const storyRouter = require('./routes/storyRoutes')
const bodyParser = require('body-parser')

const app = express()
const server = http.createServer(app)

// set up socketio
io.initialize(server)
require('./socket/chat')

app.use(express.json())
app.use(
    express.urlencoded({
        extended: true,
    })
)

// Increase payload size limit for JSON requests
app.use(bodyParser.json({ limit: '50mb' }))

// Increase payload size limit for form data requests
app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }))

app.use('', authRouter)
app.post('/email-search', stringSearchController.searchByEmail)
app.post('/name-search', stringSearchController.searchByName)
app.use('/chatroom', chatRouter)
app.post('/upload-image', s3Controller.uploadMediaFiles)
app.use('/s/:statusPostId/comment', statusCommentRouter)
app.get('/s/:statusPostId', statusPostController.getStatusPostById)
app.get('/story/:storyId', storyController.getStoryById)
// app.get('/jobpost/:jobPostId', userJobPostController.getAJobPostUsingItsId)
// app.use('/:userId/jobpost', jobPostRouter)
app.use('/:userId/post', statusPostRouter)
app.get('/:userId/news-feed', statusPostController.getNewsFeed)
app.get('/:userId/story-feed', storyController.storyFeed)
app.use('/:userId/friend-request', friendRouter)
app.use('/:userId/notification', notificationRouter)
app.use('/:userId/story', storyRouter)
app.use('', usersRouter)
app.use('*', errorHandlers.invalidUrlHandler)
app.use(errorHandlers.globalErrorHandler)

server.listen(process.env.PORT || 3000, () => {
    console.log(`Server running on port ${process.env.PORT || 3000}`)
})
