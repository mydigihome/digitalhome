import { useEffect, useRef, TextareaHTMLAttributes } from "react";

interface Props extends TextareaHTMLAttributes<HTMLTextAreaElement> {}

export default function AutoTextarea({ value, onChange, className, style, ...rest }: Props) {
  const ref = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (ref.current) {
      ref.current.style.height = "0";
      ref.current.style.height = ref.current.scrollHeight + "px";
    }
  }, [value]);

  return (
    <textarea
      ref={ref}
      value={value}
      onChange={onChange}
      className={className}
      style={{ ...style, overflow: "hidden", resize: "none" }}
      rows={1}
      {...rest}
    />
  );
}
