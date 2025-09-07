'use client';
import * as React from 'react';

type Props = React.HTMLAttributes<HTMLButtonElement> & {
  size?: number; // px
  asDiv?: boolean; // если нужно без <button>
};

export default function IconCircle({ size = 36, asDiv, className = '', ...rest }: Props) {
  const cls =
    'icon-btn inline-flex items-center justify-center transition-colors focus:outline-none focus:ring-2 focus:ring-violet-500/40 ' +
    className;

  const style = { 
    width: size, 
    height: size, 
    lineHeight: `${size}px`,
    padding: '0' // убираем padding от icon-btn
  };

  return asDiv ? (
    <div className={cls} style={style} {...(rest as React.HTMLAttributes<HTMLDivElement>)} />
  ) : (
    <button type="button" className={cls} style={style} {...rest} />
  );
}
