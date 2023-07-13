import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  Alert,
} from 'react-native';
import React, {useEffect, useState} from 'react';
import {Toast} from '../components/ui/Toast';
import * as ImagePicker from 'expo-image-picker';
import { ToastAndroid } from 'react-native';
import {createThumbnail} from 'react-native-create-thumbnail';
import Icon, {Icons} from '../components/ui/Icons';
import VideoPlayer from 'react-native-video';
import Colors from '../constants/Colors';
import {createStory} from '../api/storyApi';
import {useDispatch, useSelector} from 'react-redux';
import {RootState} from '../reducers/Store';
import {setStatus} from '../reducers/LoadingReducer';

export default function PostStoryScreen({navigation}) {
  const screenWidth = Dimensions.get('window').width;
  const [mediaFiles, setMediaFiles] = useState();
  const token = useSelector((state) => state.token.key);
  const uid = useSelector((state) => state.uid.id);

  const dispatch = useDispatch();

  const navigateBack = () => {
    navigation.goBack();
  };

  const choosePhotoFromLibrary = async () => {
    try {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        ToastAndroid.show('Permission to access media library denied', ToastAndroid.SHORT);
        return;
      }
  
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        maxFiles: 10,
      });
  
      if (!result.cancelled) {
        const selectedMedia = {
          uri: result.uri,
          type: result.type,
          name: result.uri.split('/').pop(),
        };
        console.log(selectedMedia);
        setMediaFiles(selectedMedia);
      }
    } catch (error) {
      ToastAndroid.show(error.message, ToastAndroid.SHORT);
    }
  };
  useEffect(() => {
    choosePhotoFromLibrary();
  }, []);

  const handleClose = () => {
    Alert.alert('Discard photo?', 'You can select another media to post', [
      {
        text: 'Cancel',
        onPress: () => console.log('Cancel Pressed'),
        style: 'cancel',
      },
      {text: 'Discard', onPress: navigateBack},
    ]);
  };

  const shareStory = async () => {
    navigateBack();
    dispatch(setStatus(true));
    const data = new FormData();
    data.append('media-files', mediaFiles);
    if (mediaFiles?.type === 'video/mp4') {
      const thumbnail = await createThumbnail({
        url: mediaFiles.uri,
        timeStamp: 1000,
      });
      data.append('media-files', {
        uri: thumbnail.path,
        type: thumbnail.mime,
        name: thumbnail.path.split('/').pop() || thumbnail.path,
      });
    } else {
      data.append('media-files', mediaFiles);
    }
    createStory(data, uid, token)
      .then((response) => {
        if (response.status === 200) {
          console.log(response.data);
          return response.data;
        } else {
          console.log(response.status);
          throw new Error(response.data.errorMessage);
        }
      })
      .then((data) => {
        Toast('Post successfully!');
      })
      .catch((error) => Toast(error.message))
      .finally(() => dispatch(setStatus(false)));
  };

  const renderImage = (image) => {
    return (
      <Image
        style={{
          flex: 1,
          width: '100%',
          marginVertical: 10,
          overflow: 'hidden',
        }}
        source={{uri: image.uri}}
        resizeMode="contain"
      />
    );
  };

  const renderVideo = (video) => {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: 'gray',
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <VideoPlayer
          source={{uri: video.uri}}
          style={{flex: 1, width: '100%'}}
          resizeMode="contain"
        />
      </View>
    );
  };

  if (mediaFiles) {
    return (
      <View style={styles.container}>
        {mediaFiles?.type === 'video/mp4'
          ? renderVideo(mediaFiles)
          : renderImage(mediaFiles)}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleClose}>
            <Icon
              type={Icons.AntDesign}
              name="close"
              color={Colors.white}
              size={30}
              borderColor={Colors.black}
              borderWidth={1}
            />
          </TouchableOpacity>
          <TouchableOpacity onPress={choosePhotoFromLibrary}>
            <Icon
              type={Icons.MaterialIcons}
              name="perm-media"
              color={Colors.white}
              size={30}
              borderColor={Colors.black}
              borderWidth={1}
            />
          </TouchableOpacity>
        </View>
        <TouchableOpacity style={styles.btn} onPress={shareStory}>
          <Text style={{color: Colors.white}}>Share</Text>
        </TouchableOpacity>
      </View>
    );
  }
  return null;
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.black,
  },
  header: {
    position: 'absolute',
    top: 20,
    left: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '90%',
    paddingHorizontal: 10,
  },
  btn: {
    position: 'absolute',
    backgroundColor: Colors.bluePrimary,
    borderRadius: 5,
    padding: 10,
    bottom: 20,
    right: 20,
  },
});
