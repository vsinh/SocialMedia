import ApiManager from "./ApiManager";
import axios from "axios";
export const userLogin = async (data) => {
    try {
        const result = await ApiManager("/login", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: data,
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const userSignup = async (data) => {
    try {
        const result = await ApiManager("/signup", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            data: data,
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const userLogout = async (token) => {
    try {
        const result = await ApiManager("/logout", {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const getInfoUser = async (data) => {
    try {
        const result = await ApiManager(`/${data}`, {
            method: "GET",
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const postAvatarImg = async (data, userId, token) => {
    try {
        const result = await ApiManager(`/${userId}/profile-image`, {
            method: "post",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "multipart/form-data",
            },
            data: data,
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const postBackgrImg = async (data, userId, token) => {
    try {
        const result = await ApiManager(`/${userId}/background-image`, {
            method: "post",
            headers: {
                Authorization: "Bearer " + token,
                "Content-Type": "multipart/form-data",
            },
            data: data,
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const updateUser = async (data, userId, token) => {
    try {
        const result = await ApiManager(`/${userId}`, {
            method: "PUT",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: data,
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const followUser = async (data, userId, token) => {
    try {
        const result = await ApiManager(`/${userId}/follow`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: {
                userFollowedId: data,
            },
        });
        return result;
    } catch (error) {
        return error;
    }
};

export const unfollowUser = async (data, userId, token) => {
    try {
        const result = await ApiManager(`/${userId}/unfollow`, {
            method: "POST",
            headers: {
                Authorization: "Bearer " + token,
            },
            data: {
                userUnfollowedId: data,
            },
        });
        return result;
    } catch (error) {
        return error;
    }
};
