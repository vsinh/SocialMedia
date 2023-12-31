import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native"
import React from "react"
import Colors from "../../constants/Colors"
import Icon, { Icons } from "./Icons"

export default function ShowNetwork(props) {
  const { item, navigation } = props

  const navigateToProfile = () => {
    navigation.navigate("profileOther", { id: item._id })
  }

  return (
    <View
      style={{
        borderRadius: 10,
        borderWidth: 1,
        borderColor: Colors.gray,
        margin: 7,
        width: 160,
        height: 240,
        alignItems: "center"
      }}
    >
      <View style={{ flex: 1, width: "100%", alignItems: "center" }}>
        <Image
          source={
            item.backgroundImagePath
              ? { uri: item.backgroundImagePath }
              : require("../../assets/images/DefaultBackgroundAvatar.jpg")
          }
          style={{
            width: "100%",
            height: 70,
            borderTopRightRadius: 10,
            borderTopLeftRadius: 10
          }}
        />
        <View
          style={{
            elevation: 5,
            height: 100,
            width: 100,
            marginTop: -40,
            borderRadius: 100
          }}
        >
          <Image
            source={
              item.profileImagePath
                ? { uri: item.profileImagePath }
                : require("../../assets/images/Spiderman.jpg")
            }
            style={{
              borderRadius: 100,
              flex: 1,
              width: undefined,
              height: undefined
            }}
          />
        </View>
        <Text
          style={{
            fontSize: 19,
            color: Colors.black,
            fontWeight: "bold",
            paddingHorizontal: 7,
            marginTop: 5,
            textAlign: "center"
          }}
        >
          {item.name}
        </Text>
      </View>
      <View style={{ height: 65, alignItems: "center" }}>
        {item.connections?.length > 0 ? (
          <View style={styles.flexCenter}>
            <Icon
              icon="ellipsis-horizontal-circle"
              type={Icons.Ionicons}
              size={16}
              color={Colors.gray}
            />
            <Text style={{ fontSize: 13, marginLeft: 2 }}>
              {item.connections.length} connections
            </Text>
          </View>
        ) : (
          <View style={{ height: 20 }} />
        )}
        <TouchableOpacity
          onPress={navigateToProfile}
          style={{
            bottom: 10,
            borderWidth: 1,
            borderColor: Colors.bluePrimary,
            borderRadius: 50,
            paddingHorizontal: 30,
            paddingVertical: 2,
            marginVertical: 10
          }}
        >
          <Text
            style={{
              fontSize: 19,
              fontWeight: "bold",
              color: Colors.bluePrimary
            }}
          >
            View
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  flexCenter: {
    flexDirection: "row",
    alignItems: "center"
  }
})
