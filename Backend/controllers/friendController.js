/* eslint-disable no-plusplus */
const ChatRoom = require('../models/ChatRoom');
const FriendRequest = require('../models/FriendRequest');
const Notification = require('../models/Notification');
const User = require('../models/User');
const AppError = require('../utils/AppError');
const asyncCatch = require('../utils/asyncCatch');

const socketIO = require('../socket/socket');

const createChatRoomOnAccept = async (firstUser, secondUser) => {
  const isExisted = await ChatRoom.find({
    members: {
      $all: [firstUser._id, secondUser._id],
    },
  });

  if (isExisted.length > 0) return;

  const newChatRoom = await ChatRoom.create({
    members: [firstUser._id, secondUser._id],
  });

  if (newChatRoom) {
    firstUser.chatRooms.push(newChatRoom._id);
    secondUser.chatRooms.push(newChatRoom._id);
  }
};

const sendNotificationOnReply = async (sender, receiver, isAccept) => {
  let message;
  if (isAccept) message = `${receiver.name} accepted your friend request`;
  else message = `${receiver.name} denied your friend request`;

  const noti = await Notification.create({
    userId: sender._id,
    sender: receiver._id,
    notificationType: 'FriendRequest',
    content: message,
  });

  const notiObject = noti.toObject();
  notiObject.sender = {
    _id: receiver._id,
    name: receiver.name,
    profileImagePath: receiver.profileImagePath,
  };

  const io = socketIO.getIO();
  if (noti) io.in(sender._id.toString()).emit('newNotification', notiObject);
};

const sendNotificationOnRequest = async (senderId, receiverId) => {
  const sender = await User.findById(senderId);
  const content = `${sender.name} has sent you a friend request`;

  const noti = await Notification.create({
    userId: receiverId,
    sender: sender._id,
    notificationType: 'FriendRequest',
    content,
  });

  const notiObject = noti.toObject();
  notiObject.sender = {
    _id: sender._id,
    name: sender.name,
    profileImagePath: sender.profileImagePath,
  };

  const io = socketIO.getIO();
  if (noti) io.in(receiverId.toString()).emit('newNotification', notiObject);
};

const updateFollowOnBeingFriend = (requestSender, respondent) => {
  if (requestSender.followings.indexOf(respondent._id) === -1) {
    requestSender.followings.push(respondent._id);
    requestSender.markModified('followings');
    respondent.followers.push(requestSender._id);
    respondent.markModified('followers');
  }

  if (requestSender.followers.indexOf(respondent._id) === -1) {
    requestSender.followers.push(respondent._id);
    requestSender.markModified('followers');
    respondent.followings.push(requestSender._id);
    respondent.markModified('followings');
  }
};

const updateFollowOnBeingUnfriend = (requestSender, respondent) => {
  if (requestSender.followings.indexOf(respondent._id) > -1) {
    const firstIdx = requestSender.followings.indexOf(respondent._id);
    requestSender.followings.splice(firstIdx, 1);
    requestSender.markModified('followings');

    const secondIdx = respondent.followers.indexOf(requestSender._id);
    respondent.followers.splice(secondIdx, 1);
    respondent.markModified('followers');
  }

  if (requestSender.followers.indexOf(respondent._id) > -1) {
    const firstIdx = requestSender.followers.indexOf(respondent._id);
    requestSender.followers.splice(firstIdx, 1);
    requestSender.markModified('followers');

    const secondIdx = respondent.followings.indexOf(requestSender._id);
    respondent.followings.splice(secondIdx, 1);
    respondent.markModified('followings');
  }
};

exports.getAllFriendOfUser = asyncCatch(async (req, res, next) => {
  const { userId } = req.params;
  const connections = await User.findById(userId).populate(
    'connections',
    '_id name profileImagePath backgroundImagePath workingPlace'
  );

  res.status(200).json(connections);
});

exports.createNewFriendRequest = asyncCatch(async (req, res, next) => {
  const { userId: senderId } = req.params;
  const { receiverEmail } = req.body;

  const receiver = await User.findOne({ email: receiverEmail });

  // check if you are you
  if (!receiver) return next(new AppError(`Email not found`, 400));
  if (receiver._id === senderId)
    return next(new AppError('Unable to add yourself', 400));

  // check if friend request is pending
  const isExisted = await FriendRequest.findOne({
    senderId: { $in: [receiver._id, senderId] },
    receiverId: { $in: [receiver._id, senderId] },
  });

  if (isExisted) return next(new AppError('The request is already sent', 400));

  // check if already been friend
  if (receiver.connections.includes(senderId))
    return next(new AppError('Already friend', 400));

  // create the request in db
  const newFriendRequest = await FriendRequest.create({
    senderId,
    receiverId: receiver._id,
  });

  if (!newFriendRequest)
    return next(new AppError('Unable to create new friend request', 500));

  sendNotificationOnRequest(senderId, receiver._id);

  res.status(200).json(newFriendRequest);
});

exports.getAllSentFriendRequestOfAUser = asyncCatch(async (req, res, next) => {
  const { userId } = req.params;
  const sentFriendRequests = await FriendRequest.find({ senderId: userId });
  res.status(200).json(sentFriendRequests);
});
exports.getAllReceivedFriendRequestOfAUser = asyncCatch(async (req, res, next) => {
    const { userId } = req.params;
    const receivedFriendRequests = await FriendRequest.find({
        receiverId: userId,
    });
    res.status(200).json(receivedFriendRequests);
});

exports.replyFriendRequest = asyncCatch(async (req, res, next) => {
    const { requestId: friendRequestId, userId: respondentId } = req.params;
    const { response } = req.body;

    const respondent = await User.findById(respondentId);

    // check if the response is correct
    if (response !== 'Accept' && response !== 'Decline')
        return next(new AppError('False response format', 400));

    // delete the friend request
    const friendRequest = await FriendRequest.findByIdAndDelete(friendRequestId);
    if (!friendRequest)
        return next(new AppError('Invalid friend request id', 400));

    const requestSender = await User.findById(friendRequest.senderId);

    if (response === 'Accept') {
        respondent.connections.push(requestSender._id);
        requestSender.connections.push(respondent._id);

        createChatRoomOnAccept(respondent, requestSender);
        sendNotificationOnReply(requestSender, respondent, true);
        updateFollowOnBeingFriend(requestSender, respondent);

        await Promise.all([respondent.save(), requestSender.save()]);
    } else if (response === 'Decline')
        sendNotificationOnReply(requestSender, false);

    res.status(204).end();
});

exports.unfriend = asyncCatch(async (req, res, next) => {
    const { userId, unfriendUserId } = req.params;

    const user = await User.findById(userId);
    const unfriendUser = await User.findById(unfriendUserId);

    const firstIdx = user.connections.indexOf(unfriendUserId);
    const secondIdx = unfriendUser.connections.indexOf(userId);

    if (firstIdx === -1) throw new AppError('User not found', 404);
    if (secondIdx === -1) throw new AppError('User unfriended not found', 404);

    user.connections.splice(firstIdx, 1);
    unfriendUser.connections.splice(secondIdx, 1);
    updateFollowOnBeingUnfriend(user, unfriendUser);

    await Promise.all([unfriendUser.save(), user.save()]);

    res.status(204).end();
});

exports.recommendFriends = asyncCatch(async (req, res, next) => {
    const { userId } = req.params;
    const MAX_RECOMMEND_FRIEND_SIZE = 10;
    const user = await User.findById(userId).populate(
        'connections',
        '_id connections'
    );

    if (!user) throw new AppError('User not found', 404);

    // get ids of already sent a friend request
    const sentFriendRequestIds = await FriendRequest.find({
        _id: { $in: [user._id] },
    }).select('+_id');

    let potentialFriendIds = [];
    user.connections.forEach((connection) => {
        connection.connections.forEach((friendOfFriendId) => {
            if (user.connections.find((x) => x.equals(friendOfFriendId))) return;
            if (
                sentFriendRequestIds.find((x) => x._id.equals(friendOfFriendId))
            )
                return;

            const existedIdx = potentialFriendIds.findIndex(
                (friend) =>
                    friend._id.toString() === friendOfFriendId.toString()
            );

            if (existedIdx === -1) {
                potentialFriendIds.push({
                    _id: friendOfFriendId,
                    appearCount: 1,
                });
            } else {
                potentialFriendIds[existedIdx].appearCount += 1;
            }
        });
    });

    potentialFriendIds.sort((first, sec) => sec.appearCount - first.appearCount);
    if (potentialFriendIds.length > MAX_RECOMMEND_FRIEND_SIZE)
        potentialFriendIds.splice(
            MAX_RECOMMEND_FRIEND_SIZE,
            potentialFriendIds.length - MAX_RECOMMEND_FRIEND_SIZE
        );

    potentialFriendIds = potentialFriendIds.map((obj) => obj._id);

    const potentialFriends = await User.find({
        _id: { $in: potentialFriendIds },
    });

    // add more friends if not exceeded the max size
    if (potentialFriends.length < MAX_RECOMMEND_FRIEND_SIZE)
        await User.find({
            _id: {
                $nin: [
                    ...potentialFriendIds,
                    ...user.connections,
                    ...sentFriendRequestIds,
                ],
            },
        })
            .limit(MAX_RECOMMEND_FRIEND_SIZE - potentialFriends.length)
            .then((documents) =>
                documents.forEach((document) => {
                    potentialFriends.push(document);
                })
            );

    res.status(200).json(potentialFriends);
});
