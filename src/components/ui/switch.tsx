import * as React from "react";

type SwitchProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, "type" | "onChange"> & {
  onCheckedChange?: (checked: boolean) => void;
};

export const Switch = React.forwardRef<HTMLInputElement, SwitchProps>(
  ({ onCheckedChange, ...props }, ref) => (
    <input
      ref={ref}
      type="checkbox"
      role="switch"
      className="h-4 w-4 rounded border-input accent-primary"
      onChange={(event) => onCheckedChange?.(event.target.checked)}
      {...props}
    />
  )
);

Switch.displayName = "Switch";
