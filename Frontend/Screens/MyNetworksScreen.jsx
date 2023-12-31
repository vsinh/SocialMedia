import {
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ScrollView
  } from "react-native"
  import React, { useEffect, useState } from "react"
  import Icon, { Icons } from "../components/ui/Icons"
  import ShowNetwork from "../components/ui/ShowNetwork"
  import { useDispatch, useSelector } from "react-redux"
  import { Toast } from "../components/ui/Toast"
  import { getAllFrOfUser } from "../api/friendApi"
  import { setStatus } from "../reducers/LoadingReducer"
  import { useIsFocused } from "@react-navigation/native"
  
  export default function MyNetworksScreen({ navigation }) {
    const uid = useSelector(state => state.uid.id)
    const jwt = useSelector(state => state.token.key)
  
    const dispatch = useDispatch()
  
    const [connections, setConnection] = useState([])
  
    const navigateBack = () => {
      navigation.goBack()
    }
  
    const isFocused = useIsFocused()
  
    useEffect(() => {
      const getInfoConnection = async () => {
        // for (const id of connectionsId) {
        try {
          dispatch(setStatus(true))
          // const response: any = await getInfoUser(id);
          const response = await getAllFrOfUser(uid, jwt)
          console.log(response.data)
          dispatch(setStatus(false))
          if (response.status === 200) {
            setConnection(prev => response.data)
          } else {
            console.log(response.status)
            throw new Error(response.data.errorMessage)
          }
        } catch (error) {
          Toast(error.message)
        }
        // }
      }
      if (isFocused) getInfoConnection()
    }, [isFocused])
  
    if (connections.length === 0) {
      return (
        <View>
          <View style={styles.topView}>
            <View style={{ margin: 10, flexDirection: "row" }}>
              <TouchableOpacity onPress={navigateBack} style={{ marginTop: -3 }}>
                <Icon type={Icons.Ionicons} name="arrow-back" size={35} />
              </TouchableOpacity>
              <Text style={styles.title}>My Network</Text>
            </View>
          </View>
          <Text
            style={{
              marginTop: 50,
              fontSize: 25,
              alignSelf: "center",
              color: "gray"
            }}
          >
            You have no connections
          </Text>
        </View>
      )
    } else {
      return (
        <View style={{ flex: 1 }}>
          <View style={{ flex: 1 }}>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={{ flexGrow: 1 }}
            >
              <View style={styles.modalContent}>
                <View style={{ height: 70 }} />
                <View style={{ marginHorizontal: 20 }}></View>
                <View style={styles.connectionsContainer}>
                  {connections.map((item, index) => (
                    <ShowNetwork
                      item={item}
                      navigation={navigation}
                      key={index}
                    />
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>
          <View style={styles.topView}>
            <View style={{ margin: 10, flexDirection: "row" }}>
              <TouchableOpacity onPress={navigateBack} style={{ marginTop: -3 }}>
                <Icon type={Icons.Ionicons} name="arrow-back" size={35} />
              </TouchableOpacity>
              <Text style={styles.title}>My Network</Text>
            </View>
          </View>
        </View>
      )
    }
  }
  
  const styles = StyleSheet.create({
    modalContent: {
      backgroundColor: "#fff",
      flex: 1,
      alignItems: "center"
    },
    title: {
      fontSize: 20,
      color: "black",
      marginLeft: 30,
      fontWeight: "bold"
    },
    bottomView: {
      position: "absolute",
      bottom: 0,
      left: 0,
      right: 0,
      height: 70,
      justifyContent: "center",
      alignItems: "center",
      borderTopColor: "#ccc",
      borderTopWidth: 1,
      backgroundColor: "white"
    },
    bottomText: {
      color: "white",
      fontSize: 18
    },
    topView: {
      position: "absolute",
      top: 0,
      left: 0,
      right: 0,
      backgroundColor: "white",
      elevation: 10
    },
    connectionsContainer: {
      width: "90%",
      flexDirection: "row",
      alignItems: "flex-start",
      flexWrap: "wrap",
      justifyContent: "center"
    }
  })
  