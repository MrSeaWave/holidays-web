import { memo } from 'react';

export const NotFound = memo(() => {
  console.log('import.meta.env', import.meta.env);

  return <div>NotFound</div>;
});

NotFound.displayName = 'NotFound';
