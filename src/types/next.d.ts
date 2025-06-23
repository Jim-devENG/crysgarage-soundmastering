import { Params } from 'next/dist/shared/lib/router/utils/route-matcher';

declare module 'next/navigation' {
  export function useParams(): Params;
} 