"use client"

import { useOAuthCallbackHandler } from '@/lib/utils/oauthCallbackHandler';

const OAuthCallbackHandler: React.FC = () => {
  useOAuthCallbackHandler();
  return null;
};

export default OAuthCallbackHandler;