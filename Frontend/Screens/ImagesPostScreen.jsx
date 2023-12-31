import {
    View,
    Animated,
    useWindowDimensions,
    StyleSheet,
    SafeAreaView,
    TouchableOpacity,
} from "react-native";
import React, { useRef } from "react";
import { Image } from "react-native";
import Colors from "../constants/Colors";
import { ScrollView } from "react-native-gesture-handler";
import Icon, { Icons } from "../components/ui/Icons";

export default function ImagesPostScreen({ navigation: { goBack }, route }) {
    const scrollX = useRef(new Animated.Value(0)).current;
    let { width: windowWitdh, height: windowHeight } = useWindowDimensions();
    windowHeight = windowHeight - 150;

    const { images } = route.params;

    return (
        <SafeAreaView style={styles.container}>
            <View style={{ position: "absolute", top: 10, left: 10 }}>
                <TouchableOpacity onPress={goBack}>
                    <Icon
                        type={Icons.Feather}
                        name="arrow-left"
                        color={Colors.white}
                        size={30}
                    />
                </TouchableOpacity>
            </View>
            <View style={[styles.scrollContainer, { height: windowHeight }]}>
                <ScrollView
                    horizontal={true}
                    pagingEnabled
                    showsHorizontalScrollIndicator={false}
                    onScroll={Animated.event(
                        [{ nativeEvent: { contentOffset: { x: scrollX } } }],
                        { useNativeDriver: false }
                    )}
                    scrollEventThrottle={16}
                    contentOffset={{ x: windowWitdh * 0, y: 0 }}
                >
                    {images.map((image, imageIndex) => {
                        return (
                            <Animated.View
                                style={{ width: windowWitdh }}
                                key={imageIndex}
                            >
                                <Image
                                    source={{ uri: image.location }}
                                    style={styles.card}
                                    resizeMode="contain"
                                />
                            </Animated.View>
                        );
                    })}
                </ScrollView>
            </View>

            <View style={styles.indicatorContainer}>
                {images.map((image, imageIndex) => {
                    const width = scrollX.interpolate({
                        inputRange: [
                            windowWitdh * (imageIndex - 1),
                            windowWitdh * imageIndex,
                            windowWitdh * (imageIndex + 1),
                        ],
                        outputRange: [8, 16, 8],
                        extrapolate: "clamp",
                    });
                    return (
                        <Animated.View
                            style={[styles.normalDots, { width }]}
                            key={imageIndex}
                        />
                    );
                })}
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
    scrollContainer: {},
    card: {
        flex: 1,
        width: "95%",
        marginVertical: 10,
        overflow: "hidden",
        alignSelf: "center",
    },
    indicatorContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
    },
    normalDots: {
        width: 8,
        height: 8,
        borderRadius: 4,
        backgroundColor: Colors.purple,
        marginHorizontal: 4,
    },
});
