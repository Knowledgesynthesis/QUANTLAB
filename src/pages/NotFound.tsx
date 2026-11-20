import { LinkButton } from '@/components/ui';

export default function NotFound() {
  return (
    <div className="py-16 text-center">
      <p className="text-sm font-medium text-primary">404</p>
      <h1 className="mt-1 text-2xl font-bold">Page not found</h1>
      <p className="mt-2 text-muted-foreground">The page you asked for does not exist or has moved.</p>
      <LinkButton to="/" className="mt-6">Back to the course</LinkButton>
    </div>
  );
}
