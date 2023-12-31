/* eslint-disable react/no-unstable-nested-components */
/* eslint-disable react-native/no-inline-styles */

import { View, Text, FlatList, TouchableOpacity, Image } from 'react-native';
import React, { useEffect } from 'react';
import Icon, { Icons } from '../components/ui/Icons';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../reducers/Store';
import { getTimeToNow } from '../utils/Utils';
import { getAStatusPostById } from '../api/statusPostApi';
import { Toast } from '../components/ui/Toast';
import { pushStatusPostsSub } from '../reducers/StatusPostReducer';
import { readNotification } from '../api/notificationApi';
import { clearStorySub, pushStorySub } from '../reducers/StoryReducer';
import { getStoryById } from '../api/storyApi';

export default function NotificationsScreen({ navigation }) {
  const NotificationsData = useSelector(
    (state) => state.notifications.arr
  );

  const uid = useSelector((state) => state.uid.id);
  const jwt = useSelector((state) => state.token.key);
  const dispatch = useDispatch();

  const navigateToDetail = (id) => {
    getAStatusPostById(jwt, id)
      .then((res) => {
        if (res.status === 200) {
          dispatch(pushStatusPostsSub(res.data));
          return res.data;
        } else {
          throw new Error(res.data.errorMessage);
        }
      })
      .then((data) => {
        navigation.push('detailStatus', { idPost: id });
      })
      .catch((error) => {
        Toast(error.message);
      });
  };

  useEffect(() => {
    const readNotifi = async () => {
      const response = await readNotification(uid, jwt);
      if (response.status !== 204) {
        console.log(response.status);
        console.log(response.data.errorMessage);
      }
    };
    readNotifi();
  }, []);

  const getAStoryById = async (link) => {
    try {
      const response = await getStoryById(link, jwt);
      if (response.status === 200) {
        const data = response.data;
        await dispatch(pushStorySub(data));
        navigation.push('story', { index: 0, type: 1 });
      } else {
        console.log(response.status);
        console.log(response.data.errorMessage);
        throw new Error(response.data.errorMessage);
      }
    } catch (error) {
      Toast(error.message);
    }
  };

  const CTA = ({ title, item }) => (
    <TouchableOpacity
      onPress={() => {
        if (item.notificationType === 'Comment') navigateToDetail(item.link);
        if (item.notificationType === 'FriendRequest')
          navigation.navigate('invitations');
        if (item.notificationType === 'NewStory') {
          console.log(item.link);
          dispatch(clearStorySub());
          getAStoryById(item.link);
        }
      }}
      style={{
        borderRadius: 50,
        borderColor: '#0077B5',
        borderWidth: 1,
        paddingHorizontal: 10,
        paddingVertical: 5,
        marginTop: 10,
        alignSelf: 'flex-start',
        width: 'auto',
      }}
    >
      <Text style={{ fontSize: 16, color: '#0077B5' }}>{title}</Text>
    </TouchableOpacity>
  );
  const NotificationItem = ({ item }) => (
    <View
      style={{
        justifyContent: 'space-evenly',
        marginVertical: 10,
        flexDirection: 'row',
        alignItems: 'center',
      }}
    >
      <View
        style={{
          height: 70,
          width: 70,
          marginRight: 20,
          borderRadius: 35,
          elevation: 5,
        }}
      >
        <Image
          source={
            item.sender?.profileImagePath
              ? { uri: item.sender.profileImagePath }
              : require('../assets/images/Spiderman.jpg')
          }
          style={{
            flex: 1,
            borderRadius: 35,
            height: undefined,
            width: undefined,
          }}
        />
      </View>
      <View>
        <Text
          style={{
            width: 240,
            fontSize: 16,
            color: 'black',
            paddingRight: 5,
          }}
        >
          {item.content}
        </Text>
        {item.notificationType === 'FriendRequest' ? (
          <CTA title="View request" item={item} />
        ) : item.notificationType === 'Comment' ? (
          <CTA title="See all comment" item={item} />
        ) : item.notificationType === 'Like' ? (
          <CTA title="See like" item={item} />
        ) : item.notificationType === 'NewStory' ? (
          <CTA title="See story" item={item} />
        ) : null}
      </View>
      <View>
        <Text style={{ fontSize: 13, marginBottom: 5 }}>
          {getTimeToNow(item.createdAt)}
        </Text>
        <TouchableOpacity onPress={() => {}}>
          <Icon
            type={Icons.Ionicons}
            name="ellipsis-vertical"
            size={22}
            color={'black'}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
  const ShowAllFooter = () => {
    return (
      <View
        style={{
          alignItems: 'center',
          justifyContent: 'center',
          borderTopColor: 'gray',
          borderTopWidth: 1,
          paddingVertical: 10,
        }}
      />
    );
  };

  return (
    <View
      style={{
        marginTop: 10,
        paddingHorizontal: 5,
        backgroundColor: 'white',
      }}
    >
      {NotificationsData.length === 0 ? (
        <View
          style={{
            backgroundColor: 'transparent',
            justifyContent: 'center',
            flex: 1,
          }}
        >
          <Image
            style={{
              width: 400,
              height: 400,
              marginTop: 500,
              alignSelf: 'center',
              backgroundColor: 'transparent',
            }}
            source={require('../assets/images/NoNotification-removebg-preview.png')}
          />
        </View>
      ) : (
        <FlatList
          showsVerticalScrollIndicator={false}
          data={NotificationsData}
          renderItem={NotificationItem}
          ListFooterComponent={() => <ShowAllFooter />}
        />
      )}
    </View>
  );
}
