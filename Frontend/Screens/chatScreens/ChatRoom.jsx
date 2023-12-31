import React, { useEffect, useRef, useState } from "react";
import {
    View,
    TextInput,
    Text,
    FlatList,
    StyleSheet,
    Keyboard,
    ScrollView,
    Image,
    TouchableOpacity,
} from "react-native";
import MessageComponent from "../../components/ui/ChatMessage";
import { useDispatch, useSelector } from "react-redux";
import chatApi from "../../api/chatApi";
import Icon, { Icons } from "../../components/ui/Icons";
import Colors from "../../constants/Colors";
import * as ImagePicker from "expo-image-picker";
import { ToastAndroid } from "react-native";
import { Toast } from "../../components/ui/Toast";
import { emitEvent, subscribeToEvent } from "../../utils/socket";
import { setCallShow, setDataCall } from "../../reducers/UtilsReducer";
import { UploadImage } from "../../api/Utils";
const { v4: uuidv4 } = require("uuid");

class Message {
    constructor(id, message, imageLink, senderId, createdAt) {
        this.id = id;
        this.message = message;
        this.imageLink = imageLink;
        this.senderId = senderId;
        this.createdAt = createdAt;
    }
}

const ChatRoom = ({ navigation, route }) => {
    const { chatRoomId, imageSource, title } = route.params;
    const uid = useSelector((state) => state.uid.id);
    const jwt = useSelector((state) => state.token.key);
    const [chatMessages, setChatMessages] = useState([]);
    const [message, setMessage] = useState("");
    const dispatch = useDispatch();

    const [isFocused, setIsFocused] = useState(false);
    const [mediaFile, setMediaFile] = useState();
    const messageRef = useRef(null);

    const flatListRef = useRef(null);

    useEffect(() => {
        if (flatListRef.current !== null) {
            flatListRef.current.scrollToEnd();
        }
    }, [chatMessages]);

    const handleKeyboardDismiss = () => {
        setIsFocused(false);
        messageRef.current?.blur();
    };

    useEffect(() => {
        const keyboardDidHideListener = Keyboard.addListener(
            "keyboardDidHide",
            handleKeyboardDismiss
        );
        return () => {
            keyboardDidHideListener.remove();
        };
    }, []);

    const takePhotoFromCamera = async () => {
        const { status } = await ImagePicker.requestCameraPermissionsAsync();
        if (status !== "granted") {
            Toast("Permission to access camera denied");
            return;
        }

        const result = await ImagePicker.launchCameraAsync({
            allowsEditing: false,
            quality: 1,
        });

        if (!result.canceled) {
            setMediaFile({
                uri: result.uri,
                type: "image/jpeg",
                name: uuidv4() + "_post-file",
            });
        }
    };

    const choosePhotoFromLibrary = async () => {
        try {
            const { status } =
                await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (status !== "granted") {
                ToastAndroid.show(
                    "Permission to access media library denied",
                    ToastAndroid.SHORT
                );
                return;
            }

            const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
            });

            if (!result.canceled) {
                setMediaFile({
                    uri: result.uri,
                    type: "image/jpeg", // or result.type
                    name: uuidv4() + "_post-file", // or result.name
                });
            }
        } catch (error) {
            ToastAndroid.show(error.message, ToastAndroid.SHORT);
        }
    };

    useEffect(() => {
        const getAllMessages = async () => {
            const rawMessages = await chatApi.getMessagesFromAChatRoom(
                jwt,
                chatRoomId
            );
            const messages = rawMessages.data.map((rawMessage) => {
                const { _id, message, imageLink, senderId, createdAt } =
                    rawMessage;
                return { _id, message, imageLink, senderId, createdAt };
            });
            setChatMessages(messages);
        };

        emitEvent("joinRoom", { chatRoomId });

        subscribeToEvent("newMessage", (newRawMessage) => {
            const newMessage = new Message(
                newRawMessage._id,
                newRawMessage.message,
                newRawMessage.imageLink,
                newRawMessage.senderId,
                newRawMessage.createdAt
            );
            setChatMessages((prevChatMessages) => [
                ...prevChatMessages,
                newMessage,
            ]);
        });

        getAllMessages();

        return () => {
            emitEvent("leaveRoom", { chatRoomId });
        };
    }, []);

    const handleNewMessage = () => {
        const date = new Date();
        const messageObject = new Message(
            (Math.random() + 1).toString(36).substring(7),
            message,
            null,
            uid,
            date.toISOString()
        );
        setChatMessages((messages) => [...messages, messageObject]);

        if (mediaFile) {
            const formData = new FormData();
            formData.append("media-file", mediaFile);
            UploadImage(formData, uid)
                .then((imageLink) => {
                    setChatMessages((messages) => {
                        emitEvent("newMessage", {
                            chatRoomId: chatRoomId,
                            message,
                            senderId: uid,
                            imageLink: imageLink.data,
                        });

                        return messages.map((message) => {
                            if (message.id === messageObject.id) {
                                message.imageLink = imageLink.data;
                                return message;
                            } else return message;
                        });
                    });
                })
                .catch((e) => {
                    console.error("unable to upload" + e.toString());
                });
        } else {
            emitEvent("newMessage", {
                chatRoomId: chatRoomId,
                message,
                senderId: uid,
                imageLink: null,
            });
        }

        setMediaFile(undefined);
        setMessage("");
    };

    return (
        <View style={{ flex: 1 }}>
            <View style={styles.topView}>
                <View
                    style={{
                        margin: 15,
                        flexDirection: "row",
                        alignItems: "center",
                    }}
                >
                    <TouchableOpacity
                        onPress={() => {
                            navigation.goBack();
                        }}
                        style={{ marginRight: 10 }}
                    >
                        <Icon type={Icons.Ionicons} name="arrow-back" />
                    </TouchableOpacity>
                    <Image style={styles.roomImage} source={imageSource} />
                    <Text style={styles.roomName}>{title}</Text>
                    <View style={{ flexDirection: "row" }}>
                        <View style={{ marginHorizontal: 30 }}>
                            <TouchableOpacity
                                onPress={() => {
                                    dispatch(
                                        setDataCall({
                                            isCaller: true,
                                            chatRoomId: chatRoomId,
                                            calleeName: title,
                                            calleeImageSource: imageSource,
                                            isVoiceCall: true,
                                        })
                                    );
                                    // show modal
                                    dispatch(setCallShow(true));
                                }}
                            >
                                <Icon type={Icons.Ionicons} name="call" />
                            </TouchableOpacity>
                        </View>
                        <View>
                            <TouchableOpacity
                                onPress={() => {
                                    dispatch(
                                        setDataCall({
                                            isCaller: true,
                                            chatRoomId: chatRoomId,
                                            calleeName: title,
                                            calleeImageSource: imageSource,
                                            isVoiceCall: false,
                                        })
                                    );
                                    // show modal
                                    dispatch(setCallShow(true));
                                }}
                            >
                                <Icon type={Icons.Ionicons} name="videocam" />
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </View>
            <View style={styles.parentView}>
                {chatMessages[0] ? (
                    <FlatList
                        data={chatMessages}
                        renderItem={({ item }) => (
                            <MessageComponent
                                chat={item}
                                userId={uid}
                                avatarSource={imageSource}
                            />
                        )}
                        ref={flatListRef}
                        keyExtractor={(item, index) => "key" + index}
                        contentContainerStyle={{
                            flexGrow: 1,
                            justifyContent: "flex-end",
                        }}
                    />
                ) : (
                    <Text
                        style={{
                            color: "black",
                            fontSize: 24,
                            alignSelf: "center",
                            marginTop: 300,
                        }}
                    >
                        No message yet!
                    </Text>
                )}
            </View>

            <View style={styles.bottomView}>
                <View
                    style={{
                        flexDirection: "row",
                        alignItems: "center",
                        paddingHorizontal: 10,
                    }}
                >
                    <View style={{ marginLeft: 10, flex: 1, maxHeight: 200 }}>
                        <ScrollView
                            style={{ flexGrow: 0 }}
                            showsVerticalScrollIndicator={false}
                        >
                            <TextInput
                                ref={messageRef}
                                value={message}
                                onChangeText={setMessage}
                                onFocus={() => setIsFocused(true)}
                                onBlur={() => setIsFocused(false)}
                                placeholder="Write a message..."
                                multiline={true}
                            />
                            {mediaFile && (
                                <View style={{ marginRight: 15 }}>
                                    <Image
                                        style={{
                                            borderRadius: 3,
                                            margin: 5,
                                            height: 200,
                                        }}
                                        resizeMode="cover"
                                        source={{ uri: mediaFile.uri }}
                                    />
                                    <View
                                        style={{
                                            position: "absolute",
                                            top: 5,
                                            right: 10,
                                        }}
                                    >
                                        <TouchableOpacity
                                            onPress={() =>
                                                setMediaFile(undefined)
                                            }
                                        >
                                            <Icon
                                                type={Icons.FontAwesome}
                                                name="close"
                                                color={Colors.gray}
                                            />
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            )}
                        </ScrollView>
                    </View>

                    {!isFocused && !message && !mediaFile && (
                        <View style={{ padding: 10 }}>
                            <TouchableOpacity onPress={handleNewMessage}>
                                <Text
                                    style={{
                                        color: Colors.bag10Bg,
                                        fontSize: 15,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Send
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>
                {(isFocused || message || mediaFile) && (
                    <View
                        style={{
                            flexDirection: "row",
                            alignItems: "center",
                            borderTopWidth: 1,
                            borderTopColor: Colors.darkGray,
                            paddingHorizontal: 10,
                            paddingTop: 5,
                        }}
                    >
                        <View
                            style={{
                                flex: 1,
                                flexDirection: "row",
                                alignItems: "center",
                            }}
                        >
                            <TouchableOpacity
                                style={{ marginHorizontal: 10 }}
                                onPress={takePhotoFromCamera}
                            >
                                <Icon
                                    type={Icons.Ionicons}
                                    name="camera-outline"
                                    size={30}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ marginHorizontal: 10 }}
                                onPress={choosePhotoFromLibrary}
                            >
                                <Icon
                                    type={Icons.Ionicons}
                                    name="image-outline"
                                    size={30}
                                />
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={{ marginHorizontal: 10 }}
                                onPress={() => {}}
                            >
                                <Icon
                                    type={Icons.Ionicons}
                                    name="videocam-outline"
                                    size={30}
                                />
                            </TouchableOpacity>
                        </View>
                        <View style={{ padding: 10 }}>
                            <TouchableOpacity onPress={handleNewMessage}>
                                <Text
                                    style={{
                                        color: Colors.bag10Bg,
                                        fontSize: 15,
                                        fontWeight: "bold",
                                    }}
                                >
                                    Send
                                </Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                )}
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    parentView: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 15,
    },
    topView: {
        backgroundColor: "white",
        elevation: 10,
    },
    messageInput: {
        borderWidth: 1,
        padding: 15,
        flex: 1,
        marginRight: 10,
        borderRadius: 20,
    },
    btnSendMessage: {
        width: "30%",
        backgroundColor: "green",
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 50,
    },
    bottomView: {
        backgroundColor: "white",
        elevation: 10,
        paddingVertical: 10,
    },
    roomImage: {
        width: 30,
        height: 30,
        borderRadius: 35,
        marginRight: 8,
    },
    roomName: {
        flex: 1,
        fontSize: 18,
        color: "black",
        fontWeight: "500",
    },
});

export default ChatRoom;
