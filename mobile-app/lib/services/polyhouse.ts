import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import { RootState } from '../store/store';

export interface SpatialObject {
  id: string;
  type: 'structure' | 'zone' | 'bed' | 'crop';
  class_name: string;
  confidence: number;
  position: {
    x_m: number;
    y_m: number;
    z_m: number;
  };
  dimensions: {
    width_m: number;
    depth_m: number;
    height_m?: number;
  };
  source_frames: string[];
  health_score?: number;
  pest_risk?: string;
  plant_count?: number;
  crop_type?: string;
  variety?: string;
}

export interface PolyhouseTwinResponse {
  polyhouse_id: string;
  facility_name?: string;
  timestamp: string;
  total_objects?: number;
  dimensions?: {
    width_m: number;
    depth_m: number;
    height_m: number;
  };
  objects: SpatialObject[];
}

export interface LoginResponse {
  success: boolean;
  message: string;
  data: {
    accessToken: string;
    user: {
      id: string;
      name: string;
      email: string;
      role: string;
    };
  };
}

const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:3000/api/v1';

export const polyhouseApi = createApi({
  reducerPath: 'polyhouseApi',
  baseQuery: fetchBaseQuery({
    baseUrl: BASE_URL,
    prepareHeaders: (headers, { getState }) => {
      const token = (getState() as RootState).auth?.token;
      if (token) {
        headers.set('authorization', `Bearer ${token}`);
      }
      return headers;
    },
  }),
  tagTypes: ['PolyhouseTwin'],
  endpoints: (builder) => ({
    login: builder.mutation<LoginResponse, { email: string; password: string }>({
      query: (credentials) => ({
        url: '/auth/login',
        method: 'POST',
        body: credentials,
      }),
    }),
    getPolyhouseTwin: builder.query<PolyhouseTwinResponse, string | void>({
      query: (id) => (id ? `/digital-twin/${id}/spatial` : '/digital-twin/spatial'),
      providesTags: ['PolyhouseTwin'],
    }),
  }),
});

export const { useLoginMutation, useGetPolyhouseTwinQuery } = polyhouseApi;
