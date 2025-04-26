interface UserData {
  name: string;
  location: {
    latitude: number;
    longitude: number;
  };
  transportPreferences: string[];
}

export const getLocation = (): Promise<GeolocationPosition> => {
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error('Geolocation is not supported by your browser'));
    } else {
      navigator.geolocation.getCurrentPosition(resolve, reject);
    }
  });
};

export const saveUserData = (data: UserData): void => {
  localStorage.setItem('userData', JSON.stringify(data));
};

export const getUserData = (): UserData | null => {
  const data = localStorage.getItem('userData');
  return data ? JSON.parse(data) : null;
};
