'use client';

import { useState, useEffect } from 'react';
import { getLocation, saveUserData, getUserData } from './utils/handlers';

export default function Home() {
  const [name, setName] = useState('');
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [transport, setTransport] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [step, setStep] = useState(1);

  const transportOptions = [
    { id: 'car', label: 'Car', icon: '🚗' },
    { id: 'transit', label: 'Public Transit', icon: '🚇' },
    { id: 'bicycle', label: 'Bicycle', icon: '🚲' },
    { id: 'walking', label: 'Walking', icon: '🚶' },
    { id: 'rideshare', label: 'Ride-sharing', icon: '🚕' }
  ];

  useEffect(() => {
    const savedData = getUserData();
    if (savedData) {
      setName(savedData.name);
      setLocation(savedData.location);
      setTransport(savedData.transportPreferences);
    }
  }, []);

  const handleLocationClick = async () => {
    setLoading(true);
    setError('');
    try {
      const position = await getLocation();
      setLocation({
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      });
    } catch (err) {
      setError('Failed to get location. Please try again.');
    }
    setLoading(false);
  };

  const handleTransportToggle = (optionId: string) => {
    setTransport(prev =>
      prev.includes(optionId)
        ? prev.filter(t => t !== optionId)
        : [...prev, optionId]
    );
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !location || transport.length === 0) {
      setError('Please fill in all fields');
      return;
    }
    saveUserData({
      name,
      location,
      transportPreferences: transport
    });
    setError('');
    setStep(4); // Show success state
  };

  const renderStep = () => {
    switch(step) {
      case 1:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800">What's your name?</h2>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-3 rounded-lg border border-gray-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 transition-all"
              placeholder="Enter your name"
            />
            <button
              onClick={() => name ? setStep(2) : setError('Please enter your name')}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              Continue
            </button>
          </div>
        );
      
      case 2:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800">Where are you located?</h2>
            <button
              onClick={handleLocationClick}
              disabled={loading}
              className="w-full bg-white border-2 border-gray-200 py-3 rounded-lg hover:border-blue-500 transition-all flex items-center justify-center space-x-2"
            >
              <span className="text-xl">📍</span>
              <span>{loading ? 'Getting location...' : 'Use Current Location'}</span>
            </button>
            {location && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-blue-800">
                  Location found! 📍
                </p>
                <p className="text-sm text-blue-600">
                  Lat: {location.latitude.toFixed(4)}, Long: {location.longitude.toFixed(4)}
                </p>
              </div>
            )}
            {location && (
              <button
                onClick={() => setStep(3)}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Continue
              </button>
            )}
          </div>
        );
      
      case 3:
        return (
          <div className="space-y-4 animate-fadeIn">
            <h2 className="text-xl font-semibold text-gray-800">How do you prefer to travel?</h2>
            <p className="text-sm text-gray-600">Select all that apply</p>
            <div className="grid grid-cols-2 gap-3">
              {transportOptions.map((option) => (
                <button
                  key={option.id}
                  onClick={() => handleTransportToggle(option.id)}
                  className={`p-4 rounded-lg border-2 transition-all ${transport.includes(option.id) ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-200'}`}
                >
                  <span className="text-2xl mb-2 block">{option.icon}</span>
                  <span className="text-sm font-medium">{option.label}</span>
                </button>
              ))}
            </div>
            {transport.length > 0 && (
              <button
                onClick={handleSubmit}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Complete Setup
              </button>
            )}
          </div>
        );
      
      case 4:
        return (
          <div className="text-center space-y-4 animate-fadeIn">
            <div className="text-5xl mb-4">🎉</div>
            <h2 className="text-xl font-semibold text-gray-800">All set, {name}!</h2>
            <p className="text-gray-600">Your preferences have been saved successfully.</p>
          </div>
        );
    }
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      <div className="max-w-md mx-auto pt-16 px-4">
        <div className="bg-white rounded-2xl shadow-xl p-6 md:p-8">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-2xl font-bold text-gray-800">Profile Setup</h1>
            <div className="flex space-x-1">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className={`w-2 h-2 rounded-full ${i === step ? 'bg-blue-600' : i < step ? 'bg-blue-200' : 'bg-gray-200'}`}
                />
              ))}
            </div>
          </div>
          
          {error && (
            <div className="mb-4 p-3 rounded-lg bg-red-50 text-red-600 text-sm">
              {error}
            </div>
          )}
          
          {renderStep()}
        </div>
      </div>
    </main>
  );
}
