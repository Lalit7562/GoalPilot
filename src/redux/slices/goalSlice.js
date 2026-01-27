import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const STORAGE_KEY = '@goalpilot_state';
const BASE_URL = Platform.OS === 'web' ? 'http://localhost:5002' : 'http://172.17.0.47:5002';
const API_URL = `${BASE_URL}/api`;

export const fetchTodayTasks = createAsyncThunk('goals/fetchTodayTasks', async (mood, { getState }) => {
  const { token } = getState().goals;
  const url = mood ? `${API_URL}/tasks/today?mood=${mood}` : `${API_URL}/tasks/today`;
  const response = await fetch(url, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  const data = await response.json();
  return data;
});

export const updateTaskOnServer = createAsyncThunk('goals/updateTaskOnServer', async ({ id, status }, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/tasks/${id}/progress`, {
    method: 'PATCH',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify({ status }),
  });
  return await response.json();
});

export const createGoalWithAI = createAsyncThunk('goals/createGoalWithAI', async (params, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/goals/generate`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || `Server Error ${response.status}`);
  }
  
  return await response.json();
});

export const fetchGoalDetails = createAsyncThunk('goals/fetchGoalDetails', async (id, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/goals/${id}`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
});

export const fetchAllGoals = createAsyncThunk('goals/fetchAllGoals', async (_, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/goals`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
});

export const fetchStats = createAsyncThunk('goals/fetchStats', async (_, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/analytics/stats`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return await response.json();
});

export const fetchDashboardSummary = createAsyncThunk('goals/fetchDashboardSummary', async (_, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/analytics/summary`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) return null;
  return await response.json();
});

export const googleLogin = createAsyncThunk('goals/googleLogin', async (userData) => {
  const response = await fetch(`${API_URL}/auth/google-login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(userData),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Google Login failed');
  return data;
});

export const requestOtp = createAsyncThunk('goals/requestOtp', async (phoneNumber) => {
  const response = await fetch(`${API_URL}/auth/request-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Failed to request OTP');
  return data;
});

export const verifyOtp = createAsyncThunk('goals/verifyOtp', async ({ phoneNumber, otp }) => {
  const response = await fetch(`${API_URL}/auth/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ phoneNumber, otp }),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Invalid OTP');
  return data;
});

export const loadState = createAsyncThunk('goals/loadState', async () => {
  const jsonValue = await AsyncStorage.getItem(STORAGE_KEY);
  return jsonValue != null ? JSON.parse(jsonValue) : null;
});

const saveStateToStorage = async (state) => {
  try {
    const jsonValue = JSON.stringify(state);
    await AsyncStorage.setItem(STORAGE_KEY, jsonValue);
  } catch (e) {
    console.error("Error saving state", e);
  }
};

const initialState = {
  tasks: [],
  goalsList: [],
  currentGoal: null,
  mood: null,
  progress: 0,
  loading: false,
  refreshing: false,
  isUpdating: false,
  isGenerating: false,
  coachMessage: '',
  dailyFocus: '',
  microHabit: '',
  dashboardSummary: null,
  user: null,
  token: null,
  isAuthenticated: false,
  stats: { history: [], streak: 0, totalCompleted: 0 }
};

const taskSlice = createSlice({
  name: 'goals',
  initialState,
  reducers: {
    setMood: (state, action) => {
      state.mood = action.payload;
      saveStateToStorage(state);
    },
    logout: (state) => {
      Object.assign(state, initialState);
      saveStateToStorage(state);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(loadState.fulfilled, (state, action) => {
        if (action.payload) {
          state.tasks = action.payload.tasks || [];
          state.mood = action.payload.mood || null;
          state.progress = action.payload.progress || 0;
          state.goalsList = action.payload.goalsList || [];
          state.stats = action.payload.stats || initialState.stats;
          state.user = action.payload.user || null;
          state.token = action.payload.token || null;
          state.isAuthenticated = !!action.payload.token;
          state.dashboardSummary = action.payload.dashboardSummary || null;
        }
      })
      .addCase(googleLogin.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        saveStateToStorage(state);
      })
      .addCase(verifyOtp.fulfilled, (state, action) => {
        state.user = action.payload.user;
        state.token = action.payload.token;
        state.isAuthenticated = true;
        saveStateToStorage(state);
      })
      .addCase(fetchStats.fulfilled, (state, action) => {
        state.stats = action.payload;
        saveStateToStorage(state);
      })
      .addCase(fetchDashboardSummary.fulfilled, (state, action) => {
        state.dashboardSummary = action.payload;
        state.refreshing = false;
        saveStateToStorage(state);
      })
      .addCase(fetchDashboardSummary.pending, (state) => {
        if (state.dashboardSummary) state.refreshing = true;
        else state.loading = true;
      })
      .addCase(fetchDashboardSummary.rejected, (state) => {
        state.loading = false;
        state.refreshing = false;
      })
      .addCase(fetchAllGoals.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchAllGoals.fulfilled, (state, action) => {
        state.loading = false;
        state.goalsList = action.payload;
      })
      .addCase(fetchGoalDetails.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchGoalDetails.fulfilled, (state, action) => {
        state.loading = false;
        state.currentGoal = action.payload.goal;
        // Optionally update tasks if they are returned for this goal
      })
      .addCase(fetchTodayTasks.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchTodayTasks.fulfilled, (state, action) => {
        state.loading = false;
        state.tasks = action.payload.tasks || [];
        state.coachMessage = action.payload.coachMessage || "";
        state.dailyFocus = action.payload.focus || "";
        state.microHabit = action.payload.microHabit || "";
        state.progress = calculateProgress(state.tasks);
      })
      .addCase(updateTaskOnServer.pending, (state) => {
        state.isUpdating = true;
      })
      .addCase(updateTaskOnServer.fulfilled, (state, action) => {
        state.isUpdating = false;
        const updatedTask = action.payload;
        const index = state.tasks.findIndex(t => t._id === updatedTask._id);
        if (index !== -1) {
          state.tasks[index] = updatedTask;
          state.progress = calculateProgress(state.tasks);
          saveStateToStorage(state);
        }
      })
      .addCase(updateTaskOnServer.rejected, (state) => {
        state.isUpdating = false;
      })
      .addCase(createGoalWithAI.pending, (state) => {
        state.isGenerating = true;
      })
      .addCase(createGoalWithAI.fulfilled, (state, action) => {
        state.isGenerating = false;
        // Added defensive checks for spreads
        const newTasks = action.payload?.tasks || [];
        state.tasks = [...(state.tasks || []), ...newTasks];
        state.progress = calculateProgress(state.tasks);
        state.goalsList = [action.payload?.goal, ...(state.goalsList || [])].filter(Boolean);
        saveStateToStorage(state);
      })
      .addCase(createGoalWithAI.rejected, (state) => {
        state.isGenerating = false;
      })
      .addCase(deleteGoal.fulfilled, (state, action) => {
        const deletedId = action.payload;
        state.goalsList = state.goalsList.filter(g => g._id !== deletedId);
        state.tasks = state.tasks.filter(t => t.goalId !== deletedId);
        if (state.currentGoal?._id === deletedId) {
           state.currentGoal = null;
        }
        saveStateToStorage(state);
      });
  },
});

export const deleteGoal = createAsyncThunk('goals/deleteGoal', async (id, { getState }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/goals/${id}`, {
    method: 'DELETE',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to delete goal');
  return id;
});

export const activateGoal = createAsyncThunk('goals/activateGoal', async (id, { getState, dispatch }) => {
  const { token } = getState().goals;
  const response = await fetch(`${API_URL}/goals/${id}/activate`, {
    method: 'PATCH',
    headers: { 'Authorization': `Bearer ${token}` }
  });
  if (!response.ok) throw new Error('Failed to activate goal');
  
  // Refresh data
  dispatch(fetchDashboardSummary());
  dispatch(fetchTodayTasks()); // Should pass mood if available, but optional
  
  return await response.json();
});

const calculateProgress = (tasks) => {
  if (!tasks || tasks.length === 0) return 0;
  const completedOrSkipped = tasks.filter(t => t.status !== 'pending').length;
  return Math.round((completedOrSkipped / tasks.length) * 100);
};

export const { setMood, logout } = taskSlice.actions;
export default taskSlice.reducer;
