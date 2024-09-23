import React from 'react';
import { Button, ButtonProps } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Loader2 } from "lucide-react";

interface GradientButtonProps extends ButtonProps {
  progress: number;
  isLoading?: boolean;
}

const GradientButton: React.FC<GradientButtonProps> = ({ progress, isLoading, className, children, ...props }) => {
  return (
    <Button
      className={cn(
        className,
        progress === 100 && "bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold",
        "relative"
      )}
      disabled={isLoading}
      {...props}
    >
      {isLoading && (
        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
      )}
      {children}
    </Button>
  );
};

export default GradientButton;
