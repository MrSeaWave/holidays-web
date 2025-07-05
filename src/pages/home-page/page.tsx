import { memo } from 'react';

export const HomePage = memo(() => {
  console.log('import.meta.env', import.meta.env);
  return <div>Home Page</div>;
});

HomePage.displayName = 'HomePage';
