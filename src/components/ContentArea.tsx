"use client";

interface ContentAreaProps {
  children: React.ReactNode;
  className?: string;
}

export default function ContentArea({ children, className = "" }: ContentAreaProps) {
  return (
    <div className={`flex-1 flex flex-col ${className}`}>
      {children}
    </div>
  );
}
