export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
  BookDetail: { bookId: string };
  ReadingTimer: {
    bookId: string;
    bookTitle: string;
    bookAuthor: string;
    startPage: number;
    totalPages: number;
    /** クラッシュ復元時のみ。経過時間をこの時刻から再計算する */
    resumeStartedAt?: string;
  };
  Account: undefined;
  ResetPassword: undefined;
};

export type AuthStackParamList = {
  Login: undefined;
  Signup: undefined;
};

export type MainTabParamList = {
  Shelf: undefined;
  Add: undefined;
  Stats: undefined;
};
