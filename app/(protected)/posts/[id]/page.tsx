import { Suspense } from 'react';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { getPost, getPostComments } from '@/lib/server/api';
import { generatePostMetadata, generatePostStructuredData } from '@/lib/server/metadata';
import { InteractivePost } from '@/components/client/InteractivePost';
import { CommentsList } from '@/components/client/CommentsList';
import { LoadingSpinner } from '@/components/ui/LoadingSpinner';
import { Button } from '@/components/ui/button';

interface PostPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: PostPageProps) {
  try {
    const { id } = await params;
    const post = await getPost(id);
    if (!post) {
      return {
        title: 'Post Not Found',
        description: 'The requested post could not be found.',
      };
    }
    return generatePostMetadata(post);
  } catch {
    return {
      title: 'Post Not Found',
      description: 'The requested post could not be found.',
    };
  }
}

export default async function PostPage({ params }: PostPageProps) {
  const { id } = await params;
  const [post, comments] = await Promise.all([
    getPost(id),
    getPostComments(id).catch(() => []),
  ]);

  if (!post) {
    notFound();
  }

  const structuredData = generatePostStructuredData(post);

  return (
    <>
      {/* Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData) }}
      />

      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          {/* Back Button */}
          <div className="mb-6">
            <Link href="/">
              <Button variant="ghost" className="flex items-center gap-2 text-gray-600 hover:text-gray-900">
                <ArrowLeft className="w-4 h-4" />
                Back to Posts
              </Button>
            </Link>
          </div>

          {/* Post Content */}
          <div className="space-y-8">
            <InteractivePost post={post} showActions={true} />

            {/* Comments Section */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-6">
                Comments ({post.commentsCount || 0})
              </h2>
              
              <Suspense fallback={<LoadingSpinner text="Loading comments..." />}>
                <CommentsList 
                  postId={post.id}
                  initialComments={comments}
                />
              </Suspense>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}