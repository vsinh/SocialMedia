import React, { useEffect } from "react"
import { createNativeStackNavigator } from "@react-navigation/native-stack"
import BottomTabs from "./BottomTabs"
import FirstTimeUseScreen from "../Screens/FirstTimeUseScreen"
import { useDispatch, useSelector } from "react-redux"
import AppLoader from "../components/ui/AppLoader"
import ProfileScreen from "../Screens/ProfileScreen"
import PostScreen from "../Screens/PostScreen"
import SearchScreen from "../Screens/SearchScreen"
import ChatScreen from "../Screens/chatScreens/ChatScreen"
import ChatRoom from "../Screens/chatScreens/ChatRoom"

import LoadingScreen from "../Screens/LoadingScreen"
import ImagesPostScreen from "../Screens/ImagesPostScreen"
import DetailStatusScreen from "../Screens/DetailStatusScreen"
import EditPostScreen from "../Screens/EditPostScreen"
import ProfileOfUserScreen from "../Screens/ProfileOfUserScreen"
import MyNetworksScreen from "../Screens/MyNetworksScreen"
import InvitationsScreen from "../Screens/InvitationsScreen"
import PostOfUserSreen from "../Screens/PostOfUserSreen"
import SharePost from "../components/ui/SharePost"
import { pushNotification } from "../reducers/NotificationReducer"
import { Toast } from "../components/ui/Toast"
import {
  connectSocket,
  disconnectSocket,
  subscribeToEvent
} from "../utils/socket"
import {
  pushStatusPosts,
  pushStatusPostsSub
} from "../reducers/StatusPostReducer"
import { getAStatusPostById } from "../api/statusPostApi"
import PostStoryScreen from "../Screens/PostStoryScreen"
import StoriesScreen from "../Screens/StoriesScreen"
import { setCallShow, setDataCall } from "../reducers/UtilsReducer"
import VideoCallScreen from "../Screens/chatScreens/VideoCallScreen"

const Stack = createNativeStackNavigator()

export default function Routers() {
  // Get the loading status from the Redux store
  const isLoading = useSelector(state => state.loading.status)
  const token = useSelector(state => state.token.key)
  const uid = useSelector(state => state.uid.id)

  const dispatch = useDispatch()

  const getPostById = async id => {
    try {
      const response = await getAStatusPostById(token, id)
      if (response.status === 200) {
        const data = response.data
        dispatch(pushStatusPostsSub(data))
      } else {
        console.log(response.status)
        console.log(response.data.errorMessage)
        throw new Error(response.data.errorMessage)
      }
    } catch (error) {
      Toast(error.message)
    }
  }

  useEffect(() => {
    const ConnectSocket = async () => {
      connectSocket(uid)

      subscribeToEvent("newStatusPost", newPost => {
        console.log("have new post")
        console.log(newPost)
        dispatch(pushStatusPosts(newPost))
        if (newPost.sharedLink) {
          getPostById(newPost.sharedLink)
        }
      })

      subscribeToEvent("newNotification", newNotify => {
        console.log("have new notification")
        dispatch(pushNotification(newNotify))
      })

      subscribeToEvent("offerVideoCall", offer => {
        // set data
        // view in utilsReducer
        // dispatch(setDataCall({alo: 'ola'}));
        dispatch(setDataCall(JSON.parse(offer)))
        // show modal
        dispatch(setCallShow(true))
      })
    }
    if (uid) {
      disconnectSocket()
      ConnectSocket()
    }
  }, [uid])

  return (
    <>
      {/* Navigation stack */}
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {/* Login screen */}
        <Stack.Screen name="login" component={FirstTimeUseScreen} />
        {/* Main screen with bottom tabs */}
        <Stack.Screen name="main" component={BottomTabs} />
        {/* Detail status screen */}
        <Stack.Screen
          name="detailStatus"
          component={DetailStatusScreen}
          options={{
            animation: "slide_from_right"
          }}
        />
        {/* Images post screen */}
        <Stack.Screen
          name="imagesPost"
          component={ImagesPostScreen}
          options={{
            // presentation: 'modal',
            animationTypeForReplace: "push",
            animation: "none"
          }}
        />
        {/* Edit post screen */}
        <Stack.Screen
          name="editPost"
          component={EditPostScreen}
          options={{
            animation: "none"
          }}
        />
        {/* My networks screen */}
        <Stack.Screen
          name="myNetworks"
          component={MyNetworksScreen}
          options={{
            animation: "slide_from_right"
          }}
        />
        {/* Invitations screen */}
        <Stack.Screen
          name="invitations"
          component={InvitationsScreen}
          options={{
            animation: "slide_from_right"
          }}
        />
        {/* Profile screen */}
        <Stack.Screen name="profile" component={ProfileScreen} />
        {/* Profile of user screen */}
        <Stack.Screen
          name="profileOther"
          component={ProfileOfUserScreen}
          options={{
            animation: "slide_from_right"
          }}
        />
        {/* Post of user screen */}
        <Stack.Screen
          name="postOfUser"
          component={PostOfUserSreen}
          options={{
            animation: "slide_from_right"
          }}
        />
        {/* Search screen */}
        <Stack.Screen
          name="search"
          component={SearchScreen}
          options={{
            animation: "none"
          }}
        />
        <Stack.Screen
          name="postStory"
          component={PostStoryScreen}
          options={{
            animation: "slide_from_bottom"
          }}
        />
        <Stack.Screen
          name="story"
          component={StoriesScreen}
          options={{
            // presentation: 'modal',
            animationTypeForReplace: "push",
            animation: "none"
          }}
        />
        {/* Chat screen */}
        <Stack.Screen name="chat" component={ChatScreen} />
        <Stack.Screen name="chatRoom" component={ChatRoom} />
        <Stack.Screen name="loading" component={LoadingScreen} />
        <Stack.Screen name="videoCall" component={VideoCallScreen} />
      </Stack.Navigator>

      {/* Show the app loader if isLoading is true */}
      {isLoading ? <AppLoader /> : null}

      {/* Post screen */}
      <PostScreen />
      <SharePost />
      <VideoCallScreen />
    </>
  )
}
