import React from 'react';
import {
  View,
  Text,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import Colors from '../../constants/Colors';
import Icon, { Icons } from './Icons';

export default function MenuStatus(props) {
  const { handleEdit, handleDelete } = props;
  return (
    <View style={styles.container}>
      <TouchableOpacity onPress={handleEdit} style={styles.contentButton}>
        <Icon type={Icons.Feather} name="edit" size={20} color={Colors.gray} />
        <Text style={{ marginLeft: 10 }}>Edit</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={handleDelete} style={styles.contentButton}>
        <Icon type={Icons.Feather} name="trash" size={20} color={Colors.gray} />
        <Text style={{ marginLeft: 10 }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    backgroundColor: Colors.white,
    padding: 10,
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    borderBottomRightRadius: 10,
    elevation: 5,
  },
  contentButton: {
    padding: 10,
    flexDirection: 'row',
    alignItems: 'center',
  },
});
