"use client"

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { Check, X, ExternalLink } from 'lucide-react';
import toast from 'react-hot-toast';

const GoogleAccountSection: React.FC = () => {
  const { user, googleOAuthStatus, unlinkGoogle } = useAuth();
  const [unlinking, setUnlinking] = useState(false);

  const handleUnlinkGoogle = async () => {
    if (!user?.googleId) return;

    const confirmUnlink = confirm(
      'Are you sure you want to unlink your Google account? Make sure you have a password set up for your account before proceeding.'
    );

    if (!confirmUnlink) return;

    setUnlinking(true);
    const loadingToast = toast.loading('Unlinking Google account...');

    try {
      await unlinkGoogle.mutateAsync();
      toast.success('Google account unlinked successfully', { id: loadingToast });
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to unlink Google account';
      toast.error(errorMessage, { id: loadingToast });
    } finally {
      setUnlinking(false);
    }
  };

  const handleLinkGoogle = () => {
    if (googleOAuthStatus.configured) {
      window.location.href = '/api/auth/google';
    }
  };

  return (
    <Card className="bg-white shadow rounded-lg">
      <CardHeader>
        <CardTitle className="text-lg font-medium text-gray-900 flex items-center gap-2">
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              fill="#4285F4"
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
            />
            <path
              fill="#34A853"
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
            />
            <path
              fill="#FBBC05"
              d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
            />
            <path
              fill="#EA4335"
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
            />
          </svg>
          Google Account
        </CardTitle>
      </CardHeader>
      
      <CardContent>
        {user?.googleId ? (
          // Account is linked
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <Check className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Google account linked</p>
                  <p className="text-sm text-gray-500">You can sign in with Google</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                onClick={handleUnlinkGoogle}
                disabled={unlinking || unlinkGoogle.isPending}
                variant="outline"
                size="sm"
                className="text-red-600 border-red-300 hover:bg-red-50"
              >
                {unlinking || unlinkGoogle.isPending ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-red-300 border-t-red-600 rounded-full animate-spin" />
                    Unlinking...
                  </div>
                ) : (
                  <>
                    <X className="w-4 h-4 mr-1" />
                    Unlink Account
                  </>
                )}
              </Button>
            </div>
          </div>
        ) : (
          // Account is not linked
          <div className="space-y-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3">
                <div className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0">
                  <X className="w-5 h-5 text-gray-400" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">No Google account linked</p>
                  <p className="text-sm text-gray-500">Link your Google account for easier sign in</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              {googleOAuthStatus.configured ? (
                <Button
                  onClick={handleLinkGoogle}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 border-blue-300 hover:bg-blue-50"
                >
                  <ExternalLink className="w-4 h-4 mr-1" />
                  Link Google Account
                </Button>
              ) : (
                <p className="text-sm text-gray-500">Google OAuth is not configured</p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default GoogleAccountSection;