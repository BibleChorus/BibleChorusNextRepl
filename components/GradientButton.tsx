import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface GradientButtonProps extends ButtonProps {
  progress: number;
}

const GradientButton: React.FC<GradientButtonProps> = ({ progress, className, ...props }) => {
  return (
    <Button
      className={cn(
        className,
        progress === 100 && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
      )}
      {...props}
    />
  );
};

export default GradientButton;
