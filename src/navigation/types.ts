import { NavigatorScreenParams } from '@react-navigation/native';

export type MainTabParamList = {
  TodayTab: undefined;
  CareerTab: undefined;
  HealthTab: undefined;
  WealthTab: undefined;
  AgentTab: undefined;
};

export type RootStackParamList = {
  SignUp: undefined;
  SignIn: undefined;
  Onboarding: undefined;
  MainTabs: NavigatorScreenParams<MainTabParamList>;
  TodoList: undefined;
  Settings: undefined;
  AddJobModal: undefined;
  AddLoanModal: undefined;
  AddGoldModal: undefined;
  TripDetail: { tripId: string };
};
