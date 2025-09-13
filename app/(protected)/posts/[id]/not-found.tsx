import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { AlertCircle } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="text-center space-y-6 max-w-md">
        <div className="flex justify-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center">
            <AlertCircle className="w-10 h-10 text-orange-600" />
          </div>
        </div>
        
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-gray-900">Post Not Found</h1>
          <p className="text-gray-600">
            Sorry, we couldn&apos;t find the post you&apos;re looking for. It may have been deleted or the link might be incorrect.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Link href="/">
            <Button variant="default">
              Back to Home
            </Button>
          </Link>
          <Link href="/posts">
            <Button variant="outline">
              Browse Posts
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}