import { useEffect, useState } from 'react';
import ApiManager from './ApiManager';

export const getStoryById = async (storyId, token) => {
  try {
    const result = await ApiManager.get(`/story/${storyId}`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return result.data;
  } catch (error) {
    return error;
  }
};

export const getAllStory = async (userId, token) => {
  try {
    const result = await ApiManager.get(`/${userId}/story`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return result.data;
  } catch (error) {
    return error;
  }
};

export const getStoryFeed = async (userId, token) => {
  try {
    const result = await ApiManager.get(`/${userId}/story-feed`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return result.data;
  } catch (error) {
    return error;
  }
};

export const createStory = async (data, userId, token) => {
  try {
    const result = await ApiManager.post(`/${userId}/story`, data, {
      headers: {
        Authorization: 'Bearer ' + token,
        'Content-Type': 'multipart/form-data',
      },
    });
    return result.data;
  } catch (error) {
    console.error('Failed to create story:', error);
    if (error.response && error.response.data && error.response.data.errorMessage) {
      throw new Error(error.response.data.errorMessage);
    } else {
      throw new Error('Failed to create story.');
    }
  }
};



export const likeStory = async (authorId, storyId, token) => {
  try {
    const result = await ApiManager.patch(`/${authorId}/story/${storyId}`, null, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return result.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errorMessage) {
      throw new Error(error.response.data.errorMessage);
    } else {
      throw new Error('Failed to like story.');
    }
  }
};

export const deleteStoryApi = async (authorId, storyId, token) => {
  try {
    const result = await ApiManager.delete(`/${authorId}/story/${storyId}`, {
      headers: {
        Authorization: 'Bearer ' + token,
      },
    });
    return result.data;
  } catch (error) {
    if (error.response && error.response.data && error.response.data.errorMessage) {
      throw new Error(error.response.data.errorMessage);
    } else {
      throw new Error('Failed to delete story.');
    }
  }
};
