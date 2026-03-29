export type RootStackParamList = {
  Map: undefined;
  SiteDetail: { siteId: string; siteName: string; siteType: string };
  Survey: { siteId: string; siteName: string; siteType: string };
  Reward: {
    tokensAwarded: number;
    multiplier: number;
    visitNumber: number;
    isFirstSurvey: boolean;
    siteName: string;
  };
};
