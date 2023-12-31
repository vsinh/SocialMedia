import {
    View,
    Text,
    SafeAreaView,
    StyleSheet,
    ScrollView,
    useWindowDimensions,
    Animated,
    Image,
    FlatList,
    TouchableOpacity,
    Pressable,
    Alert,
} from "react-native";
import React, { useEffect, useRef, useState } from "react";
import Colors from "../constants/Colors";
import VideoPlayer from "react-native-video-controls";
import Icon, { Icons } from "../components/ui/Icons";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../reducers/Store";
import { getTimeToNow } from "../utils/Utils";
import { deleteStoryApi, likeStory } from "../api/storyApi";
import { deleteStory, toggleLikeStory } from "../reducers/StoryReducer";

export default function StoriesScreen({ navigation, route }) {
    const { index, type } = route.params;
    let { width: windowWidth, height: windowHeight } = useWindowDimensions();
    windowHeight = windowHeight - 150;

    const stories =
        type === 0
            ? useSelector((state) => state.story.Main)
            : useSelector((state) => state.story.Sub);
    const token = useSelector((state) => state.token.key);
    const uid = useSelector((state) => state.uid.id);

    const flatListRef = useRef(null);

    const dispatch = useDispatch();

    // get index of item in flatlist
    const [currentIndex, setCurrentIndex] = useState(index);
    useEffect(() => {
        console.log("index:", currentIndex);
    }, [currentIndex]);

    useEffect(() => {
        // Scroll to the second item in the FlatList]
        if (flatListRef.current) {
            flatListRef.current.scrollToIndex({
                animated: false,
                index: index,
            });
        }
    }, []);

    const toggleLike = async (item) => {
        const response = await likeStory(item.author._id, item._id, token);
        if (response.status === 204) {
            dispatch(toggleLikeStory(item._id));
        } else {
            console.log(response.data);
        }
    };

    const handleDelete = async (item) => {
        const response = await deleteStoryApi(item.author._id, item._id, token);
        if (response.status === 204) {
            dispatch(deleteStory(item._id));
        } else {
            console.log(response.data);
        }
    };

    const deleteAStory = async (item) => {
        Alert.alert(
            "Delete Story",
            "Are you sure you want to delete this story?",
            [
                {
                    text: "Cancel",
                    onPress: () => {},
                    style: "cancel",
                },
                {
                    text: "Delete",
                    onPress: () => {
                        handleDelete(item);
                    },
                    style: "destructive",
                },
            ],
            { cancelable: true }
        );
    };

    const getItemLayout = (data, index) => ({
        length: windowWidth,
        offset: windowWidth * index,
        index,
    });

    const viewProfile = (authorId) => {
        if (uid !== authorId) navigation.push("profileOther", { id: authorId });
    };

    const Story = ({ item, index }) => {
        return (
            <View
                style={{
                    width: windowWidth,
                    justifyContent: "center",
                    alignContent: "center",
                }}
            >
                {item.mediaFiles[0].fileType === "Image" ? (
                    <Image
                        source={{ uri: item.mediaFiles[0].location }}
                        style={{ flex: 1, width: "99%" }}
                        resizeMode="contain"
                    />
                ) : (
                    <VideoPlayer
                        source={{ uri: item.mediaFiles[0].location }}
                        style={{ flex: 1, width: "99%" }}
                        resizeMode="contain"
                        repeat={true}
                        paused={index !== currentIndex ? true : false}
                        tapAnywhereToPause={true}
                        disableFullscreen={true}
                        disablePlayPause={true}
                        disableSeekbar={true}
                        disableVolume={true}
                        disableTimer={true}
                        disableBack={true}
                    />
                )}
                <View style={styles.header}>
                    <View style={styles.row}>
                        <TouchableOpacity
                            style={styles.row}
                            onPress={() => viewProfile(item.author._id)}
                        >
                            <Image
                                source={
                                    item.author.profileImagePath
                                        ? { uri: item.author.profileImagePath }
                                        : require("../assets/images/Spiderman.jpg")
                                }
                                style={styles.avatar}
                            />
                            <Text style={styles.name}>
                                {item.author.name.length < 18
                                    ? `${item.author.name}`
                                    : `${item.author.name.substring(0, 15)}...`}
                            </Text>
                        </TouchableOpacity>
                        <Text
                            style={{
                                color: Colors.white,
                                fontSize: 16,
                                marginLeft: 5,
                            }}
                        >
                            {getTimeToNow(item.createdAt)}
                        </Text>
                    </View>
                    <View style={styles.row}>
                        {uid === item.author._id && (
                            <TouchableOpacity
                                onPress={() => {
                                    deleteAStory(item);
                                }}
                                style={{ padding: 5 }}
                            >
                                <Icon
                                    type={Icons.Feather}
                                    name="delete"
                                    color={Colors.white}
                                    size={25}
                                />
                            </TouchableOpacity>
                        )}
                        <TouchableOpacity
                            onPress={() => navigation.goBack()}
                            style={{ padding: 5 }}
                        >
                            <Icon
                                type={Icons.AntDesign}
                                name="close"
                                color={Colors.white}
                                size={25}
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.bottom}>
                    <TouchableOpacity
                        style={{ padding: 5 }}
                        onPress={() => toggleLike(item)}
                    >
                        <Icon
                            type={Icons.FontAwesome}
                            name="heart"
                            color={item.isLiked ? Colors.red : Colors.white}
                            size={30}
                        />
                    </TouchableOpacity>
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ height: windowHeight }}>
                <FlatList
                    ref={flatListRef}
                    pagingEnabled={true}
                    horizontal={true}
                    showsHorizontalScrollIndicator={false}
                    data={stories}
                    keyExtractor={(item, index) => "key " + index}
                    renderItem={({ item, index }) => (
                        <Story item={item} index={index} />
                    )}
                    getItemLayout={getItemLayout} // Add getItemLayout prop
                    onScroll={(event) => {
                        const { contentOffset, layoutMeasurement } =
                            event.nativeEvent;
                        const index = Math.floor(
                            contentOffset.x / (layoutMeasurement.width - 1)
                        );
                        setCurrentIndex(index);
                    }}
                />
            </View>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: Colors.black,
    },
    row: {
        flexDirection: "row",
        alignItems: "center",
    },
    header: {
        position: "absolute",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        width: "100%",
        padding: 15,
        top: 0,
        left: 0,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        borderWidth: 2,
        borderColor: Colors.black,
    },
    name: {
        color: Colors.white,
        fontSize: 16,
        marginLeft: 6,
        fontWeight: "bold",
    },
    bottom: {
        position: "absolute",
        bottom: 10,
        right: 10,
    },
});
