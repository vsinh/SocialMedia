/* eslint-disable react-native/no-inline-styles */
import {
    StyleSheet,
    Text,
    View,
    ImageBackground,
    Modal,
    TouchableOpacity,
    ScrollView,
} from "react-native";
import React, { useEffect, useState } from "react";
import RectangleButton from "../components/ui/RectangleButton";
import SignUpHrScreen from "./SignUpScreen";
import LoginScreen from "./LoginScreen";
import { nameStorage, retrieveData } from "../reducers/AsyncStorage";

import { useDispatch, useSelector } from "react-redux";
import { setStatus } from "../reducers/LoadingReducer";
import AppLoader from "../components/ui/AppLoader";
import { Toast } from "../components/ui/Toast";
import ForgetPassScreen from "./ForgetPassScreen";
import ChangePassScreen from "./ChangePassScreen";

function FirstTimeUseScreen({ navigation }) {
    const [modalHrVisible, setModalHrVisible] = useState(false);
    const [modalLoginVisible, setModalLoginVisible] = useState(false);
    const [modalForgetPassVisible, setModalForgetPassVisible] = useState(false);
    const [modalChangePassVisible, setModalChangePassVisible] = useState(false);
    const isLoading = useSelector((state) => state.loading.status);
    const dispatch = useDispatch();
    function closeModalLogin() {
        setModalLoginVisible(false);
    }
    function closeModalHr() {
        setModalHrVisible(false);
    }

    function closeModalForgetPass() {
        setModalForgetPassVisible(false);
    }

    function closeModalChangePass() {
        setModalChangePassVisible(false);
    }

    const navigateToMain = (jwt) => {
        navigation.navigate("loading", { jwt });
    };

    useEffect(() => {
        const checkLogin = async () => {
            dispatch(setStatus(true));

            retrieveData(nameStorage.isLogin)
                .then((isLogin) => {
                    if (isLogin === true) {
                        retrieveData(nameStorage.jwtToken).then((jwt) => {
                            navigateToMain(jwt);
                        });
                    }
                })
                .catch((error) => {
                    Toast(error.message);
                })
                .finally(() => {
                    dispatch(setStatus(false));
                });
        };

        checkLogin();
    }, []);

    return (
        <View style={styles.container}>
            <ImageBackground
                resizeMode={"stretch"}
                style={styles.image}
                source={require("../assets/images/xiao.png")}
            >
                <View style={[styles.viewSurround, { marginTop: 100 }]}>
                    <Text style={styles.title}>Fakebook</Text>
                </View>

                <View style={[styles.buttonContainer, { marginTop: 320 }]}>
                    <RectangleButton
                        style={styles.button}
                        onPress={() => {
                            setModalHrVisible(true);
                        }}
                    >
                        <View style={styles.centering}>
                            <Text
                                style={[styles.textOut, { marginBottom: 10 }]}
                            >
                                Sign up
                            </Text>
                        </View>
                    </RectangleButton>
                </View>

                <View style={styles.lastView}>
                    <Text style={styles.loginText}>
                        Already have an account?{" "}
                        <Text
                            onPress={() => {
                                setModalLoginVisible(true);
                            }}
                            style={[
                                styles.loginText,
                                { textDecorationLine: "underline" },
                            ]}
                        >
                            Log in
                        </Text>
                    </Text>
                    <Text
                        onPress={() => {
                            setModalChangePassVisible(true);
                        }}
                        style={[
                            styles.loginText,
                            { textDecorationLine: "underline", marginTop: 10 },
                        ]}
                    >
                        Change password
                    </Text>
                </View>
                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalHrVisible}
                    onRequestClose={() => {
                        setModalHrVisible(!modalHrVisible);
                    }}
                >
                    {isLoading ? <AppLoader /> : null}
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPressOut={closeModalHr}
                    />
                    <View style={{ flex: 2 }}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            <SignUpHrScreen
                                handleCloseModal={setModalHrVisible}
                                handleToLogin={() => {
                                    closeModalHr();
                                    setModalLoginVisible(true);
                                }}
                            />
                        </ScrollView>
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalLoginVisible}
                    onRequestClose={() => {
                        setModalLoginVisible(!modalLoginVisible);
                    }}
                >
                    {isLoading ? <AppLoader /> : null}
                    <TouchableOpacity
                        style={{ flex: 1 }}
                        activeOpacity={1}
                        onPressOut={closeModalLogin}
                    />
                    <View style={{ flex: 1 }}>
                        <LoginScreen
                            handleToSignUp={() => {
                                closeModalLogin();
                                setModalHrVisible(true);
                            }}
                            handleNavigate={navigateToMain}
                            handleOpenForgetPass={() => {
                                closeModalLogin();
                                setModalForgetPassVisible(true);
                            }}
                        />
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalForgetPassVisible}
                    onRequestClose={() => {
                        setModalForgetPassVisible(!modalForgetPassVisible);
                    }}
                >
                    {isLoading ? <AppLoader /> : null}
                    <TouchableOpacity
                        style={{ flex: 2 }}
                        activeOpacity={1}
                        onPressOut={closeModalForgetPass}
                    />
                    <View style={{ flex: 1 }}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            <ForgetPassScreen
                                handleCloseModal={closeModalForgetPass}
                            />
                        </ScrollView>
                    </View>
                </Modal>

                <Modal
                    animationType="slide"
                    transparent={true}
                    visible={modalChangePassVisible}
                    onRequestClose={() => {
                        setModalChangePassVisible(!modalChangePassVisible);
                    }}
                >
                    {isLoading ? <AppLoader /> : null}
                    <TouchableOpacity
                        style={{ flex: 2 }}
                        activeOpacity={1}
                        onPressOut={closeModalChangePass}
                    />
                    <View style={{ flex: 3 }}>
                        <ScrollView contentContainerStyle={{ flexGrow: 1 }}>
                            <ChangePassScreen
                                handleCloseModal={closeModalChangePass}
                            />
                        </ScrollView>
                    </View>
                </Modal>
            </ImageBackground>
        </View>
    );
}
export default FirstTimeUseScreen;
const styles = StyleSheet.create({
    container: {
        flex: 1,
    },
    viewSurround: {
        width: 320,
    },
    image: {
        flex: 1,
        resizeMode: "stretch",
        padding: 8,
        justifyContent: "center",
        alignItems: "center",
    },
    title: {
        fontSize: 36,
        fontFamily: "Roboto",
        fontWeight: "bold",
        color: "#fff",
        alignSelf: "center",
    },
    textOut: {
        fontSize: 18,
        fontFamily: "Roboto",
        fontWeight: "bold",
        color: "#fff",
        textAlign: "right",
    },
    buttonContainer: {
        margin: 10,
    },
    button: {
        width: 200,
        height: 40,
    },
    lastView: {
        borderColor: "white",
        borderTopWidth: 2,
        padding: 20,
        width: 350,
        alignItems: "center",
        marginTop: 30,
    },
    loginText: {
        fontSize: 14,
        fontFamily: "Roboto",
        fontWeight: "bold",
        color: "#fff",
    },
    centering: {
        flex: 1,
        alignSelf: "center",
        alignContent: "center",
    },
});
