'use client';

import { useState } from 'react';
import { Settings, Lock, Shield, Bell, Palette, AlertCircle, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/useAuth';
import { toast } from 'react-hot-toast';

export default function SettingsPage() {
  const { isLoading: isUserLoading } = useAuth();
  const [activeTab, setActiveTab] = useState('security');
  const [isLoading, setIsLoading] = useState(false);
  
  const [securitySettings, setSecuritySettings] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleSecuritySave = async () => {
    setIsLoading(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 1000));
      toast.success('Security settings updated successfully!');
      setSecuritySettings({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch {
      toast.error('Failed to update security settings');
    } finally {
      setIsLoading(false);
    }
  };

  if (isUserLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-6 lg:py-8">
      <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Settings</h1>
              <p className="text-gray-600 text-sm sm:text-base">Manage your account security, privacy, and preferences</p>
            </div>
          </div>
        </div>

        {/* Settings Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 sm:gap-8">
          {/* Navigation Sidebar */}
          <div className="lg:col-span-1">
            <Card>
              <CardContent className="p-0">
                <div className="space-y-1">
                  <button
                    onClick={() => setActiveTab('security')}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'security' 
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Lock className="w-3 h-3 sm:w-4 sm:h-4" />
                    Security
                  </button>
                  <button
                    onClick={() => setActiveTab('privacy')}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'privacy' 
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Shield className="w-3 h-3 sm:w-4 sm:h-4" />
                    Privacy
                  </button>
                  <button
                    onClick={() => setActiveTab('notifications')}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'notifications' 
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Bell className="w-3 h-3 sm:w-4 sm:h-4" />
                    Notifications
                  </button>
                  <button
                    onClick={() => setActiveTab('appearance')}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'appearance' 
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <Palette className="w-3 h-3 sm:w-4 sm:h-4" />
                    Appearance
                  </button>
                  <button
                    onClick={() => setActiveTab('account')}
                    className={`w-full flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2 sm:py-3 text-left rounded-lg transition-colors text-sm sm:text-base ${
                      activeTab === 'account' 
                        ? 'bg-orange-50 text-orange-600 border-r-2 border-orange-500' 
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <AlertCircle className="w-3 h-3 sm:w-4 sm:h-4" />
                    Account
                  </button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3">
            {activeTab === 'security' && (
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Lock className="w-4 h-4 sm:w-5 sm:h-5" />
                    Password & Security
                    </CardTitle>
                  </CardHeader>
                <CardContent className="space-y-4 sm:space-y-6">
                  <div className="grid grid-cols-1 gap-3 sm:gap-4">
                      <div className="space-y-2">
                      <Label htmlFor="currentPassword" className="text-sm">Current Password</Label>
                        <Input
                          id="currentPassword"
                          type="password"
                          value={securitySettings.currentPassword}
                          onChange={(e) => setSecuritySettings(prev => ({...prev, currentPassword: e.target.value}))}
                          placeholder="Enter current password"
                        className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="newPassword" className="text-sm">New Password</Label>
                        <Input
                          id="newPassword"
                          type="password"
                          value={securitySettings.newPassword}
                          onChange={(e) => setSecuritySettings(prev => ({...prev, newPassword: e.target.value}))}
                          placeholder="Enter new password"
                        className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                      <Label htmlFor="confirmPassword" className="text-sm">Confirm New Password</Label>
                        <Input
                          id="confirmPassword"
                          type="password"
                          value={securitySettings.confirmPassword}
                          onChange={(e) => setSecuritySettings(prev => ({...prev, confirmPassword: e.target.value}))}
                          placeholder="Confirm new password"
                        className="text-sm"
                        />
                      </div>
                    </div>

                  <Button onClick={handleSecuritySave} disabled={isLoading} className="text-xs sm:text-sm">
                    <Save className="w-3 h-3 sm:w-4 sm:h-4 mr-1 sm:mr-2" />
                    {isLoading ? 'Saving...' : 'Update Password'}
                    </Button>
                  </CardContent>
                </Card>
            )}

            {activeTab === 'privacy' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Shield className="w-4 h-4 sm:w-5 sm:h-5" />
                    Privacy Settings
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Privacy settings coming soon...</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'notifications' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Bell className="w-4 h-4 sm:w-5 sm:h-5" />
                    Notification Preferences
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Notification settings coming soon...</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'appearance' && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <Palette className="w-4 h-4 sm:w-5 sm:h-5" />
                    Appearance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-gray-600">Appearance settings coming soon...</p>
                </CardContent>
              </Card>
            )}

            {activeTab === 'account' && (
                <Card>
                  <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5" />
                    Account Management
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                  <p className="text-sm text-gray-600">Account management coming soon...</p>
                  </CardContent>
                </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 