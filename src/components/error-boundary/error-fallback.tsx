import { memo } from 'react';
import { useNavigate } from 'react-router-dom';

import s from './style.module.scss';

interface IProps {
  error: Error;
  resetError: () => void;
}

export const ErrorFallback = memo((props: IProps) => {
  const { error } = props;
  const navigate = useNavigate();

  return (
    <div role="alert" className={s.wrapper}>
      <h2>Something went wrong</h2>
      <h3>{error.message}</h3>
      <pre className={s['error-info']}>{error.stack}</pre>
      <div className={s['button-wrapper']}>
        <button
          className={s.button}
          onClick={() => {
            navigate('/');
            props?.resetError();
          }}
        >
          返回首页
        </button>
      </div>
    </div>
  );
});

ErrorFallback.displayName = 'ErrorFallback';
